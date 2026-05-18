# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with retry
RUN npm config set registry https://registry.npmjs.org/ && \
    npm cache clean --force && \
    npm install --legacy-peer-deps && \
    ls node_modules/mongoose/lib/helpers/promiseOrCallback.js || \
    (npm install mongoose@8.5.0 --force && \
     ls node_modules/mongoose/lib/helpers/promiseOrCallback.js || \
     echo "WARNING: promiseOrCallback.js still missing")

# Copy source code
COPY . .

# Create upload directories
RUN mkdir -p uploads/avatars uploads/banners uploads/gallery uploads/posts uploads/documents uploads/address-proofs uploads/temp

EXPOSE 5000

CMD ["node", "server.js"]