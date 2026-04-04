from flask import Flask, request, jsonify
import pdfplumber
import random
from flask_cors import CORS
import smtplib
import os
from email.mime.text import MIMEText

EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASS = os.environ.get("EMAIL_PASS")

print("EMAIL_USER:", EMAIL_USER)
print("EMAIL_PASS:", EMAIL_PASS)

app = Flask(__name__)
CORS(app)


def generate_questions(text):
    sentences = text.split(".")
    questions = []

    clean_sentences = [s.strip() for s in sentences if len(s.strip()) > 30]

    for sentence in clean_sentences[:10]:
        words = sentence.split()

        if len(words) < 6:
            continue

        keyword = words[len(words)//2]
        question_text = sentence.replace(keyword, "_____")

        options = [
            keyword,
            "system",
            "process",
            "method"
        ]

        random.shuffle(options)

        questions.append({
            "question": f"Fill in the blank: {question_text}",
            "options": options,
            "answer": keyword
        })

    return questions


@app.route('/upload', methods=['POST'])
def upload_pdf():
    file = request.files['file']

    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            content = page.extract_text()
            if content:
                text += content

    questions = generate_questions(text)
    return jsonify(questions)




@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get("email")

    reset_link = "https://pdf-quizgenerator.netlify.app/reset.html"

    msg = MIMEText(f"Click here to reset password: {reset_link}")
    msg['Subject'] = "Password Reset"
    msg['From'] = "paruchuruvyshnavi87@gmail.com"
    msg['To'] = email

    try:
      server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)  
      server.ehlo()
      server.starttls()
      server.ehlo()

      server.login(EMAIL_USER, EMAIL_PASS)

      server.send_message(msg)
      server.quit()

      print("Mail sent successfully")
      return jsonify({"message": "Email sent successfully"})

   except Exception as e:
      print("FULL ERROR:", e)
      return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
