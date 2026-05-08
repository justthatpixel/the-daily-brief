require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const pipelineRoutes = require('./routes/pipeline');
const articlesRoutes = require('./routes/articles');
const chatRoutes = require('./routes/chat');
const assetsRoutes = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend build (production) or frontend src (dev)
const frontendPath = path.join(__dirname, '../frontend');
const distPath = path.join(frontendPath, 'dist');
app.use(express.static(distPath));
app.use(express.static(path.join(__dirname, '../content/assets')));

// API Routes
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/articles', articlesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assets', assetsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Daily Column - Loading</title></head>
        <body>
          <h1>📰 The Daily Financial Column</h1>
          <p>Building frontend... Please refresh in a moment.</p>
          <p><a href="/reader">Go to Reader</a> | <a href="/admin">Go to Admin</a></p>
        </body>
      </html>
    `);
  }
});

// Create HTTP server and integrate WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/pipeline-log' });

const wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('📡 WebSocket client connected');
  wsClients.add(ws);
  
  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected');
    wsClients.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    wsClients.delete(ws);
  });
});

// Global broadcaster for pipeline logs
global.pipelineLog = (level, message) => {
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logEntry = { timestamp, level, message, step: global.currentPipelineStep || null };
  
  const payload = JSON.stringify(logEntry);
  wsClients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN = 1
      client.send(payload);
    }
  });
  
  const color = level === 'error' ? '\x1b[31m' : level === 'success' ? '\x1b[32m' : level === 'warning' ? '\x1b[33m' : '\x1b[36m';
  console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
};

// Broadcast status updates to all clients
global.broadcastStatus = (status) => {
  global.pipelineStatus = status;
  const payload = JSON.stringify({ type: 'status', data: status });
  wsClients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
};

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📰 The Daily Financial Column v2.0`);
  console.log(`   Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Admin Studio: http://localhost:${PORT}/admin`);
  console.log(`   Reader App:   http://localhost:${PORT}/reader\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wss.close();
  server.close(() => process.exit(0));
});

module.exports = { app, server };
