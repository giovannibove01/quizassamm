// --- LOGICA QUIZ ---
// Variabili globali per lo stato del quiz
let allQuestionsData = [];
let score = 0;
let currentQuestionIndex = 0;
let currentQuizQuestions = [];
let userAnswers = []; 
let tempSelectedButton = null;
let isConfirmed = false;
const questionsByTopic = {};

// Riferimenti DOM (saranno assegnati al caricamento)
let elements = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Caricato. Avvio script...");

    // Assegnazione riferimenti DOM
    elements = {
        startButton: document.getElementById('start-btn'),
        nextButton: document.getElementById('next-btn'),
        restartButton: document.getElementById('restart-btn'),
        homeBtn: document.getElementById('home-btn'),
        endBtn: document.getElementById('end-btn'),
        selectAllBtn: document.getElementById('select-all-btn'),
        deselectAllBtn: document.getElementById('deselect-all-btn'),
        mobileReloadBtn: document.getElementById('mobile-reload-btn'),
        mobileCloseBtn: document.getElementById('mobile-close-btn'),
        questionContainer: document.getElementById('question-container'),
        questionElement: document.getElementById('question'),
        answerButtons: document.getElementById('answer-buttons'),
        resultsContainer: document.getElementById('results-container'),
        scoreElement: document.getElementById('score'),
        totalResults: document.getElementById('total-questions-results'),
        topicElement: document.getElementById('question-topic'),
        counterElement: document.getElementById('question-counter'),
        settingsContainer: document.getElementById('settings-container'),
        topicSelection: document.getElementById('topic-selection'),
        answersReview: document.getElementById('answers-review')
    };

    // Attacca Event Listeners
    if (elements.startButton) elements.startButton.addEventListener('click', startGame);
    if (elements.nextButton) elements.nextButton.addEventListener('click', handleNextClick);
    if (elements.homeBtn) elements.homeBtn.addEventListener('click', restartQuiz);
    if (elements.endBtn) elements.endBtn.addEventListener('click', showResults);

    if (elements.selectAllBtn) {
        elements.selectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.topic-checkbox').forEach(cb => cb.checked = true);
        });
    }

    if (elements.deselectAllBtn) {
        elements.deselectAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.topic-checkbox').forEach(cb => cb.checked = false);
        });
    }

    if (elements.mobileReloadBtn) elements.mobileReloadBtn.addEventListener('click', () => location.reload());
    if (elements.mobileCloseBtn) elements.mobileCloseBtn.addEventListener('click', () => {
        if (confirm("Chiudere il quiz?")) window.close();
    });

    // Inizializzazione dati
    initQuiz();
});

function initQuiz() {
    // Recupera domande da window.allQuestions (popolato da questions_db.js)
    if (window.allQuestions && window.allQuestions.length > 0) {
        allQuestionsData = window.allQuestions;
        console.log("Domande caricate: " + allQuestionsData.length);
    } else {
        console.error("ERRORE: Nessuna domanda trovata in window.allQuestions!");
        alert("Errore nel caricamento del database domande.");
        return;
    }

    groupQuestionsByTopic();
    populateTopics();
}

function groupQuestionsByTopic() {
    // Reset
    for (let key in questionsByTopic) delete questionsByTopic[key];
    
    allQuestionsData.forEach(q => {
        if (!questionsByTopic[q.topic]) questionsByTopic[q.topic] = [];
        questionsByTopic[q.topic].push(q);
    });
}

function populateTopics() {
    const container = elements.topicSelection;
    if (!container) return;
    
    container.innerHTML = '';
    Object.keys(questionsByTopic).sort().forEach(topic => {
        const count = questionsByTopic[topic].length;
        const div = document.createElement('div');
        div.classList.add('topic-setting');
        div.innerHTML = `
            <div class="topic-info">
                <label style="font-weight:700"><input type="checkbox" class="topic-checkbox" value="${topic}"> ${topic}</label>
                <span style="font-size:0.8em; color:#64748b">${count} disponibili</span>
            </div>
            <div class="topic-controls-row">
                <input type="number" class="topic-question-input" data-topic="${topic}" value="30" min="0" max="${count}">
                <button class="topic-btn-max" data-topic="${topic}">MAX</button>
            </div>
        `;
        container.appendChild(div);
    });
    
    // Listener per i pulsanti MAX
    document.querySelectorAll('.topic-btn-max').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const topic = e.target.dataset.topic;
            const input = document.querySelector(`.topic-question-input[data-topic="${topic}"]`);
            if (input) input.value = input.max;
        });
    });
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
        const maxAvailable = questionsByTopic[topic].length;
        let count = parseInt(input.value, 10) || 0;
        if (count > maxAvailable) count = maxAvailable;

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
    elements.settingsContainer.classList.add('hide');
    elements.questionContainer.classList.remove('hide');
    
    setNextQuestion();
}

