import React, { useEffect, useState } from 'react';
import { client } from '../../client';
import { UserStatus } from '../../types';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  username: string;
  userId: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  username,
  userId,
  size = 'medium',
  className = '',
  onClick,
}) => {
  const [status, setStatus] = useState<UserStatus>();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const userStatus = await client.getUserStatus(userId);
        setStatus(userStatus);
      } catch (error) {
        console.error('Failed to fetch user status:', error);
        setStatus(UserStatus.OFFLINE);
      }
    };

    fetchStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [userId]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return styles.statusOnline;
      case 'away':
        return styles.statusAway;
      case 'offline':
      case 'invisible':
        return styles.statusOffline;
      default:
        return styles.statusOffline;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'offline':
        return 'Offline';
      case 'invisible':
        return 'Invisible';
      case 'do_not_disturb':
        return 'Do Not Disturb';
      default:
        return '';
    }
  };

  const containerClasses = [
    styles['avatar-container'],
    styles[size],
    onClick && styles.clickable,
    status && getStatusColor(status),
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      title={status ? `${username} - ${getStatusText(status)}` : username}
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