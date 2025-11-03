document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('tetris');
    const context = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const linesElement = document.getElementById('lines');
    const gameTimerElement = document.getElementById('game-timer');

    const instructionsModal = document.getElementById('instructions-modal');
    const quizModal = document.getElementById('quiz-modal');
    const lineClearModal = document.getElementById('line-clear-modal');
    const gameOverModal = document.getElementById('game-over-modal');

    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const questionText = document.getElementById('question-text');
    const answerOptions = document.getElementById('answer-options');
    const questionTimerBar = document.getElementById('question-timer-bar');
    
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverMessage = document.getElementById('game-over-message');
    const finalScoreElement = document.getElementById('final-score');

    // Game Constants
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 24;
    const LINES_TO_WIN = 3;
    const GAME_TIME_LIMIT = 600; // 10 minutes in seconds
    const QUESTION_TIME_LIMIT = 10; // 10 seconds

    const COLORS = [
        null, '#D00000', '#000000', '#FDF2D9', '#4d4f53', '#FFFFFF', '#D00000', '#FDF2D9'
    ]; // Nebraska-themed colors for pieces

    const SHAPES = [
        [], // Empty
        [[1,1,1,1]], // I
        [[2,2],[2,2]], // O
        [[0,3,3],[3,3,0]], // S
        [[4,4,0],[0,4,4]], // Z
        [[0,5,0],[5,5,5]], // T
        [[6,0,0],[6,6,6]], // L
        [[0,0,7],[7,7,7]]  // J
    ];

    // --- QUESTION BANK ---
    // Add more questions here to expand the game
    const questionBank = [
        {
            question: "How many touchdowns did running back Emmett Johnson score against Northwestern?",
            options: ["One", "Two", "Three", "Zero"],
            correctAnswer: 1
        },
        {
            question: "Against Northwestern, what was the result of Kenneth Williams' second-half kickoff return?",
            options: ["A 50-yard gain", "A tackle at the 20", "A 95-yard touchdown", "A fumble"],
            correctAnswer: 2
        },
        {
            question: "Javin Wright's crucial interception against Northwestern came on what down?",
            options: ["First-and-10", "Second-and-5", "Third-and-12", "Fourth-and-1"],
            correctAnswer: 2
        },
        {
            question: "How many sacks did Nebraska's defense record against Northwestern?",
            options: ["Zero", "One", "Three", "Five"],
            correctAnswer: 0
        },
        {
            question: "What injury did quarterback Dylan Raiola suffer, ending his season?",
            options: ["Torn ACL", "Broken Collarbone", "Concussion", "Broken Fibula"],
            correctAnswer: 3
        },
        {
            question: "Who took over at quarterback for Nebraska after Dylan Raiola's injury?",
            options: ["Chubba Purdy", "TJ Lateef", "Heinrich Haarberg", "Jeff Sims"],
            correctAnswer: 1
        },
        {
            question: "Against USC, how many sacks did the Husker pass rush record?",
            options: ["Zero", "One", "Two", "Three"],
            correctAnswer: 3
        },
        {
            question: "USC's 21 points against Nebraska was a season ____ for their offense.",
            options: ["High", "Average", "Low", "Record"],
            correctAnswer: 2
        },
        {
            question: "Head Coach Matt Rhule received a contract extension through which season?",
            options: ["2028", "2030", "2032", "2035"],
            correctAnswer: 2
        },
        {
            question: "What is the new buyout amount in Matt Rhule's contract extension?",
            options: ["$5 million", "$10 million", "$15 million", "$20 million"],
            correctAnswer: 2
        },
        {
            question: "What was quarterback Dylan Raiola's completion record on throws of 15+ yards against Northwestern?",
            options: ["5-of-10", "3-of-5", "1-of-6", "0-of-4"],
            correctAnswer: 2
        },
        {
            question: "Freshman Donovan Jones had a key interception against Northwestern and finished second on the team in what category?",
            options: ["Sacks", "Tackles", "Pass Breakups", "Forced Fumbles"],
            correctAnswer: 1
        },
        {
            question: "What did Ceyair Wright do on a third-and-8 in the red zone against Northwestern?",
            options: ["Get an interception", "Commit pass interference", "Force a field goal with tight coverage", "Record a sack"],
            correctAnswer: 2
        },
        {
            question: "USC, who had the No. 1 offense in the country, was held to how many passing yards by the Blackshirts?",
            options: ["135 yards", "250 yards", "310 yards", "405 yards"],
            correctAnswer: 0
        },
        {
            question: "Who did Nebraska play immediately after their win against Northwestern?",
            options: ["UCLA", "Minnesota", "USC", "Penn State"],
            correctAnswer: 2
        }
    ];

    // Game State
    let board = [];
    let score = 0;
    let lines = 0;
    let isGameOver = false;
    let currentPiece;
    let gameInterval;
    let gameTimer;
    let questionTimer;
    let gameTimeRemaining;
    let isGameTimerRunning = false; 

    class Piece {
        constructor(shape, context) {
            this.shape = shape;
            this.color = COLORS[SHAPES.indexOf(shape)];
            this.context = context;
            this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
            this.y = 0;
        }

        draw() {
            this.context.fillStyle = this.color;
            this.context.strokeStyle = '#000';
            this.shape.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value > 0) {
                        this.context.fillRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        this.context.strokeRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                });
            });
        }
    }

    function resetGame() {
        score = 0;
        lines = 0;
        isGameOver = false;
        isGameTimerRunning = false; 
        board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
        gameTimerElement.textContent = "10:00"; 
        updateUI();
        clearInterval(gameInterval);
        clearInterval(gameTimer);
        clearInterval(questionTimer);
        gameOverModal.classList.add('hidden');
    }

    function startGameTimer() {
        gameTimer = setInterval(() => {
            gameTimeRemaining--;
            const minutes = Math.floor(gameTimeRemaining / 60).toString().padStart(2, '0');
            const seconds = (gameTimeRemaining % 60).toString().padStart(2, '0');
            gameTimerElement.textContent = `${minutes}:${seconds}`;

            if (gameTimeRemaining <= 0) {
                gameOver("Time's up!");
            }
        }, 1000);
    }
    
    function startNextTurn() {
        showQuiz();
    }

    function play() {
        const shape = SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1];
        currentPiece = new Piece(shape, context);
        gameInterval = setInterval(gameLoop, 500);
    }

    function gameLoop() {
        movePiece('down');
    }
    
    function showQuiz() {
        clearInterval(gameInterval);
        // Remove citations from question text for display
        const randomQuestion = JSON.parse(JSON.stringify(questionBank[Math.floor(Math.random() * questionBank.length)]));
        questionText.textContent = randomQuestion.question.replace(/ \/g, '');

        answerOptions.innerHTML = '';

        randomQuestion.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.onclick = () => checkAnswer(index === randomQuestion.correctAnswer);
            answerOptions.appendChild(button);
        });
        
        let time = QUESTION_TIME_LIMIT;
        questionTimerBar.style.width = '100%';
        quizModal.classList.remove('hidden');

        questionTimer = setInterval(() => {
            time--;
            questionTimerBar.style.width = `${(time / QUESTION_TIME_LIMIT) * 100}%`;
            if (time <= 0) {
                checkAnswer(false, "You ran out of time!");
            }
        }, 1000);
    }
    
    function checkAnswer(isCorrect, message = "Incorrect answer!") {
        clearInterval(questionTimer);
        quizModal.classList.add('hidden');
        if (isCorrect) {
            if (!isGameTimerRunning) {
                gameTimeRemaining = GAME_TIME_LIMIT;
                startGameTimer();
                isGameTimerRunning = true;
            }
            play(); 
        } else {
            gameOver(message);
        }
    }

    function movePiece(direction) {
        if (isGameOver) return;
        let { x, y, shape } = currentPiece;

        switch (direction) {
            case 'left':
                x--;
                break;
            case 'right':
                x++;
                break;
            case 'down':
                y++;
                break;
            case 'rotate':
                shape = rotate(shape);
                break;
        }

        if (!collision(x, y, shape)) {
            currentPiece.x = x;
            currentPiece.y = y;
            currentPiece.shape = shape;
        } else if (direction === 'down') {
            lockPiece();
            clearLines();
            if (!isGameOver) {
                startNextTurn();
            }
        }
        draw();
    }
    
    function collision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] &&
                   ((y + row >= ROWS) ||
                    (x + col < 0) ||
                    (x + col >= COLS) ||
                    (board[y + row][x + col]))) {
                    return true;
                }
            }
        }
        return false;
    }

    function rotate(matrix) {
        const N = matrix.length;
        const result = matrix.map((_, i) => matrix.map(col => null));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                result[j][N - 1 - i] = matrix[i][j];
            }
        }
        return result;
    }
    
    function lockPiece() {
        clearInterval(gameInterval);
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    if (currentPiece.y + y < 0) {
                        gameOver("The blocks reached the top!");
                        return;
                    }
                    board[currentPiece.y + y][currentPiece.x + x] = value;
                }
            });
        });
    }

    function clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (board[y].every(value => value > 0)) {
                linesCleared++;
                board.splice(y, 1);
                board.unshift(Array(COLS).fill(0));
                y++; // Re-check the same row index
            }
        }
        if (linesCleared > 0) {
            score += linesCleared * 100;
            lines += linesCleared;
            updateUI();
            showGoBigRed();
            if (lines >= LINES_TO_WIN) {
                gameOver("You cleared 3 lines! You win!", "Congratulations!");
            }
        }
    }
    
    function showGoBigRed() {
        lineClearModal.classList.remove('hidden');
        setTimeout(() => {
            lineClearModal.classList.add('hidden');
        }, 1500); // Display for 1.5 seconds
    }
    
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        if(currentPiece) currentPiece.draw();
    }

    function drawBoard() {
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    context.fillStyle = COLORS[value];
                    context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    context.strokeStyle = '#000';
                    context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
    }
    
    function updateUI() {
        scoreElement.textContent = score;
        linesElement.textContent = lines;
    }

    function gameOver(message = "Game Over", title = "Game Over") {
        isGameOver = true;
        clearInterval(gameInterval);
        clearInterval(gameTimer);
        clearInterval(questionTimer);

        gameOverTitle.textContent = title;
        gameOverMessage.textContent = `${message} Your final score: ${score}`;
        
        gameOverModal.classList.remove('hidden');
    }

    document.addEventListener('keydown', (e) => {
        if (!currentPiece || isGameOver) return;
        if (e.key === 'ArrowLeft') movePiece('left');
        if (e.key === 'ArrowRight') movePiece('right');
        if (e.key === 'ArrowDown') movePiece('down');
        if (e.key === 'ArrowUp') movePiece('rotate');
    });

    startButton.addEventListener('click', () => {
        instructionsModal.classList.add('hidden');
        resetGame();
        showQuiz(); // Go straight to the first quiz
    });
    
    restartButton.addEventListener('click', () => {
        gameOverModal.classList.add('hidden');
        instructionsModal.classList.remove('hidden');
    });
});