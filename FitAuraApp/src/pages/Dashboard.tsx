import React, { useEffect, useState } from 'react';
import { clearLoginCookie } from '../utils/auth';
import HabitLogger from './HabitLogger';
import ProfilePage from './ProfilePage';
import axios from 'axios';

interface DashboardProps {
  userId: string;
}

interface CoachFeedback {
  motivation_message: string;
  suggestions: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);

  const fetchCoachFeedback = async () => {
    try {
      const res = await axios.post('http://localhost:5000/coach', {
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
      });
      setFeedback(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoachFeedback();
  }, []);

  const handleLogout = () => {
    clearLoginCookie();
    window.location.reload();
  };

  return (
    <div>
      <h2>Welcome to FitAura, {userId}!</h2>
      <button onClick={handleLogout}>Logout</button>

      <ProfilePage userId={userId} />
      <HabitLogger userId={userId} />

      {feedback && (
        <div className='dashboard-card'>
          <h3>AI Coach</h3>
          <p>{feedback?.motivation_message}</p>
          <ul>
            {feedback?.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
