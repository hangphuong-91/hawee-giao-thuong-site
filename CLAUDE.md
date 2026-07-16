# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc với repo này.

## Repo này là gì

`hawee-giao-thuong-site` là **trang thư viện (archive) tĩnh** cho Bản Tin Giao Thương HAWEE — chỉ hiển thị ảnh bìa + link tới từng số bản tin đã phát hành. Domain thật: `giaothuong.hawee.vn`.

## Repo này KHÔNG làm gì

- Không sản xuất nội dung bản tin hàng tháng (việc đó nằm trong Canva).
- Không có trang đọc chi tiết từng bài/chương trình (đã chuyển hẳn qua Canva).
- Không gọi Canva Autofill/Data Merge.
- Không phải nơi publish chính thức của bản tin (nơi publish chính là nút **"Publish as website"** trong Canva).

## Toàn bộ pipeline (phần lớn nằm ngoài repo này)

1. Chi hội nộp tin qua **Google Form "Chi Hội Nộp Tin"** → đổ vào **Google Sheet**.
2. **Người kiểm tin** duyệt nội dung trong Sheet.
3. **Người thiết kế** tạo design trong Canva từ nội dung đã duyệt (tên design: `Bản Tin Giao Thương Tháng X/YYYY`).
4. Người thiết kế bấm **"Publish as website"** trong Canva + lấy embed code (Share → More → Embed).
5. Người thiết kế điền **Google Form "BE-HAWEE Bản Tin Giao Thương"** (https://docs.google.com/forms/d/1NCvTCV4od5KF2MJnMEWL_Gl8anEh6sBcGRdpEf-kh6g/edit — 2 trường: Kỳ Phát Hành `YYYY-MM`, Embed Code). **Đây là bước cuối của người thiết kế** — không cần Git, không cần làm thêm gì.
6. **(TỰ ĐỘNG — Apps Script)** Ngay khi Form submit, Apps Script đọc phản hồi → tạo `archive/thang-X-YYYY.html` → cập nhật `data/archive.json` → push GitHub **(repo này)** → Vercel auto-deploy. Không cần ai can thiệp thủ công.
7. (Độc lập, không chặn) Người thiết kế move design vào folder Canva **"Đã Publish"** (ID: `FAHOttyBecM`) để lưu trữ — làm bất cứ lúc nào, không ảnh hưởng tới site.

**Lưu ý:** có 2 Google Form khác nhau — Form ở Bước 1 (chi hội nộp tin thô, đầu quy trình) và Form ở Bước 5 (người thiết kế bàn giao embed code, kích hoạt tự động hóa). Đừng nhầm khi troubleshoot.

## Cấu trúc file

- `index.html` — trang gallery, đọc dữ liệu từ `data/archive.json` qua `js/archive.js`. Giữ nguyên phần head/header/footer (font Montserrat, theme màu thương hiệu, glass dark background) từ bản gốc.
- `data/archive.json` — nguồn dữ liệu duy nhất cho cả site lẫn runbook đồng bộ. Field `id` dùng làm khoá chống trùng.
- `archive/thang-6-2026.html` — bản đông cứng của bản tin tháng 6/2026 (bản HTML thủ công cuối cùng, trước khi chuyển qua Canva) — giữ lại làm link cố định.
- `media/archive/` — ảnh bìa đã tải về, dùng cho từng entry trong `archive.json` (không lưu URL Canva trực tiếp vì URL thumbnail có thể hết hạn).
- `media/banner-thang-5/`, `media/banner-thang-6/` — ảnh banner cũ, được `archive/thang-6-2026.html` tham chiếu tới, giữ nguyên không xoá.
- `fonts/MonaSans_*.ttf` — **hiện không được dùng** (site dùng Google Fonts Montserrat). Giữ lại phòng khi đổi bộ nhận diện, không phải lỗi.

## Runbook đồng bộ thủ công (chỉ dùng khi Apps Script thất bại)

**Trường hợp bình thường:** Apps Script tự động xử lý sau khi người thiết kế submit Form "BE-HAWEE Bản Tin Giao Thương". Không cần chạy runbook này.

**Dùng runbook này khi:** Apps Script báo lỗi, tháng mới chưa xuất hiện trên site sau 5 phút, hoặc cần thêm tháng cũ bị bỏ sót.

Lấy `period` (Kỳ Phát Hành `YYYY-MM`) + `embed code` từ tab **Responses** của Form (https://docs.google.com/forms/d/1NCvTCV4od5KF2MJnMEWL_Gl8anEh6sBcGRdpEf-kh6g/edit), rồi thực hiện thủ công:

1. Tạo `archive/thang-X-YYYY.html`: copy `archive/thang-7-2026.html`, thay embed code + cập nhật 3 chỗ ghi tháng (`<title>`, `.hdr-pill`, `.footer-bottom`), giữ nguyên `max-width: 960px`.
2. Thêm entry vào **đầu** mảng `data/archive.json → issues[]`:
   ```json
   {
     "id": "thang-X-YYYY",
     "period": "Tháng X/YYYY",
     "period_sort": "YYYY-0X",
     "source": "canva",
     "canva_design_id": "DAHxxxxxxxx",
     "canva_view_url": null,
     "link_url": "archive/thang-X-YYYY.html",
     "cover_image": "media/archive/archive-cover.png",
     "published_at": "YYYY-MM-DD"
   }
   ```
   Cập nhật `meta.last_synced_at` (ISO format `+07:00`).
3. `git add archive/thang-X-YYYY.html data/archive.json` → commit → `git push origin master`. Không dùng `git add -A`.

Vercel tự deploy sau ~30 giây.

### Cách 2 (khuyên dùng khi có embed code): nhúng thiết kế ngay trên site, thay vì chỉ link ra Canva

Canva cho phép lấy đoạn **embed code** (Share → More → Embed) — 1 div wrapper co giãn theo tỉ lệ + 1 iframe. Nhúng cách này giữ người xem ở lại `giaothuong.hawee.vn` (có header/footer thương hiệu bao quanh) thay vì bấm ra ngoài canva.com. Đã kiểm chứng bằng Puppeteer: iframe tải đúng nội dung thật, container co giãn đúng tỉ lệ trên mobile lẫn desktop.

Cách làm:
1. Trong Canva, mở design đã publish → Share → More → Embed → copy nguyên đoạn code (div + iframe). **Không tự tính lại số `padding-top`** — mỗi design có tỉ lệ khung hình riêng, dùng đúng số Canva đưa ra.
2. Tạo file `archive/thang-X-2026.html`: copy phần `<head>` + `<header class="hdr">` + `<footer class="footer">` từ `archive/thang-6-2026.html` (giữ nguyên branding), phần nội dung giữa header/footer thay bằng:
   ```html
   <div class="embed-wrap">
     <!-- dán nguyên đoạn embed code Canva vào đây -->
   </div>
   <div class="embed-attr"><!-- dòng attribution "by ..." Canva yêu cầu giữ lại, không xoá --></div>
   <a class="back-link" href="../index.html">← Quay lại thư viện</a>
   ```
   CSS cần thêm: `.embed-wrap { max-width: 720px; margin: 0 auto; padding: 32px 16px 8px; }`
3. Trong `archive.json`, set `"link_url": "archive/thang-X-2026.html"` và để `"canva_view_url": null` — gallery ưu tiên `link_url` khi có (xem `js/archive.js`, dòng `issue.link_url || issue.canva_view_url`).

**Lưu ý quan trọng:** design phải bật chia sẻ "Anyone with the link can view" thì iframe mới tải được nội dung. Vì repo này **Public** trên GitHub và sẽ deploy public, **chỉ nhúng bản đã chốt/đã duyệt** — không nhúng design còn nháp hoặc chứa nội dung nội bộ chưa công khai (ảnh hội viên, số liệu chưa công bố...), vì URL trang sẽ hiển thị được với bất kỳ ai có link, kể cả trước khi bạn chủ động công bố.

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
