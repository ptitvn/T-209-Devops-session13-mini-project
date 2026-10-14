# Campus Hub — Nền Tảng Kết Nối & Đăng Ký Hoạt Động Sinh Viên PTIT
> **Mini Project Tổng Hợp — Session 13 DevOps (IT-209)**  
> **Học viện Công nghệ Bưu chính Viễn thông (PTIT)**  
> **Kho lưu trữ GitHub:** [https://github.com/ptitvn/T-209-Devops-session13-mini-project.git](https://github.com/ptitvn/T-209-Devops-session13-mini-project.git)  
> **Phiên bản hoàn thiện:** 2.0.0

---

## 1. Giới thiệu tổng quan
**Campus Hub** là nền tảng số hóa hỗ trợ sinh viên Học viện Công nghệ Bưu chính Viễn thông (PTIT) chia sẻ thông tin học tập, tìm kiếm đồng đội làm đồ án / tham gia cuộc thi công nghệ, đăng ký tham gia các sự kiện của câu lạc bộ, trao đổi giáo trình và thông báo đồ thất lạc.

Dự án được kế thừa và mở rộng toàn diện từ mã nguồn nền (`campus-hub-base`), giải quyết bài toán cốt lõi: **Quản lý quy trình đăng ký tham gia hoạt động & xét duyệt thành viên trực tuyến (Event & Group Activity Registration Workflow)** với chỉ tiêu số lượng (capacity control) và quản trị trạng thái rõ ràng.

---

## 2. Tính năng nổi bật & Điểm phát triển mới so với dự án nền

| Tiêu chí | Dự án nền (`campus-hub-base`) | Phiên bản nhóm hoàn thiện (`Campus Hub v2.0`) |
|---|---|---|
| **Đăng ký tham gia hoạt động** | ❌ Không có (chỉ có bình luận và like) | ✅ **Có luồng đăng ký hoàn chỉnh**: Sinh viên gửi thông tin liên hệ (SĐT/Zalo/Email) & lời nhắn; Chủ bài đăng duyệt/từ chối ứng viên; Kiểm soát số lượng tối đa (`maxParticipants`). |
| **Quản lý đăng ký cá nhân** | ❌ Không có | ✅ Màn hình **"Đăng ký của tôi"**: Sinh viên theo dõi trạng thái đơn đăng ký (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`) và có thể chủ động hủy đăng ký. |
| **Quản lý bài viết cá nhân** | ❌ Không có lọc theo tác giả | ✅ Tab **"Bài viết của tôi"**: Quản lý các bài do chính mình đăng tải và danh sách ứng viên đăng ký. |
| **Bộ lọc & Phân loại** | Cơ bản (Keyword, Category) | ✅ Nâng cao: Lọc bài đăng theo từ khóa, chuyên mục, **bài mở đăng ký**, và bài viết của tôi. |
| **Hình ảnh minh họa** | ❌ Không hỗ trợ | ✅ Hỗ trợ đính kèm `imageUrl` cho bài đăng (ảnh sự kiện, đồ thất lạc, sách...). |
| **Giao diện người dùng** | Cơ bản | ✅ Giao diện hiện đại (Modern Academic Blue & Teal Palette, thẻ thông tin trực quan, trạng thái dạng pill badge, modal chi tiết). |
| **Đóng gói & Triển khai** | ❌ Không có Dockerfile, Docker Compose | ✅ **Đóng gói hoàn chỉnh**: Multi-stage Dockerfile cho Backend & Frontend, Nginx Reverse Proxy, `docker-compose.yml` 3 tầng (Database, Backend, Frontend). |
| **Tự động hóa CI/CD** | ❌ Chưa có | ✅ GitHub Actions Workflow tự động kiểm thử Gradle, Lint/Build React và validate cấu hình Docker. |

---

## 3. Tài khoản thử nghiệm (Demo Accounts)

Hệ thống tự động khởi tạo dữ liệu mẫu khi chạy lần đầu:

| Tên đăng nhập | Mật khẩu | Tên hiển thị | Vai trò (Role) | Mô tả |
|---|---|---|---|---|
| `student` | `student123` | Nguyễn Minh Anh | `USER` (Sinh viên) | Tài khoản sinh viên, đăng bài tìm nhóm đồ án |
| `le_dong` | `dong123` | Lê Trung Đông | `USER` (Sinh viên) | Sinh viên ứng tuyển vào nhóm và chia sẻ giáo trình |
| `admin` | `admin123` | Quản trị viên | `ADMIN` (Quản trị) | Quản trị viên hệ thống (có quyền ẩn/xóa mọi bài) |

---

## 4. Kiến trúc hệ thống & Triển khai

```text
                           [ Người dùng / Trình duyệt ]
                                        │
                                        ▼ Port 80 / 3000
                       ┌─────────────────────────────────┐
                       │   Frontend Container (Nginx)    │
                       │   - React 19 SPA (Vite)         │
                       │   - Reverse Proxy: /api/*       │
                       └────────────────┬────────────────┘
                                        │
                            Internal Network (Port 8080)
                                        │
                                        ▼
                       ┌─────────────────────────────────┐
                       │   Backend Container             │
                       │   - Spring Boot 3.5.7 (Java 21) │
                       │   - Spring Security (HTTP Basic)│
                       │   - Flyway DB Migrations        │
                       └────────────────┬────────────────┘
                                        │
                            Internal Network (Port 3306)
                                        │
                                        ▼
                       ┌─────────────────────────────────┐
                       │   Database Container            │
                       │   - MySQL 8.0 (UTF-8 mb4)       │
                       │   - Volume: mysql_data          │
                       └─────────────────────────────────┘
```

---

## 5. Danh mục RESTful API chính

### Xác thực & Người dùng
- `POST /api/auth/register`: Đăng ký tài khoản sinh viên mới.
- `GET /api/auth/me`: Lấy thông tin tài khoản đang đăng nhập.

### Bài đăng & Tương tác
- `GET /api/categories`: Danh sách các chuyên mục trong trường.
- `GET /api/posts`: Tìm kiếm và lọc bài đăng (`keyword`, `categoryId`, `allowRegistration`, `myPosts`, `page`, `size`).
- `GET /api/posts/{id}`: Chi tiết bài đăng kèm thông tin đăng ký của người dùng hiện tại.
- `POST /api/posts`: Tạo bài đăng mới (hỗ trợ `allowRegistration`, `maxParticipants`, `imageUrl`).
- `PUT /api/posts/{id}`: Cập nhật nội dung bài đăng của mình.
- `PATCH /api/posts/{id}/status`: Cập nhật trạng thái bài đăng (`PUBLISHED`, `RESOLVED`, `HIDDEN`).
- `DELETE /api/posts/{id}`: Xóa bài đăng.
- `POST /api/posts/{id}/comments`: Gửi bình luận.
- `POST /api/posts/{id}/reaction`: Bày tỏ quan tâm (Toggle reaction).

### Đăng ký tham gia hoạt động (Mới)
- `POST /api/posts/{postId}/registrations`: Sinh viên nộp đơn đăng ký tham gia (SĐT/Zalo/Email & lời nhắn).
- `GET /api/posts/{postId}/registrations`: Chủ bài đăng / Quản trị viên xem danh sách người đã đăng ký.
- `PATCH /api/posts/{postId}/registrations/{regId}/status`: Chủ bài đăng duyệt (`APPROVED`) hoặc từ chối (`REJECTED`) ứng viên.
- `DELETE /api/posts/{postId}/registrations/me`: Sinh viên chủ động hủy đơn đăng ký của mình.
- `GET /api/users/me/registrations`: Lịch sử các hoạt động sinh viên đã nộp đơn đăng ký.

---

## 6. Hướng dẫn chạy ứng dụng

### Cách 1: Chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)
Yêu cầu: Đã cài đặt Docker và Docker Compose.

```bash
# 1. Sao chép tệp biến môi trường
cp .env.example .env

# 2. Khởi chạy toàn bộ hệ thống (Database, Backend, Frontend)
docker compose up --build -d

# 3. Kiểm tra trạng thái các container
docker compose ps

# 4. Xem log hoạt động
docker compose logs -f
```

- **Frontend:** Truy cập tại `http://localhost` hoặc `http://localhost:3000`
- **Backend API:** Truy cập tại `http://localhost:8080/api`
- **Health check:** `http://localhost:8080/actuator/health`

Để dừng hệ thống:
```bash
docker compose down
```

---

### Cách 2: Chạy thủ công từng thành phần khi phát triển (Development)

#### 1. Khởi động MySQL
Tạo cơ sở dữ liệu MySQL tên `campus_hub`, cổng 3306.

#### 2. Khởi động Backend
```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23" # Hoặc đường dẫn JDK của máy
.\gradlew.bat bootRun
```

#### 3. Khởi động Frontend
```powershell
cd frontend
npm install
npm run dev
```
Truy cập giao diện tại `http://localhost:5173`.

---

## 7. Kiểm thử hệ thống (Automated Testing)

Toàn bộ các ca kiểm thử tích hợp (Integration Tests) và kiểm tra chuẩn mã nguồn (Linting) đã được cài đặt tự động:

```powershell
# Chạy toàn bộ kiểm thử phía Backend
cd backend
.\gradlew.bat test

# Chạy kiểm tra cú pháp và build kiểm thử phía Frontend
cd ../frontend
npm run lint
npm run build
```

---

## 8. Báo cáo nộp môn học
Báo cáo hoàn chỉnh định dạng `.docx` được lưu trữ trực tiếp tại thư mục gốc của dự án:
- **Tên tệp:** `Bao_Cao_Mini_Project_Session13.docx`
- **Nội dung bao gồm:** Toàn bộ phân tích bài toán, luồng sử dụng, thiết kế kiến trúc, sơ đồ thực thể ERD, danh mục API, minh chứng kiểm thử, minh chứng triển khai và link GitHub.
