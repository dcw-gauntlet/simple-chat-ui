import React from 'react';
import { Avatar } from '../ui/Avatar';
import { User } from '../../types';
import { Dialog } from '@mui/material';
import { Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Container, Typography, Button } from '@mui/material';
import { Grid2 } from '@mui/material';

interface UserPanelProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onStartDM: (userId: string) => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UserPanel: React.FC<UserPanelProps> = ({
  isOpen,
  onClose,
  user,
  onStartDM
}) => {
  const handleDMClick = () => {
    onStartDM(user.id);
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth={false}
      sx={{
        '& .MuiDialog-paper': {
          maxWidth: '80vw',
          minWidth: '30vw',
          margin: '16px',
        },
      }}
    >
      <Container
        sx={{
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <Typography variant="h6">User Panel</Typography>
        <Grid2 container spacing={2}>
          <Grid2 
            size={4}
            sx={{
              display: 'flex',
              justifyContent: 'left',
              alignItems: 'center',
            }}
          >
            <Avatar 
              user={user}
              size="xl"
            />
          </Grid2>
          <Grid2>
            <Grid2 container >
              <Grid2 size={4}>
                <Typography variant="h6">{user.username}</Typography>
              </Grid2>
              <Grid2 size={8} />
              <Grid2 size={12}>
                <Button variant="contained" onClick={handleDMClick}>Direct Message</Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        
        
        
        
      </Container>
    </Dialog>
  );
};

export default UserPanel;
