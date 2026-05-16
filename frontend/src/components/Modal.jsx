import { useEffect } from 'react';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      tabIndex={-1}
      autoFocus
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}
