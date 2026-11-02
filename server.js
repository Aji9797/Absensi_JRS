import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Health check endpoint for container orchestrators and monitoring
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Cache control: Immutable long-term cache for hashed static assets
app.use(
  '/assets',
  express.static(path.join(DIST_DIR, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve standard static files from dist root
app.use(
  express.static(DIST_DIR, {
    maxAge: '1h',
  })
);

// Single Page Application (SPA) fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JRS GeoFace Absensi production server running at http://0.0.0.0:${PORT}`);
});
