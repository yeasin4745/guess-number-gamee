/**
 * গেস নম্বর গেম
 * Guess Number Game
 * 
 * একটা মজার নম্বর গেসিং গেম যেখানে ইউজার 0-4 এর মধ্যে নম্বর গেস করে
 * সিস্টেম র‍্যান্ডম নম্বর জেনারেট করে এবং ম্যাচ করলে জয়, না করলে হার
 * 
 * @author Yeasin
 * @version 1.0.0
 */

// ===== Game State =====
const gameState = {
    totalRounds: 0,
    currentRound: 0,
    wins: 0,
    loses: 0,
    isGameRunning: false,
    currentGuess: null,
    generatedNumber: null
};

// ===== DOM Elements =====
const elements = {
    // Settings
    gameRoundsInput: document.getElementById('gameRounds'),
    startGameBtn: document.getElementById('startGame'),
    
    // Game Play
    gamePlaySection: document.getElementById('gamePlaySection'),
    winCount: document.getElementById('winCount'),
    loseCount: document.getElementById('loseCount'),
    currentRound: document.getElementById('currentRound'),
    totalRounds: document.getElementById('totalRounds'),
    roundNumber: document.getElementById('roundNumber'),
    progressFill: document.getElementById('progressFill'),
    resultMessage: document.getElementById('resultMessage'),
    
    // Number Buttons
    numberButtons: document.querySelectorAll('.number-btn'),
    guessInput: document.getElementById('guessInput'),
    submitGuessBtn: document.getElementById('submitGuess'),
    
    // Game Over
    gameOverSection: document.getElementById('gameOverSection'),
    finalWin: document.getElementById('finalWin'),
    finalLose: document.getElementById('finalLose'),
    winPercentage: document.getElementById('winPercentage'),
    highScoreDisplay: document.getElementById('highScoreDisplay'),
    
    // Actions
    endGameBtn: document.getElementById('endGame'),
    playAgainBtn: document.getElementById('playAgain'),
    saveScoreBtn: document.getElementById('saveScore'),
    
    // History
    scoreHistorySection: document.getElementById('scoreHistorySection'),
    historyList: document.getElementById('historyList'),
    closeHistoryBtn: document.getElementById('closeHistory')
};

// ===== LocalStorage Keys =====
const STORAGE_KEYS = {
    HIGH_SCORE: 'guessNumber_highScore',
    SCORE_HISTORY: 'guessNumber_scoreHistory'
};

// ===== Utility Functions =====
/**
 * র‍্যান্ডম নম্বর জেনারেট করে
 * @param {number} min - সর্বনিম্ন মান
 * @param {number} max - সর্বোচ্চ মান
 * @returns {number} র‍্যান্ডম নম্বর
 */
function generateRandomNumber(min = 0, max = 4) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * ইনপুট ভ্যালিডেশন চেক করে
 * @param {number} value - চেক করার জন্য মান
 * @returns {boolean} ভ্যালিড কিনা
 */
function isValidGuess(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 4 && Number.isInteger(num);
}

/**
 * স্কোর হিসাব করে
 * @returns {number} জয়ের শতকরা
 */
function calculateWinPercentage() {
    const total = gameState.wins + gameState.loses;
    return total > 0 ? Math.round((gameState.wins / total) * 100) : 0;
}

/**
 * হাই স্কোর আপডেট করে
 */
function updateHighScore() {
    const currentScore = gameState.wins;
    const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    
    if (!highScore || currentScore > parseInt(highScore)) {
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, currentScore.toString());
    }
}

/**
 * স্কোর হিস্টরিতে যোগ করে
 */
function addToHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORE_HISTORY)) || [];
    const newEntry = {
        date: new Date().toLocaleString('bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        wins: gameState.wins,
        loses: gameState.loses,
        percentage: calculateWinPercentage()
    };
    
    history.push(newEntry);
    localStorage.setItem(STORAGE_KEYS.SCORE_HISTORY, JSON.stringify(history));
}

