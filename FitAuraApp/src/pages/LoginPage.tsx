import React, { useState } from 'react';
import { setLoginCookie } from '../utils/auth';

interface LoginPageProps {
  onLogin: (userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [userIdInput, setUserIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (userIdInput.trim() === '') return;
    setIsLoading(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setLoginCookie(userIdInput); // save in cookie
      onLogin(userIdInput);
      setIsLoading(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleQuickLogin = (id: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setLoginCookie(id);
      onLogin(id);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className='login-container animate-fade-in'>
      <div className='login-card glass-card animate-slide-up'>
        <div className='login-header'>
          <h1>🏃‍♂️ FitAura</h1>
          <p className='login-subtitle'>Your Personal Health Assistant</p>
        </div>
        
        <div className='login-form'>
          <input
            type='text'
            className='input'
            placeholder='Enter your User ID'
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            onClick={handleLogin}
            className='btn btn-primary'
            disabled={isLoading || !userIdInput.trim()}
          >
            {isLoading ? (
              <>
                <div className='loading-spinner' style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                Getting Started...
              </>
            ) : (
              <>
                🚀 Get Started
              </>
            )}
          </button>
        </div>
        
        <div className='login-info'>
          <p>Don't have a User ID? Try one of our test accounts:</p>
        </div>
        
        <div className='test-users'>
          <button 
            className='test-user-btn'
            onClick={() => handleQuickLogin('user123')}
            disabled={isLoading}
          >
            👤 user123 - General User
          </button>
          <button 
            className='test-user-btn'
            onClick={() => handleQuickLogin('emma_chen')}
            disabled={isLoading}
          >
            👩 emma_chen - Fitness Enthusiast
          </button>
          <button 
            className='test-user-btn'
            onClick={() => handleQuickLogin('marcus_johnson')}
            disabled={isLoading}
          >
            👨 marcus_johnson - Health Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
