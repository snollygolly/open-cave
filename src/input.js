class InputManager {
	constructor(canvas) {
		this.isPressed = false;
		this.canvas = canvas;
		
		this.setupKeyboard();
		this.setupMouse();
		this.setupTouch();
	}
	
	setupKeyboard() {
		document.addEventListener("keydown", (e) => {
			if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
				e.preventDefault();
				this.setPressed(true);
			}
		});
		
		document.addEventListener("keyup", (e) => {
			if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
				e.preventDefault();
				this.setPressed(false);
			}
		});
	}
	
	setupMouse() {
		this.canvas.addEventListener("mousedown", (e) => {
			e.preventDefault();
			this.setPressed(true);
		});
		
		this.canvas.addEventListener("mouseup", (e) => {
			e.preventDefault();
			this.setPressed(false);
		});
		
		this.canvas.addEventListener("mouseleave", () => {
			this.setPressed(false);
		});
		
		// Prevent context menu
		this.canvas.addEventListener("contextmenu", (e) => {
			e.preventDefault();
		});
	}
	
	setupTouch() {
		this.canvas.addEventListener("touchstart", (e) => {
			e.preventDefault();
			this.setPressed(true);
		});
		
		this.canvas.addEventListener("touchend", (e) => {
			e.preventDefault();
			this.setPressed(false);
		});
		
		this.canvas.addEventListener("touchcancel", (e) => {
			e.preventDefault();
			this.setPressed(false);
		});
		
		// Prevent scrolling
		document.addEventListener("touchmove", (e) => {
			e.preventDefault();
		}, { passive: false });
	}
	
	setPressed(pressed) {
		this.isPressed = pressed;
	}
	
	isThrusting() {
		return this.isPressed;
	}
}

export { InputManager };