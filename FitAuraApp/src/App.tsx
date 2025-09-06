import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import { getLoginCookie } from './utils/auth';

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getLoginCookie();
    if (storedUser) {
      setUserId(storedUser);
    }
  }, []);

  return (
    <div className='App'>
      <h1>FitAura – Personal AI Micro-Habit Coach</h1>
      {userId ? <Dashboard userId={userId} /> : <LoginPage onLogin={(id) => setUserId(id)} />}
    </div>
  );
};

export default App;
