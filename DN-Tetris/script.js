/* ============================================
    Husker News Tetris - Final Script (v7 - Bug Fix)
    ============================================
*/
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
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
    const nextPieceCanvas = document.getElementById('next-piece');
    const nextContext = nextPieceCanvas.getContext('2d');

    // --- Game Constants & Shapes ---
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 24;
    const LINES_TO_WIN = 5; 
    const GAME_TIME_LIMIT = 600; 
    const QUESTION_TIME_LIMIT = 10; 
    
    // ** BUG FIX: Changed 'O' piece color from black to scarlet **
    const COLORS = [
        null, 
        '#D00000', // 1: I (Scarlet)
        '#D00000', // 2: O (WAS BLACK, NOW SCARLET)
        '#FDF2D9', // 3: S (Cream)
        '#4d4f53', // 4: Z (Husker Steel)
        '#FFFFFF', // 5: T (White)
        '#D00000', // 6: L (Scarlet)
        '#FDF2D9'  // 7: J (Cream)
    ];
    
    const SHAPES = [
        [],
        [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
        [[2,2],[2,2]], // O
        [[0,3,3],[3,3,0],[0,0,0]], // S
        [[4,4,0],[0,4,4],[0,0,0]], // Z
        [[0,5,0],[5,5,5],[0,0,0]], // T
        [[0,0,6],[6,6,6],[0,0,0]], // L
        [[7,0,0],[7,7,7],[0,0,0]]  // J
    ];

    // --- Question Bank (Truncated) ---
    const questionBank = [
        { question: "How many touchdowns did running back Emmett Johnson score against Northwestern?", options: ["One", "Two", "Three", "Zero"], correctAnswer: 1 },
        { question: "Against Northwestern, what was Kenneth Williams' second-half kickoff return?", options: ["A 50-yard gain", "A tackle at the 20", "A 95-yard touchdown", "A fumble"], correctAnswer: 2 },
        { question: "Javin Wright's crucial interception against Northwestern came on what down?", options: ["First-and-10", "Second-and-5", "Third-and-12", "Fourth-and-1"], correctAnswer: 2 },
        { question: "How many sacks did Nebraska's defense record against Northwestern?", options: ["Zero", "One", "Three", "Five"], correctAnswer: 0 },
        { question: "What season-ending injury did quarterback Dylan Raiola suffer?", options: ["Torn ACL", "Broken Collarbone", "Concussion", "Broken Fibula"], correctAnswer: 3 },
        { question: "Who took over at quarterback for Nebraska after Dylan Raiola's injury?", options: ["Chubba Purdy", "TJ Lateef", "Heinrich Haarberg", "Jeff Sims"], correctAnswer: 1 },
        { question: "Against USC, how many sacks did the Husker pass rush record?", options: ["Zero", "One", "Two", "Three"], correctAnswer: 3 },
    ];

    // --- Game State Variables ---
    let board, score, lines, isGameOver, currentPiece, gameInterval, gameTimer, questionTimer, gameTimeRemaining, isGameTimerRunning, quizStartTime;
    let nextPiece, blocksPlacedSinceQuiz, quizTriggerCount;

    // --- Game Logic Functions ---
    
    class Piece {
        constructor(shape) { 
            this.shape = shape; 
            this.color = COLORS[SHAPES.indexOf(shape)]; 
            this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2); 
            this.y = 0; 
        }
        
        draw() { 
            // ** BUG FIX: Explicitly set alpha to 1.0 for the active piece **
            context.globalAlpha = 1.0; 
            context.fillStyle = this.color; 
            context.strokeStyle = '#000';
            this.shape.forEach((row, y) => { 
                row.forEach((value, x) => { 
                    if (value > 0) { 
                        context.fillRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); 
                        context.strokeRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); 
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
        currentPiece = null; 
        blocksPlacedSinceQuiz = 0;
        quizTriggerCount = Math.floor(Math.random() * 2) + 3; 
        nextPiece = new Piece(SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1]);
        drawNextPiece();
        updateUI(); 
        clearInterval(gameInterval); 
        clearInterval(gameTimer); 
        clearInterval(questionTimer); 
        gameOverModal.classList.add('hidden'); 
        draw(); 
    }
    
    function startGameTimer() { 
        gameTimer = setInterval(() => { 
            gameTimeRemaining--; 
            const minutes = Math.floor(gameTimeRemaining / 60).toString().padStart(2, '0'); 
            const seconds = (gameTimeRemaining % 60).toString().padStart(2, '0'); 
            gameTimerElement.textContent = `${minutes}:${seconds}`; 
            if (gameTimeRemaining <= 0) gameOver("Time's up!"); 
        }, 1000); 
    }
    
    function play() { 
        currentPiece = nextPiece; 
        nextPiece = new Piece(SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1]); 
        drawNextPiece(); 
        gameInterval = setInterval(gameLoop, 500); 
    }
    
    function gameLoop() { 
        movePiece('down'); 
    }
    
    function showQuiz() { 
        clearInterval(gameInterval); 
        const q = questionBank[Math.floor(Math.random() * questionBank.length)]; 
        questionText.textContent = q.question; 
        answerOptions.innerHTML = ''; 
        
        q.options.forEach((option, index) => { 
            const button = document.createElement('button'); 
            button.textContent = option; 
            button.onclick = () => checkAnswer(index === q.correctAnswer); 
            answerOptions.appendChild(button); 
        }); 
        
        quizStartTime = Date.now();
        questionTimerBar.style.width = '100%';
        quizModal.classList.remove('hidden'); 

        questionTimer = setInterval(() => {
            const timePassed = (Date.now() - quizStartTime) / 1000;
            const timeRemaining = QUESTION_TIME_LIMIT - timePassed;
            const widthPercent = Math.max(0, (timeRemaining / QUESTION_TIME_LIMIT) * 100);
            questionTimerBar.style.width = `${widthPercent}%`;
            
            if (timeRemaining <= 0) checkAnswer(false, "You ran out of time!");
        }, 50);
        
        blocksPlacedSinceQuiz = 0;
        quizTriggerCount = Math.floor(Math.random() * 2) + 3; 
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
            if (!currentPiece) {
                play(); 
            } else {
                gameInterval = setInterval(gameLoop, 500); 
            }
        } else { 
            gameOver(message); 
        } 
    }
    
    function movePiece(direction) { 
        if (isGameOver) return; 
        let { x, y, shape } = currentPiece; 
        
        switch (direction) { 
            case 'left': x--; break; 
            case 'right': x++; break; 
            case 'down': y++; break; 
            case 'rotate': 
                shape = rotate(shape); 
                if (collision(x, y, shape)) {
                    if (!collision(x - 1, y, shape)) x--;
                    else if (!collision(x + 1, y, shape)) x++;
                    else shape = currentPiece.shape;
                }
                break; 
        } 
        
        if (!collision(x, y, shape)) { 
            currentPiece.x = x; 
            currentPiece.y = y; 
            currentPiece.shape = shape; 
        } else if (direction === 'down') { 
            lockPiece(); 
            clearLines(); 
            if (isGameOver) return;
            if (blocksPlacedSinceQuiz >= quizTriggerCount) {
                showQuiz();
            } else {
                play();
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
                    (board[y + row] && board[y + row][x + col])))
                { 
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
                    if (board[currentPiece.y + y]) {
                        board[currentPiece.y + y][currentPiece.x + x] = value; 
                    }
                } 
            }); 
        });
        blocksPlacedSinceQuiz++;
    }
    
    function clearLines() { 
        let linesCleared = 0; 
        for (let y = ROWS - 1; y >= 0; y--) { 
            if (board[y].every(value => value > 0)) { 
                linesCleared++; 
                board.splice(y, 1); 
                board.unshift(Array(COLS).fill(0)); 
                y++; 
            } 
        } 
        
        if (linesCleared > 0) { 
            score += linesCleared * 100; 
            lines += linesCleared; 
            updateUI(); 
            showGoBigRed(); 
            if (lines >= LINES_TO_WIN) {
                gameOver(`You cleared ${LINES_TO_WIN} lines! You win!`, "Congratulations!"); 
            }
        } 
    }
    
    function showGoBigRed() { 
        lineClearModal.classList.remove('hidden'); 
        setTimeout(() => { 
            lineClearModal.classList.add('hidden'); 
        }, 1500); 
    }
    
    function draw() { 
        context.clearRect(0, 0, canvas.width, canvas.height); 
        drawBoard(); 
        drawGhostPiece(); 
        if(currentPiece) currentPiece.draw(); 
    }
    
    function drawBoard() { 
        // ** BUG FIX: Explicitly set alpha to 1.0 for the board **
        context.globalAlpha = 1.0;
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

    function drawNextPiece() {
        nextContext.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        if (!nextPiece) return;
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        const size = BLOCK_SIZE * 0.8; 
        const shapeWidth = (shape[0] ? shape[0].length : 0) * size;
        const shapeHeight = shape.length * size;
        const startX = (nextPieceCanvas.width - shapeWidth) / 2;
        const startY = (nextPieceCanvas.height - shapeHeight) / 2;

        nextContext.fillStyle = color;
        nextContext.strokeStyle = '#3f3f46';
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    nextContext.fillRect(startX + x * size, startY + y * size, size, size);
                    nextContext.strokeRect(startX + x * size, startY + y * size, size, size);
                }
            });
        });
    }

    function drawGhostPiece() {
        if (!currentPiece) return;
        
        let ghostY = currentPiece.y;
        while (!collision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
            ghostY++;
        }

        context.globalAlpha = 0.3; // Set transparency
        context.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    context.fillRect((currentPiece.x + x) * BLOCK_SIZE, (ghostY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        // ** BUG FIX: Reset alpha immediately after use **
        context.globalAlpha = 1.0; 
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
        if (gameOverMessage.firstChild) {
            gameOverMessage.firstChild.nodeValue = `${message} Your final score: `; 
        }
        finalScoreElement.textContent = score; 
        gameOverModal.classList.remove('hidden'); 
    }
    
    // --- Event Listeners ---
    document.addEventListener('keydown', (e) => { 
        if (isGameOver || !quizModal.classList.contains('hidden')) {
            return;
        }
        if (!currentPiece) return;

        if (e.key === 'ArrowLeft') movePiece('left'); 
        if (e.key === 'ArrowRight') movePiece('right'); 
        if (e.key === 'ArrowDown') movePiece('down'); 
        if (e.key === 'ArrowUp') movePiece('rotate'); 

        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault(); 
            let rowsDropped = 0;
            while (!collision(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
                currentPiece.y++;
                rowsDropped++;
            }
            score += rowsDropped; 
            updateUI();
            movePiece('down');
        }
    });

    if (startButton) {
        startButton.addEventListener('click', () => {
            instructionsModal.classList.add('hidden');
            resetGame();
            showQuiz(); // Start with the first quiz
        });
    } else {
        console.error("FATAL ERROR: Start button with id 'start-button' not found!");
    }
    
    if (restartButton) {
        restartButton.addEventListener('click', () => {
            gameOverModal.classList.add('hidden');
            instructionsModal.classList.remove('hidden');
        });
    } else {
        console.error("Error: Restart button with id 'restart-button' not found!");
    }

    // --- Initial Game State ---
    console.log("Husker News Tetris initialized successfully (v7). Ready to play!");
    resetGame(); 
});

