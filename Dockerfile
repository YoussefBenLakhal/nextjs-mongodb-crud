FROM node:18-alpine

# Install git for some npm packages that might need it
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Configure npm for better network handling
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3

# Install dependencies with retry logic
RUN npm install --legacy-peer-deps --no-audit --no-fund || \
    (sleep 15 && npm install --legacy-peer-deps --no-audit --no-fund) || \
    (sleep 30 && npm install --legacy-peer-deps --no-audit --no-fund)

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --production

# Expose port
EXPOSE 3000

# Set the hostname to 0.0.0.0 so Docker can access it
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Start the application with proper hostname binding
CMD ["npm", "start", "--", "--hostname", "0.0.0.0", "--port", "3000"]
