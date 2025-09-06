import React from 'react';

const Dashboard: React.FC = () => {
  // TODO: fetch /history and /coach API
  return (
    <div className='dashboard-card'>
      <h3>Today's Progress</h3>
      <div className='progress-bar-container'>
        <div className='progress-bar-fill' style={{ width: '60%' }}></div>
      </div>
      <p>AI Coach: Great job! Keep up the streak.</p>
    </div>
  );
};

export default Dashboard;
