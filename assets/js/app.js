/* SME Couplings — 页面交互
   1) 产品页：保存 / 对比 / 打印
   2) 产品页：材质卡组切换
   3) 产品页：订货表筛选
   4) 编号索引：过滤 + 遮罩开关
   5) 枢纽页：体系切换
   6) 对比页：渲染
   7) 首页：编号直达
   8) 表格缩略图：悬浮大图
*/
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

  /* ---------- 1. 动作条 ---------- */
  var actions = document.querySelector(".actions");
  if (actions) {
    var slug = actions.getAttribute("data-slug");
    var bSave = actions.querySelector('[data-act="save"]');
    var bCmp = actions.querySelector('[data-act="compare"]');
    var bPrint = actions.querySelector('[data-act="print"]');

    var syncActions = function () {
      var saved = read(LS_SAVE).indexOf(slug) > -1;
      var cmp = read(LS_CMP).indexOf(slug) > -1;
      if (bSave) { bSave.textContent = saved ? "★ Saved" : "☆ Save"; bSave.classList.toggle("is-on", saved); }
      if (bCmp) { bCmp.textContent = cmp ? "⇄ In compare" : "⇄ Compare"; bCmp.classList.toggle("is-on", cmp); }
    };

    if (bSave) bSave.addEventListener("click", function () { write(LS_SAVE, toggle(read(LS_SAVE), slug)); syncActions(); });
    if (bCmp) {
      bCmp.addEventListener("click", function () {
        var list = read(LS_CMP);
        var sys = actions.getAttribute("data-system") || "cam-and-groove";
        var stored = localStorage.getItem("sme_compare_system");
        if (list.length && stored && stored !== sys) {
          if (!confirm("Compare works within one system. Clear the current selection and start a new one?")) return;
          list = [];
        }
        list = toggle(list, slug, 4);
        write(LS_CMP, list);
        localStorage.setItem("sme_compare_system", list.length ? sys : "");
        syncActions();
      });
    }
    if (bPrint) bPrint.addEventListener("click", function () { window.print(); });
    syncActions();
  }

  /* ---------- 2. 材质卡组 ---------- */
  var gallery = document.querySelector(".gallery[data-materials]");
  if (gallery) {
    var cards = Array.prototype.slice.call(gallery.querySelectorAll(".deck-card"));
    var setMaterial = function (mat) {
      cards.forEach(function (b) {
        b.classList.toggle("is-on", b.getAttribute("data-mat") === mat);
      });
    };
    window.smeSetMaterial = setMaterial;
    cards.forEach(function (b) {
      b.addEventListener("click", function () { setMaterial(b.getAttribute("data-mat")); });
    });
    var matSelect = document.querySelector('[data-filter="material"]');
    if (matSelect) {
      matSelect.addEventListener("change", function () {
        if (matSelect.value) setMaterial(matSelect.value);
      });
    }
  }

  /* ---------- 3. 订货表筛选 ---------- */
  var table = document.getElementById("codeTable");
  if (table) {
    var selects = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr:not(.group-row)"));
    var groupRows = Array.prototype.slice.call(table.querySelectorAll("tr.group-row"));
    var counter = document.getElementById("rowCount");

    var updateGroups = function () {
      groupRows.forEach(function (g) {
        var mat = g.getAttribute("data-group");
        var any = rows.some(function (tr) {
          return tr.getAttribute("data-material") === mat && !tr.classList.contains("is-hidden");
        });
        g.classList.toggle("is-hidden", !any);
      });
    };

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
      updateGroups();
    };

    selects.forEach(function (s) { s.addEventListener("change", apply); });
    updateGroups();
  }

  /* ---------- 4. 编号索引 ---------- */
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
    if (initial) filter.value = initial;
    run();
  }

  /* ---------- 5. 枢纽页体系切换 ---------- */
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

  /* ---------- 6. 对比页 ---------- */
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

  /* ---------- 7. 首页编号直达 ---------- */
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

  /* ---------- 8. 表格缩略图：悬浮大图 ---------- */
  var pop = null;
  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.id = "imgPop";
    document.body.appendChild(pop);
    return pop;
  }
  function showPop(el) {
    var src = el.getAttribute("data-pop");
    if (!src) return;
    var box = ensurePop();
    box.innerHTML = '<img src="' + src + '" alt="">';
    box.style.display = "block";
    var r = el.getBoundingClientRect();
    var w = 240;
    var left = r.right + 14;
    if (left + w > window.innerWidth - 12) left = r.left - w - 14;
    var top = Math.min(Math.max(12, r.top - 60), window.innerHeight - 260);
    box.style.left = Math.max(12, left) + "px";
    box.style.top = top + "px";
  }
  function hidePop() { if (pop) pop.style.display = "none"; }
  document.querySelectorAll(".thumb[data-pop]").forEach(function (el) {
    el.addEventListener("mouseenter", function () { showPop(el); });
    el.addEventListener("mouseleave", hidePop);
  });
})();
