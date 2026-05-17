# ── Stage: Production image ───────────────────────────────────────────────────
FROM node:20-alpine

# Install openssl needed by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies (production only) — cached layer
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client (no DB needed at build time)
RUN npx prisma generate

EXPOSE 5000

# Start the server (migrations already applied on the external DB)
CMD ["node", "server.js"]
