FROM node:22-bookworm-slim

# Install build tools needed for better-sqlite3 native compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source and database
COPY . .

# Ensure data directory exists and has full write permissions
RUN mkdir -p /app/data && chmod -R 777 /app/data

# Build the Next.js production application
RUN npm run build

# Expose standard cloud ports
EXPOSE 3000 7860 10000

# Start on dynamic cloud PORT (defaults to 7860 for HF Spaces / Render)
ENV NODE_ENV=production
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-7860}"]
