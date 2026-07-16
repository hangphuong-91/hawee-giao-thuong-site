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
html{font-size:16px}
body{font-family:'Montserrat','Inter',system-ui,sans-serif;background:#F2EDE8;color:#1A1A1A;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}img{display:block}
:root{--mg:#C9187F;--mg-dk:#8A1060}
.hdr{background:linear-gradient(125deg,#0D2248 0%,#3A1070 22%,#8A1060 44%,#C9187F 62%,#E8456A 78%,#FF7B4A 100%)}
.ticker{background:rgba(0,0,0,.22);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.ticker::-webkit-scrollbar{display:none}
.t-row{display:flex;align-items:center;padding:8px 20px;width:max-content;min-width:100%;gap:0}
.t-chip{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;letter-spacing:.04em;color:rgba(255,255,255,.8);white-space:nowrap;padding-right:16px}
.t-chip b{font-size:14px;font-weight:800;color:#fff;line-height:1}
.t-sep{color:rgba(255,255,255,.2);font-size:14px;padding-right:16px}
.hdr-body{padding:28px 20px 32px;display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.hdr-logo img{height:38px;width:auto}
.hdr-title{font-size:clamp(24px,6.5vw,52px);font-weight:800;letter-spacing:-.01em;line-height:1;color:#fff;text-shadow:0 2px 24px rgba(0,0,0,.2)}
.hdr-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:100px;font-size:12px;font-weight:700;letter-spacing:.06em;color:rgba(255,255,255,.9);text-transform:uppercase}
.hdr-pill span{opacity:.5}
.hdr-rule{height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3) 30%,rgba(255,255,255,.5) 50%,rgba(255,255,255,.3) 70%,transparent)}
.embed-wrap{max-width:960px;margin:0 auto;padding:32px 16px 8px}
.embed-attr{text-align:center;font-size:11px;color:#8C7F76;padding:4px 16px 4px}
.embed-attr a{text-decoration:underline;color:inherit}
.back-link{display:block;text-align:center;padding:20px 16px 40px;font-size:13px;font-weight:600;color:var(--mg);text-decoration:underline}
.back-link:hover{opacity:.75}
.footer{background:linear-gradient(135deg,#0D2248,#3A1070);color:#fff;padding:40px 20px 0}
.footer-inner{max-width:900px;margin:0 auto;display:flex;flex-wrap:wrap;gap:32px 48px;padding-bottom:32px}
.footer-brand{flex:1;min-width:220px}
.f-logo{height:36px;width:auto;margin-bottom:14px}
.f-tagline{font-size:13px;font-weight:700;color:rgba(255,255,255,.9);margin-bottom:8px}
.f-desc{font-size:12px;color:rgba(255,255,255,.5);line-height:1.7}
.footer-contact{flex:1;min-width:220px}
.f-contact-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:12px}
.f-hotline{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.f-hotline-dot{width:36px;height:36px;background:rgba(201,24,127,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.f-hotline-num{font-size:16px;font-weight:800;color:#fff}
.f-hotline-sub{font-size:11px;color:rgba(255,255,255,.4)}
.f-contact-info{font-size:12.5px;color:rgba(255,255,255,.55);line-height:1.8}
.f-contact-info strong{display:block;color:rgba(255,255,255,.9);font-weight:700}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);text-align:center;padding:16px 20px;font-size:11px;color:rgba(255,255,255,.3);letter-spacing:.04em}
</style>
</head>
<body>
<svg style="display:none"><defs>
  <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l.77-.77a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </symbol>
</defs></svg>

<header class="hdr">
  <div class="ticker"><div class="t-row">
    <div class="t-chip"><b>${period.toUpperCase()}</b></div>
    <span class="t-sep">·</span>
    <div class="t-chip">Ban Giao Thương HAWEE</div>
    <span class="t-sep">·</span>
    <div class="t-chip">Phát hành tuần đầu tháng</div>
  </div></div>
  <div class="hdr-body">
    <div class="hdr-logo"><img src="../img/hawee-logo-white.png" alt="HAWEE"></div>
    <div class="hdr-title">BẢN TIN GIAO THƯƠNG</div>
    <div class="hdr-pill">${parsePillHtml(period)}</div>
  </div>
  <div class="hdr-rule"></div>
</header>

<div class="embed-wrap">
  <div style="position:relative;width:100%;height:0;padding-top:${paddingTop}%;padding-bottom:0;box-shadow:0 2px 8px 0 rgba(63,69,81,0.16);margin-top:1.6em;margin-bottom:0.9em;overflow:hidden;border-radius:8px;will-change:transform;">
    <iframe loading="lazy" style="position:absolute;width:100%;height:100%;top:0;left:0;border:none;padding:0;margin:0;"
      src="${embedSrc}" allowfullscreen="allowfullscreen" allow="fullscreen"></iframe>
  </div>
</div>
<div class="embed-attr">
  <a href="${attrHref}" target="_blank" rel="noopener">BẢN TIN GIAO THƯƠNG</a> by Engeleinvonb
</div>
<a class="back-link" href="../index.html">← Quay lại thư viện</a>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="../img/hawee-logo-white.png" alt="HAWEE" class="f-logo">
      <div class="f-tagline">Kết nối cơ hội — Mở rộng thị trường<br>Nâng tầm năng lực doanh nghiệp</div>
      <div class="f-desc">Ban Giao Thương HAWEE tổng hợp và cập nhật các cơ hội học tập, giao thương và kết nối thị trường dành cho hội viên. Bản tin phát hành tuần đầu tiên mỗi tháng.</div>
    </div>
    <div class="footer-contact">
      <div class="f-contact-label">Liên hệ</div>
      <div class="f-hotline">
        <div class="f-hotline-dot"><svg width="18" height="18" style="color:#fff"><use href="#i-phone"/></svg></div>
        <div><div class="f-hotline-num">091 947 99 55</div><div class="f-hotline-sub">Hotline HAWEE</div></div>
      </div>
      <div class="f-contact-info">
        <strong>Ban Giao Thương HAWEE</strong>
        Hội Nữ Doanh Nhân TP.HCM<br>
        <a href="https://www.hawee.vn" target="_blank" style="color:inherit;text-decoration:underline">hawee.vn</a> · Ms. Anh Thơ: 0968 734 119
      </div>
    </div>
  </div>
  <div class="footer-bottom">Bản Tin Giao Thương HAWEE · ${period} · Lưu hành nội bộ hội viên</div>
</footer>
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
