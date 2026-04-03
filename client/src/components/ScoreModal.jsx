import { useState } from 'react';

export default function ScoreModal({ score, onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSubmitting(true);
    await onSubmit(name.trim(), score);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Game Over!</h3>
        <p>You scored <strong>{score}</strong></p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={15}
            autoFocus
            disabled={submitting}
          />
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              Skip
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || submitting}>
              {submitting ? 'Saving...' : 'Submit Score'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
