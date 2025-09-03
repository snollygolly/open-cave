import { Graphics, Container } from "pixi.js";
import { InputManager } from "./input.js";
import { StateManager } from "./state.js";
import { UIManager } from "./ui.js";
import { createPRNG, clamp, signedNoise, createPool } from "./utils.js";

// Game constants
// Slightly snappier handling (~10% more acceleration)
const GRAVITY = 880; // was 800
const THRUST_IMPULSE = -1320; // was -1200
const MAX_VELOCITY = 660; // was 600
const BASE_SPEED = 180;
const SPEED_INCREASE = 0.3;
const INITIAL_GAP = 300;
const MIN_GAP = 120;
const GAP_SHRINK_RATE = 2;
const PILLAR_FREQUENCY = 0.003; // randomness gate for spawn once spacing allows
// Pillar spacing starts wide (fewer pillars), tightens slowly over time
const BASE_PILLAR_MIN_SPACING = 200; // px between pillars at start (~50% fewer vs 100)
const MIN_PILLAR_MIN_SPACING = 140;  // lower bound as difficulty ramps
const SPACING_REDUCTION_RATE = 1.5;  // px per second reduction
const SHIP_RADIUS = 8;
const CAVE_SEGMENT_WIDTH = 20;
const VIRTUAL_HEIGHT = 720;
// Fraction of game width from the left where the ship stays
const SHIP_X_OFFSET = 0.35;

