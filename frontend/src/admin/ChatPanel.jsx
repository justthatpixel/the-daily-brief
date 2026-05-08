import { useState, useEffect, useRef } from 'react';

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [articleContext, setArticleContext] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    }
  };

  const loadArticleContext = async (articleId) => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      const article = await res.json();
      setSelectedArticle(article);
      
      // Convert blocks to plain text for context
      const context = article.blocks?.map(b => b.content).filter(Boolean).join('\n\n') || '';
      setArticleContext(context);
    } catch (e) {
      alert('Failed to load article: ' + e.message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setStreamingContent('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          articleContext: articleContext || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      // Handle SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
              setStreamingContent('');
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (e) {
      alert('Failed to get response: ' + e.message);
    } finally {
      setLoading(false);
      setStreamingContent('');
      inputRef.current?.focus();
    }
  };

  const insertIntoEditor = () => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMessage && selectedArticle) {
      // This would integrate with the CMS editor
      alert('To insert: Navigate to the article editor and paste:\n\n' + lastAssistantMessage.content.slice(0, 500));
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStreamingContent('');
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-headline dark:text-dark-headline">Chat</h2>
        <p className="text-body dark:text-dark-body mt-1">Powered by Minimax M2 · Edit and discuss articles with AI</p>
      </div>

      {/* Context Selector */}
      <div className="card p-4 mb-4">
        <label className="block text-sm font-medium text-body dark:text-dark-body mb-2">
          Article Context
        </label>
        <div className="flex gap-3">
          <select
            value={selectedArticle?.id || ''}
            onChange={(e) => {
              if (e.target.value) {
                loadArticleContext(e.target.value);
              } else {
                setSelectedArticle(null);
                setArticleContext('');
              }
            }}
            className="input flex-1"
          >
            <option value="">No context</option>
            {articles.map(article => (
              <option key={article.id} value={article.id}>
                {article.title}
              </option>
            ))}
          </select>
          {selectedArticle && (
            <button
              onClick={() => { setSelectedArticle(null); setArticleContext(''); }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </div>
        {selectedArticle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Loading context from: {selectedArticle.title}
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="card flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-4xl mb-4">💬</p>
            <p>Start a conversation with the AI assistant.</p>
            <p className="text-sm mt-2">
              {articleContext ? 'Chatting with article context loaded.' : 'Select an article above for context-aware assistance.'}
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-headline dark:text-dark-headline'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-headline dark:text-dark-headline">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block animate-pulse ml-2">▊</span>
            </div>
          </div>
        )}

        {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex justify-center">
            <button
              onClick={insertIntoEditor}
              className="text-sm text-accent hover:text-blue-700 dark:text-dark-accent"
            >
              📋 Insert into editor
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
          className="input flex-1"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn-primary px-6"
        >
          {loading ? '...' : 'Send →'}
        </button>
        <button
          onClick={clearChat}
          className="btn-secondary px-4"
          title="Clear chat"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}