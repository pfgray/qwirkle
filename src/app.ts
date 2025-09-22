interface Player {
    name: string;
    scores: number[];
    total: number;
}

interface GameState {
    players: Player[];
    currentRound: number;
    currentPlayerIndex: number;
    gameStarted: boolean;
}


class ScoreTracker {
    private gameState: GameState;
    private readonly STORAGE_KEY = 'scoreTracker_gameState';

    constructor() {
        this.gameState = {
            players: [],
            currentRound: 0,
            currentPlayerIndex: 0,
            gameStarted: false
        };
        
        this.loadGameState();
        this.initializeApp();
    }

    private initializeApp(): void {
        if (this.gameState.gameStarted && this.gameState.players.length > 0) {
            this.showGameSection();
            this.updateScoreTable();
            this.updateCurrentPlayerInfo();
        } else {
            this.showPlayerSetup();
            this.displayPlayers();
        }
    }

    private loadGameState(): void {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.gameState = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load game state:', e);
            }
        }
    }

    private saveGameState(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.gameState));
    }

    public addPlayer(): void {
        const input = document.getElementById('player-name') as HTMLInputElement;
        const name = input.value.trim();
        
        if (!name) {
            alert('Please enter a player name');
            return;
        }

        if (this.gameState.players.length >= 6) {
            alert('Maximum 6 players allowed');
            return;
        }

        if (this.gameState.players.some(p => p.name === name)) {
            alert('Player name already exists');
            return;
        }

        const player: Player = {
            name: name,
            scores: [],
            total: 0
        };

        this.gameState.players.push(player);
        input.value = '';
        
        this.displayPlayers();
        this.saveGameState();
    }

    private displayPlayers(): void {
        const playerList = document.getElementById('player-list')!;
        const continueSection = document.getElementById('continue-section')!;
        
        playerList.innerHTML = '';
        this.gameState.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.textContent = player.name;
            playerList.appendChild(playerDiv);
        });

        if (this.gameState.players.length >= 3) {
            continueSection.classList.remove('hidden');
        } else {
            continueSection.classList.add('hidden');
        }
    }

    public startGame(): void {
        if (this.gameState.players.length < 3) {
            alert('Need at least 3 players to start');
            return;
        }

        this.gameState.gameStarted = true;
        this.gameState.currentRound = 1;
        this.gameState.currentPlayerIndex = 0;
        
        this.showGameSection();
        this.updateCurrentPlayerInfo();
        this.updateScoreTable();
        this.saveGameState();
    }

    private showPlayerSetup(): void {
        document.getElementById('player-setup')!.classList.remove('hidden');
        document.getElementById('game-section')!.classList.add('hidden');
    }

    private showGameSection(): void {
        document.getElementById('player-setup')!.classList.add('hidden');
        document.getElementById('game-section')!.classList.remove('hidden');
    }

    private updateCurrentPlayerInfo(): void {
        const infoDiv = document.getElementById('current-player-info')!;
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        
        infoDiv.innerHTML = `
            <div class="current-player">
                Round ${this.gameState.currentRound} - ${currentPlayer.name}'s turn
            </div>
        `;
    }

    public addScore(): void {
        const input = document.getElementById('score-input') as HTMLInputElement;
        const score = parseInt(input.value);
        
        if (isNaN(score)) {
            alert('Please enter a valid number');
            return;
        }

        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        
        if (currentPlayer.scores.length < this.gameState.currentRound) {
            currentPlayer.scores.push(score);
        } else {
            currentPlayer.scores[this.gameState.currentRound - 1] = score;
        }
        
        currentPlayer.total = currentPlayer.scores.reduce((sum, s) => sum + s, 0);
        
        input.value = '';
        
        this.gameState.currentPlayerIndex++;
        if (this.gameState.currentPlayerIndex >= this.gameState.players.length) {
            this.gameState.currentPlayerIndex = 0;
            this.gameState.currentRound++;
        }
        
        this.updateCurrentPlayerInfo();
        this.updateScoreTable();
        this.saveGameState();
    }

    private updateScoreTable(): void {
        const tableDiv = document.getElementById('scores-table')!;
        
        if (this.gameState.players.length === 0) {
            tableDiv.innerHTML = '';
            return;
        }

        const maxRounds = Math.max(...this.gameState.players.map(p => p.scores.length), 1);
        
        let tableHTML = '<table><thead><tr><th>Round</th>';
        this.gameState.players.forEach(player => {
            tableHTML += `<th>${player.name}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';
        
        for (let round = 1; round <= maxRounds; round++) {
            tableHTML += `<tr><td>Round ${round}</td>`;
            this.gameState.players.forEach((player, playerIndex) => {
                const score = player.scores[round - 1];
                const value = score !== undefined ? score : '';
                tableHTML += `<td><input type="number" class="score-cell-input" value="${value}" onchange="updateScore(${playerIndex}, ${round - 1}, this.value)" placeholder="-"></td>`;
            });
            tableHTML += '</tr>';
        }
        
        tableHTML += '<tr class="total-row"><td>Total</td>';
        this.gameState.players.forEach(player => {
            tableHTML += `<td>${player.total}</td>`;
        });
        tableHTML += '</tr>';
        
        tableHTML += '</tbody></table>';
        tableDiv.innerHTML = tableHTML;
    }

    public updateScore(playerIndex: number, roundIndex: number, value: string): void {
        const player = this.gameState.players[playerIndex];
        if (!player) return;

        const numericValue = parseInt(value);
        
        if (isNaN(numericValue)) {
            if (player.scores.length > roundIndex) {
                player.scores.splice(roundIndex, 1);
            }
        } else {
            while (player.scores.length <= roundIndex) {
                player.scores.push(0);
            }
            player.scores[roundIndex] = numericValue;
        }
        
        player.total = player.scores.reduce((sum, s) => sum + s, 0);
        
        this.updateScoreTable();
        this.saveGameState();
    }


    public resetGame(): void {
        if (!window.confirm('Are you sure you want to reset the game? This will clear all data and start over.')) {
            return;
        }

        this.gameState = {
            players: [],
            currentRound: 0,
            currentPlayerIndex: 0,
            gameStarted: false
        };

        localStorage.removeItem(this.STORAGE_KEY);
        this.showPlayerSetup();
        this.displayPlayers();
        
        const input = document.getElementById('player-name') as HTMLInputElement;
        input.value = '';
        
        const scoreInput = document.getElementById('score-input') as HTMLInputElement;
        scoreInput.value = '';
    }
}

const scoreTracker = new ScoreTracker();

function addPlayer(): void {
    scoreTracker.addPlayer();
}

function startGame(): void {
    scoreTracker.startGame();
}

function addScore(): void {
    scoreTracker.addScore();
}

function resetGame(): void {
    scoreTracker.resetGame();
}

function updateScore(playerIndex: number, roundIndex: number, value: string): void {
    scoreTracker.updateScore(playerIndex, roundIndex, value);
}


document.addEventListener('DOMContentLoaded', () => {
    const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
    const scoreInput = document.getElementById('score-input') as HTMLInputElement;
    
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPlayer();
        }
    });
    
    scoreInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addScore();
        }
    });
});