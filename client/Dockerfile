# ── Stage: Development ───────────────────────────────────────────────────────
# Run Vite dev server inside Docker so it's accessible from the host machine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the client source code
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# IMPORTANT: --host 0.0.0.0 makes Vite listen on all interfaces,
# not just localhost — required for Docker port forwarding to work.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
