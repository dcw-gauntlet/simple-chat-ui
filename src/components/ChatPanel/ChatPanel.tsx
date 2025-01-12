import React from 'react';
import { Message as MessageComponent } from './../Message/Message';
import { Channel, Message } from './../../types';
import { ApiClient } from './../../client';
import { Stack, TextField, Button } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { styled } from '@mui/material/styles';

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
  channel: Channel;
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
  onStartDM
}) => {
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
    
    if (messagesResponse.messages.length > messages.length) {
      const newMessages = messagesResponse.messages.slice(messages.length);
      console.log("found new messages:", newMessages.length);
      setNeedsScroll(newMessages.length > 0);
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
      <Stack
          direction="column"
          alignItems="flex-start"
          justifyContent="flex-start"
          spacing={2}
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
          }}
        >
        <Stack
          direction="column"
          spacing={2}
          alignItems="flex-start"
          justifyContent="flex-start"
          sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
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
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="flex-start"
          sx={{
            width: '100%',
          }}
        >
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
                    const response = await client.uploadFile(file);
                    if (response.ok) {
                      // Send message with file attachment
                      await sendMessage(client, channel.id, userId, message, response.file_id, file.name, file.type);
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
      </Stack>
  );
};