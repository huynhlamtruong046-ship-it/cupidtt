# Kế hoạch Khắc Phục Triệt Để 2 Lỗi Bảo Mật: Xác Minh Email Thật & Phân Quyền Quản Trị Viên CupidGo

Kế hoạch tái cấu trúc toàn diện hệ thống xác thực và phân quyền cho CupidGo: loại bỏ hoàn toàn cơ chế đăng nhập giả mạo và các phương thức dự phòng không an toàn; bắt buộc quy trình đăng ký – gửi OTP qua email thật – xác minh trên máy chủ; đồng thời bảo vệ trang và toàn bộ API Quản lý dữ liệu (Data Management) bằng middleware đối soát phiên quản trị viên trực tiếp từ cơ sở dữ liệu Cloud SQL PostgreSQL.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Các quyết định kỹ thuật cốt lõi đã được xác nhận:**
> 1. **Dịch vụ Email OTP**: Hỗ trợ cấu hình SMTP thực tế (Gmail App Password, Resend, SendGrid) thông qua các biến môi trường máy chủ (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). Nếu chưa cấu hình biến môi trường, hệ thống sẽ trả thông báo lỗi cấu hình email rõ ràng hoặc ghi log chuyên dụng để thử nghiệm mà không bao giờ tự động kích hoạt tài khoản.
> 2. **Cơ chế Token Phiên**: Máy chủ cấp `session_token` mật mã an toàn (cryptographically secure hex token 64 ký tự) khi đăng nhập thành công. Token này được đối soát trực tiếp với cơ sở dữ liệu Cloud SQL PostgreSQL trên mỗi request cần bảo vệ.
> 3. **Phân quyền Admin chặt chẽ**: Chỉ tài khoản có email `huynhlamtruong046@gmail.com` và đã xác minh trong PostgreSQL mới được cấp quyền Admin. Mọi truy cập vào trang hoặc API Quản lý dữ liệu từ tài khoản thường đều bị chặn ngay lập tức với mã lỗi `403 Forbidden` và giao diện cảnh báo truy cập trái phép.
> 4. **Loại bỏ toàn bộ đăng nhập thay thế**: Vô hiệu hóa và gỡ bỏ hoàn toàn nút/luồng Google Login, đăng nhập khách, tài khoản demo, và cơ chế tự tạo phiên đăng nhập giả tại frontend.

---

## 1. Overview & Core Concept

- **Mục tiêu**: Đưa CupidGo từ trạng thái ứng dụng thử nghiệm sang nền tảng hẹn hò thực tế, bảo mật cao:
  - Bắt buộc 100% người dùng phải đăng ký bằng email thật họ sở hữu và nhập chính xác mã OTP 6 chữ số có hiệu lực 15 phút.
  - Ngăn chặn hoàn toàn việc nhập email giả, mật khẩu bất kỳ hoặc dùng localStorage để vượt qua đăng nhập.
  - Cô lập tuyệt đối khu vực Quản lý dữ liệu (Data Management): chỉ Admin hợp lệ mới nhìn thấy và truy cập được; người dùng thông thường bị từ chối ở cả frontend lẫn backend.
- **Đối tượng**: Người dùng thật đăng ký tài khoản hẹn hò; Quản trị viên duy nhất (`huynhlamtruong046@gmail.com`) vận hành hệ thống.

---

## 2. User Experience & Visual Design

### Luồng Người dùng Xác thực Mới (Auth Flow)
1. **Màn hình Đăng ký**:
   - Chỉ gồm 2 trường: Địa chỉ Email và Mật khẩu (kèm xác nhận mật khẩu tối thiểu 6 ký tự).
   - Không có nút Google Login, không có nút tạo tài khoản nhanh, không có tài khoản dùng thử.
   - Nhấn "Đăng ký": Máy chủ kiểm tra trùng lặp email, băm mật khẩu bằng `bcryptjs`, sinh mã OTP 6 số ngẫu nhiên an toàn, lưu mã băm SHA-256 vào database với hạn 15 phút, và gửi email thực tế đến hộp thư người dùng.
2. **Màn hình Nhập mã OTP Xác minh**:
   - Tự động chuyển sang giao diện nhập 6 ô mã OTP với đồng hồ đếm ngược 15 phút.
   - Nút "Gửi lại mã" kèm cơ chế chống spam (đếm lùi 60 giây giữa các lần gửi).
   - Giới hạn tối đa 5 lần nhập sai trước khi khóa mã để chống tấn công vét cạn (brute-force).
   - Chỉ khi nhập đúng OTP, máy chủ mới cập nhật `email_verified = true` trong database và cấp token phiên.
