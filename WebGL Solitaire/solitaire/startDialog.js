class StartDialog {
    constructor(onStart) {
        this.onStart = onStart;
        this.playerName = '';
        this.setupDialog();
    }

    setupDialog() {
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 5px;
            text-align: center;
        `;

        const title = document.createElement('h2');
        title.textContent = 'Welcome to Solitaire';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter your name';
        input.style.margin = '10px 0';
        input.addEventListener('input', (e) => {
            this.playerName = e.target.value;
            playButton.disabled = !this.playerName;
        });

        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.disabled = true;
        playButton.addEventListener('click', () => {
            if (this.playerName) {
                dialog.remove();
                this.onStart(this.playerName);
            }
        });

        dialog.appendChild(title);
        dialog.appendChild(document.createElement('br'));
        dialog.appendChild(input);
        dialog.appendChild(document.createElement('br'));
        dialog.appendChild(playButton);

        document.body.appendChild(dialog);
    }
}

export default StartDialog; 