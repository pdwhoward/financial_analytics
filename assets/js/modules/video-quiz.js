/**
 * Video Quiz Module
 * Adds interactive quizzes to Vimeo videos at specified timestamps
 */

export class VideoQuiz {
    constructor() {
        this.quizzes = new Map();
        this.activeQuiz = null;
        this.players = new Map();
        this.initializeQuizzes();
    }

    initializeQuizzes() {
        console.log('VideoQuiz: Initializing...');
        
        // Wait for Vimeo API to load
        if (typeof Vimeo === 'undefined') {
            console.log('VideoQuiz: Waiting for Vimeo API...');
            setTimeout(() => this.initializeQuizzes(), 100);
            return;
        }

        console.log('VideoQuiz: Vimeo API loaded');

        // Find all video containers with quiz data
        const quizContainers = document.querySelectorAll('[data-quiz-times]');
        console.log('VideoQuiz: Found containers:', quizContainers.length);
        quizContainers.forEach(container => this.setupVideoQuiz(container));
    }

    setupVideoQuiz(container) {
        console.log('VideoQuiz: Setting up container:', container);
        
        const iframe = container.querySelector('iframe');
        if (!iframe) {
            console.log('VideoQuiz: No iframe found in container');
            return;
        }

        console.log('VideoQuiz: Found iframe:', iframe.src);

        const player = new Vimeo.Player(iframe);
        const videoId = this.extractVideoId(iframe.src);
        
        console.log('VideoQuiz: Video ID:', videoId);
        
        // Parse quiz configuration
        const quizTimes = container.dataset.quizTimes.split(',').map(t => parseFloat(t));
        const quizData = this.getQuizData(container.dataset.quizQuestions);
        
        console.log('VideoQuiz: Quiz times:', quizTimes);
        console.log('VideoQuiz: Quiz data:', quizData);
        
        this.players.set(videoId, player);
        this.quizzes.set(videoId, { times: quizTimes, questions: quizData, container });

        // Create quiz overlay
        this.createQuizOverlay(container);

        // Monitor video time
        player.on('timeupdate', (data) => {
            this.checkQuizTriggers(videoId, data.seconds);
        });
        
        console.log('VideoQuiz: Setup complete for video', videoId);
    }

    extractVideoId(src) {
        const match = src.match(/vimeo\.com\/video\/(\d+)/);
        return match ? match[1] : null;
    }

    getQuizData(questionsKey) {
        // Quiz questions data
        const quizBank = {
            'tvm-basic': [
                {
                    question: "If you invest $1,000 today at 5% annual interest, what will it be worth in 3 years?",
                    options: [
                        "$1,150.00",
                        "$1,157.63", 
                        "$1,500.00",
                        "$1,050.00"
                    ],
                    correct: 1,
                    explanation: "Using FV = PV × (1 + r)^t = $1,000 × (1.05)^3 = $1,157.63"
                }
            ]
        };
        
        return quizBank[questionsKey] || [];
    }

    createQuizOverlay(container) {
        const overlay = document.createElement('div');
        overlay.className = 'video-quiz-overlay';
        overlay.innerHTML = `
            <div class="quiz-modal">
                <div class="quiz-header">
                    <h4>Quick Check</h4>
                    <i class="fas fa-question-circle"></i>
                </div>
                <div class="quiz-content">
                    <!-- Quiz content will be inserted here -->
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-secondary quiz-skip">Skip</button>
                    <button class="btn btn-primary quiz-submit" disabled>Submit Answer</button>
                </div>
            </div>
        `;
        
        container.appendChild(overlay);
        
        // Add event listeners
        overlay.querySelector('.quiz-skip').addEventListener('click', () => {
            this.closeQuiz(container);
        });
        
        overlay.querySelector('.quiz-submit').addEventListener('click', () => {
            this.submitQuizAnswer(container);
        });
    }

    checkQuizTriggers(videoId, currentTime) {
        const quiz = this.quizzes.get(videoId);
        if (!quiz || this.activeQuiz) return;

        // Check if we've hit a quiz time (within 1 second tolerance)
        const triggerTime = quiz.times.find(time => 
            Math.abs(currentTime - time) < 1 && currentTime >= time
        );

        if (triggerTime !== undefined) {
            const questionIndex = quiz.times.indexOf(triggerTime);
            this.showQuiz(videoId, questionIndex);
        }
    }

    showQuiz(videoId, questionIndex) {
        const player = this.players.get(videoId);
        const quiz = this.quizzes.get(videoId);
        
        if (!quiz.questions[questionIndex]) return;

        // Pause video
        player.pause();
        
        this.activeQuiz = { videoId, questionIndex };
        const question = quiz.questions[questionIndex];
        
        // Show quiz overlay
        const overlay = quiz.container.querySelector('.video-quiz-overlay');
        const content = overlay.querySelector('.quiz-content');
        
        content.innerHTML = `
            <div class="quiz-question">
                <p class="question-text">${question.question}</p>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <label class="quiz-option">
                            <input type="radio" name="quiz-answer" value="${index}">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add option change listener
        const options = content.querySelectorAll('input[name="quiz-answer"]');
        options.forEach(option => {
            option.addEventListener('change', () => {
                overlay.querySelector('.quiz-submit').disabled = false;
            });
        });
        
        overlay.style.display = 'flex';
    }

    submitQuizAnswer(container) {
        if (!this.activeQuiz) return;

        const { videoId, questionIndex } = this.activeQuiz;
        const quiz = this.quizzes.get(videoId);
        const question = quiz.questions[questionIndex];
        
        const selectedOption = container.querySelector('input[name="quiz-answer"]:checked');
        const selectedValue = selectedOption ? parseInt(selectedOption.value) : -1;
        
        const isCorrect = selectedValue === question.correct;
        
        // Show feedback
        this.showQuizFeedback(container, isCorrect, question.explanation);
        
        // Store result
        this.storeQuizResult(videoId, questionIndex, isCorrect);
    }

    showQuizFeedback(container, isCorrect, explanation) {
        const overlay = container.querySelector('.video-quiz-overlay');
        const content = overlay.querySelector('.quiz-content');
        
        content.innerHTML = `
            <div class="quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="feedback-icon">
                    <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                </div>
                <h5>${isCorrect ? 'Correct!' : 'Not quite right'}</h5>
                <p class="explanation">${explanation}</p>
            </div>
        `;
        
        // Update actions
        const actions = overlay.querySelector('.quiz-actions');
        actions.innerHTML = `
            <button class="btn btn-primary quiz-continue">Continue Video</button>
        `;
        
        actions.querySelector('.quiz-continue').addEventListener('click', () => {
            this.closeQuiz(container);
        });
    }

    closeQuiz(container) {
        const overlay = container.querySelector('.video-quiz-overlay');
        overlay.style.display = 'none';
        
        if (this.activeQuiz) {
            const player = this.players.get(this.activeQuiz.videoId);
            player.play();
            this.activeQuiz = null;
        }
    }

    storeQuizResult(videoId, questionIndex, isCorrect) {
        const results = JSON.parse(localStorage.getItem('videoQuizResults') || '{}');
        if (!results[videoId]) results[videoId] = {};
        results[videoId][questionIndex] = { correct: isCorrect, timestamp: Date.now() };
        localStorage.setItem('videoQuizResults', JSON.stringify(results));
    }
}