/**
 * হিস্টরি লোড করে
 */
function loadHistory() {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCORE_HISTORY)) || [];
    
    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="no-history">এখনো কোন স্কোর সেভ করা হয়নি।</p>';
        return;
    }
    
    let html = '';
    history.slice().reverse().forEach((entry, index) => {
        html += `
            <div class="history-item">
                <span class="date">${entry.date}</span>
                <span class="score">${entry.wins} জয়, ${entry.loses} হার (${entry.percentage}%)</span>
            </div>
        `;
    });
    
    elements.historyList.innerHTML = html;
}

// ===== Game Functions =====
/**
 * গেম ইনিশিয়ালাইজ করে
 */
function initGame() {
    // ইভেন্ট লিসেনার সেটআপ
    elements.startGameBtn.addEventListener('click', startGame);
    elements.submitGuessBtn.addEventListener('click', handleGuess);
    elements.endGameBtn.addEventListener('click', endGame);
    elements.playAgainBtn.addEventListener('click', startGame);
    elements.saveScoreBtn.addEventListener('click', saveScore);
    elements.closeHistoryBtn.addEventListener('click', closeHistory);
    
    // নম্বর বাটন ইভেন্ট
    elements.numberButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            selectNumber(btn.dataset.value);
        });
    });
    
    // ইনপুট ইভেন্ট
    elements.guessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });
    
    // ইনপুট ভ্যালিডেশন
    elements.guessInput.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length > 1) {
            e.target.value = value.slice(0, 1);
        }
    });
    
    // হাই স্কোর লোড
    loadHighScore();
}

/**
 * হাই স্কোর লোড করে
 */
function loadHighScore() {
    const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    if (highScore) {
        elements.highScoreDisplay.textContent = `${highScore} জয়`;
    } else {
        elements.highScoreDisplay.textContent = '-';
    }
}

/**
 * গেম শুরু করে
 */
function startGame() {
    const rounds = parseInt(elements.gameRoundsInput.value);
    
    // ভ্যালিডেশন
    if (isNaN(rounds) || rounds < 1 || rounds > 20) {
        showMessage('দয়া করে 1 থেকে 20 এর মধ্যে একটি সংখ্যা নির্বাচন করুন', 'error');
        return;
    }
    
    // গেম স্টেট রিসেট
    gameState.totalRounds = rounds;
    gameState.currentRound = 0;
    gameState.wins = 0;
    gameState.loses = 0;
    gameState.isGameRunning = true;
    gameState.currentGuess = null;
    
    // UI আপডেট
    elements.gamePlaySection.style.display = 'block';
    elements.gameOverSection.style.display = 'none';
    elements.scoreHistorySection.style.display = 'none';
    
    // স্কোর আপডেট
    updateScoreDisplay();
    
    // প্রথম রাউন্ড শুরু
    nextRound();
}

/**
 * পরের রাউন্ড শুরু করে
 */
function nextRound() {
    if (!gameState.isGameRunning) return;
    
    gameState.currentRound++;
    gameState.generatedNumber = generateRandomNumber();
    gameState.currentGuess = null;
    
    // UI আপডেট
    elements.roundNumber.textContent = gameState.currentRound;
    elements.currentRound.textContent = gameState.currentRound;
    elements.totalRounds.textContent = gameState.totalRounds;
    
    // প্রোগ্রেস বার আপডেট
    const progress = (gameState.currentRound / gameState.totalRounds) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // নম্বর বাটন রিসেট
    elements.numberButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // ইনপুট রিসেট
    elements.guessInput.value = '';
    elements.guessInput.focus();
    
    // মেসেজ ক্লিয়ার
    clearMessage();
    
    // গেম শেষ চেক
    if (gameState.currentRound > gameState.totalRounds) {
        endGame();
    }
}

/**
 * গেস হ্যান্ডেল করে
 */
