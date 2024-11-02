import React from 'react';
import ApiKeyForm from './components/ApiKeyForm';
import AssistantsList from './components/AssistantsList';
import './components/styles.css';

const App: React.FC = () => {
  return (
    <div className="container">
      <ApiKeyForm />
      <AssistantsList />
    </div>
  );
};

export default App; 