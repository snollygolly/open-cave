import { Application } from "pixi.js";
import { Game } from "./game.js";
import { loadAssets } from "./assets.js";
import "./styles.css";

class App {
	constructor() {
		this.pixiApp = null;
		this.game = null;
		
		this.init();
	}
	
	async init() {
		// Create PIXI application
		this.pixiApp = new Application({
			width: window.innerWidth,
			height: window.innerHeight,
			backgroundColor: 0x0A0A0A,
			antialias: true,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true
		});
		
		// Add canvas to DOM
		document.getElementById("app").appendChild(this.pixiApp.view);
		
		// Setup resize handler
		this.setupResize();
		
		// Load assets (none for now)
		await loadAssets();
		
		// Create and start game
		this.game = new Game(this.pixiApp);
		
		// Prevent right-click context menu on canvas
		this.pixiApp.view.addEventListener("contextmenu", (e) => {
			e.preventDefault();
		});
	}
	
	setupResize() {
		const resize = () => {
			const width = window.innerWidth;
			const height = window.innerHeight;
			
			// Resize PIXI application
			this.pixiApp.renderer.resize(width, height);
			
			// Notify game of resize
			if (this.game) {
				this.game.resize(width, height);
			}
		};
		
		window.addEventListener("resize", resize);
		window.addEventListener("orientationchange", () => {
			setTimeout(resize, 100);
		});
		
		// Initial resize
		resize();
	}
}

// Start the application
new App();