function setNextQuestion() {
    resetState();
    isConfirmed = false;
    tempSelectedButton = null;
    elements.nextButton.innerText = "Conferma Risposta";
    elements.nextButton.classList.add('hide');

    if (currentQuestionIndex < currentQuizQuestions.length) {
        showQuestion(currentQuizQuestions[currentQuestionIndex]);
    } else {
        showResults();
    }
}

function showQuestion(question) {
    elements.questionElement.innerText = question.question;
    elements.topicElement.innerText = question.topic;
    elements.counterElement.innerText = `Domanda ${currentQuestionIndex + 1} / ${currentQuizQuestions.length}`;
    
    // Mischia le risposte in ordine casuale
    const shuffledAnswers = [...question.answers].sort(() => 0.5 - Math.random());

    shuffledAnswers.forEach(answer => {
        const button = document.createElement('button');
        button.innerText = answer.text;
        button.classList.add('btn');
        if (answer.correct) button.dataset.correct = "true";
        button.addEventListener('click', selectAnswer);
        elements.answerButtons.appendChild(button);
    });
    
    elements.endBtn.classList.remove('hide');
}

function resetState() {
    while (elements.answerButtons.firstChild) {
        elements.answerButtons.removeChild(elements.answerButtons.firstChild);
    }
}

function selectAnswer(e) {
    if (isConfirmed) return;
    Array.from(elements.answerButtons.children).forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    tempSelectedButton = e.target;
    elements.nextButton.classList.remove('hide');
}

function handleNextClick() {
    if (!isConfirmed) {
        if (!tempSelectedButton) return;
        isConfirmed = true;
        const correct = tempSelectedButton.dataset.correct === "true";
        if (correct) score++;

        const currentQuestion = currentQuizQuestions[currentQuestionIndex];

        userAnswers.push({ 
            question: currentQuestion.question, 
            selectedText: tempSelectedButton.innerText,
            allAnswers: currentQuestion.answers, // Salva tutte le opzioni
            isCorrect: correct 
        });

        Array.from(elements.answerButtons.children).forEach(button => {
            button.disabled = true;
            if (button.dataset.correct === "true") button.classList.add('correct');
            else if (button === tempSelectedButton) button.classList.add('wrong');
        });

        elements.nextButton.innerText = (currentQuestionIndex + 1 < currentQuizQuestions.length) ? "Prossima Domanda" : "Vedi Risultati";
    } else {
        currentQuestionIndex++;
        setNextQuestion();
    }
}

function showResults() {
    elements.questionContainer.classList.add('hide');
    elements.resultsContainer.classList.remove('hide');
    elements.scoreElement.innerText = score;
    elements.totalResults.innerText = currentQuizQuestions.length;

    elements.answersReview.innerHTML = '';
    
    userAnswers.forEach((item, index) => {
        const reviewItem = document.createElement('div');
        reviewItem.classList.add('review-item');
        reviewItem.classList.add(item.isCorrect ? 'correct' : 'wrong');

        let answersHtml = '';
        item.allAnswers.forEach(ans => {
            let className = 'review-answer';
            if (ans.correct) {
                className += ' correct-label'; // Sempre evidenzia la corretta
            } else if (!item.isCorrect && ans.text === item.selectedText) {
                className += ' wrong-label'; // Evidenzia la scelta sbagliata
            }
            
            // Aggiunge un indicatore testuale se è stata la scelta dell'utente
            const userChoiceMarker = (ans.text === item.selectedText) ? ' <strong>(Tua scelta)</strong>' : '';
            
            answersHtml += `<div class="${className}">${ans.text}${userChoiceMarker}</div>`;
        });

        reviewItem.innerHTML = `
            <div class="review-question">${index + 1}. ${item.question}</div>
            <div class="review-answers-list">
                ${answersHtml}
            </div>
        `;
        elements.answersReview.appendChild(reviewItem);
    });
}

function restartQuiz() {
    elements.resultsContainer.classList.add('hide');
    elements.questionContainer.classList.add('hide');
    elements.settingsContainer.classList.remove('hide');
    score = 0;
    currentQuestionIndex = 0;
}
