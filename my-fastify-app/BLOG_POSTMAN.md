# Blog System — Postman Testing Guide

Base URL: `http://localhost:5000/api/v1/blog`

**Categories (enum):** `TECHNOLOGY` | `HEALTH` | `EDUCATION` | `BUSINESS` | `LIFESTYLE` | `TRAVEL` | `FOOD` | `SPORTS` | `ENTERTAINMENT` | `OTHER`

**Post Status:** `PENDING` | `APPROVED` | `REJECTED`

---

## PUBLIC ROUTES (No login required)

### 1. List Approved Posts

**GET** `/blog/posts`

Anyone can see the list of approved posts without logging in.

**Query Params (all optional)**
| Param | Example | Description |
|-------|---------|-------------|
| category | `TECHNOLOGY` | Filter by category |
| page | `1` | Page number |
| limit | `10` | Items per page |

**Example URLs**

```
GET http://localhost:5000/api/v1/blog/posts
GET http://localhost:5000/api/v1/blog/posts?category=TECHNOLOGY
GET http://localhost:5000/api/v1/blog/posts?page=2&limit=5
```

**Success Response `200`**

```json
{
  "success": true,
  "total": 8,
  "posts": [
    {
      "id": "post-uuid",
      "title": "My First Blog Post",
      "slug": "my-first-blog-post",
      "category": "TECHNOLOGY",
      "imageUrl": "/uploads/abc.jpg",
      "createdAt": "2026-05-10T00:00:00.000Z",
      "user": { "id": "user-uuid", "name": "Alice" },
      "_count": { "comments": 3 }
    }
  ]
}
```

---

## USER ROUTES (Login required)

### 2. Get Post Detail

**GET** `/blog/posts/:slug`

Login required to see full post content and comments.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Example URL**

```
GET http://localhost:5000/api/v1/blog/posts/my-first-blog-post
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "content": "Full post content here...",
    "category": "TECHNOLOGY",
    "imageUrl": "/uploads/abc.jpg",
    "pdfUrl": "/uploads/doc.pdf",
    "videoLink": "https://youtube.com/watch?v=...",
    "status": "APPROVED",
    "createdAt": "...",
    "updatedAt": "...",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" },
    "comments": [
      {
        "id": "comment-uuid",
        "content": "Great post!",
        "createdAt": "...",
        "user": { "id": "...", "name": "Bob" }
      }
    ]
  }
}
```

---

### 3. Create a Blog Post

**POST** `/blog/posts`

Uses **multipart/form-data**. Image and PDF are optional file uploads. videoLink is a text field.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | multipart/form-data _(set automatically by Postman)_ |

**Body (form-data)**
| Key | Type | Required | Description |
|-----|------|----------|-------------|
| title | Text | ✅ | Post title |
| content | Text | ✅ | Full post content |
| category | Text | ❌ | One of the valid categories (default: `OTHER`) |
| videoLink | Text | ❌ | YouTube or any video URL |
| image | File | ❌ | Cover image (jpg, png, etc.) |
| pdf | File | ❌ | Attached PDF document |

**Success Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "My First Blog Post",
    "slug": "my-first-blog-post",
    "content": "Full content...",
    "category": "TECHNOLOGY",
    "imageUrl": "/uploads/uuid.jpg",
    "pdfUrl": null,
    "videoLink": "https://youtube.com/watch?v=xyz",
    "status": "PENDING",
    "createdAt": "...",
    "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
  }
}
```

> Post starts with `PENDING` status — admin must approve before it's publicly visible.

---

### 4. List My Posts

**GET** `/blog/posts/my`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Query Params (optional)**
| Param | Default |
|-------|---------|
| page | 1 |
| limit | 10 |

**Success Response `200`**

```json
{
  "success": true,
  "total": 2,
  "posts": [
    {
      "id": "post-uuid",
      "title": "My First Blog Post",
      "slug": "my-first-blog-post",
      "status": "PENDING",
      "category": "TECHNOLOGY",
      "createdAt": "..."
    }
  ]
}
```

---

### 5. Edit a Post

**PUT** `/blog/posts/:id`

Uses **multipart/form-data**. Only include fields you want to change. Editing resets status back to `PENDING` for re-approval.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | multipart/form-data |

**Body (form-data) — only include what you want to update**
| Key | Type | Description |
|-----|------|-------------|
| title | Text | New title (also regenerates slug) |
| content | Text | New content |
| category | Text | New category |
| videoLink | Text | New or updated video URL |
| image | File | Replace cover image |
| pdf | File | Replace PDF |

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "post-uuid",
    "title": "Updated Title",
    "status": "PENDING",
    "updatedAt": "..."
  }
}
```

