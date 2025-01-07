import React from 'react';
import styles from './ReactionPicker.module.css';

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={e => e.stopPropagation()}>
        {AVAILABLE_REACTIONS.map(reaction => (
          <button
            key={reaction}
            className={styles.reactionButton}
            onClick={() => {
              onSelect(reaction);
              onClose();
            }}
          >
            {reaction}
          </button>
        ))}
      </div>
    </div>
  );
}; 