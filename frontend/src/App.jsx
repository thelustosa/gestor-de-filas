import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TVDisplay from './components/TVDisplay';
import Totem from './components/Totem';
import Atendente from './components/Atendente';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/tv" element={<TVDisplay />} />
          <Route path="/totem" element={<Totem />} />
          <Route path="/atendente" element={<Atendente />} />
          <Route path="/" element={<Navigate to="/tv" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
