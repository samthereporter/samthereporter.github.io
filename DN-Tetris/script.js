/* ============================================
    Husker News Tetris - Final Script (v6)
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
    
    // ** NEW: Next piece canvas **
    const nextPieceCanvas = document.getElementById('next-piece');
    const nextContext = nextPieceCanvas.getContext('2d');

    // --- Game Constants & Shapes ---
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 24;
    const LINES_TO_WIN = 5; // ** CHANGED: Win condition is now 5 lines **
    const GAME_TIME_LIMIT = 600; 
    const QUESTION_TIME_LIMIT = 10; 
    
    const COLORS = [
        null, '#D00000', '#000000', '#FDF2D9', '#4d4f53', '#FFFFFF', '#D00000', '#FDF2D9'  
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

    // --- Question Bank (Truncated for brevity) ---
    const questionBank = [
        { question: "How many touchdowns did running back Emmett Johnson score against Northwestern?", options: ["One", "Two", "Three", "Zero"], correctAnswer: 1 },
        { question: "Against Northwestern, what was Kenneth Williams' second-half kickoff return?", options: ["A 50-yard gain", "A tackle at the 20", "A 95-yard touchdown", "A fumble"], correctAnswer: 2 },
        { question: "Javin Wright's crucial interception against Northwestern came on what down?", options: ["First-and-10", "Second-and-5", "Third-and-12", "Fourth-and-1"], correctAnswer: 2 },
        { question: "How many sacks did Nebraska's defense record against Northwestern?", options: ["Zero", "One", "Three", "Five"], correctAnswer: 0 },
        { question: "What season-ending injury did quarterback Dylan Raiola suffer?", options: ["Torn ACL", "Broken Collarbone", "Concussion", "Broken Fibula"], correctAnswer: 3 },
        { question: "Who took over at quarterback for Nebraska after Dylan Raiola's injury?", options: ["Chubba Purdy", "TJ Lateef", "Heinrich Haarberg", "Jeff Sims"], correctAnswer: 1 },
        { question: "Against USC, how many sacks did the Husker pass rush record?", options: ["Zero", "One", "Two", "Three"], correctAnswer: 3 },
        { question: "USC's 21 points against Nebraska was a season ____ for their offense.", options: ["High", "Average", "Low", "Record"], correctAnswer: 2 },
        { question: "Head Coach Matt Rhule received a contract extension through which season?", options: ["2028", "2030", "2032", "2035"], correctAnswer: 2 },
        { question: "What is the new buyout amount in Matt Rhule's contract extension?", options: ["$5 million", "$10 million", "$15 million", "$20 million"], correctAnswer: 2 },
    ];

    // --- Game State Variables ---
    let board, score, lines, isGameOver, currentPiece, gameInterval, gameTimer, questionTimer, gameTimeRemaining, isGameTimerRunning, quizStartTime;
    
    // ** NEW: Quiz cadence state **
    let nextPiece;
    let blocksPlacedSinceQuiz;
    let quizTriggerCount; // How many blocks to place before next quiz

    // --- Game Logic Functions ---
    
    class Piece {
        constructor(shape) { 
            this.shape = shape; 
            this.color = COLORS[SHAPES.indexOf(shape)]; 
            this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2); 
            this.y = 0; 
        }
        
        draw() { 
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
        currentPiece = null; // Game starts with no piece
        
        // ** NEW: Set up quiz cadence and next piece **
        blocksPlacedSinceQuiz = 0;
        quizTriggerCount = Math.floor(Math.random() * 2) + 3; // 3 or 4
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
    
    // ** UPDATED: Play logic now uses the nextPiece system **
    function play() { 
        currentPiece = nextPiece; // The next piece becomes current
        nextPiece = new Piece(SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1]); // Get a new next piece
        drawNextPiece(); // Update the preview box
        gameInterval = setInterval(gameLoop, 500); 
    }
    
    function gameLoop() { 
        movePiece('down'); 
    }
    
    // ** UPDATED: Show quiz now resets quiz cadence **
    function showQuiz() { 
        clearInterval(gameInterval); // Pause the game
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
        
        // ** NEW: Reset quiz counter for the *next* round **
        blocksPlacedSinceQuiz = 0;
        quizTriggerCount = Math.floor(Math.random() * 2) + 3; // 3 or 4
    }
    
    // ** UPDATED: Check answer logic is now simpler **
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
                play(); // This is the first piece of the game
            } else {
                gameInterval = setInterval(gameLoop, 500); // Resume the paused piece
            }
        } else { 
            gameOver(message); 
        } 
    }
    
    // ** UPDATED: Move piece now handles quiz cadence logic **
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
            
            if (isGameOver) return; // Stop if game was won

            // ** NEW: Check if it's time for a quiz **
            if (blocksPlacedSinceQuiz >= quizTriggerCount) {
                showQuiz();
            } else {
                play(); // No quiz, just start the next piece
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
    
    // ** UPDATED: Lock piece now increments the quiz counter **
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
        
        // ** NEW: Count this piece toward the next quiz **
        blocksPlacedSinceQuiz++;
    }
    
    // ** UPDATED: Win condition is now 5 lines **
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
    
    // ** UPDATED: Main draw function now calls ghost piece **
    function draw() { 
        context.clearRect(0, 0, canvas.width, canvas.height); 
        drawBoard(); 
        drawGhostPiece(); // ** NEW: Draw the shadow **
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

    // ** NEW: Function to draw the "Next Piece" preview **
    function drawNextPiece() {
        nextContext.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
        if (!nextPiece) return;

        const shape = nextPiece.shape;
        const color = nextPiece.color;
        const size = BLOCK_SIZE * 0.8; // Make it a bit smaller for the box
        
        // Calculate offset to center the piece
        const shapeWidth = (shape[0] ? shape[0].length : 0) * size;
        const shapeHeight = shape.length * size;
        const startX = (nextPieceCanvas.width - shapeWidth) / 2;
        const startY = (nextPieceCanvas.height - shapeHeight) / 2;

        nextContext.fillStyle = color;
        nextContext.strokeStyle = '#3f3f46'; // Use border color
        shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    nextContext.fillRect(startX + x * size, startY + y * size, size, size);
                    nextContext.strokeRect(startX + x * size, startY + y * size, size, size);
                }
            });
        });
    }

    // ** NEW: Function to draw the "Ghost Piece" shadow **
    function drawGhostPiece() {
        if (!currentPiece) return;
        
        let ghostY = currentPiece.y;
        // Move the ghost piece down until it collides
        while (!collision(currentPiece.x, ghostY + 1, currentPiece.shape)) {
            ghostY++;
        }

        // Now draw the piece at (currentPiece.x, ghostY) with transparency
        context.globalAlpha = 0.3; // Set transparency
        context.fillStyle = currentPiece.color;
        currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    context.fillRect((currentPiece.x + x) * BLOCK_SIZE, (ghostY + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                }
            });
        });
        context.globalAlpha = 1.0; // Reset transparency
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
            
            // Manually trigger the "down" collision logic
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
    console.log("Husker News Tetris initialized successfully (v6). Ready to play!");
    resetGame(); 
});
