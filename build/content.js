/* global chrome */

// Добавляем стили только для модального окна чата
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
  }
`;
document.head.appendChild(style);

// Создаем модальное окно
const modal = document.createElement('div');
modal.className = 'ai-modal-overlay';
document.body.appendChild(modal);

// Функция переключения модального окна
const toggleModal = async () => {
  const currentDisplay = window.getComputedStyle(modal).display;
  
  if (currentDisplay === 'none') {
    const result = await chrome.storage.sync.get(['openai_assistants']);
    const activeAssistant = result.openai_assistants?.find(a => a.active);
    
    if (!activeAssistant) {
      alert('Please select an assistant first');
      return;
    }
    
    modal.innerHTML = `
      <div class="ai-modal">
        <span class="ai-modal-close">&times;</span>
        <h2>Chat with ${activeAssistant.name}</h2>
        <div class="chat-container">
          <!-- Здесь будет чат -->
        </div>
      </div>
    `;
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