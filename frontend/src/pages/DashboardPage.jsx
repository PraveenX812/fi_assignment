import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import NoteItem from '../features/notes/NoteItem';
import NoteEditor from '../features/notes/NoteEditor';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async (query = '') => {
    try {
      setLoading(true);
      const endpoint = query ? `/search?q=${encodeURIComponent(query)}` : '/notes';
      const { data } = await apiClient(endpoint);
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to fetch notes', err);
      if (err.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNotes(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSaveNote = async (noteData) => {
    try {
      if (noteData.id) {
        // Update existing
        const { data } = await apiClient(`/notes/${noteData.id}`, {
          method: 'PUT',
          body: { title: noteData.title, content: noteData.content }
        });
        setNotes(notes.map(n => n.id === data.id ? data : n));
        setSelectedNote(data);
      } else {
        // Create new
        const { data } = await apiClient('/notes', {
          body: { title: noteData.title, content: noteData.content }
        });
        setNotes([data, ...notes]);
        setSelectedNote(data);
      }
    } catch (err) {
      alert('Failed to save note: ' + err);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await apiClient(`/notes/${id}`, { method: 'DELETE' });
      setNotes(notes.filter(n => n.id !== id));
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (err) {
      alert('Failed to delete note. You might not have permission.');
    }
  };

  const handleNoteRestored = (restoredNote) => {
    setNotes(notes.map(n => n.id === restoredNote.id ? restoredNote : n));
    setSelectedNote(restoredNote);
  };

  const handleNewNote = () => {
    setSelectedNote({ title: '', content: '' }); // Unsaved new note state
  };

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Notes</h2>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
        
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search notes..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ padding: '0 1rem 1rem' }}>
          <button 
            onClick={handleNewNote}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'var(--surface-border)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            + New Note
          </button>
        </div>

        <div className={styles.notesList}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : notes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No notes found.</div>
          ) : (
            <>
              {notes.filter(n => n.owner_id === user?.id).length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    My Notes
                  </div>
                  {notes.filter(n => n.owner_id === user?.id).map(note => (
                    <NoteItem 
                      key={note.id} 
                      note={note} 
                      isActive={selectedNote?.id === note.id}
                      onClick={setSelectedNote}
                    />
                  ))}
                </div>
              )}
              
              {notes.filter(n => n.owner_id !== user?.id).length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
                    Shared With Me
                  </div>
                  {notes.filter(n => n.owner_id !== user?.id).map(note => (
                    <NoteItem 
                      key={note.id} 
                      note={note} 
                      isActive={selectedNote?.id === note.id}
                      onClick={setSelectedNote}
                      isShared={true}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      <main className={styles.mainContent}>
        <NoteEditor 
          note={selectedNote} 
          onSave={handleSaveNote} 
          onDelete={handleDeleteNote}
          onNoteRestored={handleNoteRestored}
        />
      </main>
    </div>
  );
}
