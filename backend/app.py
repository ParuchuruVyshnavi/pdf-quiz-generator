from flask import Flask, request, jsonify
import pdfplumber
import random
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText

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

    reset_link = "http://127.0.0.1:5500/frontend/reset.html"

    msg = MIMEText(f"Click here to reset password: {reset_link}")
    msg['Subject'] = "Password Reset"
    msg['From'] = "paruchuruvyshnavi87@gmail.com"
    msg['To'] = email

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login("paruchuruvyshnavi87@gmail.com", "ostbtfawuwrqvuzv")
        server.send_message(msg)
        server.quit()

        print("Mail Sent Successfully")
        return jsonify({"message": "Email sent successfully"})

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)})


if __name__ == "__main__":
    app.run(debug=True)