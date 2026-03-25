let questionsData = [];
let timeLeft = 60;
let timerInterval;
let currentQuestion = 0;
let userAnswers = [];
let isSubmitted = false;


async function uploadPDF() {
    resetQuizUI();

    const fileInput = document.getElementById("pdfFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload a PDF");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://pdf-quiz-generator-1t5g.onrender.com/upload", {
        method: "POST",
        body: formData
    });

    const data = await response.json();

    if (data.error) {
        alert(data.error);
        return;
    }
    console.log("API response:", data);

    questionsData = data;   
    currentQuestion = 0;
    userAnswers = [];
    isSubmitted = false;

    renderQuestionNumbers();
    showQuestion();
    startTimer();
}


function renderQuestionNumbers() {
    const container = document.getElementById("questionNumbers");
    container.innerHTML = "";

    questionsData.forEach((_, index) => {
        const btn = document.createElement("span");
        btn.innerText = index + 1;
        btn.classList.add("qnum");

        if (index === currentQuestion) btn.classList.add("active");

        if (userAnswers[index]) btn.classList.add("answered");
        else btn.classList.add("unanswered");

        btn.onclick = () => {
            currentQuestion = index;
            showQuestion();
        };

        container.appendChild(btn);
    });
}


function showQuestion() {
    const quizDiv = document.getElementById("quiz");
    quizDiv.innerHTML = "";

    const q = questionsData[currentQuestion];

    let optionsHTML = "";

    q.options.forEach(opt => {
        let checked = userAnswers[currentQuestion] === opt ? "checked" : "";
        let className = "";

        if (isSubmitted) {
            if (opt === q.answer) className = "correct";
            if (userAnswers[currentQuestion] === opt && opt !== q.answer)
                className = "wrong";
        }

        optionsHTML += `
            <label class="${className}">
                <input type="radio" name="q" value="${opt}" ${checked}
                onchange="saveAnswer('${opt}')"
                ${isSubmitted ? "disabled" : ""}>
                ${opt}
            </label><br>
        `;
    });

    quizDiv.innerHTML = `
        <div class="question">
            <h3>Q${currentQuestion + 1}. ${q.question}</h3>
            ${optionsHTML}
        </div>
    `;

    renderQuestionNumbers();
}


function saveAnswer(answer) {
    if (isSubmitted) return;

    userAnswers[currentQuestion] = answer;
    updateProgress();
    renderQuestionNumbers();
}


function nextQuestion() {
    if (currentQuestion < questionsData.length - 1) {
        currentQuestion++;
        showQuestion();
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion();
    }
}


function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 60;

    timerInterval = setInterval(() => {
        document.getElementById("timer").innerText = `⏳ Time: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("⏰ Time's up!");
            submitQuiz();
        }

        timeLeft--;
    }, 1000);
}


function updateProgress() {
    let answered = userAnswers.filter(a => a).length;
    const progress = (answered / questionsData.length) * 100;
    document.getElementById("progressBar").value = progress;
}


function submitQuiz() {
    clearInterval(timerInterval);

    let score = 0;

    questionsData.forEach((q, index) => {
        if (userAnswers[index] === q.answer) score++;
    });

    isSubmitted = true;

    document.getElementById("result").innerText =
        `🎯 Your Score: ${score} / ${questionsData.length}`;

    saveResult(score, questionsData.length);   // 🔥 NEW
    showLeaderboard();
    showHistory();

    showQuestion();
}


function saveResult(score, total) {
    const user = localStorage.getItem("user") || "Guest";

    const record = {
        user,
        score,
        total,
        date: new Date().toLocaleString()
    };

    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];
    history.push(record);

    localStorage.setItem("quizHistory", JSON.stringify(history));
}


function showLeaderboard() {
    const div = document.getElementById("leaderboard");
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];

    history.sort((a, b) => b.score - a.score);

    div.innerHTML = "";

    history.slice(0, 5).forEach(item => {
        div.innerHTML += `
            <div class="card">
                👤 ${item.user} <br>
                🎯 ${item.score}/${item.total} <br>
                📅 ${item.date}
            </div>
        `;
    });
}


function showHistory() {
    const div = document.getElementById("history");
    let history = JSON.parse(localStorage.getItem("quizHistory")) || [];

    div.innerHTML = "";

    history.forEach(item => {
        div.innerHTML += `
            <div class="card">
                👤 ${item.user} <br>
                🎯 ${item.score}/${item.total} <br>
                📅 ${item.date}
            </div>
        `;
    });
}


function resetQuizUI() {
    document.getElementById("quiz").innerHTML = "";
    document.getElementById("result").innerText = "";
    document.getElementById("progressBar").value = 0;

    clearInterval(timerInterval);
    document.getElementById("timer").innerText = "⏳ Time: 60s";

    questionsData = [];
    userAnswers = [];
    currentQuestion = 0;
    isSubmitted = false;
}


window.onload = function () {
    showLeaderboard();
    showHistory();
};




function register() {
    const user = document.getElementById("regUser")?.value;
    const pass = document.getElementById("regPass")?.value;

    if (!user || !pass) {
        alert("Enter all fields");
        return;
    }

    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);

    alert("Registered Successfully!");
    window.location.href = "login.html";
}


function login() {
    const user = document.getElementById("loginUser")?.value;
    const pass = document.getElementById("loginPass")?.value;

    const storedUser = localStorage.getItem("user");
    const storedPass = localStorage.getItem("pass");

    if (user === storedUser && pass === storedPass) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "index.html";
    } else {
        alert("Invalid Credentials");
    }
}


function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
}


if (window.location.pathname.includes("index.html")) {
    const isLoggedIn = localStorage.getItem("loggedIn");

    if (!isLoggedIn) {
        window.location.href = "login.html";
    }
}


async function sendReset() {
    const email = document.getElementById("email")?.value;

    if (!email) {
        alert("Please enter email");
        return;
    }

    try {
        const res = await fetch("https://pdf-quiz-generator-1t5g.onrender.com/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.message) {
            alert("📧 Reset link sent to your email!");
        } else {
            alert(data.error || "Error sending email");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}


function resetPassword() {
    const newPass = document.getElementById("newPass")?.value;

    if (!newPass) {
        alert("Enter new password");
        return;
    }

    
    localStorage.setItem("pass", newPass);

    alert("✅ Password updated successfully!");
    window.location.href = "login.html";
}
