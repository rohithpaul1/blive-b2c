# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.21.1-alpine

# Remove default config
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm -rf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
CMD ["nginx", "-g", "daemon off;"]