**Error — not your post `403`**

```json
{ "success": false, "message": "Access denied" }
```

---

### 6. Delete My Post

**DELETE** `/blog/posts/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Success Response `200`**

```json
{ "success": true, "message": "Post deleted" }
```

---

### 7. Add a Comment

**POST** `/blog/posts/:id/comments`

Only works on `APPROVED` posts.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{ "content": "This is a great post!" }
```

**Success Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "content": "This is a great post!",
    "createdAt": "...",
    "user": { "id": "...", "name": "Bob" }
  }
}
```

---

### 8. Edit a Comment

**PUT** `/blog/posts/:id/comments/:commentId`

Users can only edit their own comments.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |
| Content-Type | application/json |

**Body (raw JSON)**

```json
{ "content": "Updated comment text." }
```

**Success Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "comment-uuid",
    "content": "Updated comment text.",
    "updatedAt": "..."
  }
}
```

---

### 9. Delete a Comment

**DELETE** `/blog/posts/:id/comments/:commentId`

Users can delete their own comments. Admins can delete any.

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<accessToken>` |

**Success Response `200`**

```json
{ "success": true, "message": "Comment deleted" }
```

---

## ADMIN ROUTES

> All admin routes require `role: "ADMIN"` token.

---

### 10. List All Posts (Any Status)

**GET** `/blog/admin/posts`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Query Params (all optional)**
| Param | Example | Description |
|-------|---------|-------------|
| status | `PENDING` | Filter by status |
| category | `HEALTH` | Filter by category |
| page | `1` | Page number |
| limit | `10` | Items per page |

**Example URLs**

```
GET http://localhost:5000/api/v1/blog/admin/posts?status=PENDING
GET http://localhost:5000/api/v1/blog/admin/posts?status=APPROVED&category=TECHNOLOGY
```

**Success Response `200`**

```json
{
  "success": true,
  "total": 5,
  "posts": [
    {
      "id": "post-uuid",
      "title": "Pending Post",
      "status": "PENDING",
      "category": "EDUCATION",
      "createdAt": "...",
      "user": { "id": "...", "name": "Alice", "email": "alice@example.com" }
    }
  ]
}
```

---

### 11. Approve a Post

{{baseUrl}}/api/v1/blog/admin/posts/{{blogId}}/status

{
"status": "APPROVED"
}

// { "status": "REJECTED" }

````

---

### 13. Delete Any Post (Admin)

**DELETE** `/blog/admin/posts/:id`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Success Response `200`**

```json
{ "success": true, "message": "Post deleted" }
````

---

### 14. Delete Any Comment (Admin)

**DELETE** `/blog/admin/posts/:id/comments/:commentId`

**Headers**
| Key | Value |
|-----|-------|
| Authorization | Bearer `<adminAccessToken>` |

**Success Response `200`**

```json
{ "success": true, "message": "Comment deleted" }
```

---

## Quick Testing Flow

### As a User:

1. Login → `POST /api/v1/auth/login` → copy `accessToken`
2. Create a post → `POST /api/v1/blog/posts` (multipart with title, content, category, optional image/pdf/videoLink)
3. Copy the post `id` from response
4. List your posts → `GET /api/v1/blog/posts/my`
5. Wait for admin approval (or use admin account below)
6. Once approved — browse public list → `GET /api/v1/blog/posts`
7. View post detail → `GET /api/v1/blog/posts/<slug>`
8. Add a comment → `POST /api/v1/blog/posts/<postId>/comments`
9. Edit the comment → `PUT /api/v1/blog/posts/<postId>/comments/<commentId>`

### As an Admin:

1. Login with admin account → copy `accessToken`
2. List pending posts → `GET /api/v1/blog/admin/posts?status=PENDING`
3. Copy a post `id`
4. Approve it → `PATCH /api/v1/blog/admin/posts/<id>/approve`
5. Or reject it → `PATCH /api/v1/blog/admin/posts/<id>/reject`
6. Delete any comment → `DELETE /api/v1/blog/admin/posts/<postId>/comments/<commentId>`

---

## How the Slug Works

When you create a post with `title: "Hello World"`, the slug becomes `hello-world`.  
If that slug already exists, it auto-increments: `hello-world-1`, `hello-world-2`, etc.  
The slug is used to fetch post detail: `GET /blog/posts/hello-world`
