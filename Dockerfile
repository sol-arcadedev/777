FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy workspace root and package files
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies (needed for prisma generate)
RUN npm ci --ignore-scripts

# Copy source code
COPY shared/ shared/
COPY server/ server/

# Generate Prisma client
RUN cd server && npx prisma generate

# Build server
RUN npm run build --workspace=server

# Production stage
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

RUN npm ci --omit=dev --ignore-scripts

# Copy built output and prisma
COPY --from=base /app/server/dist server/dist
COPY --from=base /app/server/node_modules/.prisma server/node_modules/.prisma
COPY --from=base /app/node_modules/.prisma node_modules/.prisma
COPY --from=base /app/node_modules/@prisma node_modules/@prisma
COPY server/prisma server/prisma

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server/dist/index.js"]
