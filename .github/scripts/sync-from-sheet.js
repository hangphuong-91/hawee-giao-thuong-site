// Đọc CSV từ Google Sheet đã publish, tạo HTML + cập nhật archive.json cho mỗi tháng mới
const fs   = require('fs');
const path = require('path');
const https = require('https');

const ROOT        = path.join(__dirname, '../..');
const ARCHIVE_JSON = path.join(ROOT, 'data', 'archive.json');
const ARCHIVE_DIR  = path.join(ROOT, 'archive');

const SHEET_CSV_URL = process.env.SHEET_CSV_URL;
if (!SHEET_CSV_URL) { console.error('Thiếu SHEET_CSV_URL'); process.exit(1); }

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
        return fetchText(res.headers.location).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = splitCsvRow(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = splitCsvRow(l);
    const row = {};
    headers.forEach((h, i) => row[h.trim()] = (vals[i] || '').trim());
    return row;
  });
}

function splitCsvRow(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur); cur = '';
    } else cur += ch;
  }
  result.push(cur);
  return result;
}

function parsePeriod(raw) {
  raw = raw.trim();
  const m1 = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (m1) return `Tháng ${parseInt(m1[2])}/${m1[1]}`;
  // "Tháng 10/ 2026" hoặc "Tháng 10/2026"
  const m2 = raw.match(/Tháng\s*(\d+)\s*\/\s*(\d{4})/i);
  if (m2) return `Tháng ${parseInt(m2[1])}/${m2[2]}`;
  throw new Error('Period sai format: ' + raw);
}

function parseId(period) {
  const m = period.match(/Tháng\s+(\d+)\/(\d{4})/i);
  if (!m) throw new Error('Không parse được id: ' + period);
  return `thang-${m[1]}-${m[2]}`;
}

function parseSort(period) {
  const m = period.match(/Tháng\s+(\d+)\/(\d{4})/i);
  return `${m[2]}-${m[1].padStart(2,'0')}`;
}

function parseEmbedSrc(html) {
  const m = html.match(/src="([^"]*canva\.com[^"]*)"/);
  return m ? m[1] : null;
}

function parseAttrHref(html) {
  // decode HTML entities in href
  const m = html.match(/href="(https:\/\/www\.canva\.com\/design\/[^"]+)"/);
  if (!m) return '';
  return m[1].replace(/&#x2F;/g, '/').replace(/&amp;/g, '&').replace(/&#47;/g, '/');
}

function parseDesignId(src) {
  const m = (src||'').match(/\/design\/([A-Za-z0-9_-]+)\//);
  return m ? m[1] : null;
}

function buildHtml(period, embedSrc, attrHref) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bản Tin Giao Thương HAWEE · ${period}</title>
<script defer src="/_vercel/insights/script.js"></script>
<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","x00f0izt9n");</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden;display:flex;flex-direction:column}
@supports(height:100dvh){html,body{height:100dvh}}
body{font-family:'Montserrat','Inter',system-ui,sans-serif;background:#0D2248;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}img{display:block}
.hdr{flex-shrink:0;height:44px;background:linear-gradient(125deg,#0D2248 0%,#3A1070 25%,#8A1060 50%,#C9187F 70%,#E8456A 85%,#FF7B4A 100%);display:flex;align-items:center;padding:0 16px}
.hdr-back{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:100px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.8);transition:background .2s,color .2s}
.hdr-back:hover{background:rgba(255,255,255,.18);color:#fff}
.embed-area{flex:1;position:relative;overflow:hidden}
.embed-area iframe{position:absolute;inset:0;width:100%;height:100%;border:none}
.ftr{flex-shrink:0;height:38px;background:#0B1E40;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 16px;gap:8px}
.ftr-period{font-size:10.5px;color:rgba(255,255,255,.3);letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ftr-attr{font-size:10.5px;color:rgba(255,255,255,.25);white-space:nowrap;flex-shrink:0}
.ftr-attr a{color:rgba(255,255,255,.35);text-decoration:underline}
.ftr-attr a:hover{color:rgba(255,255,255,.6)}
</style>
</head>
<body>
<header class="hdr">
  <a href="../index.html" class="hdr-back">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    Thư viện
  </a>
</header>
<div class="embed-area">
  <iframe src="${embedSrc}" allowfullscreen="allowfullscreen" allow="fullscreen" loading="lazy"></iframe>
</div>
<div class="ftr">
  <span class="ftr-period">Bản Tin Giao Thương HAWEE · ${period} · Lưu hành nội bộ hội viên</span>
  <span class="ftr-attr"><a href="${attrHref}" target="_blank" rel="noopener">Xem trên Canva</a></span>
</div>
</body>
</html>`;
}

(async () => {
  const csv = await fetchText(SHEET_CSV_URL);
  const rows = parseCsv(csv);
  const archive = JSON.parse(fs.readFileSync(ARCHIVE_JSON, 'utf8'));
  const existingIds = new Set(archive.issues.map(i => i.id));

  let added = 0;
  for (const row of rows) {
    const kyRaw    = row['Kỳ Phát Hành'] || row['Ky Phat Hanh'] || '';
    const embedHtml = row['Embed Code'] || '';
    if (!kyRaw || !embedHtml) continue;

    let period, id;
    try { period = parsePeriod(kyRaw); id = parseId(period); }
    catch(e) { console.warn('Bỏ qua dòng lỗi:', e.message); continue; }

    if (existingIds.has(id)) { console.log(`${id} đã có, bỏ qua.`); continue; }

    const embedSrc = parseEmbedSrc(embedHtml);
    if (!embedSrc) { console.warn(`${id}: không parse được embed src`); continue; }

    const attrHref = parseAttrHref(embedHtml);
    const designId = parseDesignId(embedSrc);

    fs.writeFileSync(path.join(ARCHIVE_DIR, `${id}.html`), buildHtml(period, embedSrc, attrHref), 'utf8');

    archive.issues.unshift({
      id, period,
      period_sort: parseSort(period),
      source: 'canva',
      canva_design_id: designId,
      canva_view_url: null,
      link_url: `archive/${id}.html`,
      cover_image: 'media/archive/archive-cover.png',
      published_at: new Date().toISOString().split('T')[0]
    });
    existingIds.add(id);
    added++;
    console.log(`✅ Tạo: ${id}`);
  }

  if (added > 0) {
    archive.meta.last_synced_at = new Date().toISOString();
    fs.writeFileSync(ARCHIVE_JSON, JSON.stringify(archive, null, 2), 'utf8');
    console.log(`Đã thêm ${added} bản tin mới.`);
  } else {
    console.log('Không có bản tin mới.');
  }
})();
