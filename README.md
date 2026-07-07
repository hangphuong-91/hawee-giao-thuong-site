# hawee-giao-thuong-site

Trang thư viện (archive) của Bản Tin Giao Thương HAWEE — hiển thị ảnh bìa + link tới từng số bản tin đã phát hành. Live tại [giaothuong.hawee.vn](https://giaothuong.hawee.vn).

Việc sản xuất và publish bản tin hàng tháng diễn ra hoàn toàn trong **Canva** (không cần code). Repo này chỉ là lớp lưu trữ/sao lưu chạy nền, độc lập với luồng publish chính.

Chi tiết toàn bộ pipeline và runbook đồng bộ: xem [`CLAUDE.md`](./CLAUDE.md).

## Chạy local

Không có build step, nhưng phải chạy qua static server (không mở trực tiếp file, trình duyệt sẽ chặn việc đọc `archive.json`):

```bash
npx serve .
```

## Deploy

Push lên `main` → Vercel tự động deploy production.