3. **Màn hình Đăng nhập**:
   - Nhập Email và Mật khẩu -> Gửi lên API `/api/auth/login`.
   - Backend kiểm tra sự tồn tại của email, đối chiếu mật khẩu đã băm qua `bcryptjs.compare`, và kiểm tra cờ `email_verified`.
   - Nếu email chưa xác minh: Từ chối đăng nhập với mã `EMAIL_NOT_VERIFIED` và chuyển người dùng sang bước nhập OTP.
   - Nếu mật khẩu sai hoặc tài khoản không tồn tại: Trả thông báo lỗi "Email hoặc mật khẩu không chính xác" (không để lộ thông tin tài khoản tồn tại hay không).
4. **Màn hình Quản lý dữ liệu (Admin Dashboard)**:
   - Với người dùng thường: Ẩn hoàn toàn mục "Quản lý dữ liệu" trong menu dropdown tài khoản.
   - Nếu người dùng thường cố tình truy cập vào chế độ admin: Hiển thị ngay màn hình cảnh báo **403 Forbidden - Quyền truy cập bị từ chối** với thông điệp rõ ràng và nút quay lại trang Khám phá.
   - Với tài khoản Admin (`huynhlamtruong046@gmail.com`): Menu hiển thị đầy đủ, gọi API quản trị kèm token phiên hợp lệ được xác thực bởi middleware máy chủ.

---

## 3. Key Product Decisions & Trade-Offs

| Thành phần | Lựa chọn hiện tại (Lỗi) | Lựa chọn Khắc phục Triệt để | Lý do / Lợi ích |
| :--- | :--- | :--- | :--- |
| **Đăng nhập** | Frontend tự gọi `/api/auth/sync` hoặc lưu thẳng vào `localStorage` | Gọi `/api/auth/login` với kiểm tra mật khẩu bcrypt và trạng thái email_verified ở PostgreSQL | Chặn đứng việc nhập email giả và mật khẩu bất kỳ |
| **Xác minh Email** | Frontend giả lập xác minh, kiểm tra chuỗi `@` sơ sài | Bắt buộc kiểm tra mã OTP băm phía máy chủ, gửi qua SMTP thực tế | Chỉ những ai nhận được thư tại email đó mới có tài khoản |
| **Phương thức xác thực** | Còn nút Google và quick user tạo tài khoản test | Loại bỏ hoàn toàn Google Auth và user test, duy nhất 1 luồng Email + Mật khẩu | Đáp ứng chính xác yêu cầu loại bỏ phương thức phụ |
| **Phân quyền Admin** | Client tự kiểm tra chuỗi email, backend route không có middleware | Middleware `requireAdmin` kiểm tra token phiên trong PostgreSQL và đối chiếu vai trò admin | Loại bỏ nguy cơ giả mạo header hay sửa đổi state ở frontend |
| **Xử lý vi phạm quyền** | Cho phép hiển thị AdminDashboard khi isAdminMode = true | App.tsx kiểm tra quyền từ backend, hiển thị màn hình 403 Forbidden nếu không phải admin | Bảo vệ dữ liệu ở cả giao diện và API |

---

## 4. Technical Architecture & Data Strategy

### Mô hình Luồng Xác thực & Bảo vệ API

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (REACT FRONTEND)                       │
│  - AuthScreen: Duy nhất Form Email + Mật khẩu (bỏ Google / Demo)       │
│  - VerifyOtpModal: Nhập 6 số OTP thật + đếm ngược 60s gửi lại         │
│  - TopNavBar: Chỉ render mục "Quản lý dữ liệu" nếu isAdmin = true       │
│  - AdminDashboard: Bọc trong AccessGuard (trả 403 nếu vi phạm)         │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ /api/auth/register              │ Bearer session_token
                   │ /api/auth/login                 │ Header
                   │ /api/auth/verify-otp            │
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS BACKEND (server.ts)               │
│  ┌───────────────────────┐         ┌────────────────────────────────┐  │
│  │   Auth Endpoints      │         │   Middleware: requireAdmin     │  │
│  │ - bcryptjs.compare    │         │ - Validate session_token       │  │
│  │ - SHA-256 OTP Hash    │         │ - Query user in Cloud SQL      │  │
│  │ - SMTP Email Dispatch │         │ - Ensure emailVerified & Admin │  │
│  └──────────┬────────────┘         └───────────────┬────────────────┘  │
└─────────────┼──────────────────────────────────────┼───────────────────┘
              ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CLOUD SQL POSTGRESQL DATABASE                      │
