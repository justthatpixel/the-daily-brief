import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from './admin/AdminLayout';
import PipelinePanel from './admin/PipelinePanel';
import ArticleManager from './admin/ArticleManager';
import CMSEditor from './admin/CMSEditor';
import ChatPanel from './admin/ChatPanel';
import ReaderLayout from './reader/ReaderLayout';
import NewsFeed from './reader/NewsFeed';
import ArticleView from './reader/ArticleView';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      setDarkMode(saved === 'true');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className={darkMode ? 'dark' : ''}>
        <Routes>
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<PipelinePanel />} />
            <Route path="articles" element={<ArticleManager />} />
            <Route path="editor/:id?" element={<CMSEditor />} />
            <Route path="chat" element={<ChatPanel />} />
          </Route>

          {/* Reader routes */}
          <Route path="/reader" element={<ReaderLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
            <Route index element={<NewsFeed />} />
            <Route path="article/:id" element={<ArticleView />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/reader" replace />} />
          <Route path="*" element={<Navigate to="/reader" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;