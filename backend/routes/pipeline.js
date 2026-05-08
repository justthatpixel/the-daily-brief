const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

let currentJob = null;
let pipelineStatus = {
  step: 'idle',
  status: 'idle',
  lastRun: null,
  nextRun: null,
  lastOutput: '',
  error: null
};

function getNextRun() {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(7, 0, 0, 0);
  return next.toISOString();
}

router.get('/status', (req, res) => {
  res.json(pipelineStatus);
});

router.post('/run', (req, res) => {
  if (currentJob && currentJob.exitCode === null) {
    return res.status(409).json({ error: 'Pipeline already running' });
  }
  
  pipelineStatus.step = 'fetch';
  pipelineStatus.status = 'running';
  pipelineStatus.lastRun = new Date().toISOString();
  pipelineStatus.nextRun = getNextRun();
  pipelineStatus.error = null;
  
  if (global.broadcastStatus) global.broadcastStatus(pipelineStatus);
  
  const pipelinePath = path.join(__dirname, '../../pipeline');
  
  if (global.pipelineLog) global.pipelineLog('info', '🚀 Pipeline started');
  if (global.pipelineLog) global.pipelineLog('info', `📁 Working directory: ${pipelinePath}`);
  
  currentJob = spawn('node', ['index.js', '--silent'], {
    cwd: pipelinePath,
    env: {
      ...process.env,
      OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434'
    }
  });
  
  let stdoutData = '';
  let stderrData = '';
  
  currentJob.stdout.on('data', (data) => {
    const text = data.toString();
    stdoutData += text;
    if (global.pipelineLog) global.pipelineLog('info', text.trim());
  });
  
  currentJob.stderr.on('data', (data) => {
    const text = data.toString();
    stderrData += text;
    if (text.includes('error') || text.includes('Error') || text.includes('❌')) {
      if (global.pipelineLog) global.pipelineLog('error', text.trim());
    } else {
      if (global.pipelineLog) global.pipelineLog('warning', text.trim());
    }
  });
  
  currentJob.on('close', (code) => {
    if (code === 0) {
      pipelineStatus.step = 'idle';
      pipelineStatus.status = 'success';
      if (global.pipelineLog) global.pipelineLog('success', '✅ Pipeline completed successfully');
      const outputMatch = stdoutData.match(/Saved to: (.*\.md)/);
      if (outputMatch) pipelineStatus.lastOutput = outputMatch[1];
    } else {
      pipelineStatus.step = 'idle';
      pipelineStatus.status = 'error';
      pipelineStatus.error = stderrData || `Process exited with code ${code}`;
      if (global.pipelineLog) global.pipelineLog('error', `❌ Pipeline failed with code ${code}`);
    }
    if (global.broadcastStatus) global.broadcastStatus(pipelineStatus);
    currentJob = null;
  });
  
  currentJob.on('error', (err) => {
    pipelineStatus.step = 'idle';
    pipelineStatus.status = 'error';
    pipelineStatus.error = err.message;
    if (global.pipelineLog) global.pipelineLog('error', `❌ Pipeline error: ${err.message}`);
    if (global.broadcastStatus) global.broadcastStatus(pipelineStatus);
    currentJob = null;
  });
  
  res.json({ success: true, message: 'Pipeline started' });
});

module.exports = router;