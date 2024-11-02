/* global chrome */

// Добавляем стили для модального окна и чата
const style = document.createElement('style');
style.textContent = `
  .ai-modal-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999999;
  }

  .ai-modal {
    width: 600px;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    max-width: 90%;
    z-index: 1000000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    color: #333333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.4;
  }

  .ai-modal * {
    box-sizing: border-box;
  }

  .ai-modal h2 {
    margin: 0 0 15px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333333;
  }

  .ai-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    font-size: 20px;
    color: #666;
    text-decoration: none;
    border: none;
    background: none;
  }

  .chat-container {
    flex-grow: 1;
    overflow-y: auto;
    margin: 20px 0;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
    min-height: 300px;
    background: #ffffff;
  }

  .chat-input-container {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }

  .chat-input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    color: #333333;
    background: #ffffff;
    font-family: inherit;
  }

  .chat-input::placeholder {
    color: #999999;
  }

  .chat-input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .send-button {
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    font-weight: 500;
    text-transform: none;
    min-width: 80px;
  }

  .send-button:hover {
    background-color: #45a049;
  }

  .send-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .message {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.5;
  }

  .message.user {
    background-color: #e3f2fd;
    margin-left: 20%;
    color: #333333;
  }

  .message.assistant {
    background-color: #f5f5f5;
    margin-right: 20%;
    color: #333333;
  }

  .message-content {
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0;
    padding: 0;
  }

  .loading-messages {
    text-align: center;
    color: #666;
    padding: 20px;
    font-style: italic;
  }
`;
document.head.appendChild(style);

// Создаем модальное окно
const modal = document.createElement('div');
modal.className = 'ai-modal-overlay';
document.body.appendChild(modal);

// Добавляем хранилище для истории чата
let chatHistory = {};

// Функция для создания нового сообщения
const createMessage = (content, isUser = false) => {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(contentDiv);
  return messageDiv;
};

