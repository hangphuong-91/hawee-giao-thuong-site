# giaothuong.hawee.vn — Thư viện Bản Tin Giao Thương HAWEE

Trang thư viện tĩnh lưu trữ các số Bản Tin Giao Thương HAWEE theo tháng.

**Live:** [giaothuong.hawee.vn](https://giaothuong.hawee.vn)
**Repo nội dung & automation:** [hangphuong-91/hawee-giao-thuong-news](https://github.com/hangphuong-91/hawee-giao-thuong-news)

---

## Cách hoạt động

- Gallery đọc dữ liệu từ `data/archive.json` — mỗi entry là 1 số bản tin
- Mỗi số bản tin có trang riêng (`archive/thang-X-2026.html`) nhúng design Canva qua iframe
- Khi người thiết kế sửa design trong Canva → site tự cập nhật nội dung (không cần redeploy)
- Ảnh bìa cố định: `media/archive/archive-cover.png` (kích thước 1122 × 1402 px, tỉ lệ 4:5)

---

## Thêm số bản tin mới

**Tự động** — người thiết kế không cần đụng vào repo này.

1. Người thiết kế publish design trên Canva, lấy embed code (Share → More → Embed)
2. Người thiết kế điền **Google Form "BE-HAWEE Bản Tin Giao Thương"** (Kỳ Phát Hành `YYYY-MM` + Embed Code) → Submit
3. Apps Script tự động tạo trang HTML + cập nhật `archive.json` + push GitHub → Vercel deploy

Nếu Apps Script thất bại: xem phần "Runbook đồng bộ thủ công" trong [`CLAUDE.md`](./CLAUDE.md).

---

## Chạy local

```bash
npx serve .
```

Mở `http://localhost:3000`. Không cần `npm install`, không có build step.
**Không mở `index.html` trực tiếp** — trình duyệt chặn `fetch()` qua `file://`.

---

## Deploy

Push lên `master` → Vercel tự deploy production.
Project Vercel: `hawee-giao-thuong-site` (`prj_8QruDBbvXvbnUvpsBdcBDMJOjkKj`)
