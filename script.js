const gameBoard = document.getElementById("gameBoard");
const timerText = document.getElementById("timer");
const movesText = document.getElementById("moves");
const matchesText = document.getElementById("matches");
const statusText = document.getElementById("status");

const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const winModal = document.getElementById("winModal");
const finalStats = document.getElementById("finalStats");

const difficultySelect = document.getElementById("difficulty");
const bestScoreText = document.getElementById("bestScore");
const coinsText = document.getElementById("coins");

const allSymbols = [
    "🚀", "🎮", "💎", "👾", "🎯", "⚡",
    "🌙", "🔥", "🪐", "🎧", "🦄", "🍀"
];

const pairCounts = {
    easy: 6,
    medium: 8,
    hard: 12
};

const timeLimits = {
    easy: 60,
    medium: 90,
    hard: 120
};

let symbols = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;

let moves = 0;
let matches = 0;
let seconds = 0;
let timerInterval = null;
let gameStarted = false;
let gameFinished = false;

let coins = Number(localStorage.getItem("memoryCoins") || 0);
let earnedThisGame = 0;

function updateCoins() {
    if (coinsText) {
        coinsText.textContent = coins;
    }

    localStorage.setItem("memoryCoins", String(coins));
}

function showCoinPopup(amount) {
    const popup = document.createElement("div");

    popup.className = "coin-popup";
    popup.textContent = `🪙 +${amount} COINS!`;

    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 1200);
}

function awardCoins(amount) {
    coins += amount;
    earnedThisGame += amount;

    updateCoins();
    showCoinPopup(amount);
}

function createDeck() {
    return [...symbols, ...symbols]
        .map((symbol, index) => ({
            id: index,
            symbol: symbol
        }))
        .sort(() => Math.random() - 0.5);
}

function updateBestScore() {
    const key = "memoryBest_" + difficultySelect.value;
    const best = localStorage.getItem(key);

    if (bestScoreText) {
        bestScoreText.textContent = best !== null
            ? `🏆 Best Score: ${best} moves`
            : "🏆 Best Score: Not set";
    }
}

function startGame() {
    clearInterval(timerInterval);

    symbols = allSymbols.slice(
        0,
        pairCounts[difficultySelect.value]
    );

    firstCard = null;
    secondCard = null;
    lockBoard = false;

    moves = 0;
    matches = 0;
    seconds = 0;
    gameStarted = false;
    gameFinished = false;
    earnedThisGame = 0;

    timerText.textContent = "00:00";
    movesText.textContent = "0";
    matchesText.textContent = `0 / ${symbols.length}`;
    statusText.textContent = "Ready to play";

    winModal.classList.add("hidden");
    gameBoard.innerHTML = "";

    const deck = createDeck();

    deck.forEach((item) => {
        const card = document.createElement("button");

        card.className = "memory-card";
        card.type = "button";
        card.dataset.symbol = item.symbol;
        card.setAttribute("aria-label", "Hidden memory card");

        card.innerHTML = `
            <span class="card-symbol">?</span>
        `;

        card.addEventListener("click", () => flipCard(card));

        gameBoard.appendChild(card);
    });

    updateCoins();
    updateBestScore();
}

function startTimer() {
    if (gameStarted || gameFinished) return;

    gameStarted = true;
    statusText.textContent = "Game in progress";

    timerInterval = setInterval(() => {
        seconds++;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        timerText.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(remainingSeconds).padStart(2, "0");

        if (seconds >= timeLimits[difficultySelect.value]) {
            endGame(false);
        }
    }, 1000);
}

function flipCard(card) {
    if (
        lockBoard ||
        gameFinished ||
        card === firstCard ||
        card.classList.contains("matched") ||
        card.classList.contains("flipped")
    ) {
        return;
    }

    startTimer();

    card.classList.add("flipped");
    card.querySelector(".card-symbol").textContent =
        card.dataset.symbol;
    card.setAttribute("aria-label", card.dataset.symbol);

    if (!firstCard) {
        firstCard = card;
        return;
    }

    secondCard = card;
    moves++;

    movesText.textContent = moves;
    lockBoard = true;

    if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
        handleMatch();
    } else {
        statusText.textContent = "Not a match — try again!";

        const cardA = firstCard;
        const cardB = secondCard;

        setTimeout(() => {
            if (!gameFinished) {
                cardA.classList.remove("flipped");
                cardB.classList.remove("flipped");

                cardA.querySelector(".card-symbol").textContent = "?";
                cardB.querySelector(".card-symbol").textContent = "?";

                cardA.setAttribute("aria-label", "Hidden memory card");
                cardB.setAttribute("aria-label", "Hidden memory card");

                resetTurn();
                statusText.textContent = "Keep going!";
            }
        }, 850);
    }
}

function handleMatch() {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    firstCard.disabled = true;
    secondCard.disabled = true;

    matches++;

    matchesText.textContent = `${matches} / ${symbols.length}`;
    statusText.textContent = "Perfect match! ✨";

    // 5 coins for every matching pair.
    awardCoins(5);

    resetTurn();

    if (matches === symbols.length) {
        endGame(true);
    }
}

function resetTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

function endGame(won) {
    if (gameFinished) return;

    gameFinished = true;
    gameStarted = false;
    lockBoard = true;

    clearInterval(timerInterval);

    document.querySelectorAll(".memory-card").forEach((card) => {
        card.disabled = true;
    });

    if (won) {
        // 50 bonus coins for winning.
        awardCoins(50);

        statusText.textContent = "You won! 🏆";

        finalStats.textContent =
            `You matched all ${symbols.length} pairs in ${moves} moves and ${timerText.textContent}. You earned ${earnedThisGame} coins!`;

        const key = "memoryBest_" + difficultySelect.value;
        const best = localStorage.getItem(key);

        if (best === null || moves < Number(best)) {
            localStorage.setItem(key, String(moves));
        }

        updateBestScore();
    } else {
        statusText.textContent = "Game over! ⏰";

        finalStats.textContent =
            `Time is up! You matched ${matches} of ${symbols.length} pairs. You earned ${earnedThisGame} coins.`;
    }

    winModal.classList.remove("hidden");
}

restartBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);

difficultySelect.addEventListener("change", () => {
    startGame();
});

updateCoins();
startGame();