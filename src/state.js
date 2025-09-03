class StateManager {
	constructor() {
		this.currentState = "menu";
		this.score = 0;
		this.bestScore = this.loadBestScore();
		this.gameStartTime = 0;
		this.listeners = new Map();
	}
	
	loadBestScore() {
		const saved = localStorage.getItem("opencave-best-score");
		return saved ? parseInt(saved, 10) : 0;
	}
	
	saveBestScore() {
		localStorage.setItem("opencave-best-score", this.bestScore.toString());
	}
	
	setState(newState) {
		const oldState = this.currentState;
		this.currentState = newState;
		
		// Trigger state change listeners
		if (this.listeners.has("stateChange")) {
			this.listeners.get("stateChange")(oldState, newState);
		}
		
		// Handle state-specific logic
		if (newState === "playing") {
			this.gameStartTime = Date.now();
			this.score = 0;
		} else if (newState === "gameover") {
			if (this.score > this.bestScore) {
				this.bestScore = this.score;
				this.saveBestScore();
			}
		}
	}
	
	updateScore(distance) {
		this.score = Math.floor((distance || 0) / 10);
	}
	
	getGameTime() {
		if (this.currentState === "playing") {
			return (Date.now() - this.gameStartTime) / 1000;
		}
		return 0;
	}
	
	on(event, callback) {
		this.listeners.set(event, callback);
	}
	
	isState(state) {
		return this.currentState === state;
	}
	
	getState() {
		return this.currentState;
	}
}

export { StateManager };