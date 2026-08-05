const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const SUBMISSIONS = path.join(ROOT, 'submissions');
const ARCHIVE_JSON = path.join(ROOT, 'data', 'archive.json');
const ARCHIVE_DIR = path.join(ROOT, 'archive');
const MEDIA_DIR = path.join(ROOT, 'media', 'archive');

function parseId(period) {
  const m = period.match(/Tháng\s+(\d+)\/(\d{4})/i);
  if (!m) throw new Error('Period không đúng format: ' + period);
  return `thang-${m[1]}-${m[2]}`;
}

function parseSort(period) {
  const m = period.match(/Tháng\s+(\d+)\/(\d{4})/i);
  return `${m[2]}-${m[1].padStart(2, '0')}`;
}

function parsePillHtml(period) {
  const m = period.match(/Tháng\s+(\d+)\/(\d{4})/i);
  return `THÁNG ${m[1]} <span>·</span> ${m[2]}`;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch(e){}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (e) => { file.close(); try{fs.unlinkSync(dest);}catch(x){} reject(e); });
  });
}

function buildHtml(period, embedSrc, paddingTop, attrHref) {
  const pill = parsePillHtml(period);
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

.hdr{flex-shrink:0;background:linear-gradient(125deg,#0D2248 0%,#3A1070 22%,#8A1060 44%,#C9187F 62%,#E8456A 78%,#FF7B4A 100%);height:60px;display:flex;align-items:center;padding:0 16px;gap:12px}
.hdr-back{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:rgba(255,255,255,.7);white-space:nowrap;flex-shrink:0;transition:color .15s}
.hdr-back:hover{color:#fff}
.hdr-main{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0}
.hdr-logo{height:22px;width:auto}
.hdr-label{font-size:8.5px;font-weight:700;letter-spacing:.1em;color:rgba(255,255,255,.5);text-transform:uppercase}
.hdr-pill{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:100px;font-size:10.5px;font-weight:700;letter-spacing:.06em;color:#fff;text-transform:uppercase;white-space:nowrap}
.hdr-pill span{opacity:.4}

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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    Thư viện
  </a>
  <div class="hdr-main">
    <img src="../img/hawee-logo-white.png" alt="HAWEE" class="hdr-logo">
    <div class="hdr-label">Bản Tin Giao Thương</div>
  </div>
  <div class="hdr-pill">${pill}</div>
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

// ── MAIN ──
const files = fs.readdirSync(SUBMISSIONS).filter(f => f.endsWith('.json'));
if (files.length === 0) { console.log('Không có submission.'); process.exit(0); }

const archive = JSON.parse(fs.readFileSync(ARCHIVE_JSON, 'utf8'));

(async () => {
  for (const file of files) {
    const fp = path.join(SUBMISSIONS, file);
    let d;
    try { d = JSON.parse(fs.readFileSync(fp, 'utf8')); }
    catch(e) { console.error(`Lỗi đọc ${file}:`, e.message); continue; }

    const { period, embed_src, embed_padding, attr_href, design_id } = d;
    if (!period || !embed_src) { console.error(`${file}: thiếu period hoặc embed_src`); continue; }

    let id;
    try { id = parseId(period); } catch(e) { console.error(e.message); continue; }

    if (archive.issues.find(i => i.id === id)) {
      console.log(`${id} đã có, bỏ qua.`);
      fs.unlinkSync(fp); continue;
    }

    const paddingTop = embed_padding || '381.5520';
    const coverFile = `${id}-cover.png`;
    const coverDest = path.join(MEDIA_DIR, coverFile);

    // Thử tải ảnh bìa từ Canva
    let coverOk = false;
    if (design_id) {
      try {
        await downloadFile(`https://www.canva.com/design/${design_id}/thumbnail`, coverDest);
        coverOk = true;
        console.log(`Ảnh bìa: ${coverFile}`);
      } catch(e) {
        console.log(`Không tải được ảnh bìa (${e.message}) — dùng placeholder.`);
      }
    }
    if (!coverOk) {
      // dùng placeholder từ tháng 7 nếu có
      const ph = path.join(MEDIA_DIR, 'thang-7-2026-cover.png');
      if (fs.existsSync(ph)) fs.copyFileSync(ph, coverDest);
    }

    // Tạo trang HTML
    const html = buildHtml(period, embed_src, paddingTop, attr_href || embed_src.replace('?embed',''));
    fs.writeFileSync(path.join(ARCHIVE_DIR, `${id}.html`), html, 'utf8');
    console.log(`Tạo: archive/${id}.html`);

    // Cập nhật archive.json
    archive.issues.unshift({
      id, period,
      period_sort: parseSort(period),
      source: 'canva',
      canva_design_id: design_id || null,
      canva_view_url: null,
      link_url: `archive/${id}.html`,
      cover_image: `media/archive/${coverFile}`,
      published_at: new Date().toISOString().split('T')[0]
    });
    archive.meta.last_synced_at = new Date().toISOString();
    fs.writeFileSync(ARCHIVE_JSON, JSON.stringify(archive, null, 2), 'utf8');

    fs.unlinkSync(fp);
    console.log(`✅ Đã publish: ${period}`);
  }
})();
