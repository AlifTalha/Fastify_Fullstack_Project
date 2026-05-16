# Product Feedback API — Testing Guide

Base URL: `http://localhost:5000/shop`

---

## Prerequisites

### 1. Login as Regular User (get token)

**POST** `http://localhost:5000/auth/login`

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

Save `accessToken` from the response → use as `Bearer <token>` in `Authorization` header.

### 2. Login as Admin (get admin token)

**POST** `http://localhost:5000/auth/login`

```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```

Save `accessToken` → use as admin `Bearer <token>`.

---

## Routes

### 1. Get Product Feedback (Public)

Fetch all reviews + stats for a product. **No auth required.**

**GET** `http://localhost:5000/shop/catalog/:productId/feedback`

**Example:**

```
GET http://localhost:5000/shop/catalog/PRODUCT_ID_HERE/feedback
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "id": "uuid",
        "productId": "uuid",
        "userId": "uuid",
        "rating": 4,
        "comment": "Great product!",
        "createdAt": "2026-05-16T10:00:00.000Z",
        "user": {
          "id": "uuid",
          "name": "John Doe",
          "email": "user@example.com"
        }
      }
    ],
    "stats": {
      "average": "4.00",
      "count": 1,
      "distribution": {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 1,
        "5": 0
      }
    }
  }
}
```

---

### 2. Submit Feedback (Authenticated User)

Submit a star rating + comment for a product. Each user can only submit **once per product**.

**POST** `http://localhost:5000/shop/catalog/:productId/feedback`

**Headers:**

```
Authorization: Bearer <user_accessToken>
Content-Type: application/json
```

**Body:**

```json
{
  "rating": 5,
  "comment": "Absolutely love this product! Fast shipping too."
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "userId": "uuid",
    "rating": 5,
    "comment": "Absolutely love this product! Fast shipping too.",
    "createdAt": "2026-05-16T10:00:00.000Z",
    "updatedAt": "2026-05-16T10:00:00.000Z"
  }
}
```

**Error — rating out of range (400):**

```json
{
  "success": false,
  "message": "Rating must be between 1 and 5"
}
```

**Error — missing comment (400):**

```json
{
  "success": false,
  "message": "Comment is required"
}
```

**Error — already reviewed (409):**

```json
{
  "success": false,
  "message": "You have already submitted feedback for this product"
}
```

**Error — not logged in (401):**

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

---

### 3. Delete Feedback (Admin Only)

Delete any review by its feedback ID.

**DELETE** `http://localhost:5000/shop/feedback/:feedbackId`

**Headers:**

```
Authorization: Bearer <admin_accessToken>
```

**Example:**

```
DELETE http://localhost:5000/shop/feedback/FEEDBACK_ID_HERE
```

**Expected Response (200):**

```json
{
  "success": true,
  "message": "Feedback deleted"
}
```

**Error — not admin (403):**

```json
{
  "success": false,
  "message": "Forbidden"
}
```

---

### 4. Get All Feedback — Admin (Paginated)

List all reviews across all products. Supports pagination.

**GET** `http://localhost:5000/shop/admin/feedback`

**Headers:**

```
Authorization: Bearer <admin_accessToken>
```

**Query Parameters:**

| Param   | Type    | Default | Max | Description    |
| ------- | ------- | ------- | --- | -------------- |
| `page`  | integer | 1       | —   | Page number    |
| `limit` | integer | 20      | 100 | Items per page |

**Examples:**

```
GET http://localhost:5000/shop/admin/feedback
GET http://localhost:5000/shop/admin/feedback?page=1&limit=10
GET http://localhost:5000/shop/admin/feedback?page=2&limit=5
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "productId": "uuid",
      "userId": "uuid",
      "rating": 5,
      "comment": "Great!",
      "createdAt": "2026-05-16T10:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "user@example.com"
      },
      "product": {
        "id": "uuid",
        "name": "iPhone 15 Pro"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Full Test Flow (Step by Step)

1. **Get a product ID** — `GET http://localhost:5000/shop/catalog` → copy any `id`
2. **Check feedback (empty)** — `GET /shop/catalog/:id/feedback` → should return empty `feedbacks[]`
3. **Login as user** — `POST /auth/login` → save `accessToken`
4. **Submit feedback** — `POST /shop/catalog/:id/feedback` with rating + comment
5. **Try duplicate** — same POST again → expect `409` conflict
6. **Check feedback (populated)** — `GET /shop/catalog/:id/feedback` → should show the review + stats
7. **Login as admin** — `POST /auth/login` with admin credentials → save token
8. **List all feedback** — `GET /shop/admin/feedback` → see all reviews
9. **Delete feedback** — `DELETE /shop/feedback/:feedbackId` using the `id` from step 6
10. **Verify deleted** — `GET /shop/catalog/:id/feedback` → should return empty again
