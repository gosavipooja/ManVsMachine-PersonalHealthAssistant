/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import axios from 'axios';

interface HabitLoggerProps {
  userId: string;
  onNewLog: (log: any) => void; // callback to notify dashboard
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId, onNewLog }) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'voice' | 'photo'>('text');
  const [textInput, setTextInput] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    let content: string = '';
    if (inputMethod === 'text') content = textInput;
    else if (inputMethod === 'voice' && voiceBlob) content = 'voice_record.wav'; // placeholder
    else if (inputMethod === 'photo' && photoFile) content = photoFile.name;

    if (!content) {
      alert('Please provide input before logging!');
      return;
    }

    const logEntry = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      input_method: inputMethod,
      content,
    };

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/logging', logEntry);
      if (res.data.success) {
        onNewLog(res.data.data); // notify Dashboard
        alert('Habit logged successfully!');
        setTextInput('');
        setVoiceBlob(null);
        setPhotoFile(null);
      } else {
        alert(`Failed to log habit: ${res.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error logging habit.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVoiceBlob(event.target.files?.[0] || null);
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoFile(event.target.files?.[0] || null);
  };

  return (
    <section className='habit-logger'>
      <h3>Log a Habit</h3>

      <select value={inputMethod} onChange={(e) => setInputMethod(e.target.value as any)}>
        <option value='text'>Text</option>
        <option value='voice'>Voice</option>
        <option value='photo'>Photo</option>
      </select>

      {inputMethod === 'text' && (
        <input type='text' placeholder='Enter habit details' value={textInput} onChange={(e) => setTextInput(e.target.value)} />
      )}

      {inputMethod === 'voice' && (
        <>
          <input type='file' accept='audio/*' capture='microphone' onChange={handleVoiceCapture} />
          {voiceBlob && (
            <audio controls>
              <source src={URL.createObjectURL(voiceBlob)} type={voiceBlob.type} />
              Your browser does not support the audio element.
            </audio>
          )}
        </>
      )}

      {inputMethod === 'photo' && (
        <>
          <input type='file' accept='image/*' capture='environment' onChange={handlePhotoCapture} />
          {photoFile && (
            <img src={URL.createObjectURL(photoFile)} alt='Preview' style={{ maxWidth: '200px', marginTop: '10px', borderRadius: '8px' }} />
          )}
        </>
      )}

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Logging...' : 'Log Habit'}
      </button>
    </section>
  );
};

export default HabitLogger;
