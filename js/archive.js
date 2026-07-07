(function () {
  var grid = document.getElementById('gallery-grid');
  var countEl = document.getElementById('issue-count');
  var latestPillEl = document.getElementById('latest-pill');

  fetch('data/archive.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var issues = (data.issues || []).slice().sort(function (a, b) {
        return b.period_sort.localeCompare(a.period_sort);
      });

      if (countEl) countEl.textContent = issues.length;
      if (latestPillEl && issues[0]) latestPillEl.textContent = issues[0].period.toUpperCase();

      grid.innerHTML = issues.map(function (issue) {
        var href = issue.canva_view_url || issue.link_url || '#';
        return (
          '<a class="issue-card" href="' + href + '" target="_blank" rel="noopener">' +
            '<div class="issue-img">' +
              '<img src="' + issue.cover_image + '" alt="' + issue.period + '" onerror="this.style.display=\'none\'">' +
            '</div>' +
            '<div class="issue-body">' +
              '<div class="issue-period">' + issue.period + '</div>' +
              '<div class="issue-cta">Xem bản tin <svg width="13" height="13"><use href="#i-arrow"/></svg></div>' +
            '</div>' +
          '</a>'
        );
      }).join('');
    })
    .catch(function (err) {
      console.error('Không tải được archive.json:', err);
      grid.innerHTML = '<p style="opacity:.6">Không tải được danh sách bản tin. Vui lòng thử lại sau.</p>';
    });
})();
