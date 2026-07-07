# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc với repo này.

## Repo này là gì

`hawee-giao-thuong-site` là **trang thư viện (archive) tĩnh** cho Bản Tin Giao Thương HAWEE — chỉ hiển thị ảnh bìa + link tới từng số bản tin đã phát hành. Domain thật: `giaothuong.hawee.vn`.

## Repo này KHÔNG làm gì

- Không sản xuất nội dung bản tin hàng tháng (việc đó nằm trong Canva).
- Không có trang đọc chi tiết từng bài/chương trình (đã chuyển hẳn qua Canva).
- Không đọc/ghi Google Form hay Google Sheet.
- Không gọi Canva Autofill/Data Merge.
- Không phải nơi publish chính thức của bản tin (nơi publish chính là nút **"Publish as website"** trong Canva).

## Toàn bộ pipeline (phần lớn nằm ngoài repo này)

1. Chi hội nộp tin qua **Google Form** → đổ vào **Google Sheet**.
2. **Người kiểm tin** duyệt nội dung trong Sheet.
3. Agent chuyển nội dung đã duyệt thành dataset đúng schema, gọi **Canva Autofill** (`create-design-from-brand-template`) để tự sinh 1 thiết kế mới đã điền sẵn nội dung.
4. **Người thiết kế** mở thiết kế vừa sinh ra trong Canva, chỉnh nhẹ nếu lỗi bố cục.
5. Người thiết kế bấm **"Publish as website"** ngay trong Canva — đây là bước publish chính, không cần code.
6. Người thiết kế di chuyển thiết kế hoàn chỉnh vào folder Canva **"Đã Publish"** (ID: `FAHOttyBecM`) — hành động này vừa là chỗ lưu trữ, vừa là tín hiệu cho bước 7.
7. **(Repo này)** Runbook đồng bộ bên dưới được chạy — thủ công, không có lịch tự động — để mirror số bản tin mới vào `data/archive.json`, làm bản sao lưu độc lập, không chặn bước 5.

## Cấu trúc file

- `index.html` — trang gallery, đọc dữ liệu từ `data/archive.json` qua `js/archive.js`. Giữ nguyên phần head/header/footer (font Montserrat, theme màu thương hiệu, glass dark background) từ bản gốc.
- `data/archive.json` — nguồn dữ liệu duy nhất cho cả site lẫn runbook đồng bộ. Field `id` dùng làm khoá chống trùng.
- `archive/thang-6-2026.html` — bản đông cứng của bản tin tháng 6/2026 (bản HTML thủ công cuối cùng, trước khi chuyển qua Canva) — giữ lại làm link cố định.
- `media/archive/` — ảnh bìa đã tải về, dùng cho từng entry trong `archive.json` (không lưu URL Canva trực tiếp vì URL thumbnail có thể hết hạn).
- `media/banner-thang-5/`, `media/banner-thang-6/` — ảnh banner cũ, được `archive/thang-6-2026.html` tham chiếu tới, giữ nguyên không xoá.
- `fonts/MonaSans_*.ttf` — **hiện không được dùng** (site dùng Google Fonts Montserrat). Giữ lại phòng khi đổi bộ nhận diện, không phải lỗi.

## Runbook đồng bộ Canva → archive.json (chạy thủ công)

Chạy ngay sau khi vừa publish xong 1 số bản tin trên Canva (không có lịch tự động — chạy khi được yêu cầu):

1. `list-folder-items` trên folder Canva **"Đã Publish"** (`folder_id: FAHOttyBecM`).
2. Với mỗi design trả về: suy ra `id` từ tiêu đề design (regex `Tháng (\d+)[/\-](\d{4})` → `thang-{d}-{yyyy}`).
3. So với `data/archive.json → issues[].id` — bỏ qua nếu đã có (đây chính là cơ chế "đã đồng bộ chưa", không cần file trạng thái riêng).
4. Với design mới: `get-design` (xác nhận tên/id/pages), `get-design-thumbnail` (lấy ảnh bìa) — **tải hẳn ảnh về và lưu vào `media/archive/<id>-cover.jpg`**, không lưu thẳng URL Canva (URL có thể hết hạn).
5. Thêm entry mới vào `data/archive.json → issues[]` theo đúng schema bên dưới, cập nhật `meta.last_synced_at` / `meta.last_sync_status`.
6. `git add` đúng các file thay đổi (không `git add -A`) → `git commit -m "sync: archive N số mới từ Canva"` → `git push`. Vercel đã nối GitHub nên push xong là tự deploy.

**Giới hạn cần biết:** link của entry sẽ trỏ tới URL xem thiết kế Canva gốc (`https://www.canva.com/design/{design_id}/view`), **không phải** link Canva Site đã publish (Canva không expose URL đó qua API). Nếu cần link Canva Site đẹp hơn, cần người kiểm tin dán link đó vào Sheet/nơi khác để agent lấy — hiện chưa có cơ chế này.

### Schema `data/archive.json`

```json
{
  "meta": { "title": "...", "last_synced_at": "ISO date", "last_sync_status": "ok" },
  "issues": [
    {
      "id": "thang-7-2026",
      "period": "Tháng 7/2026",
      "period_sort": "2026-07",
      "source": "canva",
      "canva_design_id": "DAFxxxxxxxxx",
      "canva_view_url": "https://www.canva.com/design/DAFxxxxxxxxx/view",
      "cover_image": "media/archive/thang-7-2026-cover.jpg",
      "published_at": "2026-07-05"
    }
  ]
}
```

`source: "legacy-html"` (chỉ dùng cho mục tháng 6/2026) dùng `link_url` thay vì `canva_view_url`/`canva_design_id` (đều để `null`).

## Việc cần làm thủ công (chưa tự động hoá được)

- Ảnh bìa cho mục **Tháng 6/2026** trong `archive.json` hiện đang tạm dùng banner "inter-trade-fair" (không phải ảnh chụp thật của trang) — nên thay bằng ảnh chụp màn hình thật của `archive/thang-6-2026.html` khi có thời gian.

## Chạy thử ở máy local

Không có build step, không cần `npm install`. **Phải chạy qua 1 static server** (không mở trực tiếp file `index.html`, vì trình duyệt chặn `fetch()` đọc `archive.json` qua giao thức `file://`):

```bash
npx serve .
```

rồi mở địa chỉ server in ra (mặc định `http://localhost:3000`).

## Deploy

Project Vercel: `hawee-giao-thuong-site` (`prj_8QruDBbvXvbnUvpsBdcBDMJOjkKj`), đã nối với GitHub repo — push lên `main` là tự động deploy production, không cần bước thủ công nào thêm.
