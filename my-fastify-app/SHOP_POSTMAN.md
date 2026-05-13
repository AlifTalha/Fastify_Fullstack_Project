# Shop & Payment System – Postman Testing Guide

Base URL: `http://localhost:5000`  
All shop endpoints are prefixed: `/api/v1/shop`

---

## Endpoints Overview

| Method | Endpoint                                   | Access | Description                                    |
| ------ | ------------------------------------------ | ------ | ---------------------------------------------- |
| GET    | `/api/v1/shop/catalog`                     | Public | List active products                           |
| GET    | `/api/v1/shop/catalog/:id`                 | Public | Get single product                             |
| POST   | `/api/v1/shop/products`                    | Admin  | Create product                                 |
| GET    | `/api/v1/shop/products`                    | Admin  | List all products (incl. inactive)             |
| GET    | `/api/v1/shop/products/:id`                | Admin  | Get product by ID                              |
| PUT    | `/api/v1/shop/products/:id`                | Admin  | Update product                                 |
| DELETE | `/api/v1/shop/products/:id`                | Admin  | Delete product                                 |
| PATCH  | `/api/v1/shop/products/:id/restock`        | Admin  | Add stock to product                           |
| POST   | `/api/v1/shop/orders`                      | User   | Place order (returns clientSecret)             |
| POST   | `/api/v1/shop/orders/:id/pay`              | User   | Confirm payment — **test only** (pm_card_visa) |
| POST   | `/api/v1/shop/orders/:id/checkout-session` | User   | Get Stripe-hosted payment URL                  |
| POST   | `/api/v1/shop/orders/:id/verify`           | User   | Verify payment status from Stripe              |
| GET    | `/api/v1/shop/orders/my`                   | User   | My order history                               |
| GET    | `/api/v1/shop/orders/my/:id`               | User   | My order detail / invoice                      |
| GET    | `/api/v1/shop/admin/orders`                | Admin  | All orders                                     |
| GET    | `/api/v1/shop/admin/orders/stats`          | Admin  | Sales statistics                               |
| GET    | `/api/v1/shop/admin/orders/:id`            | Admin  | Single order detail                            |

---

## Authentication

All user and admin routes require a JWT Bearer token:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/v1/login`.

---

## 1. Public — Product Catalog

### 1.1 List Active Products

```
GET /api/v1/shop/catalog
```

Query params:

| Param | Default | Description              |
| ----- | ------- | ------------------------ |
| page  | 1       | Page number              |
| limit | 20      | Items per page (max 100) |

**Response 200:**

```json
{
  "success": true,
  "total": 3,
  "products": [
    {
      "id": "uuid",
      "name": "Premium Plan",
      "description": "Access to all features",
      "price": 2999,
      "currency": "usd",
      "imageUrl": "/uploads/products/abc.jpg",
      "stock": 50,
      "isActive": true,
      "createdAt": "2026-05-11T10:00:00.000Z",
      "updatedAt": "2026-05-11T10:00:00.000Z"
    }
  ]
}
```

> `price` is always in **cents** — e.g. `2999` = $29.99.

---

### 1.2 Get Single Product

```
GET /api/v1/shop/catalog/:id
```

**Response 200:**

```json
{
  "success": true,
  "product": { "id": "uuid", "name": "Premium Plan", "price": 2999, ... }
}
```

---

## 2. Admin — Product Management

> All routes in this section require an admin JWT.

### 2.1 Create Product

```
POST /api/v1/shop/products
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>
```

In Postman: **Body → form-data**

| Field       | Type | Required | Description                                                         |
| ----------- | ---- | -------- | ------------------------------------------------------------------- |
| name        | text | ✅       | Product name                                                        |
| description | text | ✅       | Product description                                                 |
| price       | text | ✅       | Price in cents (e.g. `2999` = $29.99)                               |
| currency    | text | ❌       | Default: `usd`                                                      |
| stock       | text | ❌       | Initial stock quantity                                              |
| image       | file | ❌       | Product image (jpg/png/webp). Set field type to **File** in Postman |

**Response 201:**

```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "Premium Plan",
    "description": "Access to all features",
    "price": 2999,
    "currency": "usd",
    "imageUrl": "/uploads/products/abc.jpg",
    "stock": 100,
    "isActive": true,
    "createdAt": "2026-05-11T10:00:00.000Z",
    "updatedAt": "2026-05-11T10:00:00.000Z"
  }
}
```

---

### 2.2 List All Products (including inactive)

```
GET /api/v1/shop/products?page=1&limit=20
Authorization: Bearer <admin-token>
```

**Response 200:**

```json
{
  "success": true,
  "total": 5,
  "products": [ ... ]
}
```

---

### 2.3 Get Product by ID

```
GET /api/v1/shop/products/:id
Authorization: Bearer <admin-token>
```

---

### 2.4 Update Product

```
PUT /api/v1/shop/products/:id
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>
```

Send only the fields you want to change.

| Field    | Notes                                            |
| -------- | ------------------------------------------------ |
| isActive | Send `false` (as text) to deactivate the product |
| price    | Must be a positive integer in cents              |
| image    | Replaces existing image                          |

**Response 200:**

```json
{
  "success": true,
  "product": { ... }
}
```

---

### 2.5 Delete Product

```
DELETE /api/v1/shop/products/:id
Authorization: Bearer <admin-token>
```

**Response 200:**

```json
{
  "success": true,
  "message": "Product deleted"
}
```

---

### 2.6 Restock Product

```
PATCH /api/v1/shop/products/:id/restock
Content-Type: application/json
Authorization: Bearer <admin-token>
```

**Body:**

```json
{
  "quantity": 50
}
```

> Adds the given quantity to the **current** stock. E.g. if stock is 10 and you send `50`, stock becomes `60`.

**Response 200:**

```json
{
  "success": true,
  "product": {
    "id": "uuid",
    "name": "iphone16",
    "stock": 60,
    "isActive": true,
    ...
  }
}
```

---

## 3. User — Place an Order & Pay

### Payment Flow

```
POST /orders  →  Order created (PENDING) + PaymentIntent
      |
      ├── [Postman / dev]  POST /orders/:id/pay
      |                    Confirms with pm_card_visa → PAID
      |
      └── [Production]     POST /orders/:id/checkout-session
                           Returns checkoutUrl (Stripe-hosted page)
                           User opens URL in browser and pays
                           Then: POST /orders/:id/verify?sessionId=xxx → PAID
