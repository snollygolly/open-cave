// Mulberry32 PRNG for deterministic random generation
export function createPRNG(seed) {
	let state = seed;
	
	return function random() {
		let t = state += 0x6D2B79F5;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

export function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

// Generate signed noise value for cave path generation
export function signedNoise(prng, amplitude) {
	return (prng() - 0.5) * 2 * amplitude;
}

// Object pool for performance
export function createPool(createFn, resetFn) {
	const pool = [];
	
	return {
		get() {
			if (pool.length > 0) {
				return pool.pop();
			}
			return createFn();
		},
		
		release(obj) {
			resetFn(obj);
			pool.push(obj);
		}
	};
}