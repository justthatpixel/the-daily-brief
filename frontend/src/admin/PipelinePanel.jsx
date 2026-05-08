import { useState, useEffect, useRef } from 'react';

const steps = [
  { id: 'fetch', label: 'Fetch' },
  { id: 'aggregate', label: 'Aggregate' },
  { id: 'write', label: 'Write' },
  { id: 'publish', label: 'Publish' },
];

export default function PipelinePanel() {
  const [status, setStatus] = useState({ step: 'idle', status: 'idle', lastRun: null, nextRun: null });
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Fetch initial status
    fetchStatus();

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/pipeline-log`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setStatus(data.data);
            setIsRunning(data.data.status === 'running');
          } else {
            setLogs(prev => [...prev, data]);
            // Auto-scroll to bottom
            if (terminalRef.current) {
              terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      wsRef.current.onerror = () => {
        console.log('WebSocket connection failed, logs will only update on refresh');
      };
    } catch (e) {
      console.log('WebSocket not available');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/pipeline/status');
      const data = await res.json();
      setStatus(data);
      setIsRunning(data.status === 'running');
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  };

  const runPipeline = async () => {
    setLogs([]);
    setIsRunning(true);
    
    try {
      const res = await fetch('/api/pipeline/run', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to start pipeline');
        setIsRunning(false);
      }
    } catch (e) {
      alert('Failed to start pipeline: ' + e.message);
      setIsRunning(false);
    }
  };

  const getStepStatus = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === status.step);
    
    if (status.status === 'success') return 'done';
    if (status.status === 'error') return 'error';
    if (status.status !== 'running') return 'idle';
    
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'running';
    return 'idle';
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  const getLogClass = (level) => {
    switch (level) {
      case 'success': return 'log-success';
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      default: return 'log-info';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-headline dark:text-dark-headline">Pipeline</h2>
          <p className="text-body dark:text-dark-body mt-1">Run and monitor the news aggregation pipeline</p>
        </div>
        <button
          onClick={runPipeline}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isRunning
              ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? '⏳ Running...' : '▶ Run Now'}
        </button>
      </div>

      {/* Status Info */}
      <div className="card p-4">
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last run:</span>
            <span className="ml-2 font-medium text-headline dark:text-dark-headline">
              {formatTime(status.lastRun)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Next run:</span>
            <span className="ml-2 font-medium text-headline dark:text-dark-headline">
              {formatTime(status.nextRun) || 'Manual only'}
            </span>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4">STEPS</h3>
        <div className="flex items-center justify-around">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`step-dot ${getStepStatus(step.id)}`} />
                <span className="mt-2 text-sm font-medium text-body dark:text-dark-body">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  getStepStatus(steps[index + 1].id) === 'idle' 
                    ? 'bg-gray-300 dark:bg-gray-700' 
                    : 'bg-green-500'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Log */}
      <div className="card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">TERMINAL LOG</h3>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Clear
          </button>
        </div>
        <div
          ref={terminalRef}
          className="terminal h-80 overflow-auto"
          style={{ maxHeight: '320px' }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click "Run Now" to start the pipeline.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={getLogClass(log.level)}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Error Display */}
      {status.error && (
        <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2">Error</h3>
          <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {status.error}
          </pre>
        </div>
      )}
    </div>
  );
}