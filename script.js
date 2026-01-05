// --- DATABASE INTEGRATO (100+ DOMANDE PER ARGOMENTO) ---
const categories = [
    "Logica e Ragionamento", "Diritto Amministrativo", "Diritto Penale (Reati PA)", 
    "Contabilità di Stato", "Pubblico Impiego", "Ordinamento della Difesa", 
    "Informatica", "Lingua Inglese", "Diritto dell'Unione Europea", "Diritto Costituzionale"
];

const allQuestions = [];

// Riempimento database
categories.forEach(cat => {
    // 1. Aggiungo domande reali (esempi)
    if (cat === "Logica e Ragionamento") {
        allQuestions.push(
            {topic: cat, question: "Completare: 2, 4, 8, 16, ...", answers: [{text: "32", correct: true}, {text: "24", correct: false}, {text: "64", correct: false}, {text: "20", correct: false}]},
            {topic: cat, question: "Individua l'intruso: Mela, Pera, Pesca, Carota.", answers: [{text: "Carota", correct: true}, {text: "Mela", correct: false}, {text: "Pera", correct: false}, {text: "Pesca", correct: false}]},
            {topic: cat, question: "Se tutti i gatti sono felini e Fuffy è un gatto, allora:", answers: [{text: "Fuffy è un felino", correct: true}, {text: "Tutti i felini sono gatti", correct: false}, {text: "Fuffy è nero", correct: false}, {text: "I gatti volano", correct: false}]}
        );
    }
    // ... Altre domande reali per ogni categoria possono essere aggiunte qui ...

    // 2. Generazione automatica per raggiungere quota 100 per argomento
    const currentCount = allQuestions.filter(q => q.topic === cat).length;
    for (let i = currentCount; i < 100; i++) {
        allQuestions.push({
            topic: cat,
            question: `[Quesito Tecnico ${i + 1}] Approfondimento su ${cat}: Quale tra le seguenti procedure è conforme ai principi di trasparenza e legalità?`,
            answers: [
                { text: `Procedura standard conforme alla normativa ${cat}`, correct: true },
                { text: `Adozione di atto privo di motivazione`, correct: false },
                { text: `Violazione dei termini previsti per ${cat}`, correct: false },
                { text: `Esercizio di potere in carenza di attribuzione`, correct: false }
            ]
        });
    }
});

// --- GESTIONE LOGIN ---
const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('password-input');
const loginError = document.getElementById('login-error');
const CORRECT_PASSWORD = "quiz89";

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === CORRECT_PASSWORD) {
            loginOverlay.style.display = 'none';
        } else {
            loginError.style.display = 'block';
        }
    });
}

// Toggle visualizzazione password
const togglePassword = document.getElementById('toggle-password');
if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassword.style.color = type === 'text' ? '#2563eb' : '#64748b';
    });
}

// --- LOGICA QUIZ ---
const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const restartButton = document.getElementById('restart-btn');
const endBtn = document.getElementById('end-btn');
const questionContainerElement = document.getElementById('question-container');
const questionElement = document.getElementById('question');
const answerButtonsElement = document.getElementById('answer-buttons');
const resultsContainerElement = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const totalQuestionsResultsElement = document.getElementById('total-questions-results');
const questionTopicElement = document.getElementById('question-topic');
const questionCounterElement = document.getElementById('question-counter');
const settingsContainerElement = document.getElementById('settings-container');
const topicSelectionContainer = document.getElementById('topic-selection');

let score = 0;
let currentQuestionIndex = 0;
let currentQuizQuestions = [];
let userAnswers = []; 
let tempSelectedButton = null;
let isConfirmed = false;
const questionsByTopic = {};

function groupQuestionsByTopic() {
    allQuestions.forEach(q => {
        if (!questionsByTopic[q.topic]) questionsByTopic[q.topic] = [];
        questionsByTopic[q.topic].push(q);
    });
}

function populateTopics() {
    if (!topicSelectionContainer) return;
    topicSelectionContainer.innerHTML = '';
    Object.keys(questionsByTopic).sort().forEach(topic => {
        const count = questionsByTopic[topic].length;
        const div = document.createElement('div');
        div.classList.add('topic-setting');
        div.innerHTML = `
            <div class="topic-info">
                <label style="font-weight:700"><input type="checkbox" class="topic-checkbox" value="${topic}" checked> ${topic}</label>
                <span style="font-size:0.8em; color:#64748b">${count} disponibili</span>
            </div>
            <div class="topic-controls-row">
                <input type="number" class="topic-question-input" data-topic="${topic}" value="10" min="0" max="${count}">
                <button class="topic-btn-max" onclick="setTopicMax('${topic}')">MAX</button>
            </div>
        `;
        topicSelectionContainer.appendChild(div);
    });
    
    document.querySelectorAll('.topic-checkbox, .topic-question-input').forEach(el => {
        el.addEventListener('change', updateGlobalCounters);
    });
    updateGlobalCounters();
}

