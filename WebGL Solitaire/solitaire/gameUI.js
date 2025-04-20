class GameUI {
    constructor(highScores) {
        this.timerElement = null;
        this.moveCounterElement = null;
        this.moveCount = 0;
        this.timer = 0;  // Simple timer value
        this.timerInterval = null;
        this.highScores = highScores;
        this.setupUI();
        this.addButtons();
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

    addButtons() {
        // Play Again button
        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 10px 20px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        playAgainBtn.addEventListener('click', () => {
            location.reload();
        });
        document.body.appendChild(playAgainBtn);

        // High Scores button
        const highScoresBtn = document.createElement('button');
        highScoresBtn.textContent = 'High Scores';
        highScoresBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 140px;
            padding: 10px 20px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        highScoresBtn.addEventListener('click', () => {
            this.showHighScores();
        });
        document.body.appendChild(highScoresBtn);
    }

    showHighScores() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            color: white;
        `;

        const title = document.createElement('h2');
        title.textContent = 'High Scores';
        title.style.color = '#FFD700';
        content.appendChild(title);

        const scores = this.highScores.getScores();
        if (scores.length > 0) {
            const table = this.createHighScoresTable(scores);
            content.appendChild(table);
        } else {
            const noScores = document.createElement('p');
            noScores.textContent = 'No high scores yet!';
            content.appendChild(noScores);
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            margin-top: 20px;
            padding: 10px 20px;
            font-size: 16px;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeBtn.addEventListener('click', () => {
            overlay.remove();
        });
        content.appendChild(closeBtn);

        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    createHighScoresTable(scores) {
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            color: white;
        `;

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Time</th>
                <th>Moves</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${minutes}:${seconds.toString().padStart(2, '0')}</td>
                <td>${score.moves}</td>
            `;
            
            if (index === 0) {
                row.style.color = '#FFD700';
            }
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        return table;
    }

    startGame() {
        this.timer = 0;
        this.moveCount = 0;
        // Start incrementing timer
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateDisplay();
        }, 1000);
    }

    incrementMoves() {
        this.moveCount++;
        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        this.timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.moveCounterElement.textContent = `Moves: ${this.moveCount}`;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        return this.timer;
    }
}

export default GameUI; 