import React from 'react';
import { Message as MessageComponent } from './../Message/Message';
import { Channel, Message } from './../../types';
import { ApiClient } from './../../client';
import { Stack, TextField, Button, Box, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { styled } from '@mui/material/styles';
import { ChatTitle } from './ChatTitle';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface ChatPanelProps {
  channel: Channel | null;
  client: ApiClient;
  userId: string;
  onThreadCreate: (message: Message) => void;
  onThreadOpen: (channel: Channel, message: Message) => void;
  onStartDM: (userId: string, username?: string) => void;
}

const sendMessage = (client: ApiClient, channelId: string, userId: string, message: string, file_id?: string, filename?: string, content_type?: string) => {
  client.sendMessage({
    channel_id: channelId, 
    user_id: userId,
    content: message,
    file_id: file_id,
    filename: filename,
    content_type: content_type
  });
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  channel, 
  client,
  userId,
  onThreadOpen,
  onStartDM,
}) => {
  // if we don't have a channel, we should show a "no channel" message
  if (!channel || !channel.id) {
    return <Stack sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        p: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderTop: 1,
        borderColor: 'divider',
        width: '100%',
      }}>
      <Typography variant="h6">No channel selected</Typography>
      <Typography variant="body1">Please select a channel to start chatting.</Typography>
    </Stack>
  }

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [needsScroll, setNeedsScroll] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    const messagesResponse = await client.getChannelMessages(channel.id);
    console.log("new messages count:", messagesResponse.messages.length);
    
    if (messagesResponse.messages.length > messages.length) {
      const newMessages = messagesResponse.messages.slice(messages.length);
      console.log("found new messages:", newMessages.length);
      setNeedsScroll(newMessages.length > 0);
    } else {
      console.log("no new messages");
    }
    setMessages(messagesResponse.messages);
  };

  React.useEffect(() => {
    if (needsScroll) {
      scrollToBottom();
      setNeedsScroll(false);
    }
  }, [needsScroll]);

  React.useEffect(() => {
    setMessages([]);
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));
  }, [channel.id]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 1_000);

    return () => clearInterval(interval);
  }, [client, channel.id, messages.length]);

  

  return (
    <>
      <Stack
        direction="column"
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      <ChatTitle channel={channel} client={client} />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
        }}
      >
        {isLoading && <div>Loading...</div>}
        {messages.map((message) => (
          <MessageComponent 
            key={message.id}
            message={message}
            client={client}
            currentUserId={userId}
            onThreadOpen={onThreadOpen}
            onStartDM={onStartDM}
          />
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          width: '100%',
        }}
      >
        <Stack direction="row" spacing={1}>
          <TextField
            label="Message"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(client, channel.id, userId, message);
                setMessage('');
              }
            }}
          />
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<AttachFileIcon />}
            sx={{
              "height": "100%",
            }}
          >
            Attach
            <VisuallyHiddenInput
              type="file"
              multiple
              onChange={async (event) => {
                if (event.target.files && event.target.files.length > 0) {
                  const file = event.target.files[0];
                  try {
                    const response = await client.uploadFile(file, channel.id);
                    if (response.ok) {
                      // Send message with file attachment
                      sendMessage(client, channel.id, userId, message, response.file_id, file.name, file.type);
                      setMessage('');
                    }
                  } catch (error) {
                    console.error('Error uploading file:', error);
                  }
                }
              }}
            />
          </Button>
          <Button
            variant="contained"
            disabled={message.length === 0}
            sx={{
              backgroundColor: 'green',
              color: 'white',
              height: '100%',
            }}
            onClick={() => {
              sendMessage(client, channel.id, userId, message);
              setMessage('');
            }}
          >Send</Button>
        </Stack>
      </Box>
    </Stack>
    </>
  );
};