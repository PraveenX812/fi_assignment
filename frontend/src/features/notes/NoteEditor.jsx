import { useState, useEffect } from 'react';
import styles from './NoteEditor.module.css';
import ShareModal from './ShareModal';
import VersionHistoryModal from './VersionHistoryModal';

export default function NoteEditor({ note, onSave, onDelete, onNoteRestored }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  return (
    <>
      <div className={styles.editorContainer}>
        <div className={styles.toolbar}>
          {note && note.id && (
            <>
              <button className={styles.actionBtn} onClick={() => setIsHistoryOpen(true)}>History</button>
              <button className={styles.actionBtn} onClick={() => setIsShareOpen(true)}>Share</button>
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
