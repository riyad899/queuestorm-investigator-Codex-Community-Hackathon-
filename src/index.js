// Compatibility entrypoint for hosts that expect `src/index.js` (Render default)
// This simply imports the built server in `dist/` so `node src/index.js` will start the app
import '../dist/server.js';

// Note: Ensure your build step runs before start (Render: Build Command -> `npm run build`).
