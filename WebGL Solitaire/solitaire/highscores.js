class HighScores {
    constructor() {
        this.scores = [];
        this.loadScores();
    }

    loadScores() {
        const savedScores = localStorage.getItem('solitaireHighScores');
        this.scores = savedScores ? JSON.parse(savedScores) : [];
    }

    saveScores() {
        localStorage.setItem('solitaireHighScores', JSON.stringify(this.scores));
    }

    addScore(name, time, moves) {
        const newScore = { name, time, moves };
        
        // Only add if time is less than 30 minutes (1800 seconds)
        if (time >= 1800) return false;
        
        // Find the correct position to insert the new score
        const insertIndex = this.scores.findIndex(score => time < score.time);
        
        if (insertIndex === -1 && this.scores.length < 10) {
            // Add to end if list has less than 10 scores
            this.scores.push(newScore);
        } else if (insertIndex !== -1) {
            // Insert at correct position
            this.scores.splice(insertIndex, 0, newScore);
            // Keep only top 10
            if (this.scores.length > 10) {
                this.scores.pop();
            }
        }
        
        this.saveScores();
        return insertIndex !== -1 || this.scores.length <= 10;
    }

    getScores() {
        return this.scores;
    }
}

export default HighScores; 