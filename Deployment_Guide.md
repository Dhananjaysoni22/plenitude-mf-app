# Plenitude Analytics - Production Deployment Guide

To deploy this platform onto your company's local internal server, you will move away from the "Development" mode (`npm run dev`) and compile the code into highly optimized "Production" mode.

## Server Prerequisites
Ensure your local server (Windows or Linux) has the following installed:
1. **Node.js** (v18 or higher)
2. **PostgreSQL** (Running on port 5432)
3. **PM2** (A production process manager for Node.js). Install it globally by running:
   `npm install -g pm2`

---

## Step 1: Prepare the Database
Make sure you have created an empty database in PostgreSQL (e.g., `plenitude_db`).

In your `backend/.env` file on the server, update the connection string:
```env
DATABASE_URL="postgresql://<USERNAME>:<PASSWORD>@localhost:5432/plenitude_db?schema=public"
PORT=5000
JWT_SECRET="your_highly_secure_random_string"
```

Push the database schema to the new server database:
```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## Step 2: Build and Run the Backend
You need to compile the TypeScript backend into optimized JavaScript.

1. **Compile the code:**
   ```bash
   cd backend
   npm run build
   ```
   *This will generate a `dist/` folder containing the production-ready code.*

2. **Start the server using PM2:**
   ```bash
   pm2 start dist/index.js --name "plenitude-backend"
   ```
   *PM2 will ensure the backend stays online 24/7. If the server crashes or restarts, PM2 can automatically boot the backend back up.*

---

## Step 3: Build and Serve the Frontend
You must compile the React code into a static bundle of HTML/CSS/JS.

1. **Configure the API URL:**
   Before building, ensure `frontend/src/api/axiosClient.ts` is pointing to your server's IP address (e.g., `http://192.168.1.100:5000/api`) instead of `localhost`, so that RM's accessing from other computers on the network can connect to the backend!

2. **Compile the code:**
   ```bash
   cd frontend
   npm run build
   ```
   *This will generate a `dist/` folder containing your production frontend.*

3. **Serve the Frontend:**
   The easiest way to serve the frontend on an internal network is using PM2's static server:
   ```bash
   pm2 serve dist/ 80 --name "plenitude-frontend" --spa
   ```
   *(Note: The `--spa` flag is critical. It tells the server to route all traffic through React's router, ensuring page refreshes work perfectly).*

---

## Step 4: Access the Platform
Your application is now live! 
Anyone connected to your company's local network (Wi-Fi or LAN) can open their browser and type in the server's IP address (e.g., `http://192.168.1.100`) to access the Plenitude platform!

### Useful PM2 Commands for your IT Team:
- `pm2 list` (View all running apps)
- `pm2 logs` (View live server logs and errors)
- `pm2 restart all` (Restart the platform)
- `pm2 startup` (Configures PM2 to boot automatically when the Windows/Linux server is turned on)