```

---

### 3.1 Create Order

```
POST /api/v1/shop/orders
Content-Type: application/json
Authorization: Bearer <user-token>
```

**Body:**

```json
{
  "productId": "product-uuid",
  "quantity": 1
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Order created. Use clientSecret to confirm payment with Stripe.js or POST /orders/:id/pay for testing.",
  "order": {
    "id": "order-uuid",
    "invoiceNumber": "INV-20260511-123456",
    "status": "PENDING",
    "amount": 2999,
    "amountFormatted": "29.99 USD",
    "quantity": 1,
    "product": { "id": "...", "name": "Premium Plan", "price": 2999 },
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com" },
    "createdAt": "2026-05-11T10:00:00.000Z"
  },
  "clientSecret": "pi_3xxx_secret_xxx"
}
```

> Save `order.id` and `clientSecret` for the next steps.

---

### 3.2 Confirm Payment — Test Only

> **Development / Postman only.** Uses Stripe's built-in test card `pm_card_visa`.  
> Do **not** use this endpoint in production.

```
POST /api/v1/shop/orders/:id/pay
Authorization: Bearer <user-token>
```

No request body needed.

**Response 200:**

```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "order": {
    "id": "order-uuid",
    "status": "PAID",
    "invoiceNumber": "INV-20260511-123456",
    "amountFormatted": "29.99 USD",
    ...
  }
}
```

Stock is decremented automatically on success.

---

### 3.3 Get Stripe-Hosted Payment URL — Production

> This creates a **Stripe Checkout Session** — a Stripe-hosted payment page.  
> The user opens the returned URL in a browser, enters their card, and pays.  
> No webhook needed. Call `/verify` afterward to sync the order status.

```
POST /api/v1/shop/orders/:id/checkout-session
Content-Type: application/json
Authorization: Bearer <user-token>
```

**Body (optional):**

```json
{
  "successUrl": "https://yourapp.com/payment/success",
  "cancelUrl": "https://yourapp.com/payment/cancel"
}
```

If `successUrl`/`cancelUrl` are omitted, defaults from `.env` (`STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`) are used.

**Response 200:**

```json
{
  "success": true,
  "message": "Open checkoutUrl in a browser to complete payment...",
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxx",
  "sessionId": "cs_test_xxx"
}
```

> Copy both `checkoutUrl` and `sessionId`. Open `checkoutUrl` in a browser, complete payment with Stripe test card `4242 4242 4242 4242`, then call `/verify` with the `sessionId`.

---

### 3.4 Verify Payment — Production

> Call this after the user pays via Stripe Checkout.  
> Pass the `sessionId` from step 3.3 as a query param.  
> No webhook required.

```
POST /api/v1/shop/orders/:id/verify?sessionId=cs_test_xxx
Authorization: Bearer <user-token>
```

No request body needed.

**Response 200 (payment succeeded):**

```json
{
  "success": true,
  "order": {
    "id": "order-uuid",
    "status": "PAID",
    "invoiceNumber": "INV-20260511-123456",
    "amountFormatted": "29.99 USD"
  }
}
```

**Response 200 (payment not yet complete):**

```json
{
  "success": true,
  "order": {
    "status": "PENDING",
    "stripeStatus": "unpaid"
  }
}
```

---

## 4. User — Payment History & Invoice

### 4.1 My Orders

```
GET /api/v1/shop/orders/my?page=1&limit=20
Authorization: Bearer <user-token>
```

**Response 200:**

```json
{
  "success": true,
  "total": 3,
  "orders": [
    {
      "id": "order-uuid",
      "invoiceNumber": "INV-20260511-123456",
      "status": "PAID",
      "amount": 2999,
      "amountFormatted": "29.99 USD",
      "quantity": 1,
      "product": { "name": "Premium Plan", ... },
      "createdAt": "2026-05-11T10:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Order Detail / Invoice

```
GET /api/v1/shop/orders/my/:id
Authorization: Bearer <user-token>
```

**Response 200:**

```json
{
  "success": true,
  "invoice": {
    "id": "order-uuid",
    "invoiceNumber": "INV-20260511-123456",
    "status": "PAID",
    "amount": 2999,
    "amountFormatted": "29.99 USD",
    "currency": "usd",
    "quantity": 1,
    "stripePaymentIntentId": "pi_3xxx",
    "createdAt": "2026-05-11T10:00:00.000Z",
    "product": {
      "id": "...",
      "name": "Premium Plan",
      "description": "Access to all features",
      "price": 2999,
      "currency": "usd",
      "imageUrl": "/uploads/products/abc.jpg"
    },
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

## 5. Admin — Orders & Statistics

> All routes in this section require an admin JWT.

### 5.1 All Orders

```
GET /api/v1/shop/admin/orders
Authorization: Bearer <admin-token>
```

Query params:

| Param  | Description                                     |
| ------ | ----------------------------------------------- |
| status | Filter: `PENDING`, `PAID`, `FAILED`, `REFUNDED` |
| page   | Page number (default 1)                         |
| limit  | Items per page (default 20, max 100)            |

---

### 5.2 Sales Statistics

```
GET /api/v1/shop/admin/orders/stats
Authorization: Bearer <admin-token>
```

**Response 200:**

```json
{
  "success": true,
  "stats": {
    "totalOrders": 42,
    "paidOrders": 35,
    "pendingOrders": 5,
    "totalRevenueCents": 104965,
    "totalRevenueFormatted": "1049.65 USD",
    "recentOrders": [ ... ]
  }
}
```

---

### 5.3 Single Order Detail

```
GET /api/v1/shop/admin/orders/:id
Authorization: Bearer <admin-token>
```

**Response 200:**

```json
{
  "success": true,
  "invoice": { ... }
}
```

---

## 6. Price Convention

All prices are stored and returned in **cents**:

| Value   | Meaning |
| ------- | ------- |
| `999`   | $9.99   |
| `2999`  | $29.99  |
| `50000` | $500.00 |

---

## 7. Order Status Flow

```
PENDING  →  PAID      (payment succeeded — via /pay or /verify)
         →  FAILED    (payment failed)
PAID     →  REFUNDED  (processed manually via Stripe Dashboard)
```

---

## 8. Quick Test Workflows (Postman)

### Flow A — Postman Test (pm_card_visa, no browser needed)

**Step 1 — Create a product (admin):**

```
POST /api/v1/shop/products
Body (form-data): name=Premium Plan, description=All features, price=2999, stock=100
```

**Step 2 — View catalog (public):**

```
GET /api/v1/shop/catalog
```

Copy a `product.id`.

**Step 3 — Place an order (user):**

```
POST /api/v1/shop/orders
Body: { "productId": "<id>", "quantity": 1 }
```

Copy `order.id`.

**Step 4 — Confirm payment (test card):**

```
POST /api/v1/shop/orders/<order.id>/pay
```

Order status becomes `PAID` immediately.

**Step 5 — View invoice:**

```
GET /api/v1/shop/orders/my/<order.id>
```

**Step 6 — Admin stats:**

```
GET /api/v1/shop/admin/orders/stats
```

---

### Flow B — Stripe Checkout (real hosted payment page)

**Step 1–3:** Same as Flow A above.

**Step 4 — Get Stripe checkout URL:**

```
POST /api/v1/shop/orders/<order.id>/checkout-session
Body (optional): { "successUrl": "https://yourapp.com/success", "cancelUrl": "https://yourapp.com/cancel" }
```

Copy `checkoutUrl` and `sessionId` from the response.

**Step 5 — Open the URL and pay:**

- Open `checkoutUrl` in a browser
- Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC

**Step 6 — Verify payment:**

```
POST /api/v1/shop/orders/<order.id>/verify?sessionId=<sessionId>
```

Order status becomes `PAID`.
