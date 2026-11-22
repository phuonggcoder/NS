# SpecPage Studio — Trình Tạo & Xuất Bản Landing Page Theo Chuẩn Spec-Driven (`speckit.org`)

SpecPage Studio giúp bạn thiết kế, tùy biến cấu trúc/giao diện, dùng AI điền tự động & kiểm lỗi, gửi mẫu cho khách hàng thật duyệt trực tiếp và xuất bản thành trang web HTML độc lập.

---

## 1. Các tính năng chính

- **Kiến trúc Spec-Driven (Spec Kit)**: Toàn bộ trang web được quản lý bởi `LandingPageSpec` (`spec.md` & `landing-spec.json`) trong [specs/](specs/) và [.specify/](.specify/).
- **AI Trợ lý tích hợp**:
  - **AI Tự động điền**: Dán thông tin thô của khách hàng (bài Facebook/Zalo, CV, bảng giá, FAQ, SĐT/Email) -> AI bóc tách, cho phép chọn phần áp dụng & xem thử trước khi lưu.
  - **AI Kiểm tra & Gợi ý sửa (Xem thử / Chấp nhận / Từ chối)**: Tự động quét lỗi chính tả tiếng Việt, kiểm tra tương phản màu WCAG (tránh chữ bị chìm khi đổi nền Sáng/Tối), lỗi link neo `#anchor`, cân đối lưới sản phẩm và SEO.
  - **Tùy chọn AI Cục bộ miễn phí** (chạy ngay không cần API key) hoặc kết nối **Google Gemini / OpenAI API** cá nhân.
- **Bảo vệ tương phản & Tùy biến sâu**:
  - 8 bộ theme chuyên nghiệp, 9 font chữ tối ưu tiếng Việt, kiểm tra WCAG trực tiếp + nút **Tự động sửa tương phản**.
  - 13 loại khối giao diện (bao gồm **Thư viện Ảnh / Dự án** `gallery`), tùy chỉnh màu nền/chữ riêng cho từng khối, độ rộng khối, căn lề và CSS tùy biến.
- **Quy trình làm việc cho Khách hàng thật**:
  - **Quản lý nhiều dự án khách hàng**: Tạo dự án theo từng khách (`Nháp → Chờ khách duyệt → Đã duyệt → Đã xuất bản`).
  - **Chế độ Gửi khách Duyệt mẫu (`/?mode=review&slug=<slug>`)**: Khách hàng xem thử trên Desktop/Mobile, bấm **Duyệt mẫu này** hoặc gửi góp ý gắn theo từng khối về Studio.
  - **Trang khách hàng xuất bản (`/clients/<slug>/index.html` & `/site.html`)**: File HTML độc lập kèm Form đặt mua hàng tính tổng tiền tự động.

---

## 2. Chạy Development & Kiểm tra

```bash
# Cài đặt thư viện
npm install

# Chạy máy chủ phát triển (Studio + API xuất bản)
npm run dev

# Kiểm tra TypeScript & build bản Production
npm run build
```

Mở trình duyệt:
- Studio chỉnh sửa: `http://localhost:5173/`
- Chế độ khách hàng Live: `http://localhost:5173/?mode=live`
- Chế độ gửi khách duyệt mẫu: `http://localhost:5173/?mode=review&slug=du-an-mau`
- Trang HTML tĩnh đã xuất bản: `http://localhost:5173/site.html`

---

## 3. Xuất bản & Chạy Production

### Cách 1: Chạy trực tiếp bằng Node Production Server (`server.mjs`) — Đầy đủ tính năng API
Phục vụ giao diện Studio, trang khách hàng tĩnh (`/site.html`, `/clients/<slug>/index.html`), nhận đơn hàng (`/api/orders`) và phản hồi duyệt mẫu (`/api/feedback`):

```bash
npm run build
npm start
# Mặc định chạy ở http://localhost:3000/ (có thể đổi PORT trong .env)
```

### Cách 2: Chạy bằng Docker
```bash
docker build -t specpage-studio .
docker run -p 3000:3000 -v $(pwd)/public:/app/public -v $(pwd)/data:/app/data specpage-studio
```

### Cách 3: Deploy Frontend tĩnh lên Vercel / Netlify hoặc Hosting riêng
- Đã cấu hình sẵn `vercel.json` và `netlify.toml`.
- Hoặc tải file `<slug>.html` trong mục **Gửi khách & Xuất bản** để upload trực tiếp lên bất kỳ hosting nào (GitHub Pages, Cloudflare Pages, cPanel...).
