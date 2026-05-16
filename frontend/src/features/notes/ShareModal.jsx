import { useState } from 'react';
import Modal from '../../components/Modal';
import { apiClient } from '../../api/client';

export default function ShareModal({ isOpen, onClose, noteId }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('VIEWER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await apiClient(`/notes/${noteId}/share`, {
        body: { share_with_email: email, permission }
      });
      setMessage(`Successfully shared with ${email}`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Note">
      <form onSubmit={handleShare} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {message && <div style={{ color: 'var(--success-color)' }}>{message}</div>}
        {error && <div style={{ color: 'var(--danger-color)' }}>{error}</div>}
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="user@example.com"
            required 
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Permission Level</label>
          <select 
            value={permission} 
            onChange={(e) => setPermission(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="VIEWER">Viewer (Read-only)</option>
            <option value="EDITOR">Editor (Read & Write)</option>
          </select>
        </div>

        <button 
          type="submit" 
          disabled={loading || !email}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            borderRadius: 'var(--border-radius)'
          }}
        >
          {loading ? 'Sharing...' : 'Share Note'}
        </button>
      </form>
    </Modal>
  );
}
