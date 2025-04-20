class GameUI {
    constructor() {
        this.timerElement = null;
        this.moveCounterElement = null;
        this.startTime = null;
        this.moveCount = 0;
        this.timerInterval = null;
        this.timeExceeded = false;
        this.setupUI();
    }

    setupUI() {
        // Create timer
        this.timerElement = document.createElement('div');
        this.timerElement.id = 'timer';
        this.timerElement.style.cssText = 'position: fixed; top: 20px; left: 20px; color: white; font-size: 24px;';
        document.body.appendChild(this.timerElement);

        // Create move counter
        this.moveCounterElement = document.createElement('div');
        this.moveCounterElement.id = 'moveCounter';
        this.moveCounterElement.style.cssText = 'position: fixed; top: 20px; right: 20px; color: white; font-size: 24px;';
        document.body.appendChild(this.moveCounterElement);

        this.updateDisplay();
    }

    startGame() {
        this.startTime = Date.now();
        this.moveCount = 0;
        this.timeExceeded = false;
        this.updateDisplay();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.timeExceeded) return;
            
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            if (elapsed >= 1800) { // 30 minutes
                this.timeExceeded = true;
                this.updateDisplay();
                clearInterval(this.timerInterval);
            } else {
                this.updateDisplay();
            }
        }, 1000);
    }

    incrementMoves() {
        if (!this.timeExceeded) {
            this.moveCount++;
            this.updateDisplay();
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    updateDisplay() {
        if (this.timeExceeded) {
            this.timerElement.textContent = 'Time Exceeded';
            this.moveCounterElement.textContent = 'Time Exceeded';
            return;
        }

        const elapsed = this.getElapsedTime();
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.moveCounterElement.textContent = `Moves: ${this.moveCount}`;
    }

    isPaused() {
        return this.timerInterval === null;
    }

    pauseTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resumeTimer() {
        if (!this.timerInterval && !this.timeExceeded) {
            this.startTimer();
        }
    }
}

export default GameUI; 