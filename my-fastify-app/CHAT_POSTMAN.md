# Chat API — Postman Testing Guide

Base URL: `http://localhost:5000/api/v1`

All protected routes require:

```
Authorization: Bearer <accessToken>
```

Get an `accessToken` by calling `POST /api/v1/auth/login` first.

---

## 1. Start or Get a Conversation

**POST** `/chat/conversations`

Creates a new conversation between you and another user. If one already exists it returns the existing one.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{
  "receiverId": "USER_UUID_HERE"
}
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "conv-uuid",
    "participants": [...],
    "createdAt": "2026-05-10T00:00:00.000Z",
    "updatedAt": "2026-05-10T00:00:00.000Z"
  }
}
```

**Error — missing receiverId `400`**

```json
{ "success": false, "message": "receiverId is required" }
```

**Error — messaging yourself `400`**

```json
{ "success": false, "message": "Cannot start a conversation with yourself" }
```

---

## 2. List My Conversations

**GET** `/chat/conversations`

Returns all conversations the logged-in user participates in, with the last message preview.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Success Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid",
      "participants": [
        {
          "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
        },
        { "user": { "id": "...", "name": "Bob", "email": "bob@example.com" } }
      ],
      "messages": [
        {
          "id": "msg-uuid",
          "content": "Hello!",
          "mediaUrl": null,
          "mediaType": null,
          "isRead": false,
          "createdAt": "2026-05-10T00:00:00.000Z",
          "sender": { "id": "...", "name": "Alice" },
          "receiver": { "id": "...", "name": "Bob" }
        }
      ],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

## 3. Get Messages in a Conversation

**GET** `/chat/conversations/:id?page=1&limit=50`

Returns paginated messages for a conversation. You must be a participant.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Query Params**
| Param | Default | Description |
|-------|---------|-------------|
| page | 1 | Page number |
| limit | 50 | Messages per page |

**Example URL**

```
GET http://localhost:5000/api/v1/chat/conversations/conv-uuid?page=1&limit=20
```

**Success Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid",
      "conversationId": "conv-uuid",
      "senderId": "...",
      "receiverId": "...",
      "content": "Hello!",
      "mediaUrl": null,
      "mediaType": null,
      "isRead": true,
      "createdAt": "2026-05-10T00:00:00.000Z",
      "sender": { "id": "...", "name": "Alice" },
      "receiver": { "id": "...", "name": "Bob" }
    }
  ]
}
```

**Error — not a participant `403`**

```json
{ "success": false, "message": "Access denied" }
```

---

## 4. Send a Message (Text)

**POST** `/chat/conversations/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{
  "content": "Hey, how are you?"
}
```

**Success Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "senderId": "...",
    "receiverId": "...",
    "content": "Hey, how are you?",
    "mediaUrl": null,
    "mediaType": null,
    "isRead": false,
    "createdAt": "2026-05-10T00:00:00.000Z"
  }
}
```

**Error — no content or media `400`**

```json
{ "success": false, "message": "content or media is required" }
```

---

## 5. Send a Message (With Media)

**POST** `/chat/conversations/:id`

Send a file (image, video, document) optionally with a text caption.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | multipart/form-data _(set automatically by Postman)_ |

**Body (form-data)**
| Key | Type | Value |
|-----|------|-------|
| media | File | _(select your file)_ |
| content | Text | _(optional caption)_ |

**Success Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "msg-uuid",
    "content": "Check this out",
    "mediaUrl": "/uploads/1715299200000-photo.jpg",
    "mediaType": "image/jpeg",
    "isRead": false,
    "createdAt": "2026-05-10T00:00:00.000Z"
  }
}
```

> The uploaded file is served at:
> `http://localhost:5000/uploads/<filename>`

---

## 6. Mark Messages as Read

**PUT** `/chat/conversations/:id/read`

Marks all unread messages in the conversation as read for the logged-in user.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Success Response `200`**

```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

## 7. Upload a File (Standalone)

**POST** `/chat/upload`

Upload a file independently and get back its URL and type. Useful for sending the URL in a message later.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | multipart/form-data _(set automatically by Postman)_ |

**Body (form-data)**
| Key | Type | Value |
|-----|------|-------|
| _(any field name)_ | File | _(select your file)_ |

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "mediaUrl": "/uploads/1715299200000-file.png",
    "mediaType": "image/png"
  }
}
```

**Error — no file `400`**

```json
{ "success": false, "message": "No file uploaded" }
```

---

## 8. WebSocket — Real-time Chat

**WebSocket URL:** `ws://localhost:5000/api/v1/chat/ws`

Use **Postman's WebSocket request** tab (New → WebSocket).

### Step 1 — Connect

Open a connection to:

```
ws://localhost:5000/api/v1/chat/ws
```

### Step 2 — Authenticate (first frame, required)

Send this JSON immediately after connecting:

```json
{
  "event": "auth",
  "token": "<accessToken>"
}
```

**Server responds:**

```json
{
  "event": "authenticated",
  "data": { "userId": "your-user-uuid" }
}
```

### Step 3 — Send a Message

```json
{
  "event": "message",
  "data": {
    "conversationId": "conv-uuid",
    "content": "Hello via WebSocket!"
  }
}
```

**Server responds to sender:**

```json
{
  "event": "message",
  "data": {
    "id": "msg-uuid",
    "conversationId": "conv-uuid",
    "senderId": "...",
    "receiverId": "...",
    "content": "Hello via WebSocket!",
    "mediaUrl": null,
    "mediaType": null,
    "isRead": false,
    "createdAt": "2026-05-10T00:00:00.000Z"
  }
}
```

**The receiver also gets the same `message` frame in real-time** if they are connected.

### Error Frames

| Situation             | Frame                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ |
| Invalid JSON sent     | `{ "event": "error", "data": { "message": "Invalid JSON" } }`                        |
| Not authenticated yet | `{ "event": "error", "data": { "message": "Send { event: 'auth', token } first" } }` |
| Bad/expired token     | `{ "event": "error", "data": { "message": "Authentication failed" } }`               |
| Unknown event         | `{ "event": "error", "data": { "message": "Unknown event" } }`                       |

---

## Quick Testing Flow

1. **Login** → `POST /api/v1/auth/login` → copy `accessToken`
2. **Get a target user ID** → `GET /api/v1/users` (admin) or from your DB
3. **Start conversation** → `POST /chat/conversations` with `receiverId`
4. **Copy the conversation `id`** from the response
5. **Send a message** → `POST /chat/conversations/:id` with `{ "content": "Hi!" }`
6. **Read messages** → `GET /chat/conversations/:id`
7. **Mark as read** → `PUT /chat/conversations/:id/read`
8. **Test WebSocket** → connect, authenticate, send message frame
