import { Graphics, Text } from "pixi.js";

class UIManager {
	constructor(app, stateManager) {
		this.app = app;
		this.stateManager = stateManager;
		
		this.setupElements();
		this.createOverlays();
		
		// Listen for state changes
		this.stateManager.on("stateChange", (oldState, newState) => {
			this.updateVisibility();
		});
		
		this.updateVisibility();
	}
	
	setupElements() {
		// Score HUD
		this.scoreText = new Text("", {
			fontFamily: "Courier New",
			fontSize: 24,
			fill: 0xFFFFFF,
			stroke: 0x000000,
			strokeThickness: 2
		});
		this.scoreText.position.set(20, 20);
		this.app.stage.addChild(this.scoreText);
		
		// Best score HUD
		this.bestScoreText = new Text("", {
			fontFamily: "Courier New",
			fontSize: 16,
			fill: 0x888888,
			stroke: 0x000000,
			strokeThickness: 1
		});
		this.bestScoreText.position.set(20, 50);
		this.app.stage.addChild(this.bestScoreText);
	}
	
	createOverlays() {
		// Menu overlay
		this.menuOverlay = new Graphics();
		this.menuOverlay.beginFill(0x000000, 0.8);
		this.menuOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
		this.menuOverlay.endFill();
		
		this.menuTitle = new Text("OPEN CAVE", {
			fontFamily: "Courier New",
			fontSize: 64,
			fill: 0x00FF88,
			fontWeight: "bold"
		});
		this.menuTitle.anchor.set(0.5);
		this.menuTitle.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 60);
		
		this.menuHint = new Text("Press Space, Click, or Tap to Start", {
			fontFamily: "Courier New",
			fontSize: 24,
			fill: 0xFFFFFF
		});
		this.menuHint.anchor.set(0.5);
		this.menuHint.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 40);
		
		this.menuOverlay.addChild(this.menuTitle, this.menuHint);
		this.app.stage.addChild(this.menuOverlay);
		
		// Game over overlay
		this.gameOverOverlay = new Graphics();
		this.gameOverOverlay.beginFill(0x000000, 0.8);
		this.gameOverOverlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
		this.gameOverOverlay.endFill();
		
		this.gameOverTitle = new Text("GAME OVER", {
			fontFamily: "Courier New",
			fontSize: 48,
			fill: 0xFF4444,
			fontWeight: "bold"
		});
		this.gameOverTitle.anchor.set(0.5);
		this.gameOverTitle.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 80);
		
		this.finalScoreText = new Text("", {
			fontFamily: "Courier New",
			fontSize: 32,
			fill: 0xFFFFFF
		});
		this.finalScoreText.anchor.set(0.5);
		this.finalScoreText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 20);
		
		this.gameOverHint = new Text("Press Space, Click, or Tap to Restart", {
			fontFamily: "Courier New",
			fontSize: 20,
			fill: 0xAAAAAA
		});
		this.gameOverHint.anchor.set(0.5);
		this.gameOverHint.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 60);
		
		this.gameOverOverlay.addChild(this.gameOverTitle, this.finalScoreText, this.gameOverHint);
		this.app.stage.addChild(this.gameOverOverlay);
	}
	
	updateScore(score, bestScore) {
		this.scoreText.text = `Score: ${score}`;
		this.bestScoreText.text = `Best: ${bestScore}`;
		
		if (this.stateManager.isState("gameover")) {
			this.finalScoreText.text = `Score: ${score}`;
		}
	}
	
	updateVisibility() {
		const state = this.stateManager.getState();
		
		this.menuOverlay.visible = state === "menu";
		this.gameOverOverlay.visible = state === "gameover";
		
		const hudVisible = state === "playing";
		this.scoreText.visible = hudVisible;
		this.bestScoreText.visible = hudVisible;
	}
	
	resize(width, height) {
		// Update overlay sizes
		this.menuOverlay.clear();
		this.menuOverlay.beginFill(0x000000, 0.8);
		this.menuOverlay.drawRect(0, 0, width, height);
		this.menuOverlay.endFill();
		
		this.gameOverOverlay.clear();
		this.gameOverOverlay.beginFill(0x000000, 0.8);
		this.gameOverOverlay.drawRect(0, 0, width, height);
		this.gameOverOverlay.endFill();
		
		// Update positions
		this.menuTitle.position.set(width / 2, height / 2 - 60);
		this.menuHint.position.set(width / 2, height / 2 + 40);
		
		this.gameOverTitle.position.set(width / 2, height / 2 - 80);
		this.finalScoreText.position.set(width / 2, height / 2 - 20);
		this.gameOverHint.position.set(width / 2, height / 2 + 60);
		
		// Scale text for mobile
		if (width < 768) {
			this.menuTitle.style.fontSize = 40;
			this.menuHint.style.fontSize = 16;
			this.gameOverTitle.style.fontSize = 32;
			this.finalScoreText.style.fontSize = 24;
			this.gameOverHint.style.fontSize = 14;
			this.scoreText.style.fontSize = 18;
			this.bestScoreText.style.fontSize = 12;
		} else {
			this.menuTitle.style.fontSize = 64;
			this.menuHint.style.fontSize = 24;
			this.gameOverTitle.style.fontSize = 48;
			this.finalScoreText.style.fontSize = 32;
			this.gameOverHint.style.fontSize = 20;
			this.scoreText.style.fontSize = 24;
			this.bestScoreText.style.fontSize = 16;
		}
	}
}

export { UIManager };