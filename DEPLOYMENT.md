# Docker Deployment Guide

This guide explains how to deploy the Plenitude MF App on a local company server using Docker and Docker Compose. This is the recommended method for production or staging environments as it automatically handles databases, networking, and reverse proxying.

## Prerequisites

Before deploying, ensure the target server has the following installed:
- **[Docker](https://docs.docker.com/get-docker/)**
- **[Docker Compose](https://docs.docker.com/compose/install/)**

## Architecture

The `docker-compose.yml` file spins up three isolated containers on an internal Docker network:
1. **`db`**: A PostgreSQL 15 database container with persistent storage volumes.
2. **`backend`**: The Node.js/Express API. It automatically waits for the database, runs database migrations using Prisma, and listens on port 5000 internally.
3. **`frontend`**: An Nginx web server that serves the compiled React Single Page Application and proxies all `/api/*` traffic to the backend. It exposes the application to the network on port 80.

## 🚀 Quick Start Deployment

1. **Transfer the Source Code**
   Copy the entire `MF App` project folder to your target server.

2. **Open a Terminal**
   Navigate into the root directory of the project (where `docker-compose.yml` is located).
   ```bash
   cd /path/to/MF-App
   ```

3. **Build and Start the Containers**
   Run the following command to build the images and start the services in detached (background) mode:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the Application**
   Once the containers are running, the application will be accessible from any device on the network.
   Open a web browser and navigate to the server's local IP address or domain:
   ```text
   http://<server-ip-address>
   ```

5. **Initial Login & Setup**
   Because this is a completely fresh database, the system will auto-generate a default Master Administrator account for you. Log in using these credentials:
   - **Email:** `admin@plenitude.com`
   - **Password:** `admin123`
   
   *(Note: For security reasons, as soon as you log in, please click on "My Profile" in the bottom left of the sidebar and change this password!)*

---

## Useful Docker Commands

Here are some helpful commands for maintaining the server:

**View Live Logs**
If you want to see what the application is doing (e.g., watching cron jobs trigger):
```bash
docker-compose logs -f
```

**View Specific Service Logs**
```bash
docker-compose logs -f backend
```

**Stop the Application**
This will gracefully shut down all containers but preserve the database data:
```bash
docker-compose down
```

**Restart the Application**
```bash
docker-compose restart
```

**Wipe Database and Restart (CAUTION)**
If you ever need to completely wipe the system and start completely fresh, use the `-v` flag to destroy the persistent database volumes:
```bash
docker-compose down -v
docker-compose up -d --build
```

---

## Environment Configuration

The `docker-compose.yml` file comes pre-configured with default credentials and secrets. If you are deploying this to a strictly secured production environment, you may want to change the variables inside `docker-compose.yml`:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
