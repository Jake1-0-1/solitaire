class GameScreens {
    constructor(onPlayAgain, onQuit) {
        this.onPlayAgain = onPlayAgain;
        this.onQuit = onQuit;
        this.pauseScreen = null;
        this.winScreen = null;
        this.isPaused = false;
        
        // Create pause screen immediately
        const pauseContent = document.createElement('div');
        const title = document.createElement('h2');
        title.textContent = 'Game Paused';
        pauseContent.appendChild(title);
        
        this.pauseScreen = this.createScreen(pauseContent);
        this.pauseScreen.style.display = 'none';
        document.body.appendChild(this.pauseScreen);
    }

    createPauseButton() {
        const pauseButton = document.createElement('button');
        pauseButton.textContent = '⏸️';
        pauseButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 24px;
            padding: 5px 15px;
            cursor: pointer;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: 5px;
        `;
        pauseButton.addEventListener('click', () => this.togglePause());
        document.body.appendChild(pauseButton);
    }

    createScreen(content, isWinScreen = false) {
        const screen = document.createElement('div');
        screen.style.cssText = `
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
            color: white;
            z-index: 1000;
        `;

        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
        `;

        contentContainer.appendChild(content);

        // Add buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '20px';

        const playAgainBtn = document.createElement('button');
        playAgainBtn.textContent = 'Play Again';
        playAgainBtn.classList.add('game-button');
        playAgainBtn.addEventListener('click', () => {
            screen.remove();
            this.isPaused = false;
            this.onPlayAgain();
        });

        const quitBtn = document.createElement('button');
        quitBtn.textContent = 'Quit';
        quitBtn.classList.add('game-button');
        quitBtn.addEventListener('click', () => {
            screen.remove();
            this.isPaused = false;
            this.onQuit();
        });

        buttonContainer.appendChild(playAgainBtn);
        if (!isWinScreen) {
            const resumeBtn = document.createElement('button');
            resumeBtn.textContent = 'Resume';
            resumeBtn.classList.add('game-button');
            resumeBtn.addEventListener('click', () => this.togglePause());
            buttonContainer.insertBefore(resumeBtn, playAgainBtn);
        }
        buttonContainer.appendChild(quitBtn);

        contentContainer.appendChild(buttonContainer);
        screen.appendChild(contentContainer);
        return screen;
    }

    createHighScoresTable(scores, highlightIndex = -1) {
        const container = document.createElement('div');
        container.style.marginTop = '20px';

        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            color: white;
        `;

        // Table header
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

        // Table body
        const tbody = document.createElement('tbody');
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            if (index === highlightIndex) {
                row.style.color = '#4CAF50';
                row.style.fontWeight = 'bold';
            }
            if (index === 0) {
                row.style.fontFamily = "'Press Start 2P', cursive";
                row.style.color = '#FFD700';
            }
            
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${minutes}:${seconds.toString().padStart(2, '0')}</td>
                <td>${score.moves}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        container.appendChild(table);
        return container;
    }

    togglePause() {
        if (!this.isPaused) {
            // Pause the game
            this.isPaused = true;
            this.pauseScreen.style.display = 'flex';
            if (gameUI) {
                gameUI.pauseTimer();
            }
        } else {
            // Resume the game
            this.isPaused = false;
            this.pauseScreen.style.display = 'none';
            if (gameUI) {
                gameUI.resumeTimer();
            }
        }
    }

    showWinScreen(playerName, time, moves, madeHighScores, highScores) {
        const content = document.createElement('div');
        
        const title = document.createElement('h1');
        title.style.fontFamily = "'Press Start 2P', cursive";
        title.style.color = '#FFD700';
        title.textContent = 'CONGRATULATIONS!';
        content.appendChild(title);

        const message = document.createElement('p');
        message.style.fontSize = '20px';
        message.style.marginBottom = '20px';

        if (madeHighScores) {
            message.innerHTML = `Well done, <span style="color: #4CAF50">${playerName}</span>!<br>You made it to the high scores!`;
            const stats = document.createElement('p');
            const minutes = Math.floor(time / 60);
            const seconds = time % 60;
            stats.innerHTML = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}<br>Moves: ${moves}`;
            content.appendChild(stats);
        } else {
            message.innerHTML = `You won, ${playerName}!<br>But you didn't make it to the high scores :/<br>Better luck next time!`;
        }
        content.appendChild(message);

        if (highScores.length > 0) {
            const scoresTitle = document.createElement('h3');
            scoresTitle.textContent = 'High Scores';
            content.appendChild(scoresTitle);
            const highlightIndex = madeHighScores ? highScores.findIndex(score => 
                score.name === playerName && score.time === time && score.moves === moves) : -1;
            content.appendChild(this.createHighScoresTable(highScores, highlightIndex));
        }

        this.winScreen = this.createScreen(content, true);
        document.body.appendChild(this.winScreen);
    }
}

export default GameScreens; 