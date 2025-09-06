import React, { useState } from 'react';
import axios from 'axios';

interface HabitLoggerProps {
  userId: string;
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId }) => {
  const [logText, setLogText] = useState('');

  const handleLog = async (type: string) => {
    if (!logText) return;
    try {
      await axios.post('http://localhost:5000/log', {
        user_id: userId,
        type,
        timestamp: new Date().toISOString(),
        input_method: 'text',
        content: logText,
      });
      setLogText('');
      alert('Log saved!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className='habit-logger-container'>
      <h2>Habit Logger</h2>
      <input
        type='text'
        placeholder='Enter habit (exercise, food, hydration)'
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
      />
      <button onClick={() => handleLog('exercise')}>Exercise</button>
      <button onClick={() => handleLog('food')}>Food</button>
      <button onClick={() => handleLog('hydration')}>Hydration</button>
    </section>
  );
};

export default HabitLogger;
