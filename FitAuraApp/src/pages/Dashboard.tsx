/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import HabitLogger from './HabitLogger';
import ProfilePage from './ProfilePage';

interface DashboardProps {
  userId: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'edit-profile' | 'log' | 'chat'>('home');
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Load profile on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(`profile_${userId}`);
    if (savedProfile) setProfile(JSON.parse(savedProfile));

    const savedLogs = localStorage.getItem(`logs_${userId}`);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, [userId]);

  // Handle profile save
  const handleSaveProfile = (updatedProfile: any) => {
    setProfile(updatedProfile);
    localStorage.setItem(`profile_${userId}`, JSON.stringify(updatedProfile));
  };

  // Handle log save (when HabitLogger posts a new habit)
  const handleNewLog = (log: any) => {
    const updatedLogs = [...logs, log];
    setLogs(updatedLogs);
    localStorage.setItem(`logs_${userId}`, JSON.stringify(updatedLogs));
  };

  // Filter logs for today
  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = logs.filter((log) => log.timestamp.startsWith(today));

  return (
    <div className='dashboard'>
      {/* Navigation Tabs */}
      <nav className='dashboard-nav'>
        <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'active' : ''}>
          Home
        </button>
        <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>
          Profile
        </button>
        <button onClick={() => setActiveTab('log')} className={activeTab === 'log' ? 'active' : ''}>
          Log
        </button>
        <button onClick={() => setActiveTab('chat')} className={activeTab === 'chat' ? 'active' : ''}>
          Chat
        </button>
        <button className='logout-btn' onClick={onLogout}>
          Logout
        </button>
      </nav>

      {/* Tab Content */}
      <div className='tab-content'>
        {activeTab === 'home' && (
          <section className='home-tab'>
            <h2>Today's Logs</h2>
            {todaysLogs.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Input Method</th>
                    <th>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      <td>{log.input_method}</td>
                      <td>{log.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No logs yet today.</p>
            )}
          </section>
        )}

        {activeTab === 'profile' && (
          <section className='profile-tab'>
            {profile ? (
              <div>
                <h2>Profile Details</h2>
                <ul>
                  <li>
                    <strong>Name:</strong> <span>{profile.name}</span>
                  </li>
                  <li>
                    <strong>Age:</strong> <span>{profile.age}</span>
                  </li>
                  <li>
                    <strong>Gender:</strong> <span>{profile.gender}</span>
                  </li>
                  <li>
                    <strong>Weight:</strong> <span>{profile.weight} kg</span>
                  </li>
                  <li>
                    <strong>Height:</strong> <span>{profile.height} cm</span>
                  </li>
                  <li>
                    <strong>Body Type:</strong> <span>{profile.bodyType}</span>
                  </li>
                  <li>
                    <strong>Goal:</strong> <span>{profile.goal}</span>
                  </li>
                  <li>
                    <strong>Activity Level:</strong> <span>{profile.activityLevel}</span>
                  </li>
                  <li>
                    <strong>Culture:</strong> <span>{profile.culture}</span>
                  </li>
                </ul>
                <button onClick={() => setActiveTab('edit-profile')}>Edit Profile</button>
              </div>
            ) : (
              <p>No profile set up yet.</p>
            )}
          </section>
        )}

        {activeTab === 'edit-profile' && (
          <section className='edit-profile-tab'>
            <ProfilePage
              userId={userId}
              onSave={(updatedProfile) => {
                handleSaveProfile(updatedProfile);
                setActiveTab('profile'); // go back to profile view
              }}
            />
          </section>
        )}

        {activeTab === 'log' && <HabitLogger userId={userId} />}

        {activeTab === 'chat' && (
          <section className='chat-tab'>
            <h2>Chat (Coming Soon)</h2>
          </section>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
