// Global board state, initially empty
let board = [
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', '']
];

// Initialize current player (X starts)
let currentPlayer = 'X';
let gameOver = false; // Track if the game is over
let blockPhase = true; // To track if we are in the block phase
let blockCount = 0; // To count the number of block squares placed

// Function to render the board
function renderBoard() {
    let boardContainer = document.getElementById('board');
    boardContainer.innerHTML = ''; // Clear existing board
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            let cell = document.createElement('div');
            cell.classList.add('square');
            cell.setAttribute('data-row', row);
            cell.setAttribute('data-col', col);
            cell.addEventListener('click', handleCellClick);
            // If the cell is blocked, add the blocked class
            if (board[row][col] === 'blocked') {
                cell.classList.add('blocked');
            } else {
                cell.textContent = board[row][col];
            }
            boardContainer.appendChild(cell);
        }
    }
    updateMessage();
}
// Function to update the message based on the current game state
function updateMessage() {
    const message = document.getElementById('message');
    if (gameOver) {
        return; // No need to update message if game is over
    }
    if (blockPhase) {
        message.textContent = `Player ${currentPlayer}, place your block!`;
    } else {
        message.textContent = `Player ${currentPlayer}'s turn to play!`;
    }
}
// Handle cell click to place X, O, or a blocked square
function handleCellClick(event) {
    if (gameOver) return; // Prevent moves after game is over

    let row = event.target.getAttribute('data-row');
    let col = event.target.getAttribute('data-col');
   
    if (board[row][col] !== '') return; // Prevent placing in an already occupied cell

    // Check if it's the block phase
    if (blockPhase) {
        board[row][col] = 'blocked';
        blockCount++;
        renderBoard();

        if (blockCount === 4) {
            // After 4 blocks, end the block phase
            blockPhase = false;
            currentPlayer = 'X'; // Ensure Player X is the first player after the block phase
            updateMessage();
            enableHintButton(); // Enable Hint button after block phase
            return;
        } else {
            // Alternate players during block phase
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateMessage();
            return;
        }
    }

    // Main phase: place X or O
    board[row][col] = currentPlayer;
    renderBoard();

    if (checkWinner(currentPlayer)) {
        setTimeout(() => {
            const message = document.getElementById('message');
            message.textContent = `Player ${currentPlayer} wins!`;
            gameOver = true;
            disableHintButton(); // Disable Hint button when game is over
        }, 200);
        return;
    }

    // Check for a draw after each move
    if (checkDraw()) {
        const message = document.getElementById('message');
        message.textContent = "The game is a draw!";
        gameOver = true;
        disableHintButton(); // Disable Hint button when game is over
        return;
    }

    // Switch players after a valid move
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateMessage();
}

// Check if the current player has won
function checkWinner(player) {
    // Check rows, columns, and diagonals
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            // Check row
            if (col < 2 && board[row][col] === player && board[row][col + 1] === player && board[row][col + 2] === player) {
                return true;
            }
            // Check column
            if (row < 2 && board[row][col] === player && board[row + 1][col] === player && board[row + 2][col] === player) {
                return true;
            }
            // Check diagonal top-left to bottom-right
            if (row < 2 && col < 2 && board[row][col] === player && board[row + 1][col + 1] === player && board[row + 2][col + 2] === player) {
                return true;
            }
            // Check diagonal top-right to bottom-left
            if (row < 2 && col > 1 && board[row][col] === player && board[row + 1][col - 1] === player && board[row + 2][col - 2] === player) {
                return true;
            }
        }
    }
    return false;
}

// Check if the board is filled and there's no winner
function checkDraw() {
    // Check if the board is full
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === '') {
                return false; // There's still an empty space
            }
        }
    }
    // The board is full, and no winner has been found
    return !checkWinner('X') && !checkWinner('O');
}

