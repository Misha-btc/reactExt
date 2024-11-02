/* global chrome */

// Добавляем стили
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
  }

  .ai-modal-close {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    font-size: 20px;
    color: #666;
    transition: color 0.3s;
  }

  .ai-modal-close:hover {
    color: #000;
  }

  .assistant-form {
    display: none;
    flex-direction: column;
    gap: 15px;
    margin-top: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-weight: 500;
    color: #333;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }

  .tools-section {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .tool-checkbox {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .temperature-slider {
    width: 100%;
  }

  .button {
    background-color: #4CAF50;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  .button:hover {
    background-color: #45a049;
  }

  .button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .main-menu {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .assistants-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .assistant-card {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .assistant-card:hover {
    background-color: #f5f5f5;
    border-color: #4CAF50;
  }

  .assistant-card.active {
    border-color: #4CAF50;
    background-color: #e8f5e9;
  }

  .assistant-info {
    flex-grow: 1;
  }

  .assistant-name {
    font-weight: bold;
    margin-bottom: 5px;
  }

  .assistant-model {
    font-size: 12px;
    color: #666;
  }

  .assistant-actions {
    display: flex;
    gap: 10px;
  }

  .no-assistants {
    text-align: center;
    color: #666;
    padding: 20px;
  }
`;
document.head.appendChild(style);

// Функция загрузки ассистентов
const loadAssistants = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openai_assistants'], (result) => {
      console.log('Loaded assistants:', result.openai_assistants);
      resolve(result.openai_assistants || []);
    });
  });
};

// Создаем модальное окно
const modal = document.createElement('div');
modal.className = 'ai-modal-overlay';
document.body.appendChild(modal);

// Функция обновления содержимого модального окна
const updateModalContent = (assistants) => {
  console.log('Updating modal content with assistants:', assistants);
  modal.innerHTML = `
    <div class="ai-modal">
      <span class="ai-modal-close">&times;</span>
      <h2>AI Assistant Manager</h2>
      <div class="main-menu">
        ${assistants.length > 0 ? `
          <div class="assistants-list">
            ${assistants.map(assistant => `
              <div class="assistant-card ${assistant.active ? 'active' : ''}" data-id="${assistant.id}">
                <div class="assistant-info">
                  <div class="assistant-name">${assistant.name}</div>
                  <div class="assistant-model">Model: ${assistant.model}</div>
                </div>
                <div class="assistant-actions">
                  <button class="button select-assistant" data-id="${assistant.id}">
                    ${assistant.active ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-assistants">
            No assistants created yet
          </div>
        `}
        <button class="button" id="addAssistantBtn">Add Assistant</button>
      </div>
      
      <form class="assistant-form" id="assistantForm" style="display: none;">
        <div class="form-group">
          <label for="name">Assistant Name</label>
          <input type="text" id="name" maxlength="256" placeholder="Example: Math Tutor" required>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" maxlength="512" placeholder="Describe the assistant's purpose"></textarea>
        </div>

        <div class="form-group">
          <label for="instructions">Instructions</label>
          <textarea id="instructions" maxlength="256000" placeholder="Detailed instructions for the assistant" required></textarea>
        </div>

        <div class="form-group">
          <label for="model">Model</label>
          <select id="model" required>
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        <div class="form-group">
          <label>Tools</label>
          <div class="tools-section">
            <label class="tool-checkbox">
              <input type="checkbox" value="code_interpreter"> Code Interpreter
            </label>
            <label class="tool-checkbox">
              <input type="checkbox" value="file_search"> File Search
            </label>
            <label class="tool-checkbox">
              <input type="checkbox" value="function"> Function Calling
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="temperature">Temperature: <span id="temperatureValue">1</span></label>
          <input type="range" id="temperature" class="temperature-slider" 
                 min="0" max="2" step="0.1" value="1">
        </div>

        <button type="submit" class="button">Create Assistant</button>
      </form>
    </div>
  `;
  
  attachEventListeners();
};

// Функция переключения модального окна
const toggleModal = async () => {
  console.log('Toggling modal');
  const currentDisplay = window.getComputedStyle(modal).display;
  
  if (currentDisplay === 'none') {
    const assistants = await loadAssistants();
    updateModalContent(assistants);
    modal.style.display = 'block';
  } else {
    modal.style.display = 'none';
  }
};

// Обработчик горячих клавиш
const handleHotkey = (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if ((isMac && e.shiftKey && e.metaKey && e.code === 'Space') ||
      (!isMac && e.shiftKey && e.ctrlKey && e.code === 'Space')) {
    console.log('Hotkey detected');
    e.preventDefault();
    toggleModal();
  }
};

// Функция прикрепления обработчиков событий
const attachEventListeners = () => {
  console.log('Attaching event listeners');
  
  // Обработчик для кнопки добавления ассистента
  const addButton = document.getElementById('addAssistantBtn');
  if (addButton) {
    addButton.addEventListener('click', () => {
      console.log('Add button clicked');
      const mainMenu = document.querySelector('.main-menu');
      const form = document.getElementById('assistantForm');
      mainMenu.style.display = 'none';
      form.style.display = 'flex';
    });
  }

  // Обработчики для кнопок выбора ассистента
  document.querySelectorAll('.select-assistant').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const assistantId = button.dataset.id;
      setActiveAssistant(assistantId);
    });
  });

  // Обработчик формы создания ассистента
  const form = document.getElementById('assistantForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Form submission started');
      
      const submitButton = e.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Creating...';

      const formData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        instructions: document.getElementById('instructions').value,
        model: document.getElementById('model').value,
        temperature: parseFloat(document.getElementById('temperature').value),
        tools: Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
          .map(cb => ({ type: cb.value }))
      };

      try {
        const result = await new Promise((resolve) => 
          chrome.storage.sync.get(['openai_api_key'], resolve)
        );
        
        if (!result.openai_api_key) {
          throw new Error('Please set your OpenAI API key first');
        }

        const response = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.openai_api_key}`,
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }

        const newAssistant = JSON.parse(responseText);
        console.log('New assistant data:', newAssistant);
        
        const storage = await new Promise((resolve) => 
          chrome.storage.sync.get(['openai_assistants'], resolve)
        );
        
        const currentAssistants = storage.openai_assistants || [];
        const updatedAssistants = [...currentAssistants, {
          id: newAssistant.id,
          name: newAssistant.name,
          model: newAssistant.model,
          description: newAssistant.description,
          instructions: newAssistant.instructions,
          tools: newAssistant.tools,
          active: false
        }];

        await new Promise((resolve) => 
          chrome.storage.sync.set({ 'openai_assistants': updatedAssistants }, resolve)
        );

        const mainMenu = document.querySelector('.main-menu');
        form.style.display = 'none';
        form.reset();
        mainMenu.style.display = 'flex';
        
        updateModalContent(updatedAssistants);

      } catch (error) {
        console.error('Error creating assistant:', error);
        alert(`Error creating assistant: ${error.message}`);
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Assistant';
      }
    });

    // Обработчик изменения температуры
    const temperatureInput = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    if (temperatureInput && temperatureValue) {
      temperatureInput.addEventListener('input', (e) => {
        temperatureValue.textContent = e.target.value;
      });
    }
  }
};

// Функция установки активного ассистента
const setActiveAssistant = async (assistantId) => {
  console.log('Setting active assistant:', assistantId);
  const assistants = await loadAssistants();
  const updatedAssistants = assistants.map(assistant => ({
    ...assistant,
    active: assistant.id === assistantId
  }));
  await new Promise((resolve) => 
    chrome.storage.sync.set({ 'openai_assistants': updatedAssistants }, resolve)
  );
  updateModalContent(updatedAssistants);
};

// Инициализация
const initialize = () => {
  console.log('Initializing extension');
  document.addEventListener('keydown', handleHotkey);
  
  // Обработчик клика вне модального окна
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.className === 'ai-modal-close') {
      toggleModal();
    }
  });
};

// Запускаем инициализацию
initialize();
console.log('Extension initialized');