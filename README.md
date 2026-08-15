# KAPTA Backend

Backend cho hệ thống chat thời gian thực, cung cấp REST API, Socket.IO, gửi file, trò chuyện nhóm và cuộc gọi WebRTC.

## Công nghệ

- Node.js, Express và TypeScript
- MongoDB với Mongoose
- Redis cho cache, rate limit và Socket.IO adapter
- Cloudinary cho lưu trữ file
- Docker, Docker Compose và Nginx

## Cấu trúc

- `backend/`: API server, nghiệp vụ và Socket.IO.
- `nginx/`: reverse proxy cho REST API và WebSocket.
- `docker-compose.yml`: MongoDB, Redis, backend và Nginx.

## Khởi chạy bằng Docker

Tạo `backend/.env` với các biến môi trường cần thiết, sau đó chạy:

```bash
docker compose up --build -d
```

REST API được phục vụ tại `http://localhost/api/` và Socket.IO tại `http://localhost/socket.io/`.

Để dừng hệ thống:

```bash
docker compose down
```

Có thể chạy nhiều backend container nhờ Redis adapter:

```bash
docker compose up -d --scale backend=3
```

## Phát triển backend

```bash
cd backend
pnpm install
pnpm dev
```

Backend mặc định lắng nghe tại `http://localhost:5051`.
