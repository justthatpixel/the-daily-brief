const WebSocket = require('ws');

let wss = null;
const clients = new Set();

// Global broadcaster for pipeline logs
global.pipelineLog = (level, message) => {
  const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const logEntry = {
    timestamp,
    level, // 'info' | 'success' | 'error' | 'warning'
    message,
    step: global.currentPipelineStep || null
  };
  
  const payload = JSON.stringify(logEntry);
  
  // Send to all connected WebSocket clients
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
  
  // Also print to server console
  const color = level === 'error' ? '\x1b[31m' : level === 'success' ? '\x1b[32m' : level === 'warning' ? '\x1b[33m' : '\x1b[36m';
  console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
};

function initWebSocket() {
  wss = new WebSocket.Server({ noServer: true });
  
  wss.on('connection', (ws) => {
    console.log('📡 WebSocket client connected');
    clients.add(ws);
    
    // Send current status on connect
    if (global.pipelineStatus) {
      ws.send(JSON.stringify({ type: 'status', data: global.pipelineStatus }));
    }
    
    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      clients.delete(ws);
    });
  });
  
  return wss;
}

// Broadcast status updates to all clients
function broadcastStatus(status) {
  global.pipelineStatus = status;
  const payload = JSON.stringify({ type: 'status', data: status });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

module.exports = { initWebSocket, broadcastStatus };