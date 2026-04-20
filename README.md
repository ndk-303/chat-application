# KAPTA - Ứng dụng Chat Real-time

Đây là một dự án ứng dụng chat theo thời gian thực. Project được xây dựng trên mô hình Client-Server với đầy đủ các tính năng nhắn tin, gửi nhận file, tạo nhóm, hỗ trợ realtime tốt thông qua WebSockets.

## Công nghệ sử dụng

- **Frontend**: React (Vite), TailwindCSS, Zustand (quản lý state), Shadcn UI, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Mongoose, Cloudinary, Redis.
- **CSDL & Cache**: MongoDB, Redis.
- **Hệ thống vận hành**: Docker, Docker Compose, Nginx.

## Kiến trúc dự án

- `frontend/`: Chứa mã nguồn giao diện người dùng (React, Tailwind, v.v).
- `backend/`: Chứa API Server xử lý logic nghiệp vụ và Socket, tương tác với Database.
- `nginx/`: Cấu hình Nginx đóng vai trò Reverse Proxy điều hướng request cho Frontend và Backend.
- `docker-compose.yml`: File cấu hình khởi chạy hàng loạt các dịch vụ bao gồm Mongo, Redis, Backend, Frontend và Nginx. Sinh kèm dữ liệu mẫu tự động (`seeder`).

## Hướng dẫn khởi chạy bằng Docker

Cách dễ nhất là sử dụng Docker để tự động build và chạy toàn bộ dịch vụ.

**Yêu cầu:** Máy tính bạn phải cái sẵn **Docker** và **Docker Compose**.

1. Tại thư mục gốc của project (chứa file `docker-compose.yml`), mở Terminal / Command Prompt.
2. Chạy lệnh sau để build và chạy ngầm toàn bộ project:

   ```bash
   docker-compose up --build -d
   ```
3. Chờ một chút để Docker tải về các image (Mongo, Redis, Nginx) và build container cho Frontend/Backend. Quá trình này có thể tốn vài phút tùy thuộc vào mạng của bạn. Hệ thống cũng có một container `seeder` sẽ tự động đổ một số tài khoản và thông tin mẫu vào database để test.

Để tắt toàn bộ project:

```bash
docker-compose down
```

### Scale Services (Mở rộng hệ thống)

Nhờ sử dụng cấu trúc Redis Adapter cho Socket.io, hệ thống cho phép chạy song song nhiều backend container dể chịu tải mà không mất kết nối. Ví dụ chạy 3 tiến trình backend một lúc:
```bash
docker-compose up -d --scale backend=3
```

## Hướng dẫn truy cập trang web

Sau khi quá trình `docker-compose up` hoàn tất thành công, Nginx sẽ phục vụ trang web và API trực tiếp ở port `80`.

- Bạn chỉ cần mở trình duyệt và truy cập vào đường dẫn sau:
  **[http://localhost](http://localhost)**
- Nếu không hoạt động, hãy kiểm tra chắc chắn rằng bạn không có ứng dụng nào khác (Ví dụ: Apache, XAMPP, Skype...) đang chiếm dụng port 80.
