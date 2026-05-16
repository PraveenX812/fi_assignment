import { useState, useEffect, useRef } from 'react';
import styles from './NoteEditor.module.css';
import ShareModal from './ShareModal';
import VersionHistoryModal from './VersionHistoryModal';
import { apiClient } from '../../api/client';

export default function NoteEditor({ note, onSave, onDelete, onNoteRestored }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Update local state when selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  if (!note && title === '' && content === '') {
    return (
      <div className={styles.emptyState}>
        Select a note or create a new one
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSaving(true);
    await onSave({ ...note, title, content });
    setIsSaving(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !note?.id) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await apiClient(`/notes/${note.id}/attachments`, {
        body: formData
      });
      // We need to tell the parent (DashboardPage) that the note has a new attachment
      // The simplest way is to call onSave with the existing note data so it fetches again or updates state.
      // But we can just append it to the current note object for now.
      onSave({ ...note, attachments: [...(note.attachments || []), data] });
    } catch (err) {
      alert('Failed to upload file: ' + (err.message || err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className={styles.editorContainer}>
        <div className={styles.toolbar}>
          {note && note.id && (
            <>
              <button className={styles.actionBtn} onClick={() => setIsHistoryOpen(true)}>History</button>
              <button className={styles.actionBtn} onClick={() => setIsShareOpen(true)}>Share</button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload}
              />
              <button 
                className={styles.actionBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Attach File'}
              </button>
            </>
          )}
          <button 
            className={styles.actionBtn} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          {note && note.id && (
            isDeleting ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--danger-color)' }}>Are you sure?</span>
                <button 
                  className={`${styles.actionBtn} ${styles.dangerBtn}`}
                  onClick={() => {
                    onDelete(note.id);
                    setIsDeleting(false);
                  }}
                >
                  Yes
                </button>
                <button 
                  className={styles.actionBtn}
                  onClick={() => setIsDeleting(false)}
                >
                  No
                </button>
              </div>
            ) : (
              <button 
                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                onClick={() => setIsDeleting(true)}
              >
                Delete
              </button>
            )
          )}
        </div>
        
        <input
          type="text"
          className={styles.titleInput}
          placeholder="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        
        <textarea
          className={styles.contentInput}
          placeholder="Start typing your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {note && note.id && note.attachments && note.attachments.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Attachments</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {note.attachments.map(att => (
                <a 
                  key={att.id} 
                  href={att.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--surface-hover)',
                    borderRadius: 'var(--border-radius)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    border: '1px solid var(--surface-border)'
                  }}
                >
                  📄 {att.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {note && note.id && (
        <>
          <ShareModal 
            isOpen={isShareOpen} 
            onClose={() => setIsShareOpen(false)} 
            noteId={note.id} 
          />
          <VersionHistoryModal 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            noteId={note.id}
            onRestore={onNoteRestored}
          />
        </>
      )}
    </>
  );
}
