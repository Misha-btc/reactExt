import React, { useState, useEffect } from 'react';

const ApiKeyForm: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Загружаем сохраненный ключ при монтировании
    chrome.storage.sync.get(['openai_api_key'], (result) => {
      if (result.openai_api_key) {
        setApiKey(result.openai_api_key);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Сохраняем ключ в Chrome Storage
    chrome.storage.sync.set({ openai_api_key: apiKey }, () => {
      alert('API ключ сохранен!');
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="apiKey">OpenAI API Ключ:</label>
        <input
          type="password"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Введите ваш API ключ"
        />
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
};

export default ApiKeyForm; 