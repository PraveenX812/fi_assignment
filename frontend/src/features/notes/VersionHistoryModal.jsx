import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { apiClient } from '../../api/client';

export default function VersionHistoryModal({ isOpen, onClose, noteId, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await apiClient(`/notes/${noteId}/versions`);
        setVersions(data || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch versions');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && noteId) {
      fetchVersions();
    }
  }, [isOpen, noteId]);

  const [confirmId, setConfirmId] = useState(null);

  const handleRestore = async (versionId) => {
    setRestoringId(versionId);
    try {
      const { data } = await apiClient(`/notes/${noteId}/restore/${versionId}`, {
        method: 'POST'
      });
      onRestore(data);
      onClose();
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setRestoringId(null);
      setConfirmId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version History">
      {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>{error}</div>}
      
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading versions...</div>
      ) : versions.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)' }}>No previous versions found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
          {versions.map(v => (
            <div 
              key={v.id} 
              style={{ 
                padding: '1rem', 
                border: '1px solid var(--surface-border)', 
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>Version {v.version_number}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(v.created_at).toLocaleString()}
                </div>
              </div>
              {confirmId === v.id ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleRestore(v.id)}
                    disabled={restoringId === v.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--danger-color)',
                      color: 'white',
                      borderRadius: 'var(--border-radius)',
                      border: 'none'
                    }}
                  >
                    {restoringId === v.id ? 'Restoring...' : 'Confirm'}
                  </button>
                  <button 
                    onClick={() => setConfirmId(null)}
                    disabled={restoringId === v.id}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--surface-border)'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmId(v.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--surface-hover)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--surface-border)'
                  }}
                >
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
