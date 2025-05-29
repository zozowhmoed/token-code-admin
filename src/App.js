import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SearchPage from './pages/SearchPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginLogs from './pages/LoginLogs';
import Login from './pages/Login';
import AuthGuard from './components/AuthGuard';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AuthGuard />}>
            <Route path="/" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="/logs" element={<PrivateRoute><LoginLogs /></PrivateRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;