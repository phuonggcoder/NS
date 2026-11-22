# SpecPage Studio — Trình Tạo & Xuất Bản Landing Page Theo Chuẩn Spec-Driven (`speckit.org`)

SpecPage Studio giúp bạn thiết kế, tùy biến cấu trúc/giao diện, dùng AI điền tự động & kiểm lỗi, gửi mẫu cho khách hàng thật duyệt trực tiếp, **tự động ghi nhớ lâu dài trên Cloud** và **bảo mật Studio bằng mật khẩu quản trị**.

---

## 1. Tính năng nổi bật

- **Bảo mật quản trị & Chống spam**:
  - Trang thiết kế Studio (`/`) và các API quản trị (`/api/projects`, `/api/publish`, `/api/clients`, xem `/api/orders`, xem `/api/feedback`) được bảo vệ bởi **mật khẩu quản trị + Signed `HttpOnly` Cookie** (`SameSite=Lax`, `Secure` trên HTTPS) và giới hạn tốc độ chống dò mật khẩu (`Rate Limit`).
  - Trang của khách hàng (`/site.html`, `/clients/<slug>/index.html`, `/?mode=live`, `/?mode=review`) vẫn mở công khai bình thường cho khách xem và đặt mua.
- **Luôn ghi nhớ dữ liệu (Cloud Persistence)**:
  - Hỗ trợ 3 chế độ lưu tự động trong [server-store.mjs](server-store.mjs): **Upstash Redis Free**, **Supabase Free**, hoặc **Server Disk** (`data/kv/`).
  - Ngay cả khi chạy trên **Render Free** (bị reset ổ đĩa mỗi lần ngủ/restart), server vẫn tự khôi phục toàn bộ dự án, trang khách đã xuất bản (`/clients/<slug>/index.html`), đơn hàng và góp ý từ Cloud.
- **AI Trợ lý tích hợp**:
  - **AI Tự động điền**: Dán bài viết Facebook/Zalo, CV, bảng giá -> AI tách và điền vào từng khối.
  - **AI Kiểm lỗi & Gợi ý (Xem thử / Chấp nhận / Từ chối)**: Quét lỗi chính tả tiếng Việt, tương phản màu WCAG, link neo `#anchor`, lưới sản phẩm và SEO.
- **Quy trình cho khách hàng thật**:
  - Quản lý nhiều dự án khách hàng (`Nháp → Chờ khách duyệt → Đã duyệt → Đã xuất bản`), gửi link `/?mode=review&slug=<slug>` để khách xem bản Desktop/Mobile và gửi góp ý trực tiếp.

---

## 2. Hướng dẫn Deploy 100% MIỄN PHÍ thay thế hoàn toàn `localhost` (Render + Upstash Redis)

Bộ đôi **Render Free** (chạy [server.mjs](server.mjs) qua [render.yaml](render.yaml)) + **Upstash Redis Free** (lưu dữ liệu vĩnh viễn) hoàn toàn miễn phí, không cần thẻ tín dụng và giữ dữ liệu lâu dài:

### Bước 1: Tạo Database ghi nhớ miễn phí trên Upstash
1. Đăng ký tài khoản miễn phí tại `https://upstash.com/` (đăng nhập bằng GitHub).
2. Bấm **Create Database** -> chọn Type **Redis**, Region gần Việt Nam (VD: `ap-southeast-1` Singapore), Plan **Free**.
3. Trong trang chi tiết database, sao chép 2 giá trị tại mục **REST API**:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Bước 2: Push code lên GitHub (Repo Private)
```bash
git add .
git commit -m "Deploy SpecPage Studio with cloud persistence and security"
git push -u origin main
```

### Bước 3: Deploy lên Render Free
1. Đăng nhập `https://render.com/` bằng GitHub.
2. Chọn **New +** -> **Blueprint** (hoặc **Web Service** chọn repo GitHub của bạn, Runtime **Docker**, Plan **Free**).
3. Trong mục **Environment Variables**, thêm 4 biến:
   - `ADMIN_PASSWORD` = *(mật khẩu mạnh bạn tự đặt để đăng nhập Studio)*
   - `SESSION_SECRET` = *(chuỗi bí mật ngẫu nhiên dài >= 32 ký tự, hoặc Render tự sinh nếu dùng Blueprint)*
   - `UPSTASH_REDIS_REST_URL` = *(dán từ Bước 1)*
   - `UPSTASH_REDIS_REST_TOKEN` = *(dán từ Bước 1)*
4. Bấm **Deploy**. Sau 2–3 phút, bạn sẽ có đường link HTTPS chính thức `https://specpage-studio.onrender.com`:
   - Bạn mở `/` -> nhập `ADMIN_PASSWORD` -> thiết kế cho khách (mọi thay đổi tự động ghi nhớ vào Upstash!).
   - Gửi khách link `https://.../clients/<slug>/index.html` hoặc `https://.../?mode=review&slug=<slug>`.

*(Mẹo giữ Render Free không bị ngủ 15 phút: bạn có thể tạo monitor miễn phí tại UptimeRobot ping URL `/api/health` mỗi 5–10 phút).*

---

## 3. Chạy trên máy cá nhân (`localhost`)

```bash
# Cài đặt thư viện
npm install

# Chạy máy chủ phát triển
npm run dev

# Hoặc build & chạy Production Server
npm run build
npm start
```
Lần đầu mở `http://localhost:5173/` (hoặc `http://localhost:3000/`), nếu chưa đặt `ADMIN_PASSWORD` trong `.env`, Studio sẽ hiện màn hình cho bạn **tạo mật khẩu quản trị lần đầu** ngay trên trình duyệt.
