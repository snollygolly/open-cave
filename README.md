# Open Cave

A minimalist SFCave-style side-scrolling game built with PixiJS and Vite.

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Controls

- **Keyboard:** Space, ArrowUp, or W to thrust
- **Mouse:** Click and hold to thrust
- **Touch:** Tap and hold to thrust

## Game Mechanics

Navigate your ship through a procedurally generated cave corridor. Keep the ship aloft by applying thrust, but beware of gravity pulling you down. Avoid hitting the cave walls or pillars to survive as long as possible.

## Tuning Constants

| Constant | Value | Description |
|----------|-------|-------------|
| GRAVITY | 800 | Downward acceleration (px/s²) |
| THRUST_IMPULSE | -1200 | Upward acceleration while held (px/s²) |
| MAX_VELOCITY | 600 | Maximum fall/rise speed (px/s) |
| BASE_SPEED | 180 | Initial scroll speed (px/s) |
| SPEED_INCREASE | 0.3 | Speed increase per second |
| INITIAL_GAP | 300 | Starting corridor gap height (px) |
| MIN_GAP | 120 | Minimum corridor gap height (px) |
| GAP_SHRINK_RATE | 2 | Gap reduction per second (px/s) |
| PILLAR_FREQUENCY | 0.003 | Probability of pillar spawn per pixel |

## Performance Notes

- Optimized for 60 FPS on modest hardware
- Uses object pooling for particles and pillars
- Minimizes allocations in main game loop
- Responsive scaling for all screen sizes

## Mobile Support

- Full touch support with gesture prevention
- Responsive layout with letterboxing
- Touch areas cover full screen for easy input

## Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
