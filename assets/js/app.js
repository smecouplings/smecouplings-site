/* 产品页交互（收藏/比较/打印）+ 表格筛选 + 编号索引 + 枢纽页切换 */
(function () {
  "use strict";

  var LS_SAVE = "sme_saved";
  var LS_CMP = "sme_compare";

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { return []; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function toggle(list, slug, max) {
    var i = list.indexOf(slug);
    if (i > -1) { list.splice(i, 1); return list; }
    list.push(slug);
    return max ? list.slice(-max) : list;
  }

  /* ---------- 产品页动作条 ---------- */
  var actions = document.querySelector(".actions");
  if (actions) {
    var slug = actions.getAttribute("data-slug");
    var bSave = actions.querySelector('[data-act="save"]');
    var bCmp = actions.querySelector('[data-act="compare"]');
    var bPrint = actions.querySelector('[data-act="print"]');

    var sync = function () {
      var saved = read(LS_SAVE).indexOf(slug) > -1;
      var cmp = read(LS_CMP).indexOf(slug) > -1;
      if (bSave) { bSave.textContent = saved ? "★ Saved" : "☆ Save"; bSave.classList.toggle("is-on", saved); }
      if (bCmp) { bCmp.textContent = cmp ? "⇄ In compare" : "⇄ Compare"; bCmp.classList.toggle("is-on", cmp); }
    };

    if (bSave) bSave.addEventListener("click", function () { write(LS_SAVE, toggle(read(LS_SAVE), slug)); sync(); });
    if (bCmp) bCmp.addEventListener("click", function () { write(LS_CMP, toggle(read(LS_CMP), slug, 4)); sync(); });
    if (bPrint) bPrint.addEventListener("click", function () { window.print(); });
    sync();
  }

  /* ---------- 产品页：按属性筛选订货表 ---------- */
  var table = document.getElementById("codeTable");
  if (table) {
    var selects = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr"));
    var counter = document.getElementById("rowCount");
    var apply = function () {
      var active = selects.map(function (s) { return [s.getAttribute("data-filter"), s.value]; })
        .filter(function (p) { return p[1]; });
      var shown = 0;
      rows.forEach(function (tr) {
        var ok = active.every(function (p) { return (tr.getAttribute("data-" + p[0]) || "") === p[1]; });
        tr.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      if (counter) counter.textContent = shown;
    };
    selects.forEach(function (s) { s.addEventListener("change", apply); });
  }

  /* ---------- 编号索引：过滤 + 显示/隐藏 ---------- */
  var filter = document.getElementById("codeFilter");
  var codeTable = document.getElementById("allCodes");
  if (filter && codeTable) {
    var all = Array.prototype.slice.call(codeTable.querySelectorAll("tbody tr[data-search]"));
    var count = document.getElementById("codeCount");
    var toggleBtn = document.getElementById("toggleCodes");

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

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        var masked = codeTable.classList.toggle("codes-masked");
        toggleBtn.textContent = masked ? "Show codes" : "Hide codes";
      });
    }

    var initial = new URLSearchParams(location.search).get("q");
    if (initial) { filter.value = initial; }
    run();
  }

  /* ---------- 枢纽页：体系切换 ---------- */
  var chips = document.getElementById("hubChips");
  if (chips) {
    var hubRows = Array.prototype.slice.call(document.querySelectorAll("#hubTable tbody tr[data-system]"));
    chips.addEventListener("click", function (e) {
      var b = e.target.closest(".chip-btn");
      if (!b || b.disabled) return;
      Array.prototype.forEach.call(chips.querySelectorAll(".chip-btn"), function (x) {
        x.classList.toggle("is-on", x === b);
      });
      var want = b.getAttribute("data-system");
      hubRows.forEach(function (tr) {
        tr.classList.toggle("is-hidden", !!want && tr.getAttribute("data-system") !== want);
      });
    });
  }

  /* ---------- 比较页 ---------- */
  var root = document.getElementById("compareRoot");
  if (root) {
    var picks = read(LS_CMP);
    var clear = document.getElementById("clearCompare");
    if (clear) clear.addEventListener("click", function () { write(LS_CMP, []); location.reload(); });

    if (!picks.length) {
      root.innerHTML = '<p style="padding:2rem;text-align:center;color:#5b6b7c">' +
        "Nothing selected yet. Open a product page and press “Compare”." + "</p>";
    } else {
      fetch("../assets/data/compare.json").then(function (r) { return r.json(); }).then(function (all) {
        var items = picks.map(function (s) {
          return all.filter(function (x) { return x.slug === s; })[0];
        }).filter(Boolean);
        var fields = [
          ["Coupling end", "end_a"], ["Other end", "end_b"], ["Materials", "materials"],
          ["Sizes", "sizes"], ["Standards", "standards"], ["Order codes", "codes"]
        ];
        var html = '<table class="data"><thead><tr><th>Attribute</th>' +
          items.map(function (it) {
            return '<th><a href="../products/' + it.slug + '/">' + it.name + "</a></th>";
          }).join("") + "</tr></thead><tbody>" +
          fields.map(function (f) {
            return "<tr><th>" + f[0] + "</th>" + items.map(function (it) {
              return "<td>" + (it[f[1]] || "—") + "</td>";
            }).join("") + "</tr>";
          }).join("") + "</tbody></table>";
        root.innerHTML = html;
        root.classList.remove("table-wrap");
      }).catch(function () {
        root.innerHTML = '<p style="padding:2rem">Comparison data could not be loaded.</p>';
      });
    }
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
    search.addEventListener("keydown", function (e) { if (e.key === "Enter") jump(); });
  }
})();
