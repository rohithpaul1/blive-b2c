# Docker Setup for Blive B2C Frontend

This project includes Docker configuration for both development and production environments.

## Files Created

- `Dockerfile` - Production build with nginx
- `Dockerfile.dev` - Development build with hot reloading
- `nginx.conf` - Nginx configuration for serving the React app
- `docker-compose.yml` - Docker Compose configuration
- `.dockerignore` - Files to exclude from Docker build context

## Quick Start

### Development Mode

Run the application in development mode with hot reloading:

```bash
# Using Docker Compose
docker-compose --profile dev up

# Or using Docker directly
docker build -f Dockerfile.dev -t blive-b2c-dev .
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules blive-b2c-dev
```

The application will be available at `http://localhost:5173`

### Production Mode

Build and run the production version:

```bash
# Using Docker Compose
docker-compose --profile prod up

# Or using Docker directly
docker build -t blive-b2c-prod .
docker run -p 80:80 blive-b2c-prod
```

The application will be available at `http://localhost`

### Custom Port

Run production version on a custom port:

```bash
# Using Docker Compose
docker-compose --profile prod-custom up

# Or using Docker directly
docker run -p 3000:80 blive-b2c-prod
```

The application will be available at `http://localhost:3000`

## Environment Variables

Make sure to set up your environment variables in a `.env` file:

```env
VITE_API_BASE_URL=your_api_url
VITE_RAZORPAY_KEY_ID=your_razorpay_key
# Add other environment variables as needed
```

## Docker Commands Reference

### Build Commands
```bash
# Build production image
docker build -t blive-b2c-prod .

# Build development image
docker build -f Dockerfile.dev -t blive-b2c-dev .
```

### Run Commands
```bash
# Run production container
docker run -p 80:80 blive-b2c-prod

# Run development container with volume mounting
docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules blive-b2c-dev

# Run in detached mode
docker run -d -p 80:80 --name blive-b2c blive-b2c-prod
```

### Management Commands
```bash
# Stop container
docker stop blive-b2c

# Remove container
docker rm blive-b2c

# Remove image
docker rmi blive-b2c-prod

# View logs
docker logs blive-b2c

# Execute commands in running container
docker exec -it blive-b2c sh
```

## Features

### Production Build
- Multi-stage build for optimized image size
- Nginx web server for serving static files
- Client-side routing support
- Static asset caching
- Security headers
- Gzip compression
- Health check endpoint

### Development Build
- Hot reloading support
- Volume mounting for live code changes
- Development dependencies included
- Accessible from host machine

## Troubleshooting

### Port Already in Use
If port 80 is already in use, use a different port:
```bash
docker run -p 3000:80 blive-b2c-prod
```

### Permission Issues
On Linux/macOS, you might need to use sudo:
```bash
sudo docker run -p 80:80 blive-b2c-prod
```

### Build Cache Issues
Clear Docker build cache:
```bash
docker builder prune
```

### Container Won't Start
Check logs for errors:
```bash
docker logs <container_name>
```