class Game {
    constructor(app) {
        this.app = app;
        this.gameContainer = new Container();
        this.app.stage.addChild(this.gameContainer);
        
        // Managers
        this.inputManager = new InputManager(this.app.view);
        this.stateManager = new StateManager();
        this.uiManager = new UIManager(this.app, this.stateManager);
        
        // Visual scale for consistent gameplay
        this.scale = 1;
        this.gameWidth = 1280;
        this.gameHeight = VIRTUAL_HEIGHT;
        
        // Game state
        this.ship = {
            x: this.gameWidth * SHIP_X_OFFSET,
            y: this.gameHeight / 2,
            vy: 0,
            trail: []
        };
        
        this.camera = {
            x: 0
        };
        
        this.world = {
            distance: 0,
            speed: BASE_SPEED,
            gapHeight: INITIAL_GAP,
            pillars: [],
            caveSegments: []
        };
        
		// Random number generator with fixed seed
		this.prng = createPRNG(12345);
		
		// Object pools
		this.pillarPool = createPool(
			() => ({ x: 0, y: 0, width: 0, height: 0, fromTop: false, graphics: null }),
			(pillar) => {
				if (pillar.graphics) {
					pillar.graphics.visible = false;
				}
			}
		);
		
		this.particlePool = createPool(
			() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, graphics: null }),
			(particle) => {
				if (particle.graphics) {
					particle.graphics.visible = false;
				}
			}
		);
		
		this.particles = [];
		
		// Graphics objects
		this.setupGraphics();
		
        // Game loop (ticker passes delta frames; convert to seconds)
        this.app.ticker.add((delta) => this.update(delta / 60));
		
		// Input handling
		this.setupInputHandling();
		
		// Initialize cave
		this.generateInitialCave();
		
		// Initial resize
		this.resize(this.app.screen.width, this.app.screen.height);
	}
	
	setupGraphics() {
		this.shipGraphics = new Graphics();
		this.caveGraphics = new Graphics();
		this.pillarGraphics = new Graphics();
		this.particleGraphics = new Graphics();
		
		this.gameContainer.addChild(this.caveGraphics);
		this.gameContainer.addChild(this.pillarGraphics);
		this.gameContainer.addChild(this.shipGraphics);
		this.gameContainer.addChild(this.particleGraphics);
	}
	
	setupInputHandling() {
		let wasPressed = false;
		
		const checkInput = () => {
			const isPressed = this.inputManager.isThrusting();
			
			if (isPressed && !wasPressed) {
				this.handleInput();
			}
			
			wasPressed = isPressed;
			requestAnimationFrame(checkInput);
		};
		
		checkInput();
	}
	
	handleInput() {
		const state = this.stateManager.getState();
		
		if (state === "menu") {
			this.startGame();
		} else if (state === "gameover") {
			this.restartGame();
		}
	}
	
	startGame() {
		this.stateManager.setState("playing");
		this.resetGame();
	}
	
	restartGame() {
		this.stateManager.setState("playing");
		this.resetGame();
	}
	
	resetGame() {
		// Reset ship
		this.ship.x = this.gameWidth * SHIP_X_OFFSET;
		this.ship.y = this.gameHeight / 2;
		this.ship.vy = 0;
		this.ship.trail = [];
		
		// Reset camera
		this.camera.x = 0;
		
		// Reset world
		this.world.distance = 0;
		this.world.speed = BASE_SPEED;
		this.world.gapHeight = INITIAL_GAP;
		this.world.pillars.forEach(pillar => this.pillarPool.release(pillar));
		this.world.pillars = [];
		this.world.caveSegments = [];
		
		// Reset particles
		this.particles.forEach(particle => this.particlePool.release(particle));
		this.particles = [];
		
		// Reset PRNG
		this.prng = createPRNG(12345 + Math.floor(Math.random() * 1000));
		
		// Generate new cave
		this.generateInitialCave();

		// Start centered in the current cave gap at the ship's X
		const startSegment = this.getCaveSegmentAt(this.ship.x);
		if (startSegment) {
			this.ship.y = startSegment.centerY;
		}
	}
	
	generateInitialCave() {
		const segments = Math.ceil(this.gameWidth / CAVE_SEGMENT_WIDTH) + 10;
		const centerY = this.gameHeight / 2;
		
		// Start cave segments from camera position
		for (let i = 0; i < segments; i++) {
			const x = this.camera.x + (i * CAVE_SEGMENT_WIDTH);
			const variation = signedNoise(this.prng, 50);
			const y = centerY + Math.sin(x * 0.01) * 100 + variation;
			
			this.world.caveSegments.push({
				x,
				centerY: clamp(y, this.world.gapHeight / 2, this.gameHeight - this.world.gapHeight / 2),
				gapHeight: this.world.gapHeight
			});
		}
	}
	
	update(deltaTime) {
		if (this.stateManager.isState("playing")) {
			this.updateGameplay(deltaTime);
		}
		
		this.updateParticles(deltaTime);
		this.updateGraphics();
		this.updateUI();
	}
	
	updateGameplay(deltaTime) {
		// Update difficulty
		const gameTime = this.stateManager.getGameTime();
		this.world.speed = BASE_SPEED + gameTime * SPEED_INCREASE;
		this.world.gapHeight = Math.max(MIN_GAP, INITIAL_GAP - gameTime * GAP_SHRINK_RATE);
		
		// Ship physics
		if (this.inputManager.isThrusting()) {
			this.ship.vy += THRUST_IMPULSE * deltaTime;
		}
		
		this.ship.vy += GRAVITY * deltaTime;
		this.ship.vy = clamp(this.ship.vy, -MAX_VELOCITY, MAX_VELOCITY);
		
		this.ship.y += this.ship.vy * deltaTime;
		
		// Update trail
		this.ship.trail.push({ x: this.ship.x, y: this.ship.y });
		if (this.ship.trail.length > 10) {
			this.ship.trail.shift();
		}
		
		// Move camera and keep ship horizontally anchored relative to camera
		this.camera.x += this.world.speed * deltaTime;
		this.world.distance += this.world.speed * deltaTime;
		this.ship.x = this.camera.x + this.gameWidth * SHIP_X_OFFSET;
		
		// Generate new cave segments
		this.generateCave();
		
		// Generate pillars
		this.generatePillars();
		
		// Update pillars
		this.updatePillars();
		
		// Check collisions
		this.checkCollisions();
		
		// Update score
		this.stateManager.updateScore(this.world.distance);
	}
	
	generateCave() {
		if (this.world.caveSegments.length === 0) return;
		
		const targetX = this.camera.x + this.gameWidth + 200;
		let lastSegment = this.world.caveSegments[this.world.caveSegments.length - 1];
		
		// Generate only a few segments at a time to prevent infinite loops
		let segmentsToAdd = 0;
		while (lastSegment && lastSegment.x < targetX && segmentsToAdd < 50) {
			const x = lastSegment.x + CAVE_SEGMENT_WIDTH;
			const variation = signedNoise(this.prng, 30);
			let centerY = lastSegment.centerY + variation;
			
			// Add some sinusoidal movement
			centerY += Math.sin(x * 0.005) * 20;
			
			// Keep within bounds
			const halfGap = this.world.gapHeight / 2;
			centerY = clamp(centerY, halfGap, this.gameHeight - halfGap);
			
			const newSegment = {
				x,
				centerY,
				gapHeight: this.world.gapHeight
			};
			
			this.world.caveSegments.push(newSegment);
			lastSegment = newSegment;
			segmentsToAdd++;
		}
		
		// Remove old segments
		this.world.caveSegments = this.world.caveSegments.filter(
			segment => segment.x > this.camera.x - 100
		);
	}
	
	generatePillars() {
		const spawnX = this.camera.x + this.gameWidth;
		const lastPillar = this.world.pillars[this.world.pillars.length - 1];
		const minDistance = lastPillar ? spawnX - lastPillar.x : Infinity;
		const gameTime = this.stateManager.getGameTime();
		const requiredSpacing = Math.max(
			MIN_PILLAR_MIN_SPACING,
			BASE_PILLAR_MIN_SPACING - gameTime * SPACING_REDUCTION_RATE
		);
		
		if (minDistance > requiredSpacing && this.prng() < PILLAR_FREQUENCY * this.world.speed) {
			const segment = this.getCaveSegmentAt(spawnX);
			if (segment) {
				const fromTop = this.prng() < 0.5;
				const pillarHeight = 40 + this.prng() * 60;
				const pillarWidth = 20 + this.prng() * 20;
				
				const pillar = this.pillarPool.get();
				pillar.x = spawnX;
				pillar.width = pillarWidth;
				pillar.height = pillarHeight;
				pillar.fromTop = fromTop;
				
				if (fromTop) {
					// Nudge 15% farther into the gap (down)
					pillar.y = segment.centerY - segment.gapHeight / 2 - pillarHeight + pillarHeight * 0.15;
				} else {
					// Nudge 15% farther into the gap (up)
					pillar.y = segment.centerY + segment.gapHeight / 2 - pillarHeight * 0.15;
				}
				
				this.world.pillars.push(pillar);
			}
		}
	}
	
	updatePillars() {
		this.world.pillars = this.world.pillars.filter(pillar => {
			if (pillar.x < this.camera.x - 100) {
				this.pillarPool.release(pillar);
				return false;
			}
			return true;
		});
	}
	
	getCaveSegmentAt(x) {
		for (let i = 0; i < this.world.caveSegments.length - 1; i++) {
			const current = this.world.caveSegments[i];
			const next = this.world.caveSegments[i + 1];
			
			if (x >= current.x && x < next.x) {
				const t = (x - current.x) / (next.x - current.x);
				return {
					centerY: current.centerY + (next.centerY - current.centerY) * t,
					gapHeight: current.gapHeight + (next.gapHeight - current.gapHeight) * t
				};
			}
		}
		
		return this.world.caveSegments[this.world.caveSegments.length - 1];
	}
	
	checkCollisions() {
		// Check cave collision
		const segment = this.getCaveSegmentAt(this.ship.x);
		if (segment) {
			const topY = segment.centerY - segment.gapHeight / 2;
			const bottomY = segment.centerY + segment.gapHeight / 2;
			
			if (this.ship.y - SHIP_RADIUS < topY || this.ship.y + SHIP_RADIUS > bottomY) {
				this.gameOver();
				return;
			}
		}
		
		// Check pillar collision
		for (const pillar of this.world.pillars) {
			if (this.ship.x + SHIP_RADIUS > pillar.x &&
				this.ship.x - SHIP_RADIUS < pillar.x + pillar.width &&
				this.ship.y + SHIP_RADIUS > pillar.y &&
				this.ship.y - SHIP_RADIUS < pillar.y + pillar.height) {
				this.gameOver();
				return;
			}
		}
		
		// Check bounds
		if (this.ship.y < 0 || this.ship.y > this.gameHeight) {
			this.gameOver();
		}
	}
	
	gameOver() {
		this.stateManager.setState("gameover");
		this.createCrashParticles();
	}
	
	createCrashParticles() {
		for (let i = 0; i < 20; i++) {
			const particle = this.particlePool.get();
			particle.x = this.ship.x;
			particle.y = this.ship.y;
			particle.vx = (this.prng() - 0.5) * 200;
			particle.vy = (this.prng() - 0.5) * 200;
			particle.life = 0;
			particle.maxLife = 1 + this.prng() * 2;
			this.particles.push(particle);
		}
	}
	
	updateParticles(deltaTime) {
		this.particles = this.particles.filter(particle => {
			particle.life += deltaTime;
			particle.x += particle.vx * deltaTime;
			particle.y += particle.vy * deltaTime;
			particle.vy += 300 * deltaTime;
			
			if (particle.life >= particle.maxLife) {
				this.particlePool.release(particle);
				return false;
			}
			
			return true;
		});
	}
	
	updateGraphics() {
		// Clear graphics
		this.shipGraphics.clear();
		this.caveGraphics.clear();
		this.pillarGraphics.clear();
		this.particleGraphics.clear();
		
		// Draw cave
		this.drawCave();
		
		// Draw pillars
		this.drawPillars();
		
		// Draw ship
		this.drawShip();
		
		// Draw particles
		this.drawParticles();
	}
	
	drawCave() {
		if (this.world.caveSegments.length < 2) {
			return;
		}
		
		
		// Draw top wall (don't apply scale here - container handles scaling)
		this.caveGraphics.beginFill(0x333333);
		this.caveGraphics.moveTo(
			this.world.caveSegments[0].x - this.camera.x,
			0
		);
		
		for (const segment of this.world.caveSegments) {
			const x = segment.x - this.camera.x;
			const y = segment.centerY - segment.gapHeight / 2;
			this.caveGraphics.lineTo(x, y);
		}
		
		this.caveGraphics.lineTo(this.gameWidth, 0);
		this.caveGraphics.endFill();
		
		// Draw bottom wall
		this.caveGraphics.beginFill(0x333333);
		this.caveGraphics.moveTo(
			this.world.caveSegments[0].x - this.camera.x,
			this.gameHeight
		);
		
		for (const segment of this.world.caveSegments) {
			const x = segment.x - this.camera.x;
			const y = segment.centerY + segment.gapHeight / 2;
			this.caveGraphics.lineTo(x, y);
		}
		
		this.caveGraphics.lineTo(this.gameWidth, this.gameHeight);
		this.caveGraphics.endFill();
	}
	
	drawPillars() {
		this.pillarGraphics.beginFill(0x666666);
		for (const pillar of this.world.pillars) {
			const x = pillar.x - this.camera.x;
			const y = pillar.y;
			const width = pillar.width;
			const height = pillar.height;
			
			this.pillarGraphics.drawRect(x, y, width, height);
		}
		this.pillarGraphics.endFill();
	}
	
	drawShip() {
		const x = this.ship.x - this.camera.x;
		const y = this.ship.y;
		const radius = SHIP_RADIUS;
		
		// Draw trail
		if (this.ship.trail.length > 1) {
			for (let i = 1; i < this.ship.trail.length; i++) {
				const alpha = i / this.ship.trail.length;
				const trailX = this.ship.trail[i].x - this.camera.x;
				const trailY = this.ship.trail[i].y;
				const trailRadius = radius * alpha * 0.5;
				
				this.shipGraphics.beginFill(0x00FF88, alpha * 0.3);
				this.shipGraphics.drawCircle(trailX, trailY, trailRadius);
				this.shipGraphics.endFill();
			}
		}
		
		// Draw ship
		this.shipGraphics.beginFill(0x00FF88);
		this.shipGraphics.drawCircle(x, y, radius);
		this.shipGraphics.endFill();
		
		// Draw thrust indicator
		if (this.inputManager.isThrusting()) {
			this.shipGraphics.beginFill(0xFFFF00);
			this.shipGraphics.drawCircle(x, y + radius * 1.5, radius * 0.5);
			this.shipGraphics.endFill();
		}
	}
	
	drawParticles() {
		for (const particle of this.particles) {
			const x = particle.x - this.camera.x;
			const y = particle.y;
			const alpha = 1 - (particle.life / particle.maxLife);
			const radius = 2 * alpha;
			
			this.particleGraphics.beginFill(0xFF4444, alpha);
			this.particleGraphics.drawCircle(x, y, radius);
			this.particleGraphics.endFill();
		}
	}
	
	updateUI() {
		this.uiManager.updateScore(this.stateManager.score, this.stateManager.bestScore);
	}
	
	resize(width, height) {
		// Calculate scale to maintain consistent gameplay
		this.scale = Math.min(width / this.gameWidth, height / this.gameHeight);
		
		// Center the game container and scale it
		this.gameContainer.scale.set(this.scale);
		this.gameContainer.x = (width - this.gameWidth * this.scale) / 2;
		this.gameContainer.y = (height - this.gameHeight * this.scale) / 2;
		
		// Update UI
		this.uiManager.resize(width, height);
	}
}

export { Game };
