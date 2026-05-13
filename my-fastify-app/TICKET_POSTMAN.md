# Ticket System — Postman Testing Guide

Base URL: `http://localhost:5000/api/v1`

- **User routes** → `Authorization: Bearer <userAccessToken>`
- **Admin routes** → `Authorization: Bearer <adminAccessToken>`

Priority values: `LOW` | `MEDIUM` | `HIGH` | `URGENT`  
Status values: `OPEN` | `IN_PROGRESS` | `RESOLVED` | `CLOSED`

---

## USER ROUTES

### 1. Create a Ticket

**POST** `/tickets`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<userAccessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{
  "subject": "Cannot login to my account",
  "description": "I get an error saying invalid credentials even though I reset my password.",
  "priority": "HIGH"
}
```

> `priority` is optional — defaults to `MEDIUM`

**Success Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "userId": "user-uuid",
    "subject": "Cannot login to my account",
    "description": "I get an error saying invalid credentials even though I reset my password.",
    "priority": "HIGH",
    "status": "OPEN",
    "replies": [],
    "createdAt": "2026-05-10T00:00:00.000Z",
    "updatedAt": "2026-05-10T00:00:00.000Z",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
  }
}
```

**Error — missing fields `400`**

```json
{ "success": false, "message": "subject and description are required" }
```

---

### 2. List My Tickets

**GET** `/tickets/my`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<userAccessToken>` |

**Query Params (all optional)**
| Param | Example | Description |
|-------|---------|-------------|
| status | `OPEN` | Filter by status |
| page | `1` | Page number |
| limit | `20` | Items per page |

**Example URL**

```
GET http://localhost:5000/api/v1/tickets/my?status=OPEN&page=1&limit=10
```

**Success Response `200`**

```json
{
  "success": true,
  "total": 3,
  "tickets": [
    {
      "id": "ticket-uuid",
      "subject": "Cannot login",
      "priority": "HIGH",
      "status": "OPEN",
      "replies": [],
      "createdAt": "..."
    }
  ]
}
```

---

### 3. Get My Single Ticket

**GET** `/tickets/my/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<userAccessToken>` |

**Example URL**

```
GET http://localhost:5000/api/v1/tickets/my/ticket-uuid
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "subject": "Cannot login",
    "description": "...",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "replies": [
      {
        "id": "reply-uuid",
        "userId": "admin-uuid",
        "userName": "Admin",
        "role": "ADMIN",
        "message": "We are looking into this for you.",
        "createdAt": "2026-05-10T01:00:00.000Z"
      }
    ],
    "createdAt": "...",
    "updatedAt": "...",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
  }
}
```

**Error — not your ticket `403`**

```json
{ "success": false, "message": "Access denied" }
```

---

### 4. Reply to a Ticket (User)

**POST** `/tickets/:id/reply`

Users can only reply to their own tickets. Admins can reply to any ticket.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<userAccessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{
  "message": "I just tried again and still getting the same error."
}
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "replies": [
      {
        "id": "reply-uuid",
        "userId": "user-uuid",
        "userName": "Alice",
        "role": "USER",
        "message": "I just tried again and still getting the same error.",
        "createdAt": "2026-05-10T02:00:00.000Z"
      }
    ]
  }
}
```

---

## ADMIN ROUTES

> All admin routes require a token with `role: "ADMIN"`.

---

### 5. List All Tickets

**GET** `/tickets`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Query Params (all optional)**
| Param | Example | Description |
|-------|---------|-------------|
| status | `OPEN` | Filter by status |
| priority | `HIGH` | Filter by priority |
| page | `1` | Page number |
| limit | `20` | Items per page |

**Example URLs**

```
GET http://localhost:5000/api/v1/tickets
GET http://localhost:5000/api/v1/tickets?status=OPEN
GET http://localhost:5000/api/v1/tickets?status=IN_PROGRESS&priority=URGENT
GET http://localhost:5000/api/v1/tickets?page=2&limit=10
```

**Success Response `200`**

```json
{
  "success": true,
  "total": 12,
  "tickets": [
    {
      "id": "ticket-uuid",
      "subject": "Cannot login",
      "priority": "HIGH",
      "status": "OPEN",
      "replies": [],
      "createdAt": "...",
      "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
    }
  ]
}
```

---

### 6. Get Any Ticket by ID

**GET** `/tickets/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Example URL**

```
GET http://localhost:5000/api/v1/tickets/ticket-uuid
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "subject": "Cannot login",
    "description": "I get an error ...",
    "priority": "HIGH",
    "status": "OPEN",
    "replies": [],
    "createdAt": "...",
    "updatedAt": "...",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
  }
}
```

---

### 7. Reply to Any Ticket (Admin) — with optional Status Change

**POST** `/tickets/:id/reply`

With an admin token, you can reply to **any** ticket and **optionally change its status** in the same request.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |
| Content-Type | application/json |

**Body (raw JSON) — reply only**

```json
{
  "message": "We have identified the issue and will fix it within 24 hours."
}
```

**Body (raw JSON) — reply + change status**

```json
{
  "message": "We have identified the issue and will fix it within 24 hours.",
  "status": "IN_PROGRESS"
}
```

**All valid status values:**

- `OPEN` — ticket just submitted
- `IN_PROGRESS` — admin is working on it
- `RESOLVED` — issue has been fixed
- `CLOSED` — ticket closed

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid",
    "status": "IN_PROGRESS",
    "replies": [
      {
        "id": "reply-uuid",
        "userId": "admin-uuid",
        "userName": "Admin",
        "role": "ADMIN",
        "message": "We have identified the issue and will fix it within 24 hours.",
        "createdAt": "2026-05-10T04:00:00.000Z"
      }
    ],
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
  }
}
```

**Error — invalid status `400`**

```json
{
  "success": false,
  "message": "Invalid status. Must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED"
}
```

**Error — non-admin tries to set status `403`**

```json
{ "success": false, "message": "Only admins can change ticket status" }
```

---

### 8. Delete a Ticket

**DELETE** `/tickets/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Example URL**

```
DELETE http://localhost:5000/api/v1/tickets/ticket-uuid
```

**Success Response `200`**

```json
{
  "success": true,
  "message": "Ticket deleted"
}
```

---

## Quick Testing Flow

### As a User:

1. Login → `POST /api/v1/auth/login` → copy `accessToken`
2. Create ticket → `POST /api/v1/tickets` with subject, description, priority
3. Copy the ticket `id` from response
4. View your tickets → `GET /api/v1/tickets/my`
5. View single ticket → `GET /api/v1/tickets/my/:id`
6. Add a reply → `POST /api/v1/tickets/:id/reply`

### As an Admin:

1. Login with admin account → copy `accessToken`
2. View all tickets → `GET /api/v1/tickets`
3. Filter urgent open tickets → `GET /api/v1/tickets?status=OPEN&priority=URGENT`
4. View ticket detail → `GET /api/v1/tickets/:id`
5. Reply + set status to IN_PROGRESS → `POST /api/v1/tickets/:id/reply` with `{ "message": "...", "status": "IN_PROGRESS" }`
6. Close ticket → `POST /api/v1/tickets/:id/reply` with `{ "message": "Resolved!", "status": "CLOSED" }`
