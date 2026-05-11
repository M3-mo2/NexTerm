import React from 'react';
import ReactDOM from 'react-dom/client';
import { MainLayout } from './components/layout/MainLayout';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MainLayout />
  </React.StrictMode>
);