// Function to detect if a player can force a win within a certain number of moves
function canForceWin(player, depth = 1, maxDepth = 7) {
    let opponent = (player === 'X') ? 'O' : 'X';
    let result = { canWin: false, moves: 0, movesDescription: "" };

    // Step 1: Check if player can win in the next move (direct win).
    if (depth === 1) {
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] === '') {
                    // Simulate the player's move
                    board[row][col] = player;
                    if (checkWinner(player)) {
                        board[row][col] = ''; // Reset the simulated move
                        return { canWin: true, moves: 1, movesDescription: "Win in 1 move" };
                    }
                    board[row][col] = ''; // Reset the simulated move
                }
            }
        }
    }

    // Step 2: Check for forced win in future moves (up to maxDepth).
    if (depth <= maxDepth) {
        // Step 2a: Try placing a piece for the current player
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                if (board[row][col] === '') {
                    // Simulate the player's move
                    board[row][col] = player;

                    // Step 2b: Check if the opponent can force a win in the next move
                    let opponentResult = canForceWin(opponent, depth + 1, maxDepth);
                    if (opponentResult.canWin) {
                        // If the opponent can force a win, then we need to block it
                        // But, if this block doesn't prevent the opponent from winning, then it's not a forced win for us
                        board[row][col] = ''; // Reset the simulated move
                        continue;  // Skip this move
                    }

                    // Step 2c: Check if the current player can win in this sequence of moves
                    let playerResult = canForceWin(player, depth + 1, maxDepth);
                    if (playerResult.canWin) {
                        // If the current player can win in the next moves, return it
                        board[row][col] = ''; // Reset the simulated move
                        return { canWin: true, moves: depth + playerResult.moves, movesDescription: `Force win in ${depth + playerResult.moves} moves` };
                    }
                    board[row][col] = ''; // Reset the simulated move
                }
            }
        }
    }

    return result;
}

// Function to highlight the best move using the "Hint" button
function showHint() {
    if (gameOver || blockPhase) return; // Don't show hint if the game is over or in block phase

    // We need to find the best move according to the canForceWin function
    let bestMove = null;
    let bestMoveDescription = '';
    let bestMoveScore = 7; // We want the lowest score, so we'll start with the maximum depth

    // Check all empty spots for the best move
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (board[row][col] === '') {
                // Simulate the player's move
                board[row][col] = currentPlayer;
                let result = canForceWin(currentPlayer, 1, 7);

                // If we find a better move (less moves to win)
                if (result.canWin && result.moves < bestMoveScore) {
                    bestMoveScore = result.moves;
                    bestMove = { row, col };
                    bestMoveDescription = result.movesDescription;
                }

                board[row][col] = ''; // Reset the simulated move
            }
        }
    }

    // Highlight the best move if it exists
    if (bestMove) {
        let cell = document.querySelector(`[data-row="${bestMove.row}"][data-col="${bestMove.col}"]`);
        cell.classList.add('hint'); // Highlight the best move
        alert(`Best move: ${bestMoveDescription}`);
    } else {
        alert('No forced win detected');
    }
}

// Function to enable the Hint button after the block phase ends
function enableHintButton() {
	return; // we're still working on the hint feature :X
    const hintButton = document.getElementById('hintButton');
    hintButton.disabled = false;  // Enable the button
    hintButton.style.backgroundColor = '';  // Reset background color to default
    hintButton.style.cursor = '';  // Reset cursor to default
}

// Function to disable the Hint button when the game is over or during the block phase
function disableHintButton() {
    const hintButton = document.getElementById('hintButton');
    hintButton.disabled = true;  // Disable the button
    hintButton.style.backgroundColor = '#d3d3d3';  // Apply a dimmed background color
    hintButton.style.cursor = 'not-allowed';  // Change cursor to indicate the button is disabled
}
disableHintButton();

// Event listener for the "Hint" button
document.getElementById('hintButton').addEventListener('click', showHint);

// Event listener for the "Reset" button
document.getElementById('resetBtn').addEventListener('click', resetGame);

// Function to reset the game
function resetGame() {
    board = [
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', ''],
        ['', '', '', '']
    ];
    currentPlayer = 'X';
    gameOver = false;
    blockPhase = true; // Reset the block phase
    blockCount = 0;
    renderBoard();
    disableHintButton(); // Disable the Hint button on reset
}

// Initial rendering of the board
renderBoard();
