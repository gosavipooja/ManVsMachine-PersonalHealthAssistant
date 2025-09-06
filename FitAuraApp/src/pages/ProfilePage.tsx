import React, { useState } from 'react';
import axios from 'axios';

interface Profile {
  name: string;
  age: string;
  gender: string;
}

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<Profile>({ name: '', age: '', gender: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/profile', profile);
      alert('Profile saved!');
    } catch (error) {
      console.error(error);
      alert('Failed to save profile.');
    }
  };

  return (
    <div className='profile-page'>
      <h2>Profile Setup</h2>
      <input name='name' placeholder='Name' value={profile.name} onChange={handleChange} />
      <input name='age' placeholder='Age' value={profile.age} onChange={handleChange} />
      <input name='gender' placeholder='Gender' value={profile.gender} onChange={handleChange} />
      <button onClick={handleSubmit}>Save Profile</button>
    </div>
  );
};

export default ProfilePage;
