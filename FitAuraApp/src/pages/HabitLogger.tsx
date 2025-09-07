/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { apiService } from '../services/api';
import fileToBase64 from '../utils/fileToBase64';

interface HabitLoggerProps {
  userId: string;
  onNewLog: (log: any) => void; // callback to notify dashboard
}

interface LogEntry {
  user_id: string;
  timestamp: string;
  input_method: 'text' | 'voice' | 'photo';
  content: string; // text or base64 encoded file
  file_type?: 'png' | 'wav'; // for voice/photo
}

const HabitLogger: React.FC<HabitLoggerProps> = ({ userId, onNewLog }) => {
  const [inputMethod, setInputMethod] = useState<'text' | 'voice' | 'photo'>('text');
  const [textInput, setTextInput] = useState('');
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    let content: string = '';

    try {
      if (inputMethod === 'text') {
        if (!textInput.trim()) {
          setError('Please enter some text before logging!');
          return;
        }
        content = textInput.trim();
      } else if (inputMethod === 'voice') {
        if (!voiceBlob) {
          setError('Please select an audio file before logging!');
          return;
        }
        content = await fileToBase64(voiceBlob);
      } else if (inputMethod === 'photo') {
        if (!photoFile) {
          setError('Please select an image file before logging!');
          return;
        }
        content = await fileToBase64(photoFile);
      }

      const logEntry: LogEntry = {
        user_id: userId,
        timestamp: new Date().toISOString(),
        input_method: inputMethod,
        content,
      };

      if (inputMethod === 'photo') {
        logEntry.file_type = 'png';
      }

      if (inputMethod === 'voice') {
        logEntry.file_type = 'wav';
      }

      setLoading(true);
      const res = await apiService.createLog(logEntry);
      if (res.success) {
        onNewLog(res.data); // notify Dashboard
        setSuccess('Habit logged successfully! 🎉');
        setTextInput('');
        setVoiceBlob(null);
        setPhotoFile(null);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(`Failed to log habit: ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setError('Error logging habit. Please try again.');
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
    <section className='habit-logger animate-slide-up'>
      <h3>📝 Log a Habit</h3>

      {/* Error and Success Messages */}
      {error && (
        <div className='error-message'>
          ❌ {error}
        </div>
      )}
      
      {success && (
        <div className='success-message'>
          ✅ {success}
        </div>
      )}

      <div className='input-method-selector'>
        <label style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)', display: 'block', fontWeight: '500' }}>
          Choose Input Method:
        </label>
        <select 
          className='select'
          value={inputMethod} 
          onChange={(e) => setInputMethod(e.target.value as any)}
        >
          <option value='text'>📝 Text Input</option>
          <option value='voice'>🎤 Voice Recording</option>
          <option value='photo'>📷 Photo Upload</option>
        </select>
      </div>

      {inputMethod === 'text' && (
        <div className='text-input-section'>
          <label style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)', display: 'block', fontWeight: '500' }}>
            Describe your habit:
          </label>
          <textarea
            className='textarea'
            placeholder='e.g., "Had a 30-minute morning run", "Ate a healthy salad for lunch", "Drank 8 glasses of water today"'
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={4}
          />
        </div>
      )}

      {inputMethod === 'voice' && (
        <div className='voice-input-section'>
          <label style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)', display: 'block', fontWeight: '500' }}>
            Upload Audio Recording:
          </label>
          <input 
            type='file' 
            className='file-input'
            accept='audio/*' 
            onChange={handleVoiceCapture} 
          />
          {voiceBlob && (
            <div className='audio-preview'>
              <p style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)' }}>Audio Preview:</p>
              <audio controls style={{ width: '100%' }}>
                <source src={URL.createObjectURL(voiceBlob)} type={voiceBlob.type} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}

      {inputMethod === 'photo' && (
        <div className='photo-input-section'>
          <label style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)', display: 'block', fontWeight: '500' }}>
            Upload Photo:
          </label>
          <input 
            type='file' 
            className='file-input'
            accept='image/*' 
            onChange={handlePhotoCapture} 
          />
          {photoFile && (
            <div className='image-preview'>
              <p style={{ color: 'var(--white)', marginBottom: 'var(--space-sm)' }}>Image Preview:</p>
              <img 
                src={URL.createObjectURL(photoFile)} 
                alt='Preview' 
                className='preview-image'
              />
            </div>
          )}
        </div>
      )}

      <div className='action-buttons'>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className='btn btn-primary submit-btn'
        >
          {loading ? (
            <>
              <div className='loading-spinner' style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              Logging...
            </>
          ) : (
            <>
              ✅ Log Habit
            </>
          )}
        </button>
        <button 
          onClick={() => {
            setTextInput('');
            setVoiceBlob(null);
            setPhotoFile(null);
            setError(null);
            setSuccess(null);
          }}
          className='btn reset-btn'
        >
          🔄 Reset
        </button>
      </div>
    </section>
  );
};

export default HabitLogger;
