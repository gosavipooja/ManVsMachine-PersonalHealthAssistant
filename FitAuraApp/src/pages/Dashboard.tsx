/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
      const res = await axios.get(`http://localhost:3001/api/insights?userId=${userId}&days=7&includeRecommendations=true`);
      if (res.data.success) {
        setRecommendationsData(res.data.data);
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
      const res = await axios.get(`http://localhost:3001/api/insights?userId=${userId}&days=7&includeRecommendations=false`);
      if (res.data.success) {
        setSummaryData(res.data.data);
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
        const res = await axios.get(`http://localhost:3001/api/profile/${userId}`);
        if (res.data.success && res.data.data) {
          const data = res.data.data;
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
        const res = await axios.get(`http://localhost:3001/api/logging/${userId}`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setLogs(res.data.data);
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

            {/* summary buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', justifyContent: 'center' }}>
              <button onClick={handleGetSummary} disabled={loadingSummary}>
                {loadingSummary ? 'Loading...' : 'Get Summary'}
              </button>
              <button onClick={handleGetRecommendations} disabled={loadingRecommendations}>
                {loadingRecommendations ? 'Loading...' : 'Get Recommendations'}
              </button>
            </div>

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
                      <td>
                        {log.input_method === 'text' && log.content_preview && <span>{log.content_preview}</span>}
                        {log.input_method === 'image' && log.content_preview && <img src={`data:image/*;base64,${log.content_preview}`} alt='Habit' />}

                        {log.input_method === 'voice' && log.content_preview && (
                          <audio controls>
                            <source src={`data:audio/*;base64,${log.content_preview}`} />
                          </audio>
                        )}

                        {/* Fallback for any unexpected type */}
                        {!['text', 'image', 'voice'].includes(log.input_method) && <span>{log.content_preview}</span>}
                      </td>
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
              <p>Loading profile...</p>
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
          <section className='chat-tab'>
            <h2>Chat (Coming Soon)</h2>
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
