class AudioManager {
    constructor() {
        this.backgroundMusic = new Audio('sounds/background.mp3');
        this.winMusic = new Audio('sounds/win.mp3');
        this.foundationSound = new Audio('sounds/foundation.mp3');
        
        // Configure background music
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;
        
        // Configure win music
        this.winMusic.volume = 0.5;
        
        // Configure foundation sound
        this.foundationSound.volume = 0.4;
    }

    startBackgroundMusic() {
        this.backgroundMusic.play().catch(error => {
            console.log("Audio autoplay was prevented. Click to start music.");
        });
    }

    stopBackgroundMusic() {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
    }

    playWinMusic() {
        this.stopBackgroundMusic();
        this.winMusic.play().catch(error => {
            console.log("Couldn't play win music:", error);
        });
    }

    playFoundationSound() {
        // Clone the sound to allow overlapping
        const sound = this.foundationSound.cloneNode();
        sound.play().catch(error => {
            console.log("Couldn't play foundation sound:", error);
        });
    }

    // Add method to handle user interaction requirement
    initializeAudio() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            cursor: pointer;
        `;

        const message = document.createElement('div');
        message.style.cssText = `
            color: white;
            font-size: 24px;
            text-align: center;
            font-family: 'Press Start 2P', cursive;
        `;
        message.textContent = 'Click anywhere to start with music';

        overlay.appendChild(message);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            this.startBackgroundMusic();
            overlay.remove();
        });
    }
}

export default AudioManager; 