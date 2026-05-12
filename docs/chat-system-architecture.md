# Chat System Architecture

## 1. System architecture

Current production-ready implementation in this repo uses:

- `Spring Boot + STOMP/SockJS` for authenticated realtime transport
- `MySQL` for persistent chat/call history
- `React` for Messenger-style responsive UI
- `WebRTC` for 1-1 audio/video calling
- `JWT` for REST + websocket authentication
- `Multipart upload` for image/file messages

Requested Socket.IO event model is preserved at the payload level, even though the actual server transport in this repo is Spring WebSocket/STOMP to stay compatible with the existing backend.

### Runtime layers

1. `REST API`
- load conversations
- paginate message history
- upload/send attachments
- edit/recall/delete/reaction actions

2. `Realtime channel`
- receive message updates instantly
- typing indicator
- delivered / seen
- online / offline presence
- WebRTC signaling events

3. `WebRTC peer connection`
- audio/video streams
- ICE exchange
- local/remote media preview

## 2. Suggested folder structure

### Backend

```text
backend/src/main/java/com/roommate
├─ config
│  ├─ WebSocketConfig.java
│  └─ WebSocketPresenceListener.java
├─ controller
│  └─ ChatController.java
├─ model
│  ├─ TinNhan.java
│  └─ CuocGoi.java
├─ repository
│  ├─ TinNhanRepository.java
│  └─ CuocGoiRepository.java
└─ service
   ├─ ChatPresenceService.java
   └─ ChatMediaService.java
```

### Frontend

```text
frontend/src
├─ components/chat
│  ├─ ChatBox.js
│  ├─ ChatBox.css
│  ├─ CallModal.js
│  ├─ CallModal.css
│  └─ FloatingChat.js
├─ pages
│  ├─ TinNhan.js
│  └─ TinNhan.css
└─ services
   ├─ api.js
   └─ chatRealtime.js
```

## 3. MongoDB schema reference

If you later split chat into a dedicated service with MongoDB, use this mapping:

### `users`

```json
{
  "_id": "userId",
  "fullName": "Nguyen Van A",
  "avatar": "/uploads/avatars/a.jpg",
  "online": true,
  "lastActive": "2026-05-08T16:32:11Z"
}
```

### `conversations`

```json
{
  "_id": "conversationId",
  "participantIds": ["userA", "userB"],
  "lastMessageId": "messageId",
  "lastMessageAt": "2026-05-08T16:32:11Z",
  "unreadCount": {
    "userA": 0,
    "userB": 3
  }
}
```

### `messages`

```json
{
  "_id": "messageId",
  "senderId": "userA",
  "conversationId": "userA_userB",
  "type": "TEXT",
  "content": "Xin chao",
  "attachment": {
    "url": "/uploads/chat/uuid.png",
    "name": "image.png",
    "mimeType": "image/png",
    "size": 204800
  },
  "deliveredAt": "2026-05-08T16:32:12Z",
  "seenBy": ["userB"],
  "recalled": false,
  "replyTo": "previousMessageId",
  "reactions": {
    "userB": "❤️"
  },
  "createdAt": "2026-05-08T16:32:11Z",
  "updatedAt": "2026-05-08T16:35:11Z"
}
```

### `calls`

```json
{
  "_id": "callId",
  "callerId": "userA",
  "calleeId": "userB",
  "type": "video",
  "status": "ENDED",
  "startedAt": "2026-05-08T16:40:00Z",
  "endedAt": "2026-05-08T16:52:00Z",
  "durationSec": 720
}
```

## 4. Realtime event contract

### Message events

- `receive_message`
- `delivered_message`
- `seen_message`
- `message_recalled`
- `message_edited`
- `message_reaction`
- `typing`
- `stop_typing`

### Call events

- `incoming_call`
- `accept_call`
- `reject_call`
- `end_call`
- `ice_candidate`

### Suggested extensions

- `offer`
- `answer`
- `conversation_archived`
- `conversation_muted`

## 5. Realtime flow

```text
Sender UI
  -> POST /api/chat/send
  -> backend persists message
  -> backend emits receive_message to both users
Recipient UI
  -> websocket receives receive_message
  -> emits chat.delivered
Backend
  -> updates status DELIVERED
  -> emits delivered_message
Recipient opens chat
  -> emits chat.seen
Backend
  -> updates status SEEN
  -> emits seen_message
```

## 6. Call flow diagram

```text
Caller
  -> getUserMedia
  -> createOffer
  -> incoming_call { offer }
Receiver
  -> incoming popup
  -> accept_call { answer }
Caller
  -> setRemoteDescription(answer)
Both sides
  -> exchange ice_candidate
  -> media connected
Any side
  -> end_call
Backend
  -> persist call status/duration
```

## 7. Performance notes

- paginated history loading for infinite scroll
- lazy-loaded message images
- debounced typing events
- memoized `MessageItem`
- websocket cleanup on unmount
- lightweight in-memory presence tracker

## 8. Security notes

- websocket handshake authenticated by JWT
- upload validation by MIME type + size
- basic anti-spam rate limiting on send
- signaling only forwarded between authenticated participants
- static uploads isolated under `/uploads/chat`

## 9. Production hardening next steps

- move in-memory presence/rate-limit to Redis
- add TURN credentials for restrictive networks
- add virus scanning for uploaded files
- store reactions in a normalized table if analytics are needed
- add push notifications for offline users
- add unread counters with indexed aggregate queries
