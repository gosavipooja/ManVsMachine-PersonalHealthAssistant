import React from 'react';

const HabitLogger: React.FC = () => {
  // TODO: wire up text / voice / photo logging
  return (
    <div className='reminder-modal'>
      <p>Time to log your habit!</p>
      <button onClick={() => console.log('Reminder dismissed')}>Dismiss</button>
    </div>
  );
};

export default HabitLogger;
