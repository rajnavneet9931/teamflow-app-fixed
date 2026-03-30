# Teamflow Docker run guide

## Files added/fixed
- `docker-compose.yml`
- `.env.example`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `frontend/src/services/api.js`
- `backend/src/application.ts`
- cookie settings in `backend/src/controllers/user.controller.ts`

## Why this fixes login redirect after Docker deploy
The frontend and backend now run behind one origin. Nginx serves the React build and proxies `/api` to the backend container. That keeps the httpOnly login cookie working correctly in the browser.

## Run on EC2
```bash
cd Teamflow-app-main
cp .env.example .env
nano .env

docker compose down -v

docker compose up --build -d
```

Open:
```bash
http://YOUR_EC2_PUBLIC_IP
```

## Important
- Security group should allow port `80`
- Do not set frontend API URL to `localhost:3000`
- Backend DB host inside Docker must stay `db`
- For HTTPS later, change cookie `secure` to `true`
