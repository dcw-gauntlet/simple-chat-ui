# Definitions

- Channel: A collection of messages between one or more users.  The channel is displayed in a chat panel.
- Thread: A thread is a type of channel.  A thread is a channel that is opened in reply to a specific message.
- Primary Chat Channel: This channel is always open and displayed.  If no conversations are on the stack, this channel is still displayed with a placeholder message.
- Secondary Chat Channel: This channel is optionally displayed when the conversation stack is > 1.  We use the secondary chat channel to help the user descend and ascend through conversation threads.

# Conversation Stack

The purpose of the conversation stack is to help the user go through conversation channels.

The conversation stack is a stack of channels that should be displayed.  We display the last 1 or 2 channels in the stack.

If the user...
    Has not opened a channel, display just the primary chat panel with a placeholder message
    Has opened a single channel, display the single channel in the primary chat panel.
    Has 2+ channels open, display the last 2 channels in the stack.
    Open a channel from the primary chat panel - drop all channels after the primary channel and add the new channel to the stack.
    Open a channel from the secondary chat panel - just add the new channel to the stack.
    Open a channel from somewhere else - drop the entire stack and add the new channel to the stack.

# Examples

The user opens a channel CA from the recent conversations list.  This should be the first channel in the stack.
    Stack: [ CA ]
    Primary Chat Channel: CA
    Secondary Chat Channel: None

The user has channel CA open in the primary.  The user opens a channel CB-1 from the primary panel.
    Stack: [ CA, CB-1 ]
    Primary Chat Channel: CA
    Secondary Chat Channel: CB-1

The user has CA in the primary and CB-1 in the secondary.  The user opens a channel CB-1-A from the secondary panel.
    Stack: [ CA, CB-1, CB-1-A ]
    Primary Chat Channel: CB-1
    Secondary Chat Channel: CB-1-A

The user has the stack [ CA, CB-1, CB-1-A ] and opens a channel CB-2 from the secondary panel (CB-1).
    Stack: [ CA, CB-1, CB-2 ]
    Primary Chat Channel: CB-1
    Secondary Chat Channel: CB-2

The user has the stack [ CA, CB-1, CB-1-A ] and opens a channel CB-2 from the primary panel (CA).
    Stack: [ CA, CB-2 ]
    Primary Chat Channel: CA
    Secondary Chat Channel: CB-2

