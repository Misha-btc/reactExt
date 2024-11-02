import React from 'react';
import ApiKeyForm from './components/ApiKeyForm';
import AssistantsList from './components/AssistantsList';
import ThreadsList from './components/ThreadsList';
import './components/styles.css';

const App: React.FC = () => {
  return (
    <div className="container">
      <ApiKeyForm />
      <AssistantsList />
      <ThreadsList />
    </div>
  );
};

export default App; 