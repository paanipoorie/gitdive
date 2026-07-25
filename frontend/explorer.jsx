import React from 'react';
import ReactDOM from 'react-dom/client';
import ExplorerApp from './src/ExplorerApp.jsx';
import './styles.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ExplorerApp />
    </React.StrictMode>
  );
}
