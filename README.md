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

1. Người thiết kế publish design trên Canva, lấy embed code (Share → More → Embed)
2. Tạo `archive/thang-X-2026.html` — dùng `archive/thang-7-2026.html` làm template, thay embed code + cập nhật tháng trong header/footer
3. Cập nhật `data/archive.json` — thêm entry mới vào đầu mảng `issues[]`, dùng `"cover_image": "media/archive/archive-cover.png"`
4. `git add archive/thang-X-2026.html data/archive.json` → commit → push `master`
5. Vercel tự deploy sau ~30 giây

Chi tiết đầy đủ trong [`CLAUDE.md`](./CLAUDE.md).

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
