import { React } from 'react';
import ProfilePage from './pages/ProfilePage';
import HabitLogger from './pages/HabitLogger';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <div className='App'>
      <h1>Coachly – Personal AI Micro-Habit Coach</h1>
      <ProfilePage />
      <HabitLogger />
      <Dashboard />
    </div>
  );
};

export default App;
