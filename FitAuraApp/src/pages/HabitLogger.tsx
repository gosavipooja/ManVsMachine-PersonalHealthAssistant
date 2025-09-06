import React, { useState } from 'react';
import axios from 'axios';

interface HabitLoggerProps {
  userId: string;
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId }) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'voice' | 'photo'>('text');
  const [textInput, setTextInput] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    let content: string = '';
    if (inputMethod === 'text') content = textInput;
    else if (inputMethod === 'voice' && voiceBlob) content = 'voice_record.wav'; // placeholder
    else if (inputMethod === 'photo' && photoFile) content = photoFile.name;

    if (!content) {
      alert('Please provide input before logging!');
      return;
    }

    const payload = {
      user_id: userId,
      timestamp: new Date().toISOString(),
      input_method: inputMethod,
      content,
    };

    try {
      const response = await axios.post('http://localhost:3001/api/logging', payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.data.success) {
        alert('Habit logged!');
        setTextInput('');
        setVoiceBlob(null);
        setPhotoFile(null);
      } else {
        alert(`Failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to log habit. Please check server connection.');
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

      {/* Input method selector */}
      <select value={inputMethod} onChange={(e) => setInputMethod(e.target.value as any)}>
        <option value='text'>Text</option>
        <option value='voice'>Voice</option>
        <option value='photo'>Photo</option>
      </select>

      {/* Conditional input fields */}
      {inputMethod === 'text' && (
        <input type='text' placeholder='Enter habit details' value={textInput} onChange={(e) => setTextInput(e.target.value)} />
      )}

      {inputMethod === 'voice' && (
        <>
          <input type='file' accept='audio/*' capture='microphone' onChange={handleVoiceCapture} />
          {voiceBlob && (
            <audio controls>
              <source src={URL.createObjectURL(voiceBlob)} type={voiceBlob.type} />
              <track kind='captions' src='' label='No captions' />
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

      <button onClick={handleSubmit}>Log Habit</button>
    </section>
  );
};

export default HabitLogger;