│  - users: uid, email, password_hash, email_verified,                   │
│           verification_code_hash, verification_code_expires_at,        │
│           verification_attempts, session_token, session_expires_at     │
│  - profiles, matches, messages, reports (Chỉ truy cập khi có token)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Kế hoạch Triển khai Chi tiết

1. **Backend (`server.ts`, `src/middleware/auth.ts`, `src/db/dating.ts`, `src/db/schema.ts`)**:
   - Bổ sung trường `session_token` và `session_expires_at` trong bảng `users` (hoặc bảng sessions) để xác thực phiên máy chủ không phụ thuộc vào chuỗi UID tuỳ tiện của client.
   - Cập nhật `/api/auth/register`: Bắt buộc băm mật khẩu, gửi mã OTP thật qua `emailService`, lưu OTP hash + thời hạn 15 phút.
   - Cập nhật `/api/auth/login`: Chỉ cho phép đăng nhập nếu mật khẩu khớp và `email_verified === true`. Cấp `session_token` mới và lưu vào cơ sở dữ liệu.
   - Cập nhật `/api/auth/verify-otp`: Kiểm tra mã OTP an toàn theo hàm băm thời gian thực; khi đúng, cập nhật `email_verified = true` và sinh phiên đăng nhập.
   - Cập nhật middleware `requireAuth` và `requireAdmin`: Kiểm tra `session_token` hợp lệ trong PostgreSQL; `requireAdmin` chỉ chấp thuận nếu người dùng là `huynhlamtruong046@gmail.com` và `email_verified === true`.
   - Áp dụng `requireAdmin` lên toàn bộ các route quản trị: `/api/admin/stats`, `/api/admin/profiles`, `/api/admin/reports`, `/api/admin/reports/:reportId/resolve`, `/api/admin/users/:userId/verify`, `/api/admin/users/:userId/ban`, `/api/admin/users/:userId/vip`, `/api/admin/data-management/*`.
   - Xóa bỏ việc cho phép các header giả lập như `x-admin-email` hoặc token bắt đầu bằng `dev_`/`admin_`.

2. **Frontend (`src/components/auth/AuthScreen.tsx`, `src/context/DatingContext.tsx`, `src/components/navigation/TopNavBar.tsx`, `src/App.tsx`, `src/components/admin/AdminDashboard.tsx`)**:
   - Gỡ bỏ hoàn toàn nút Google Sign-In, nút tạo tài khoản nhanh `handleQuickNewUser`, và các fallback đăng nhập giả vào `localStorage`.
   - Sửa hàm `login` và `register` trong `DatingContext.tsx` để gọi đúng `/api/auth/login` và `/api/auth/register`, xử lý trường hợp nhận phản hồi `EMAIL_NOT_VERIFIED` để mở modal xác minh OTP.
   - Lưu trữ `session_token` an toàn và gửi trong header `Authorization: Bearer <session_token>` ở tất cả các request API.
   - Tạo component hiển thị lỗi `403 Forbidden` khi người dùng thông thường cố tình truy cập trang quản trị dữ liệu.
   - Kiểm tra quyền admin từ thông tin người dùng được xác thực bởi server, không phụ thuộc vào trạng thái giả lập ở client.

3. **Kiểm thử Thực tế (Automated API Test Script)**:
   - Viết và chạy kịch bản kiểm thử API để xác nhận:
     + Đăng ký email -> yêu cầu OTP, không tự động xác minh.
     + Đăng nhập email chưa xác minh -> nhận lỗi `403 EMAIL_NOT_VERIFIED`.
     + Đăng nhập với mật khẩu sai -> nhận lỗi `401 Unauthorized`.
     + Nhập email chưa đăng ký -> nhận lỗi `401 Unauthorized`.
     + Gọi API admin không có token -> nhận lỗi `401 Unauthorized`.
     + Gọi API admin với token người dùng thường -> nhận lỗi `403 Forbidden`.
     + Đăng nhập tài khoản admin hợp lệ -> truy cập thành công API admin.
