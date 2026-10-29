/* 产品页筛选 + 编号索引搜索 + 首页编号直达 */
(function () {
  "use strict";

  /* ---------- 产品页：按属性筛选订货表 ---------- */
  var table = document.getElementById("codeTable");
  if (table) {
    var selects = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    var counter = document.getElementById("rowCount");

    function apply() {
      var active = selects
        .map(function (s) { return [s.getAttribute("data-filter"), s.value]; })
        .filter(function (p) { return p[1]; });

      var shown = 0;
      rows.forEach(function (tr) {
        var ok = active.every(function (p) {
          return (tr.getAttribute("data-" + p[0]) || "") === p[1];
        });
        tr.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (counter) counter.textContent = shown;
    }

    selects.forEach(function (s) { s.addEventListener("change", apply); });
  }

  /* ---------- 编号索引：文本过滤 ---------- */
  var filter = document.getElementById("codeFilter");
  if (filter) {
    var all = Array.prototype.slice.call(
      document.querySelectorAll("#allCodes tbody tr[data-search]")
    );
    var count = document.getElementById("codeCount");

    var run = function () {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      all.forEach(function (tr) {
        var hit = !q || (tr.getAttribute("data-search") || "").indexOf(q) !== -1;
        tr.classList.toggle("is-hidden", !hit);
        if (hit) shown++;
      });
      if (count) count.textContent = shown;
    };

    filter.addEventListener("input", run);

    var initial = new URLSearchParams(location.search).get("q");
    if (initial) { filter.value = initial; }
    run();
  }

  /* ---------- 首页：编号直达 ---------- */
  var search = document.getElementById("codeSearch");
  var go = document.getElementById("codeGo");
  if (search && go) {
    var jump = function () {
      var v = search.value.trim();
      location.href = "codes/" + (v ? "?q=" + encodeURIComponent(v) : "");
    };
    go.addEventListener("click", jump);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") jump();
    });
  }
})();
