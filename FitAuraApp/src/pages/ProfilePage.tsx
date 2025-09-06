import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Profile {
  name: string;
  age: string;
  gender: string;
}

interface ProfilePageProps {
  userId: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId }) => {
  const [profile, setProfile] = useState<Profile>({ name: '', age: '', gender: '' });

  useEffect(() => {
    // Optional: fetch existing profile from backend
    // axios.get(`http://localhost:5000/profile?user_id=${userId}`).then(...)
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/profile', { ...profile, user_id: userId });
      alert('Profile saved!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section>
      <h2>Profile Setup</h2>
      <input name='name' placeholder='Name' value={profile.name} onChange={handleChange} />
      <input name='age' placeholder='Age' value={profile.age} onChange={handleChange} />
      <input name='gender' placeholder='Gender' value={profile.gender} onChange={handleChange} />
      <button onClick={handleSubmit}>Save Profile</button>
    </section>
  );
};

export default ProfilePage;
