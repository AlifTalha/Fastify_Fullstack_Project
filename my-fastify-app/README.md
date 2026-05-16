# my-fastify-app

Fastify REST API with **Prisma ORM**, **PostgreSQL**, and **JWT authentication**.

---

## Tech Stack

| Layer            | Package                                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| HTTP Framework   | [Fastify v4](https://fastify.dev)                                              |
| ORM              | [Prisma v5](https://www.prisma.io)                                             |
| Database         | PostgreSQL                                                                     |
| Auth             | [@fastify/jwt](https://github.com/fastify/fastify-jwt) + opaque refresh tokens |
| Password hashing | bcryptjs (12 rounds)                                                           |
| Security         | @fastify/helmet, @fastify/cors, @fastify/rate-limit                            |
| Logging          | Pino (built-in to Fastify) + pino-pretty (dev)                                 |

---

## Quick Start — Step by Step

### 1. Create the project folder

```bash
mkdir my-fastify-app
cd my-fastify-app
```

### 2. Initialize npm

```bash
npm init -y
```

### 3. Install production dependencies

```bash
npm install fastify @fastify/jwt @fastify/cors @fastify/helmet @fastify/rate-limit @prisma/client bcryptjs dotenv fastify-plugin
```

### 4. Install development dependencies

```bash
npm install -D prisma nodemon pino-pretty
```

### 5. Copy all project files

Place all source files as shown in the project structure below.

### 6. Set up environment variables

Copy `.env` and fill in your values:

```bash
cp .env .env.local   # optional — keep secrets out of git
```

`.env` minimum required:

```
DATABASE_URL="postgres://user:password@host:port/dbname"
JWT_SECRET=a_long_random_string_at_least_32_chars
PORT=3000
NODE_ENV=development
```

### 7. Initialize Prisma (only first time)

```bash
npx prisma init
```

> If you already have `prisma/schema.prisma`, skip this step.

### 8. Run the database migration

```bash
npx prisma migrate dev --name init
```

This will:

- Create the `users` and `refresh_tokens` tables in PostgreSQL
- Generate the Prisma client (`node_modules/.prisma/client`)

### 9. Generate Prisma Client (if needed separately)

```bash
npx prisma generate
```

### 10. Start the development server

```bash
npm run dev
```

Server starts at **http://localhost:3000**

---

## Project Structure

```
my-fastify-app/
├── prisma/
│   ├── schema.prisma          # Prisma data model (User, RefreshToken)
│   └── migrations/            # Auto-generated SQL migrations
├── src/
│   ├── app.js                 # Fastify app factory (plugins + routes + error handler)
│   ├── config/
│   │   ├── database.js        # PrismaClient singleton
│   │   └── server.js          # PORT, HOST, logger config
│   ├── plugins/
│   │   └── authPlugin.js      # JWT registration + authenticate/authorizeAdmin decorators
│   ├── models/
│   │   └── userModel.js       # All Prisma queries (data-access layer)
│   ├── services/
│   │   └── userService.js     # Business logic (hashing, token management, CRUD)
│   ├── controllers/
│   │   └── userController.js  # HTTP handlers (request → service → response)
│   ├── routes/
│   │   ├── index.js           # Aggregates all route modules
│   │   └── userRoutes.js      # Auth + user-management routes
│   ├── middlewares/
│   │   └── validation.js      # AJV JSON Schema definitions
│   ├── utils/
│   │   └── logger.js          # Pino logger config helper
│   └── errorHandler/
│       └── errorHandler.js    # Global error handler (Prisma, validation, app errors)
├── server.js                  # Entry point
├── .env                       # Environment variables
├── .gitignore
└── package.json
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

### Auth endpoints (public)

| Method | Path             | Body                         | Description                |
| ------ | ---------------- | ---------------------------- | -------------------------- |
| POST   | `/auth/register` | `{ email, password, name? }` | Create a new account       |
| POST   | `/auth/login`    | `{ email, password }`        | Get access + refresh token |
| POST   | `/auth/refresh`  | `{ refreshToken }`           | Get a new access token     |
| POST   | `/auth/logout`   | `{ refreshToken }`           | Revoke refresh token       |

### Auth endpoints (authenticated)

| Method | Path               | Header                          | Description               |
| ------ | ------------------ | ------------------------------- | ------------------------- |
| GET    | `/auth/me`         | `Authorization: Bearer <token>` | Get own profile           |
| POST   | `/auth/logout-all` | `Authorization: Bearer <token>` | Revoke all refresh tokens |

### User management (admin only)

| Method | Path                     | Description            |
| ------ | ------------------------ | ---------------------- |
| GET    | `/users?page=1&limit=10` | List all users         |
| GET    | `/users/:id`             | Get user by ID         |
| PUT    | `/users/:id`             | Update name / password |
| DELETE | `/users/:id`             | Delete user            |

---

## Example Requests

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123","name":"Alice"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "...", "email": "user@example.com", "role": "USER" },
    "accessToken": "<jwt>",
    "refreshToken": "<opaque-token>"
  }
}
```

### Access protected route

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh access token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

---

## Useful Prisma Commands

```bash
# Open Prisma Studio (visual DB browser)
npm run prisma:studio

# Reset the database (drops all data — dev only)
npx prisma migrate reset

# Apply pending migrations to production DB
npx prisma migrate deploy

# Inspect current DB schema
npx prisma db pull
```

---

## Health Check

```bash
curl http://localhost:3000/health
```

```json
{ "status": "ok", "timestamp": "...", "uptime": 42.3 }
```



*****

post like ,and dislike blog section
