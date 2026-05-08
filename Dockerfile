FROM node:20-slim

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./
COPY config.js ./
COPY fetcher.js ./
COPY formatter.js ./
COPY llm.js ./
COPY index.js ./

# Install root dependencies
RUN npm install --production

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy frontend (pre-built dist)
COPY frontend/dist ./frontend/dist
COPY frontend/src ./frontend/src
COPY frontend/package*.json ./frontend/
COPY frontend/vite.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/

# Copy content directories
COPY content ./content

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD cd backend && node server.js