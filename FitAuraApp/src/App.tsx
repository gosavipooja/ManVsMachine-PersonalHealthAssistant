import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUserId(savedUser);
    }
  }, []);

  const handleLogin = (id: string) => {
    localStorage.setItem('currentUser', id);
    setUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUserId(null);
  };

  return <div>{userId ? <Dashboard userId={userId} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}</div>;
};

export default App;
