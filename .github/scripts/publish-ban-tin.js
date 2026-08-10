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

function buildHtmlPdf(period, id, attrHref) {
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
a{color:inherit;text-decoration:none}

.hdr{flex-shrink:0;height:44px;background:linear-gradient(125deg,#0D2248 0%,#3A1070 25%,#8A1060 50%,#C9187F 70%,#E8456A 85%,#FF7B4A 100%);display:flex;align-items:center;justify-content:space-between;padding:0 16px}
.hdr-back{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:100px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.8);transition:background .2s,color .2s}
.hdr-back:hover{background:rgba(255,255,255,.18);color:#fff}
.hdr-pg{font-size:11px;color:rgba(255,255,255,.45);font-variant-numeric:tabular-nums;letter-spacing:.02em}

.pdf-area{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.pdf-area::-webkit-scrollbar{width:3px}
.pdf-area::-webkit-scrollbar-track{background:transparent}
.pdf-area::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:2px}

.slide{width:100%}
.slide canvas{display:block}

.loading{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:80px 20px;color:rgba(255,255,255,.35);font-size:12px;letter-spacing:.04em;text-align:center;line-height:1.6}
.spinner{width:28px;height:28px;border:2px solid rgba(255,255,255,.08);border-top-color:rgba(201,24,127,.6);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

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
  <span class="hdr-pg" id="pg"></span>
</header>

<div class="pdf-area" id="area">
  <div class="loading" id="load"><div class="spinner"></div>Đang tải bản tin…</div>
</div>

<div class="ftr">
  <span class="ftr-period">Bản Tin Giao Thương HAWEE · ${period} · Lưu hành nội bộ hội viên</span>
  <span class="ftr-attr"><a id="canva-link" href="${attrHref}" target="_blank" rel="noopener">Xem trên Canva</a></span>
</div>

<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

var PDF_URL = '../media/slides/${id}.pdf';
var PERIOD = '${period}';
var CANVA_URL = '${attrHref}';

var area = document.getElementById('area');
var pgEl = document.getElementById('pg');
var total = 0;
var enterTimes = {};

function cl(ev, data) { if (typeof clarity === 'function') clarity('event', ev, data); }
function clSet(k, v) { if (typeof clarity === 'function') clarity('set', k, v); }

var obs = new IntersectionObserver(function(entries) {
  entries.forEach(function(e) {
    var n = +e.target.dataset.n;
    if (e.isIntersecting) {
      enterTimes[n] = Date.now();
      pgEl.textContent = n + ' / ' + total;
      cl('trang_' + n + '_hien');
      if (n === total) cl('doc_xong');
    } else if (enterTimes[n]) {
      var s = Math.round((Date.now() - enterTimes[n]) / 1000);
      if (s >= 2) cl('trang_' + n + '_doc', { giay: s });
      delete enterTimes[n];
    }
  });
}, { threshold: 0.5 });

window.addEventListener('pagehide', function() {
  Object.keys(enterTimes).forEach(function(n) {
    var s = Math.round((Date.now() - enterTimes[n]) / 1000);
    if (s >= 2) cl('trang_' + n + '_doc', { giay: s });
  });
});

document.getElementById('canva-link').addEventListener('click', function() { cl('xem_canva'); });

clSet('ban_tin', PERIOD);
pdfjsLib.getDocument(PDF_URL).promise.then(function(pdf) {
  total = pdf.numPages;
  var loadEl = document.getElementById('load');
  if (loadEl) loadEl.remove();
  cl('ban_tin_mo', { trang: total });

  var dpr = window.devicePixelRatio || 1;
  var W = area.offsetWidth || window.innerWidth;
  var chain = Promise.resolve();

  for (var i = 1; i <= total; i++) {
    (function(pageNum) {
      chain = chain.then(function() {
        return pdf.getPage(pageNum).then(function(page) {
          var vp = page.getViewport({ scale: 1 });
          var svp = page.getViewport({ scale: (W / vp.width) * dpr });
          var wrap = document.createElement('div');
          wrap.className = 'slide';
          wrap.dataset.n = pageNum;
          var cv = document.createElement('canvas');
          cv.width = svp.width;
          cv.height = svp.height;
          cv.style.width = W + 'px';
          cv.style.height = Math.round(svp.height / dpr) + 'px';
          cv.style.display = 'block';
          return page.render({ canvasContext: cv.getContext('2d'), viewport: svp }).promise.then(function() {
            cv.addEventListener('click', function(ev) {
              var r = cv.getBoundingClientRect();
              cl('trang_' + pageNum + '_click', {
                x: Math.round((ev.clientX - r.left) / r.width * 100) + '%',
                y: Math.round((ev.clientY - r.top) / r.height * 100) + '%'
              });
            });
            wrap.appendChild(cv);
            area.appendChild(wrap);
            obs.observe(wrap);
          });
        });
      });
    })(i);
  }
}).catch(function(err) {
  var loadEl = document.getElementById('load');
  if (loadEl) loadEl.innerHTML = 'Không tải được bản tin.<br><a href="' + CANVA_URL + '" target="_blank" rel="noopener" style="color:rgba(255,255,255,.5);text-decoration:underline">Xem trên Canva ↗</a>';
  console.error('PDF load error:', err);
});
</script>

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

    // Tạo trang HTML (PDF.js reader — user upload PDF vào media/slides/${id}.pdf)
    const html = buildHtmlPdf(period, id, attr_href || embed_src.replace('?embed',''));
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
