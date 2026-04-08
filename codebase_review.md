# 📋 Codebase Review & Đề Xuất Cải Thiện

> Đánh giá toàn diện dự án chat app (React + Express + MongoDB + Socket.IO + Redis)

---

## ✅ Những điểm tốt hiện tại

| Mục | Chi tiết |
|-----|---------|
| **Kiến trúc** | Tách rõ controller → service → model ở backend, component → store → service ở frontend |
| **Realtime** | Socket.IO + Redis adapter hỗ trợ scale nhiều instance |
| **State management** | Zustand nhẹ, hiệu quả, tách store hợp lý (chat, socket, auth, call, friend, ui) |
| **Docker** | Compose đầy đủ (mongo, redis, backend, frontend, nginx) |
| **Type safety** | TypeScript cả frontend lẫn backend, type definitions rõ ràng |
| **Features** | Chat 1-1, nhóm, gọi WebRTC, reactions, file upload, invite link/QR, typing indicator |

---

## 🔴 Lỗi Cần Sửa Ngay

### 1. Typo tên file: `mesageService.ts` → `messageService.ts`

File [mesageService.ts](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/services/mesageService.ts) bị thiếu chữ "s".  
Import trong [chatStore.ts:4](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/stores/chatStore.ts#L4) cũng bị sai tên:
```typescript
import { messageService } from '@/services/mesageService'; // ← sai tên
```

### 2. Refresh token không được cập nhật khi rotate

Trong [authService.ts:120-145](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/authService.ts#L120-L145), hàm `refreshToken()` tạo token mới nhưng **không cập nhật `user.refreshTokens` trong database**. Token cũ vẫn hợp lệ → có thể bị reuse.

```diff
  const newRefreshToken = generateRefreshToken({ userId: payload.userId, role: payload.role });
+ checked.refreshTokens = newRefreshToken;
+ await checked.save();
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
```

### 3. Cookie `secure: false` trong production

[authController.ts:24](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/controllers/authController.ts#L24): `secure: false` khiến cookie không được gửi qua HTTPS. Nên dùng env variable:
```typescript
secure: process.env.NODE_ENV === 'production',
```

### 4. Register thiếu `return` sau validation fail

[authController.ts:42-44](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/controllers/authController.ts#L42-L44): Khi validation fail, code vẫn tiếp tục chạy `authService.register()`:
```diff
  if (!email || !password || !displayName) {
-   res.status(400).json({ message: '...' });
+   return res.status(400).json({ message: '...' });
  }
```

### 5. Axios interceptor thiếu auto-refresh token

[axios.ts](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/lib/axios.ts) chỉ có request interceptor. Khi access token hết hạn (401), user bị đẩy về login. Cần thêm **response interceptor** để tự động refresh:

```typescript
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await api.post('/auth/refresh-token');
      useAuthStore.getState().setAccessToken(data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 🟡 Bảo Mật

### 6. Mật khẩu không được validate độ mạnh

Backend [authService.ts:42](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/authService.ts#L42) không kiểm tra password strength (tối thiểu 8 ký tự, có chữ hoa/thường/số...). Nên thêm validation:

```typescript
if (password.length < 8) throw new Error('Mật khẩu phải có ít nhất 8 ký tự');
```

### 7. `requestPasswordReset` trả về `resetToken` trong response

[authService.ts:161-165](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/authService.ts#L161-L165): Token reset mật khẩu KHÔNG nên trả về cho client. Nó phải được gửi qua email. Hiện tại bất kỳ ai biết email cũng có thể reset password.

### 8. User model thiếu `timestamps`

[User.ts:92-93](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/models/User.ts#L92-L93): Schema không có `{ timestamps: true }`, nên không có `createdAt`/`updatedAt`.

### 9. Rate limiting

Không có rate limit cho các endpoint nhạy cảm (`/auth/login`, `/auth/register`, `/auth/resend-code`). Attacker có thể brute-force.

> [!IMPORTANT]
> Nên thêm `express-rate-limit` cho auth routes, ít nhất 5-10 lần/phút.

---

## 🟠 Hiệu Suất & Kiến Trúc

### 10. `getUserConversations` gọi aggregate trên toàn bộ messages

[conversationService.ts:29-43](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/conversationService.ts#L29-L43): Aggregate `unreadCount` quét toàn bộ messages cho **tất cả conversations** mỗi lần mở sidebar. Khi database lớn sẽ rất chậm.

**Đề xuất:** Lưu `unreadCount` vào Redis hoặc dùng counter field trong Conversation model, cập nhật incrementally khi có tin nhắn mới/đọc tin.

### 11. `createMessage` gọi `countDocuments` mỗi lần gửi tin

[messageService.ts:94](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/messageService.ts#L94): `await MessageModel.countDocuments({ conversationId })` chạy mỗi lần gửi tin nhắn chỉ để kiểm tra xem đây có phải tin nhắn đầu tiên không.

**Đề xuất:** Kiểm tra `conversation.lastMessageId === undefined` thay vì count.

### 12. Frontend không cache messages

[chatStore.ts:55-71](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/stores/chatStore.ts#L55-L71): `fetchMessages` luôn fetch lại từ server mỗi khi chuyển conversation, không dùng cache. Nên kiểm tra `if (state.messages[conversationId]?.length > 0)` trước khi gọi API.

### 13. RightPanel.tsx quá lớn (~580 dòng)

[RightPanel.tsx](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/components/panel/RightPanel.tsx) chứa 3 component lớn (`RightPanel`, `AddMemberModal`, `InviteLinkModal`) trong cùng 1 file. Nên tách thành files riêng:
- `panel/RightPanel.tsx`
- `panel/AddMemberModal.tsx`
- `panel/InviteLinkModal.tsx`

---

## 🔵 UX / Frontend

### 14. Thiếu Toast notifications

Dự án đã cài `sonner` nhưng không thấy sử dụng. Các thao tác quan trọng (gửi lời mời, kick member, đổi tên nhóm...) chỉ dùng `alert()` hoặc `window.confirm()`.

**Đề xuất:** Thay tất cả `alert()` bằng `toast()` từ sonner.

### 15. Thiếu route cho Invite Link

[App.tsx](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/frontend/src/App.tsx) không có route `/join/:token`. User nhấn link mời sẽ bị redirect về trang chủ.

```typescript
<Route path="/join/:token" element={<JoinGroupPage />} />
```

### 16. Thiếu responsive mobile

Các component `Sidebar`, `ChatWindow`, `RightPanel` dùng layout cố định (`w-[300px]`, etc.) nhưng không có breakpoint mobile. Hook `use-mobile.ts` đã tồn tại nhưng chưa được tận dụng.

### 17. Không có Dark Mode

Ứng dụng chỉ có theme sáng. Với CSS variables đã được thiết lập trong `index.css`, có thể thêm dark mode tương đối dễ dàng.

---

## 🟣 Code Quality

### 18. Quá nhiều `catch (_) { }` — nuốt lỗi im lặng

Backend có **hơn 15 chỗ** dùng `catch (_) { }` (message service, conversation service). Lỗi socket emit bị nuốt hoàn toàn, gây khó debug.

**Đề xuất:** Ít nhất log warning:
```typescript
catch (err) { console.warn('[Socket emit failed]', err); }
```

### 19. Nhiều dynamic imports không cần thiết

[conversationService.ts:240](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/conversationService.ts#L240), [355](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/conversationService.ts#L355), [487](file:///d:/Khoa%2015/TON%20DUC%20THANG/FullStack/khoa-phuc-thel/backend/src/services/conversationService.ts#L487): `await import('../models/User')` được gọi nhiều lần. Nên import tĩnh ở đầu file.

### 20. Thiếu Error class riêng

Backend dùng `throw new Error('...')` ở mọi nơi. Controller dùng generic status code (400/401). Nên tạo `AppError` class với HTTP status:

```typescript
class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
  }
}
```

### 21. Thiếu Input Validation (Joi/Zod)

Frontend đã cài `zod` nhưng backend không validate input. Ví dụ `createMessage` không validate max file size, max file count, content length nhất quán.

---

## 📊 Tóm tắt ưu tiên

| Cấp độ | Mục | Ảnh hưởng |
|--------|-----|-----------|
| 🔴 Cần sửa ngay | #2 Refresh token leak | Bảo mật |
| 🔴 Cần sửa ngay | #4 Missing return | Runtime crash |
| 🔴 Cần sửa ngay | #5 Auto-refresh token | UX bị đẩy login |
| 🔴 Cần sửa ngay | #7 Reset token leak | Bảo mật nghiêm trọng |
| 🟡 Quan trọng | #3 Cookie secure | Bảo mật production |
| 🟡 Quan trọng | #9 Rate limiting | Chống brute-force |
| 🟡 Quan trọng | #1 Typo file name | Code quality |
| 🟠 Cải thiện | #10 Unread aggregation | Performance |
| 🟠 Cải thiện | #14 Toast notifications | UX |
| 🟠 Cải thiện | #15 Join route | Feature hoàn thiện |
| 🔵 Nice to have | #16 Mobile responsive | UX mobile |
| 🔵 Nice to have | #17 Dark mode | UI |
| 🟣 Nợ kỹ thuật | #13 Tách file lớn | Maintainability |
| 🟣 Nợ kỹ thuật | #18 Silent catch | Debuggability |
| 🟣 Nợ kỹ thuật | #20 Error class | Architecture |

---

> Bạn muốn tôi bắt tay vào sửa nhóm nào trước? Tôi đề xuất bắt đầu từ **nhóm 🔴 (bugs & security)** trước.
