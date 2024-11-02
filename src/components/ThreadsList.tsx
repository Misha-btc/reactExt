import React, { useState, useEffect } from 'react';
import './styles.css';

interface Thread {
  id: string;
  created_at: number;
  metadata: {
    name?: string;
  };
  active?: boolean;
}

const ThreadsList: React.FC = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [threadName, setThreadName] = useState('');

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = () => {
    chrome.storage.sync.get(['openai_threads'], (result) => {
      setThreads(result.openai_threads || []);
    });
  };

  const setActiveThread = async (threadId: string) => {
    const updatedThreads = threads.map(thread => ({
      ...thread,
      active: thread.id === threadId
    }));
    
    await chrome.storage.sync.set({ 'openai_threads': updatedThreads });
    setThreads(updatedThreads);
  };

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await chrome.storage.sync.get(['openai_api_key']);
      
      if (!result.openai_api_key) {
        throw new Error('Please set your OpenAI API key first');
      }

      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${result.openai_api_key}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          metadata: {
            name: threadName
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorData}`);
      }

      const newThread = await response.json();
      
      const updatedThreads = [...threads, {
        ...newThread,
        metadata: { name: threadName },
        active: false
      }];

      await chrome.storage.sync.set({ 'openai_threads': updatedThreads });
      setThreads(updatedThreads);
      setShowForm(false);
      setThreadName('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error creating thread: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="threads-list">
      <h2>My Topics</h2>
      
      {!showForm ? (
        <>
          {threads.length > 0 ? (
            threads.map(thread => (
              <div 
                key={thread.id}
                className={`thread-card ${thread.active ? 'active' : ''}`}
                onClick={() => setActiveThread(thread.id)}
              >
                <div className="thread-name">
                  {thread.metadata.name || 'Unnamed Topic'}
                </div>
                <div className="thread-date">
                  Created: {formatDate(thread.created_at)}
                </div>
              </div>
            ))
          ) : (
            <p>No topics available</p>
          )}
          <button 
            className="button add-thread-btn" 
            onClick={() => setShowForm(true)}
          >
            Create New Topic
          </button>
        </>
      ) : (
        <form onSubmit={createThread} className="thread-form">
          <div className="form-group">
            <label htmlFor="threadName">Topic Name</label>
            <input
              type="text"
              id="threadName"
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              placeholder="Enter topic name"
              required
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="button secondary" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="button" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Topic'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ThreadsList; 