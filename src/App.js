import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginLogs from './pages/LoginLogs';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/logs" element={<LoginLogs />} />
      </Routes>
    </Router>
  );
};

export default App;