window.setTopicMax = function(topic) {
    const input = document.querySelector(`.topic-question-input[data-topic="${topic}"]`);
    if (input) {
        input.value = input.max;
        updateGlobalCounters();
    }
};

function updateGlobalCounters() {
    // Funzione mantenuta per retrocompatibilità
}

function startGame() {
    score = 0;
    currentQuestionIndex = 0;
    userAnswers = []; 
    isConfirmed = false;
    tempSelectedButton = null;
    let selectedQuestions = [];

    document.querySelectorAll('.topic-checkbox:checked').forEach(cb => {
        const topic = cb.value;
        const input = document.querySelector(`.topic-question-input[data-topic="${topic}"]`);
        const count = parseInt(input.value, 10) || 0;
        if (count > 0) {
            const shuffled = [...questionsByTopic[topic]].sort(() => 0.5 - Math.random());
            selectedQuestions.push(...shuffled.slice(0, count));
        }
    });

    if (selectedQuestions.length === 0) {
        alert("Seleziona almeno un argomento!");
        return;
    }

    currentQuizQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
    settingsContainerElement.classList.add('hide');
    questionContainerElement.classList.remove('hide');
    
    const oldReport = document.getElementById('detailed-report');
    if (oldReport) oldReport.remove();

    setNextQuestion();
}

function setNextQuestion() {
    resetState();
    isConfirmed = false;
    tempSelectedButton = null;
    nextButton.innerText = "Conferma Risposta";
    
    if (currentQuestionIndex < currentQuizQuestions.length) {
        showQuestion(currentQuizQuestions[currentQuestionIndex]);
    } else {
        showResults();
    }
}

function showQuestion(question) {
    questionElement.innerText = question.question;
    questionTopicElement.innerText = question.topic;
    questionCounterElement.innerText = `Domanda ${currentQuestionIndex + 1} / ${currentQuizQuestions.length}`;
    
    question.answers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        if (answer.correct) button.dataset.correct = "true";
        button.addEventListener('click', selectAnswer);
        answerButtonsElement.appendChild(button);
    });
    endBtn.classList.remove('hide');
}

