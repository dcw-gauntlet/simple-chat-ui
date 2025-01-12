import React, { useEffect, useState } from 'react';
import { client } from '../../client';
import { UserStatus, User } from '../../types';
import styles from './Avatar.module.css';

interface AvatarProps {
  user: User;
  size?: 'small' | 'medium' | 'large' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = 'medium',
  className = '',
  onClick,
}) => {
  const [status, setStatus] = useState<UserStatus>();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const userStatus = await client.getUserStatus(user.id);
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
  }, [user.id]);

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
      title={status ? `${user.username} - ${getStatusText(status)}` : user.username}
    >
      <div className={styles['image-container']}>
        {user.profile_picture ? (
          <img
            src={user.profile_picture}
            alt={user.username}
            className={styles['avatar-image']}
          />
        ) : (
          <div className={styles['avatar-fallback']}>
            {user.username.charAt(0).toUpperCase()}
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