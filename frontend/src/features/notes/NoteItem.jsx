import styles from './NoteItem.module.css';

export default function NoteItem({ note, isActive, onClick, isShared }) {
  const date = new Date(note.updated_at || note.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div 
      className={`${styles.noteItem} ${isActive ? styles.active : ''}`}
      onClick={() => onClick(note)}
    >
      <div className={styles.noteTitle}>{note.title}</div>
      <div className={styles.notePreview}>{note.content.substring(0, 50)}...</div>
      <div className={styles.noteMeta}>
        <span>{date}</span>
        {isShared && note.owner_email && (
          <span style={{ fontStyle: 'italic' }}>by {note.owner_email}</span>
        )}
      </div>
    </div>
  );
}