// Функция отправки сообщения
const sendMessage = async (content, chatContainer, inputElement, sendButton) => {
  if (!content.trim()) return;

  try {
    // Получаем API ключ, темы и ассистентов
    const { openai_api_key, openai_threads, openai_assistants } = await chrome.storage.sync.get([
      'openai_api_key',
      'openai_threads',
      'openai_assistants'
    ]);

    if (!openai_api_key) {
      throw new Error('Please set your OpenAI API key first');
    }

    // Получаем активную тему или первую доступную
    const activeThread = openai_threads?.find(t => t.active) || openai_threads?.[0];
    // Получаем активного ассистента
    const activeAssistant = openai_assistants?.find(a => a.active);
    
    if (!activeThread) {
      throw new Error('No topic available. Please create a topic first.');
    }

    if (!activeAssistant) {
      throw new Error('No assistant selected. Please select an assistant first.');
    }

    // Добавляем сообщение пользователя в чат
    chatContainer.appendChild(createMessage(content, true));
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Очищаем инпут и блокируем кнопку
    inputElement.value = '';
    sendButton.disabled = true;

    // Отправляем сообщение в API
    const messageResponse = await fetch(
      `https://api.openai.com/v1/threads/${activeThread.id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openai_api_key}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: content
        })
      }
    );

    if (!messageResponse.ok) {
      const errorData = await messageResponse.text();
      throw new Error(`Failed to send message: ${errorData}`);
    }

    // Создаем run с выбранным ассистентом
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${activeThread.id}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openai_api_key}`,
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: activeAssistant.id,
          instructions: activeAssistant.instructions // Используем инструкции ассистента
        })
      }
    );

    if (!runResponse.ok) {
      const errorData = await runResponse.text();
      throw new Error(`Failed to create run: ${errorData}`);
    }

    const runData = await runResponse.json();
    console.log('Run created:', runData);

    // Добавляем индикатор загрузки
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message assistant';
    loadingMessage.innerHTML = '<div class="message-content"><span class="loading-dots">Thinking<span>.</span><span>.</span><span>.</span></span></div>';
    const dots = loadingMessage.querySelectorAll('.loading-dots span');
    let currentDot = 0;
    const animateInterval = setInterval(() => {
      dots.forEach(dot => dot.style.opacity = '0');
      dots[currentDot].style.opacity = '1';
      currentDot = (currentDot + 1) % dots.length;
    }, 500);
    loadingMessage.animationInterval = animateInterval; // Сохраняем для последующей очистки
    chatContainer.appendChild(loadingMessage);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Проверяем статус run каждые 500ms
    const checkRunStatus = async () => {
      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${activeThread.id}/runs/${runData.id}`,
        {
          headers: {
            'Authorization': `Bearer ${openai_api_key}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        }
      );

      if (!statusResponse.ok) {
        throw new Error('Failed to check run status');
      }

      const statusData = await statusResponse.json();
      
      if (statusData.status === 'completed') {
        // Получаем последнее сообщение от ассистента
        const messagesResponse = await fetch(
          `https://api.openai.com/v1/threads/${activeThread.id}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${openai_api_key}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          }
        );

        if (!messagesResponse.ok) {
          throw new Error('Failed to fetch messages');
        }

        const messagesData = await messagesResponse.json();
        const lastMessage = messagesData.data[0]; // Последнее сообщение

        // Удаляем индикатор загрузки
        chatContainer.removeChild(loadingMessage);

        // Добавляем ответ ассистента
        if (lastMessage.role === 'assistant') {
          const content = lastMessage.content[0].text.value;
          chatContainer.appendChild(createMessage(content));
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        return;
      } else if (statusData.status === 'failed') {
        throw new Error(`Run failed: ${statusData.last_error?.message || 'Unknown error'}`);
      } else if (statusData.status === 'expired') {
        throw new Error('Run expired');
      } else {
        // Продолжаем проверять статус
        setTimeout(checkRunStatus, 500);
      }
    };

    // Начинаем проверку статуса
    await checkRunStatus();

  } catch (error) {
    console.error('Error:', error);
    alert(error.message);
    // Удаляем индикатор загрузки в случае ошибки
    const loadingMessage = chatContainer.querySelector('.message.assistant:last-child');
    if (loadingMessage?.textContent === 'Thinking...') {
      chatContainer.removeChild(loadingMessage);
    }
  } finally {
    sendButton.disabled = false;
    inputElement.focus();
  }
};

// Функция загрузки истории сообщений
const loadMessages = async (threadId, apiKey) => {
  try {
    const response = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to load messages');
    }

    const data = await response.json();
    return data.data.reverse(); // Разворачиваем массив, чтобы старые сообщения были вверху
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

// Функция отображения сообщений в чате
const displayMessages = (messages, chatContainer) => {
  messages.forEach(message => {
    const content = message.content[0].text.value;
    const isUser = message.role === 'user';
    chatContainer.appendChild(createMessage(content, isUser));
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
};

// Функция переключения модального окна
const toggleModal = async () => {
  const currentDisplay = window.getComputedStyle(modal).display;
  
  if (currentDisplay === 'none') {
    const result = await chrome.storage.sync.get(['openai_assistants', 'openai_threads', 'openai_api_key']);
    const activeAssistant = result.openai_assistants?.find(a => a.active);
    const activeThread = result.openai_threads?.find(t => t.active) || result.openai_threads?.[0];
    
    if (!activeAssistant) {
      alert('Please select an assistant first');
      return;
    }

    if (!activeThread) {
      alert('Please create a topic first');
      return;
    }

    // Создаем уникальный ключ для истории чата
    const historyKey = `${activeThread.id}_${activeAssistant.id}`;
    
    modal.innerHTML = `
      <div class="ai-modal">
        <span class="ai-modal-close">&times;</span>
        <h2>Chat with ${activeAssistant.name}</h2>
        <div class="thread-info">Current topic: ${activeThread.metadata?.name || 'Unnamed Topic'}</div>
        <div class="chat-container"></div>
        <div class="chat-input-container">
          <textarea 
            class="chat-input" 
            placeholder="Type your message here..."
            rows="1"
          ></textarea>
          <button class="send-button">Send</button>
        </div>
      </div>
    `;

    const chatContainer = modal.querySelector('.chat-container');
    const inputElement = modal.querySelector('.chat-input');
    const sendButton = modal.querySelector('.send-button');

    // Загружаем историю из памяти или с сервера
    if (!chatHistory[historyKey]) {
      // Добавляем индикатор загрузки
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-messages';
      loadingDiv.textContent = 'Loading messages...';
      chatContainer.appendChild(loadingDiv);

      // Загружаем сообщения с сервера
      const messages = await loadMessages(activeThread.id, result.openai_api_key);
      chatHistory[historyKey] = messages;
      
      // Удаляем индикатор загрузки
      chatContainer.removeChild(loadingDiv);
    }

    // Отображаем сообщения
    displayMessages(chatHistory[historyKey], chatContainer);

    // Обработчик отправки сообщения
    const handleSend = () => {
      const content = inputElement.value;
      if (!content.trim()) return;

      sendMessage(content, chatContainer, inputElement, sendButton).then(() => {
        // Обновляем историю после успешной отправки
        loadMessages(activeThread.id, result.openai_api_key).then(messages => {
          chatHistory[historyKey] = messages;
        });
      });
    };

    // Обработчики событий
    sendButton.addEventListener('click', handleSend);
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Автоматическая высота текстового поля
    inputElement.addEventListener('input', () => {
      inputElement.style.height = 'auto';
      inputElement.style.height = Math.min(inputElement.scrollHeight, 120) + 'px';
    });

    modal.style.display = 'block';
    inputElement.focus();
  } else {
    modal.style.display = 'none';
  }
};

// Обработчик горячих клавиш
const handleHotkey = (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if ((isMac && e.shiftKey && e.metaKey && e.code === 'Space') ||
      (!isMac && e.shiftKey && e.ctrlKey && e.code === 'Space')) {
    e.preventDefault();
    toggleModal();
  }
};

// Инициализация
document.addEventListener('keydown', handleHotkey);
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.className === 'ai-modal-close') {
    toggleModal();
  }
});

console.log('Extension initialized');