function handleGuess() {
    if (!gameState.isGameRunning) return;
    
    let guessValue = gameState.currentGuess;
    
    // ইনপুট থেকে ভ্যালু নিন
    if (guessValue === null) {
        const inputValue = elements.guessInput.value.trim();
        if (inputValue === '') {
            showMessage('দয়া করে একটি নম্বর নির্বাচন বা টাইপ করুন', 'error');
            return;
        }
        guessValue = parseInt(inputValue);
    }
    
    // ভ্যালিডেশন
    if (!isValidGuess(guessValue)) {
        showMessage('দয়া করে 0 থেকে 4 এর মধ্যে একটি নম্বর নির্বাচন করুন', 'error');
        return;
    }
    
    // চেক করুন
    if (guessValue === gameState.generatedNumber) {
        // জয়
        gameState.wins++;
        showMessage(`সঠিক! আপনি জয়ী হয়েছেন। 🎉`, 'success');
    } else {
        // হার
        gameState.loses++;
        showMessage(`ভুল! সঠিক নম্বর ছিল: ${gameState.generatedNumber} 😢`, 'error');
    }
    
    // স্কোর আপডেট
    updateScoreDisplay();
    
    // পরের রাউন্ড
    setTimeout(() => {
        nextRound();
    }, 1500);
}

/**
 * নম্বর সিলেক্ট করে
 * @param {string} value - নম্বর ভ্যালু
 */
function selectNumber(value) {
    gameState.currentGuess = parseInt(value);
    
    // বাটন হাইলাইট
    elements.numberButtons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.value === value) {
            btn.classList.add('selected');
        }
    });
    
    // ইনপুট আপডেট
    elements.guessInput.value = value;
    
    // ফোকাস রাখুন
    elements.guessInput.focus();
}

/**
 * গেম শেষ করে
 */
function endGame() {
    gameState.isGameRunning = false;
    
    // হাই স্কোর আপডেট
    updateHighScore();
    
    // UI আপডেট
    elements.gamePlaySection.style.display = 'none';
    elements.gameOverSection.style.display = 'block';
    
    // ফাইনাল স্কোর দেখান
    elements.finalWin.textContent = gameState.wins;
    elements.finalLose.textContent = gameState.loses;
    elements.winPercentage.textContent = `${calculateWinPercentage()}%`;
    
    // হাই স্কোর দেখান
    loadHighScore();
}

/**
 * স্কোর সেভ করে
 */
function saveScore() {
    addToHistory();
    showMessage('স্কোর সফলভাবে সেভ করা হয়েছে!', 'success');
    
    // হিস্টরি দেখান
    showHistory();
}

/**
 * হিস্টরি দেখান
 */
function showHistory() {
    loadHistory();
    elements.scoreHistorySection.style.display = 'flex';
}

/**
 * হিস্টরি বন্ধ করে
 */
function closeHistory() {
    elements.scoreHistorySection.style.display = 'none';
}

/**
 * স্কোর ডিসপ্লে আপডেট করে
 */
function updateScoreDisplay() {
    elements.winCount.textContent = gameState.wins;
    elements.loseCount.textContent = gameState.loses;
}

/**
 * মেসেজ দেখান
 * @param {string} message - মেসেজ
 * @param {string} type - টাইপ (success, error, info)
 */
function showMessage(message, type = 'info') {
    elements.resultMessage.textContent = message;
    elements.resultMessage.className = `result-message ${type}`;
}

/**
 * মেসেজ ক্লিয়ার করে
 */
function clearMessage() {
    elements.resultMessage.textContent = '';
    elements.resultMessage.className = 'result-message';
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // ডিবাগিং জন্য
    console.log('গেস নম্বর গেম লোড হয়েছে');
    console.log('তৈরি করেছেন: Yeasin');
});

// ===== Export for testing =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateRandomNumber,
        isValidGuess,
        calculateWinPercentage
    };
}
