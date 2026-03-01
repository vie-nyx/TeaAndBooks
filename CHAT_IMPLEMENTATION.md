# Real-Time Chat System Implementation Guide

## Overview
This document describes the complete implementation of a real-time chat system for Entwined, a MERN social platform. The system supports one-to-one messaging between friends and group chats with real-time updates via Socket.io.

## Architecture

### Backend Structure
```
entwined-server/
├── models/
│   ├── Conversation.js    # Conversation model (1-to-1 and group)
│   └── Message.js         # Message model (text, image, post sharing)
├── controllers/
│   └── chatController.js  # Chat business logic
├── routes/
│   └── chatRoutes.js      # REST API routes
├── socket/
│   └── socketHandler.js   # Socket.io event handlers
└── server.js              # Express + Socket.io server
```

### Frontend Structure
```
entwined-web/src/
├── components/
│   └── Chat.jsx           # Main chat component
├── contexts/
│   ├── AuthContext.jsx    # User authentication context
│   └── SocketContext.jsx  # Socket.io connection context
├── styles/
│   └── Chat.css           # Chat UI styling
└── pages/
    └── Dashboard.jsx      # Updated with chat integration
```

## Features Implemented

### ✅ Core Features
1. **One-to-One Messaging**
   - Only friends can message each other
   - Automatic conversation creation
   - Message persistence in MongoDB

2. **Group Chats**
   - Create group chats with multiple friends
   - Group admin can add members
   - Group name and member management

3. **Real-Time Messaging**
   - Socket.io integration
   - Real-time message delivery
   - Online/offline status
   - Typing indicators

4. **Message Types**
   - Text messages
   - Image uploads (via multer)
   - Post sharing support (postId field)

### ✅ Security Features
- JWT authentication for Socket.io connections
- Friend verification before messaging
- Conversation access control
- Group admin permissions

## API Endpoints

### Conversation Endpoints
- `POST /api/chat/conversation` - Get or create 1-to-1 conversation
- `POST /api/chat/conversation/group` - Create group chat
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/conversation/:id/members` - Add members to group

### Message Endpoints
- `GET /api/chat/conversation/:id/messages` - Get messages for conversation
- `POST /api/chat/message` - Send message (with image upload support)

## Socket.io Events

### Client → Server
- `conversation:join` - Join a conversation room
- `conversation:leave` - Leave a conversation room
- `message:send` - Send a message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `message:read` - Mark messages as read

### Server → Client
- `message:new` - New message received
- `message:notification` - Message notification (for users not in room)
- `typing:start` - Someone started typing
- `typing:stop` - Someone stopped typing
- `user:online` - User came online
- `user:offline` - User went offline
- `conversation:joined` - Successfully joined conversation
- `error` - Error occurred

## Database Models

### Conversation Model
```javascript
{
  type: "one-to-one" | "group",
  participants: [ObjectId],
  groupName: String (required if group),
  groupAdmin: ObjectId (required if group),
  lastMessage: ObjectId,
  lastMessageAt: Date,
  createdAt: Date
}
```

### Message Model
```javascript
{
  conversationId: ObjectId,
  sender: ObjectId,
  text: String,
  imageUrl: String (optional),
  postId: ObjectId (optional),
  readBy: [{
    user: ObjectId,
    readAt: Date
  }],
  createdAt: Date
}
```

## Setup Instructions

### Backend Setup
1. Install dependencies:
   ```bash
   cd entwined-server
   npm install socket.io multer
   ```

2. Environment variables required:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=http://localhost:5173 (or your frontend URL)
   PORT=5000
   ```

3. Create uploads directory:
   ```bash
   mkdir -p uploads/images
   ```

4. Start server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd entwined-web
   npm install socket.io-client
   ```

2. Environment variables required:
   ```
   VITE_API_URL=http://localhost:5000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Usage

### Starting a Chat
1. Navigate to Dashboard
2. Click "Chat" tab
3. Click on a friend's name in the friends list to start a 1-to-1 chat
4. Or click "+ Group" to create a group chat

### Sending Messages
- Type in the message input and press Enter or click Send
- Click the camera icon to upload an image
- Messages appear in real-time for all participants

### Creating Group Chats
1. Click "+ Group" button
2. Enter group name
3. Select friends to add
4. Click "Create"

## File Upload

Images are uploaded using multer and stored in `uploads/images/` directory. The server serves them at `/api/chat/uploads/images/:filename`.

## Security Considerations

1. **JWT Authentication**: All Socket.io connections require valid JWT tokens
2. **Friend Verification**: Only friends can create 1-to-1 conversations
3. **Group Permissions**: Only group admins can add members
4. **Access Control**: Users can only access conversations they're part of

## Future Enhancements

Potential improvements:
- Message read receipts (partially implemented)
- Message reactions
- File sharing (beyond images)
- Voice messages
- Video calls integration
- Message search
- Conversation archiving
- Message deletion/editing

## Troubleshooting

### Socket Connection Issues
- Ensure JWT token is valid and not expired
- Check CORS settings in server.js
- Verify CLIENT_URL matches your frontend URL

### Image Upload Issues
- Ensure `uploads/images` directory exists
- Check file size limits (currently 5MB)
- Verify multer configuration

### Conversation Not Found
- Ensure users are friends before messaging
- Check MongoDB connection
- Verify conversation participants array

## Notes

- The system prevents duplicate 1-to-1 conversations by checking existing conversations before creating new ones
- Online status is tracked but not fully displayed in UI (can be enhanced)
- Typing indicators timeout after 3 seconds of inactivity
- Messages are sorted by creation date (oldest first)

