# Postman Testing Guide

Base URL: `http://localhost:5000`

---

## 1. Auth — Register

**POST** `http://localhost:5000/api/v1/auth/register`

Headers:

```
Content-Type: application/json
```

Body (raw JSON):

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Alice"
}
```

Expected response `201`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "id": "...", "email": "user@example.com", "role": "USER" }
}
```

---

## 2. Auth — Register Admin

**POST** `http://localhost:5000/api/v1/auth/register`

Body:

```json
{
  "email": "admin@example.com",
  "password": "admin1234",
  "name": "Admin"
}
```

> After registering, go to **Prisma Studio** or run SQL to set the role to `ADMIN`:
>
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
> ```

---

## 3. Auth — Login (User)

**POST** `http://localhost:5000/api/v1/auth/login`

Headers:

```
Content-Type: application/json
```

Body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

Expected response `200`:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "user@example.com", "role": "USER" },
    "accessToken": "<save_this>",
    "refreshToken": "<save_this>"
  }
}
```

> Save `accessToken` and `refreshToken` — you need them for protected routes.

---

## 4. Auth — Login (Admin)

**POST** `http://localhost:5000/api/v1/auth/login`

Body:

```json
{
  "email": "admin@example.com",
  "password": "admin1234"
}
```

> Save the admin `accessToken` and `refreshToken` separately.

---

## 5. Auth — Get My Profile

**GET** `http://localhost:5000/api/v1/auth/me`

Headers:

```
Authorization: Bearer <user_accessToken>
```

---

## 6. Auth — Refresh Access Token

**POST** `http://localhost:5000/api/v1/auth/refresh`

Headers:

```
Content-Type: application/json
```

Body:

```json
{
  "refreshToken": "<your_refreshToken>"
}
```

---

## 7. Auth — Logout

**POST** `http://localhost:5000/api/v1/auth/logout`

Body:

```json
{
  "refreshToken": "<your_refreshToken>"
}
```

---

## 8. Auth — Logout All Devices

**POST** `http://localhost:5000/api/v1/auth/logout-all`

Headers:

```
Authorization: Bearer <accessToken>
```

---

## 9. User Management (Admin only)

### List all users

**GET** `http://localhost:5000/api/v1/users?page=1&limit=10`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

### Get user by ID

**GET** `http://localhost:5000/api/v1/users/<userId>`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

### Update user

**PUT** `http://localhost:5000/api/v1/users/<userId>`

Headers:

```
Authorization: Bearer <admin_accessToken>
Content-Type: application/json
```

Body:

```json
{
  "name": "Updated Name"
}
```

---

### Delete user

**DELETE** `http://localhost:5000/api/v1/users/<userId>`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

## 10. Chat — Get/Create My Room (User)

**GET** `http://localhost:5000/api/v1/chat/room`

Headers:

```
Authorization: Bearer <user_accessToken>
```

Expected response:

```json
{
  "success": true,
  "data": { "id": "<roomId>", "userId": "...", "status": "OPEN" }
}
```

> Save the `roomId` — admin needs it to connect via WebSocket.

---

## 11. Chat — Get My Messages (User)

**GET** `http://localhost:5000/api/v1/chat/room/messages?page=1&limit=50`

Headers:

```
Authorization: Bearer <user_accessToken>
```

---

## 12. Chat — Get All Rooms (Admin)

**GET** `http://localhost:5000/api/v1/chat/rooms`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

## 13. Chat — Get Room Messages (Admin)

**GET** `http://localhost:5000/api/v1/chat/rooms/<roomId>/messages`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

## 14. Chat — Close Room (Admin)

**POST** `http://localhost:5000/api/v1/chat/rooms/<roomId>/close`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

## 15. Chat — Reopen Room (Admin)

**POST** `http://localhost:5000/api/v1/chat/rooms/<roomId>/reopen`

Headers:

```
Authorization: Bearer <admin_accessToken>
```

---

## 16. Live Chat — WebSocket (User)

In Postman, go to **New → WebSocket Request**

URL:

```
ws://localhost:5000/api/v1/chat/ws
```

**Step 1 — Authenticate (send this first after connecting):**

```json
{
  "event": "auth",
  "token": "<user_accessToken>"
}
```

Server replies:

```json
{ "event": "authenticated", "data": { "roomId": "..." } }
{ "event": "history", "data": [ ...messages ] }
```

**Step 2 — Send a message:**

```json
{
  "event": "message",
  "data": { "content": "Hello, I need help!" }
}
```

**Step 3 — Mark messages as read:**

```json
{ "event": "mark_read" }
```

---

## 17. Live Chat — WebSocket (Admin)

In Postman, go to **New → WebSocket Request**

URL:

```
ws://localhost:5000/api/v1/chat/admin/ws/<roomId>
```

> Replace `<roomId>` with the room ID from step 10.

**Step 1 — Authenticate:**

```json
{
  "event": "auth",
  "token": "<admin_accessToken>"
}
```

**Step 2 — Reply to user:**

```json
{
  "event": "message",
  "data": { "content": "Hi! How can I help you?" }
}
```

---

## WebSocket Events Reference

### Client → Server

| Event       | Payload                            | Description                    |
| ----------- | ---------------------------------- | ------------------------------ |
| `auth`      | `{ "token": "..." }`               | Must be first message sent     |
| `message`   | `{ "data": { "content": "..." } }` | Send a chat message            |
| `mark_read` | none                               | Mark incoming messages as read |

### Server → Client

| Event           | Description                            |
| --------------- | -------------------------------------- |
| `authenticated` | Connection accepted, includes `roomId` |
| `history`       | Last 50 messages sent on connect       |
| `message`       | New message broadcast to both sides    |
| `messages_read` | Read receipt                           |
| `user_online`   | User connected                         |
| `user_offline`  | User disconnected                      |
| `room_closed`   | Admin closed the room                  |
| `room_opened`   | Admin reopened the room                |
| `error`         | Something went wrong                   |

---

## Health Check

**GET** `http://localhost:5000/health`

```json
{ "status": "ok", "timestamp": "...", "uptime": 42.3 }
```
