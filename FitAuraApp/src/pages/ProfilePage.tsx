import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ProfileData {
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  bodyType: string;
  goal: string;
  activityLevel: string;
  culture: string;
}

interface ProfilePageProps {
  userId: string;
  onSave: (profile: ProfileData) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userId, onSave }) => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    age: 0,
    gender: 'male',
    weight: 0,
    height: 0,
    bodyType: 'lean',
    goal: 'weight loss',
    activityLevel: 'moderate',
    culture: 'Western',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height' ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        bodyType: profile.bodyType,
        culture: profile.culture,
        goals: [profile.goal],
        activity_level: profile.activityLevel,
      };

      const res = await axios.put(`http://localhost:3001/api/profile/${userId}`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.data.success) {
        onSave(profile);
        alert('Profile saved successfully!');
      } else {
        alert(`Failed to save profile: ${res.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <section className='profile-page'>
      <h2>Edit Profile</h2>

      <input type='text' name='name' placeholder='Name' value={profile.name} onChange={handleChange} />

      <input type='number' name='age' placeholder='Age' value={profile.age || ''} onChange={handleChange} />

      <select name='gender' value={profile.gender} onChange={handleChange}>
        <option value='male'>Male</option>
        <option value='female'>Female</option>
        <option value='other'>Other</option>
      </select>

      <input type='number' name='weight' placeholder='Weight (kg)' value={profile.weight || ''} onChange={handleChange} />

      <input type='number' name='height' placeholder='Height (cm)' value={profile.height || ''} onChange={handleChange} />

      <select name='bodyType' value={profile.bodyType} onChange={handleChange}>
        <option value='lean'>Lean</option>
        <option value='athletic'>Athletic</option>
        <option value='rounded'>Rounded</option>
      </select>

      <select name='goal' value={profile.goal} onChange={handleChange}>
        <option value='weight loss'>Weight Loss</option>
        <option value='weight gain'>Weight Gain</option>
      </select>

      <select name='activityLevel' value={profile.activityLevel} onChange={handleChange}>
        <option value='very light'>Very Light</option>
        <option value='light'>Light</option>
        <option value='moderate'>Moderate</option>
        <option value='vigorous'>Vigorous</option>
        <option value='very high and intense'>Very High & Intense</option>
      </select>

      <select name='culture' value={profile.culture} onChange={handleChange}>
        <option value='African'>African</option>
        <option value='Asian'>Asian</option>
        <option value='European'>European</option>
        <option value='Indian'>Indian</option>
        <option value='Mediterranean'>Mediterranean</option>
        <option value='Western'>Western</option>
      </select>

      <button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </section>
  );
};

export default ProfilePage;
