# CupidGo — checklist trước khi phát hành

## 1. Firebase Authentication
- Mở Firebase Console đúng project `probable-harbor-xsmzh`.
- Authentication → Sign-in method: bật **Email/Password** và **Google**.
- Authentication → Settings → Authorized domains: thêm `localhost` cho môi trường local và hostname chính xác của website sau khi publish.
- Kiểm tra email xác minh bằng một hộp thư thật. Tài khoản chưa nhấn liên kết xác minh phải bị chặn khỏi chức năng riêng tư.
- Kiểm tra mẫu email verification trong Firebase Authentication → Templates.

## 2. PostgreSQL
- Dự án giữ PostgreSQL/Cloud SQL hiện có; mã nguồn không tự tạo database và không tự chạy migration phá hủy.
- Khi deploy, xác nhận môi trường runtime cung cấp `DATABASE_URL` hoặc `SQL_HOST`, `SQL_PORT`, `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME` (có thể bật `SQL_SSL=true` khi dịch vụ yêu cầu TLS).
- Không đưa giá trị thật của các biến này vào GitHub. Kho nguồn công khai chỉ chứa tên biến và ví dụ trống.
- Lỗi `ECONNREFUSED` ở máy tính cá nhân nghĩa là máy local chưa kết nối được PostgreSQL; nó không tự chứng minh Cloud SQL trên AI Studio hỏng hoặc mất dữ liệu.

## 3. Admin
- Thiết lập `ADMIN_EMAILS` trong cấu hình máy chủ bằng email quản trị cần thiết.
- Mọi API quản trị phải xác minh Firebase ID token ở máy chủ. Ẩn nút trên giao diện không phải cơ chế bảo mật độc lập.
- Kiểm thử tài khoản thường: API quản trị phải trả `403`; yêu cầu thiếu/không hợp lệ token phải trả `401`.

## 4. Dữ liệu và chat
- Tài khoản, hồ sơ, lượt thích, kết đôi và tin nhắn phải lưu trong PostgreSQL. Trình duyệt chỉ lưu các thiết lập phụ; cache không được coi là nguồn dữ liệu chính.
- Ảnh hồ sơ hiện được lưu dưới dạng data URL trong cột `profiles.photos` (JSON trong PostgreSQL). Giới hạn giao diện là tối đa 6 ảnh, 1 MB/ảnh để giữ yêu cầu JSON dưới giới hạn máy chủ. Đây là phương án lưu bền vững nhưng không tối ưu cho quy mô lớn; nên chuyển sang object storage có quy tắc truy cập rõ ràng khi mở rộng.
- Gói VIP chưa được nối với nhà cung cấp thanh toán. Endpoint hiện trả `501` thay vì tự cấp quyền miễn phí. Chỉ mở lại sau khi xác minh thanh toán ở backend/webhook.

## 5. Smoke tests bắt buộc
1. Email chưa xác minh: không thể sử dụng ứng dụng.
2. Email/mật khẩu sai: bị từ chối.
3. Google login: vào được sau khi Firebase cấp token hợp lệ và email đã xác minh.
4. Hai tài khoản đã xác minh, mỗi tài khoản hoàn tất hồ sơ và có ảnh của mình.
5. Tài khoản A thích tài khoản B, tài khoản B thích A: có match trong PostgreSQL.
6. Tin nhắn được lưu, tải lại trang vẫn còn, và chỉ thành viên match mới đọc được.
7. Tài khoản thường gọi trực tiếp API admin: `403`.
8. Kiểm tra health endpoint/DB health trên môi trường đã deploy trước khi thông báo phát hành.

**Không coi app là sẵn sàng sản xuất nếu PostgreSQL không kết nối hoặc các smoke test trên chưa đạt.**
