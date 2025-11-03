document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const canvas = document.getElementById('tetris');
    if (!canvas) {
        console.error("FATAL ERROR: Canvas element with id 'tetris' not found!");
        return; // Stop the script if the canvas is missing
    }
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

    // --- Game Constants & Shapes ---
    const COLS = 10;
    const ROWS = 20;
    const BLOCK_SIZE = 24;
    const LINES_TO_WIN = 3;
    const GAME_TIME_LIMIT = 600;
    const QUESTION_TIME_LIMIT = 10;
    const COLORS = [null, '#D00000', '#000000', '#FDF2D9', '#4d4f53', '#FFFFFF', '#D00000', '#FDF2D9'];
    const SHAPES = [ [], [[1,1,1,1]], [[2,2],[2,2]], [[0,3,3],[3,3,0]], [[4,4,0],[0,4,4]], [[0,5,0],[5,5,5]], [[6,0,0],[6,6,6]], [[0,0,7],[7,7,7]] ];

    // --- Question Bank ---
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
        { question: "What was Dylan Raiola's completion record on throws of 15+ yards vs Northwestern?", options: ["5-of-10", "3-of-5", "1-of-6", "0-of-4"], correctAnswer: 2 },
        { question: "Freshman Donovan Jones finished second on the team in what category vs Northwestern?", options: ["Sacks", "Tackles", "Pass Breakups", "Forced Fumbles"], correctAnswer: 1 },
        { question: "What did Ceyair Wright do on a third-and-8 in the red zone against Northwestern?", options: ["Get an interception", "Commit pass interference", "Force a field goal", "Record a sack"], correctAnswer: 2 },
        { question: "USC, who had the No. 1 offense, was held to how many passing yards by the Blackshirts?", options: ["135 yards", "250 yards", "310 yards", "405 yards"], correctAnswer: 0 },
        { question: "Who did Nebraska play immediately after their win against Northwestern?", options: ["UCLA", "Minnesota", "USC", "Penn State"], correctAnswer: 2 }
    ];

    // --- Game State Variables ---
    let board, score, lines, isGameOver, currentPiece, gameInterval, gameTimer, questionTimer, gameTimeRemaining, isGameTimerRunning;

    // --- Game Logic Functions ---
    class Piece {
        constructor(shape) { this.shape = shape; this.color = COLORS[SHAPES.indexOf(shape)]; this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2); this.y = 0; }
        draw() { context.fillStyle = this.color; this.shape.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) { context.fillRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); context.strokeRect((this.x + x) * BLOCK_SIZE, (this.y + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); } }); }); }
    }
    function resetGame() { score = 0; lines = 0; isGameOver = false; isGameTimerRunning = false; board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); gameTimerElement.textContent = "10:00"; updateUI(); clearInterval(gameInterval); clearInterval(gameTimer); clearInterval(questionTimer); gameOverModal.classList.add('hidden'); draw(); }
    function startGameTimer() { gameTimer = setInterval(() => { gameTimeRemaining--; const minutes = Math.floor(gameTimeRemaining / 60).toString().padStart(2, '0'); const seconds = (gameTimeRemaining % 60).toString().padStart(2, '0'); gameTimerElement.textContent = `${minutes}:${seconds}`; if (gameTimeRemaining <= 0) gameOver("Time's up!"); }, 1000); }
    function play() { const shape = SHAPES[Math.floor(Math.random() * (SHAPES.length - 1)) + 1]; currentPiece = new Piece(shape); gameInterval = setInterval(gameLoop, 500); }
    function gameLoop() { movePiece('down'); }
    function showQuiz() { clearInterval(gameInterval); const q = questionBank[Math.floor(Math.random() * questionBank.length)]; questionText.textContent = q.question; answerOptions.innerHTML = ''; q.options.forEach((option, index) => { const button = document.createElement('button'); button.textContent = option; button.onclick = () => checkAnswer(index === q.correctAnswer); answerOptions.appendChild(button); }); let time = QUESTION_TIME_LIMIT; questionTimerBar.style.width = '100%'; quizModal.classList.remove('hidden'); questionTimer = setInterval(() => { time--; questionTimerBar.style.width = `${(time / QUESTION_TIME_LIMIT) * 100}%`; if (time <= 0) checkAnswer(false, "You ran out of time!"); }, 1000); }
    function checkAnswer(isCorrect, message = "Incorrect answer!") { clearInterval(questionTimer); quizModal.classList.add('hidden'); if (isCorrect) { if (!isGameTimerRunning) { gameTimeRemaining = GAME_TIME_LIMIT; startGameTimer(); isGameTimerRunning = true; } play(); } else { gameOver(message); } }
    function movePiece(direction) { if (isGameOver) return; let { x, y, shape } = currentPiece; switch (direction) { case 'left': x--; break; case 'right': x++; break; case 'down': y++; break; case 'rotate': shape = rotate(shape); break; } if (!collision(x, y, shape)) { currentPiece.x = x; currentPiece.y = y; currentPiece.shape = shape; } else if (direction === 'down') { lockPiece(); clearLines(); if (!isGameOver) showQuiz(); } draw(); }
    function collision(x, y, shape) { for (let row = 0; row < shape.length; row++) { for (let col = 0; col < shape[row].length; col++) { if (shape[row][col] && ((y + row >= ROWS) || (x + col < 0) || (x + col >= COLS) || (board[y + row][x + col]))) return true; } } return false; }
    function rotate(matrix) { const N = matrix.length; const result = matrix.map((_, i) => matrix.map(col => null)); for (let i = 0; i < N; i++) { for (let j = 0; j < N; j++) { result[j][N - 1 - i] = matrix[i][j]; } } return result; }
    function lockPiece() { clearInterval(gameInterval); currentPiece.shape.forEach((row, y) => { row.forEach((value, x) => { if (value) { if (currentPiece.y + y < 0) { gameOver("The blocks reached the top!"); return; } board[currentPiece.y + y][currentPiece.x + x] = value; } }); }); }
    function clearLines() { let linesCleared = 0; for (let y = ROWS - 1; y >= 0; y--) { if (board[y].every(value => value > 0)) { linesCleared++; board.splice(y, 1); board.unshift(Array(COLS).fill(0)); y++; } } if (linesCleared > 0) { score += linesCleared * 100; lines += linesCleared; updateUI(); showGoBigRed(); if (lines >= LINES_TO_WIN) gameOver("You cleared 3 lines! You win!", "Congratulations!"); } }
    function showGoBigRed() { lineClearModal.classList.remove('hidden'); setTimeout(() => { lineClearModal.classList.add('hidden'); }, 1500); }
    function draw() { context.clearRect(0, 0, canvas.width, canvas.height); drawBoard(); if(currentPiece) currentPiece.draw(); }
    function drawBoard() { board.forEach((row, y) => { row.forEach((value, x) => { if (value > 0) { context.fillStyle = COLORS[value]; context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); context.strokeStyle = '#000'; context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); } }); }); }
    function updateUI() { scoreElement.textContent = score; linesElement.textContent = lines; }
    function gameOver(message = "Game Over", title = "Game Over") { isGameOver = true; clearInterval(gameInterval); clearInterval(gameTimer); clearInterval(questionTimer); gameOverTitle.textContent = title; gameOverMessage.firstChild.nodeValue = `${message} Your final score: `; finalScoreElement.textContent = score; gameOverModal.classList.remove('hidden'); }
    
    // --- Event Listeners ---
    if (startButton) {
        startButton.addEventListener('click', () => {
            instructionsModal.classList.add('hidden');
            resetGame();
            showQuiz();
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

    document.addEventListener('keydown', (e) => { if (!currentPiece || isGameOver) return; if (e.key === 'ArrowLeft') movePiece('left'); if (e.key === 'ArrowRight') movePiece('right'); if (e.key === 'ArrowDown') movePiece('down'); if (e.key === 'ArrowUp') movePiece('rotate'); });

    // --- Initial Game State ---
    console.log("Husker News Tetris initialized successfully. Ready to play!");
    resetGame(); // Set the initial board state on load
});