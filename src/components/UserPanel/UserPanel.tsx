import React from 'react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import styles from './UserPanel.module.css';
import { UserStatus } from '../../types';

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
  username: string;
  status: UserStatus;
  userId: string;
  onStartDM: (userId: string) => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  username,
  status,
  userId,
  onStartDM
}) => {
  const handleDMClick = () => {
    onStartDM(userId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles['user-panel']}>
        <div className={styles['user-panel-header']}>
          <Avatar 
            src={avatarUrl}
            username={username}
            size="large"
            status={status}
          />
          <div className={styles['user-panel-info']}>
            <h2 className={styles['username']}>{username}</h2>
            <span className={styles['status']}>
              {status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        
        <div className={styles['user-panel-actions']}>
          <button 
            className={styles['dm-button']}
            onClick={handleDMClick}
          >
            Send Direct Message
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UserPanel;
