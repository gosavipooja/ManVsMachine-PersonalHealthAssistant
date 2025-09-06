import React, { useState } from 'react';
import { setLoginCookie } from '../utils/auth';

interface LoginPageProps {
  onLogin: (userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [userIdInput, setUserIdInput] = useState('');

  const handleLogin = () => {
    if (userIdInput.trim() === '') return;
    setLoginCookie(userIdInput); // save in cookie
    onLogin(userIdInput);
  };

  return (
    <div className='login-container'>
      <h2>Login to FitAura</h2>
      <input type='text' placeholder='Enter your user ID' value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginPage;
