import React, { useState, useEffect } from 'react';

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Load saved key on mount
    chrome.storage.sync.get(['openai_api_key'], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save key to Chrome Storage
    chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
      alert('API key saved!');
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="apiKey">OpenAI API Key:</label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
        />
      </div>
      <button type="submit">Save</button>
    </form>
  );
};

export default ApiKeyForm; 