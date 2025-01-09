import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  username: string;
  size?: 'small' | 'medium' | 'large';
  status?: 'online' | 'offline' | 'away' | 'do_not_disturb' | 'invisible';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  size = 'medium',
  status,
  className = '',
  onClick,
}) => {
  const containerClasses = [
    styles['avatar-container'],
    styles[size],
    onClick && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={styles['image-container']}>
        {src ? (
          <img
            src={src}
            alt={username}
            className={styles['avatar-image']}
          />
        ) : (
          <div className={styles['avatar-fallback']}>
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      {status && (
        <span
          className={`${styles['status-indicator']} ${styles[`status-${status}`]}`}
        />
      )}
    </div>
  );
};