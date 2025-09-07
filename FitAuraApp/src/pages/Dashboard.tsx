/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
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

  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  const [recommendationsModalOpen, setRecommendationsModalOpen] = useState(false);
  const [recommendationsData, setRecommendationsData] = useState<any>(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const handleGetRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await apiService.getInsights(userId, 7, true);
      if (res.success) {
        setRecommendationsData(res.data);
        setRecommendationsModalOpen(true);
      } else {
        alert('Failed to fetch recommendations.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching recommendations.');
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleGetSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await apiService.getInsights(userId, 7, false);
      if (res.success) {
        setSummaryData(res.data);
        setSummaryModalOpen(true);
      } else {
        alert('Failed to fetch summary.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiService.getProfile(userId);
        if (res.success && res.data) {
          const data = res.data;
          setProfile({
            name: data.name || '',
            age: data.age || 0,
            gender: data.gender || 'male',
            weight: data.weight || 0,
            height: data.height || 0,
            bodyType: data.bodyType || 'lean',
            goal: Array.isArray(data.goals) && data.goals.length > 0 ? data.goals[0] : 'weight loss',
            activityLevel: data.activity_level || 'moderate',
            culture: data.culture || 'Western',
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await apiService.getLogs(userId);
        if (res.success && Array.isArray(res.data)) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };

    fetchProfile();
    fetchLogs();
  }, [userId]);

  // Handle profile save (edit-profile tab)
  const handleSaveProfile = (updatedProfile: any) => {
    setProfile(updatedProfile);
  };

  // Handle new habit log
  const handleNewLog = (log: any) => {
    setLogs((prevLogs) => [...prevLogs, log]);
  };

  // Filter logs for today
  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = logs.filter((log) => log.timestamp.startsWith(today));

  return (
    <div className='dashboard animate-fade-in'>
      {/* Navigation Tabs */}
      <nav className='dashboard-nav'>
        <button 
          onClick={() => setActiveTab('home')} 
          className={`btn ${activeTab === 'home' ? 'btn-primary' : 'btn-ghost'}`}
        >
          🏠 Home
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
        >
          👤 Profile
        </button>
        <button 
          onClick={() => setActiveTab('log')} 
          className={`btn ${activeTab === 'log' ? 'btn-primary' : 'btn-ghost'}`}
        >
          📝 Log
        </button>
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
        >
          💬 Chat
        </button>
        <button className='btn btn-secondary' onClick={onLogout}>
          🚪 Logout
        </button>
      </nav>

      {/* Tab Content */}
      <div className='tab-content'>
        {activeTab === 'home' && (
          <section className='home-tab animate-slide-up'>
            {/* Welcome Card */}
            <div className='glass-card' style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)', textAlign: 'center' }}>
              <h2>Welcome back, {profile?.name || 'User'}! 👋</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: 'var(--space-sm)' }}>
                Ready to track your health journey today?
              </p>
            </div>

            {/* AI Insights Card */}
            <div className='glass-card' style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
              <h3>🤖 AI Health Insights</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 'var(--space-lg)' }}>
                Get personalized insights and recommendations based on your health data
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleGetSummary} 
                  disabled={loadingSummary}
                  className='btn btn-success'
                >
                  {loadingSummary ? (
                    <>
                      <div className='loading-spinner' style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      📊 Get Summary
                    </>
                  )}
                </button>
                <button 
                  onClick={handleGetRecommendations} 
                  disabled={loadingRecommendations}
                  className='btn btn-secondary'
                >
                  {loadingRecommendations ? (
                    <>
                      <div className='loading-spinner' style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      🍽️ Get Recommendations
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Today's Logs Card */}
            <div className='glass-card' style={{ padding: 'var(--space-xl)' }}>
              <h3>📅 Today's Activity Logs</h3>
              {todaysLogs.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>⏰ Time</th>
                        <th>📝 Method</th>
                        <th>📄 Content</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaysLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td>
                            <span style={{ 
                              padding: 'var(--space-xs) var(--space-sm)', 
                              borderRadius: 'var(--radius-sm)', 
                              background: 'rgba(255, 255, 255, 0.1)',
                              fontSize: '0.8rem'
                            }}>
                              {log.input_method}
                            </span>
                          </td>
                          <td>
                            {log.input_method === 'text' && log.content_preview && (
                              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{log.content_preview}</span>
                            )}
                            {log.input_method === 'image' && log.content_preview && (
                              <img 
                                src={`data:image/*;base64,${log.content_preview}`} 
                                alt='Habit' 
                                style={{ maxWidth: '100px', borderRadius: 'var(--radius-md)' }}
                              />
                            )}
                            {log.input_method === 'voice' && log.content_preview && (
                              <audio controls style={{ maxWidth: '200px' }}>
                                <source src={`data:audio/*;base64,${log.content_preview}`} />
                              </audio>
                            )}
                            {!['text', 'image', 'voice'].includes(log.input_method) && (
                              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>{log.content_preview}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'rgba(255, 255, 255, 0.7)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>No logs yet today</p>
                  <p>Start tracking your health habits by clicking the "📝 Log" tab above!</p>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className='profile-tab animate-slide-up'>
            {profile ? (
              <div className='glass-card' style={{ padding: 'var(--space-xl)' }}>
                <h2>👤 Profile Details</h2>
                <div className='metadata-grid' style={{ marginBottom: 'var(--space-xl)' }}>
                  <div className='metadata-item'>
                    <strong>👤 Name:</strong> <span>{profile.name}</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>🎂 Age:</strong> <span>{profile.age} years</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>⚧ Gender:</strong> <span>{profile.gender}</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>⚖️ Weight:</strong> <span>{profile.weight} kg</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>📏 Height:</strong> <span>{profile.height} cm</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>🏃 Body Type:</strong> <span>{profile.bodyType}</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>🎯 Goal:</strong> <span>{profile.goal}</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>💪 Activity Level:</strong> <span>{profile.activityLevel}</span>
                  </div>
                  <div className='metadata-item'>
                    <strong>🌍 Culture:</strong> <span>{profile.culture}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('edit-profile')}
                  className='btn btn-primary'
                >
                  ✏️ Edit Profile
                </button>
              </div>
            ) : (
              <div className='loading-container'>
                <div className='loading-spinner'></div>
                <p>Loading profile...</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'edit-profile' && (
          <section className='edit-profile-tab'>
            <ProfilePage
              userId={userId}
              onSave={(updatedProfile) => {
                handleSaveProfile(updatedProfile);
                setActiveTab('profile'); // return to profile view
              }}
            />
          </section>
        )}

        {activeTab === 'log' && <HabitLogger userId={userId} onNewLog={handleNewLog} />}

        {activeTab === 'chat' && (
          <section className='chat-tab animate-slide-up'>
            <div className='glass-card' style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <h2>💬 AI Health Chat</h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: 'var(--space-lg)' }}>
                Coming Soon! Chat with your AI health assistant for personalized advice and support.
              </p>
              <div style={{ 
                padding: 'var(--space-xl)', 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--glass-border)'
              }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  🚧 This feature is under development. Stay tuned for updates!
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Summary Modal */}
      {summaryModalOpen && summaryData && (
        <div className='summary-modal'>
          <div className='summary-modal-content'>
            <h2>Weekly Summary</h2>

            <section>
              <h3>Summary</h3>
              <p>{summaryData.summary}</p>
            </section>

            <section>
              <h3>Motivation</h3>
              <p>{summaryData.motivation}</p>
            </section>

            <section>
              <h3>Suggestions</h3>
              <ul>
                {summaryData.suggestions.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Key Insights</h3>
              <ul>
                {summaryData.keyInsights.map((i: string, idx: number) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Progress Summary</h3>
              <p>{summaryData.progressSummary}</p>
            </section>

            <section>
              <h3>Next Steps</h3>
              <ul>
                {summaryData.nextSteps.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>

            <button onClick={() => setSummaryModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {recommendationsModalOpen && recommendationsData && (
        <div className='summary-modal'>
          <div className='summary-modal-content'>
            <h2>Weekly Recommendations</h2>

            <section>
              <h3>Summary</h3>
              <p>{recommendationsData.summary}</p>
            </section>

            <section>
              <h3>Motivation</h3>
              <p>{recommendationsData.motivation}</p>
            </section>

            <section>
              <h3>Suggestions</h3>
              <ul>
                {recommendationsData.suggestions.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Key Insights</h3>
              <ul>
                {recommendationsData.keyInsights.map((i: string, idx: number) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Progress Summary</h3>
              <p>{recommendationsData.progressSummary}</p>
            </section>

            <section>
              <h3>Next Steps</h3>
              <ul>
                {recommendationsData.nextSteps.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </section>

            {recommendationsData.dinnerRecommendation && (
              <section>
                <h3>Dinner Recommendation</h3>
                <p>{recommendationsData.dinnerRecommendation}</p>
              </section>
            )}

            <button onClick={() => setRecommendationsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
