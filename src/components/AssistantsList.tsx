import React, { useState, useEffect } from 'react';
import './styles.css';

interface Assistant {
  id: string;
  name: string;
  model: string;
  active: boolean;
}

interface AssistantForm {
  name: string;
  description: string;
  instructions: string;
  model: string;
  temperature: number;
  tools: string[];
}

const initialFormState: AssistantForm = {
  name: '',
  description: '',
  instructions: '',
  model: 'gpt-4',
  temperature: 1,
  tools: []
};

const AssistantsList: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AssistantForm>(initialFormState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = () => {
    chrome.storage.sync.get(['openai_assistants'], (result) => {
      setAssistants(result.openai_assistants || []);
    });
  };

  const setActiveAssistant = async (assistantId: string) => {
    const updatedAssistants = assistants.map(assistant => ({
      ...assistant,
      active: assistant.id === assistantId
    }));
    
    await chrome.storage.sync.set({ 'openai_assistants': updatedAssistants });
    setAssistants(updatedAssistants);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await chrome.storage.sync.get(['openai_api_key']);
      
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
        body: JSON.stringify({
          ...formData,
          tools: formData.tools.map(tool => ({ type: tool }))
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorData}`);
      }

      const newAssistant = await response.json();
      
      const updatedAssistants = [...assistants, {
        id: newAssistant.id,
        name: newAssistant.name,
        model: newAssistant.model,
        active: false
      }];

      await chrome.storage.sync.set({ 'openai_assistants': updatedAssistants });
      setAssistants(updatedAssistants);
      setShowForm(false);
      setFormData(initialFormState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error creating assistant: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToolChange = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  return (
    <div className="assistants-list">
      <h2>AI Assistants</h2>
      
      {!showForm ? (
        <>
          {assistants.length > 0 ? (
            assistants.map(assistant => (
              <div 
                key={assistant.id}
                className={`assistant-card ${assistant.active ? 'active' : ''}`}
                onClick={() => setActiveAssistant(assistant.id)}
              >
                <div className="assistant-name">{assistant.name}</div>
                <div className="assistant-model">Model: {assistant.model}</div>
              </div>
            ))
          ) : (
            <p>No assistants available</p>
          )}
          <button 
            className="button add-assistant-btn" 
            onClick={() => setShowForm(true)}
          >
            Add New Assistant
          </button>
        </>
      ) : (
        <form onSubmit={handleFormSubmit} className="assistant-form">
          <div className="form-group">
            <label htmlFor="name">Assistant Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="instructions">Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Model</label>
            <select
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <div className="form-group">
            <label>Tools</label>
            <div className="tools-section">
              {['code_interpreter', 'retrieval', 'function'].map(tool => (
                <label key={tool} className="tool-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.tools.includes(tool)}
                    onChange={() => handleToolChange(tool)}
                  />
                  {tool.replace('_', ' ').charAt(0).toUpperCase() + tool.slice(1)}
                </label>
              ))}
            </div>
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
              {isLoading ? 'Creating...' : 'Create Assistant'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AssistantsList; 