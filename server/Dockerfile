# Use Debian slim variant (instead of Alpine) because native libraries
# like onnxruntime-node require glibc (ld-linux-x86-64.so.2) which Alpine lacks.
FROM node:20-slim

# Install build dependencies for compile tasks
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the server source code
COPY . .

# Expose the port the server listens on
EXPOSE 10000

# Start the server
CMD ["node", "index.js"]