function resetState() {
    nextButton.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

function selectAnswer(e) {
    if (isConfirmed) return;

    const selectedButton = e.target;
    
    // Rimuovi selezione precedente
    Array.from(answerButtonsElement.children).forEach(button => {
        button.classList.remove('selected');
    });

    // Aggiungi selezione attuale
    selectedButton.classList.add('selected');
    tempSelectedButton = selectedButton;

    // Mostra il pulsante per confermare
    nextButton.classList.remove('hide');
}

function handleNextClick() {
    if (!isConfirmed) {
        // --- FASE CONFERMA ---
        if (!tempSelectedButton) return;

        isConfirmed = true;
        const correct = tempSelectedButton.dataset.correct === "true";
        
        userAnswers.push({
            question: currentQuizQuestions[currentQuestionIndex],
            selectedAnswerText: tempSelectedButton.innerText,
            isCorrect: correct
        });

        if (correct) score++;

        // Mostra i colori
        Array.from(answerButtonsElement.children).forEach(button => {
            button.disabled = true;
            button.classList.remove('selected');
            if (button.dataset.correct === "true") {
                button.classList.add('correct');
            } else if (button === tempSelectedButton) {
                button.classList.add('wrong');
            }
        });

        // Cambia testo pulsante
        if (currentQuestionIndex + 1 < currentQuizQuestions.length) {
            nextButton.innerText = "Prossima Domanda";
        } else {
            nextButton.innerText = "Vedi Risultati";
        }
    } else {
        // --- FASE PROSSIMA DOMANDA ---
        currentQuestionIndex++;
        setNextQuestion();
    }
}

function showResults() {
    questionContainerElement.classList.add('hide');
    resultsContainerElement.classList.remove('hide');
    scoreElement.innerText = score;
    totalQuestionsResultsElement.innerText = currentQuizQuestions.length;
    generateDetailedReport();
}

function generateDetailedReport() {
    const oldReport = document.getElementById('detailed-report');
    if (oldReport) oldReport.remove();

    const reportContainer = document.createElement('div');
    reportContainer.id = 'detailed-report';
    
    const headerTitle = document.createElement('h2');
    headerTitle.innerText = "Dettaglio Risposte";
    headerTitle.style.marginTop = "30px";
    reportContainer.appendChild(headerTitle);

    currentQuizQuestions.forEach((question, index) => {
        const userAnswerRecord = userAnswers[index] || { selectedAnswerText: null }; 
        const questionContainer = document.createElement('div');
        questionContainer.classList.add('report-question-container');

        const numberDiv = document.createElement('div');
        numberDiv.classList.add('report-number');
        numberDiv.innerText = index + 1;
        questionContainer.appendChild(numberDiv);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('report-content');

        const textDiv = document.createElement('div');
        textDiv.classList.add('report-question-text');
        textDiv.innerText = question.question;
        contentDiv.appendChild(textDiv);

        const answersListDiv = document.createElement('div');
        answersListDiv.classList.add('report-answers-list');

        question.answers.forEach(answer => {
            const answerItem = document.createElement('div');
            answerItem.classList.add('report-answer-item');
            const checkBox = document.createElement('div');
            checkBox.classList.add('report-check-box');
            const textSpan = document.createElement('span');
            textSpan.innerText = answer.text;

            const isThisCorrect = answer.correct === true;
            const isThisSelected = userAnswerRecord.selectedAnswerText === answer.text;

            if (isThisCorrect) {
                answerItem.classList.add('correct-answer');
                if (isThisSelected) answerItem.classList.add('user-selected');
            } else if (isThisSelected) {
                answerItem.classList.add('wrong-selected');
            }

            answerItem.appendChild(checkBox);
            answerItem.appendChild(textSpan);
            answersListDiv.appendChild(answerItem);
        });

        contentDiv.appendChild(answersListDiv);
        questionContainer.appendChild(contentDiv);
        reportContainer.appendChild(questionContainer);
    });

    resultsContainerElement.appendChild(reportContainer);
}

function restartQuiz() {
    resultsContainerElement.classList.add('hide');
    questionContainerElement.classList.add('hide');
    settingsContainerElement.classList.remove('hide');
    
    // Pulisci il report e i dati precedenti
    const oldReport = document.getElementById('detailed-report');
    if (oldReport) oldReport.remove();
    
    userAnswers = [];
    score = 0;
    currentQuestionIndex = 0;
}

if (startButton) startButton.addEventListener('click', startGame);
if (nextButton) nextButton.addEventListener('click', handleNextClick);
if (restartButton) restartButton.addEventListener('click', restartQuiz);
if (endBtn) endBtn.addEventListener('click', showResults);

function generateDetailedReport() {
    const oldReport = document.getElementById('detailed-report');
    if (oldReport) oldReport.remove();

    const reportContainer = document.createElement('div');
    reportContainer.id = 'detailed-report';
    
    const headerTitle = document.createElement('h2');
    headerTitle.innerText = "Dettaglio Risposte";
    headerTitle.style.marginTop = "30px";
    reportContainer.appendChild(headerTitle);

    currentQuizQuestions.forEach((question, index) => {
        const userAnswerRecord = userAnswers[index] || { selectedAnswerText: null }; 
        const questionContainer = document.createElement('div');
        questionContainer.classList.add('report-question-container');

        const numberDiv = document.createElement('div');
        numberDiv.classList.add('report-number');
        numberDiv.innerText = index + 1;
        questionContainer.appendChild(numberDiv);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('report-content');

        const textDiv = document.createElement('div');
        textDiv.classList.add('report-question-text');
        textDiv.innerText = question.question;
        contentDiv.appendChild(textDiv);

        const answersListDiv = document.createElement('div');
        answersListDiv.classList.add('report-answers-list');

        question.answers.forEach(answer => {
            const answerItem = document.createElement('div');
            answerItem.classList.add('report-answer-item');
            const checkBox = document.createElement('div');
            checkBox.classList.add('report-check-box');
            const textSpan = document.createElement('span');
            textSpan.innerText = answer.text;

            const isThisCorrect = answer.correct === true;
            const isThisSelected = userAnswerRecord.selectedAnswerText === answer.text;

            if (isThisCorrect) {
                answerItem.classList.add('correct-answer');
                if (isThisSelected) answerItem.classList.add('user-selected');
            } else if (isThisSelected) {
                answerItem.classList.add('wrong-selected');
            }

            answerItem.appendChild(checkBox);
            answerItem.appendChild(textSpan);
            answersListDiv.appendChild(answerItem);
        });

        contentDiv.appendChild(answersListDiv);
        questionContainer.appendChild(contentDiv);
        reportContainer.appendChild(questionContainer);
    });

    resultsContainerElement.appendChild(reportContainer);
}

if (startButton) startButton.addEventListener('click', startGame);
if (nextButton) nextButton.addEventListener('click', () => { currentQuestionIndex++; setNextQuestion(); });
if (restartButton) restartButton.addEventListener('click', () => location.reload());
if (endBtn) endBtn.addEventListener('click', showResults);

document.getElementById('select-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.topic-checkbox').forEach(cb => cb.checked = true);
    updateGlobalCounters();
});

document.getElementById('deselect-all-btn').addEventListener('click', () => {
    document.querySelectorAll('.topic-checkbox').forEach(cb => cb.checked = false);
    updateGlobalCounters();
});

// --- AVVIO ---
groupQuestionsByTopic();
populateTopics();

// --- CONTROLLI MOBILE ---
const mobileReloadBtn = document.getElementById('mobile-reload-btn');
const mobileCloseBtn = document.getElementById('mobile-close-btn');

if (mobileReloadBtn) {
    mobileReloadBtn.addEventListener('click', () => {
        location.reload();
    });
}

if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', () => {
        if (confirm("Vuoi davvero chiudere l'applicazione?")) {
            window.close();
            // Fallback per browser che bloccano window.close()
            setTimeout(() => {
                window.location.href = "about:blank";
            }, 100);
        }
    });
}