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


  /* ---------- 自定义下拉（材质） ---------- */
  (function () {
    var pickers = Array.prototype.slice.call(document.querySelectorAll("[data-picker]"));
    if (!pickers.length) return;
    function closeAll(except) {
      pickers.forEach(function (p) {
        if (p !== except) {
          var l = p.querySelector(".picker-list");
          if (l) l.hidden = true;
        }
      });
    }
    pickers.forEach(function (p) {
      var input = p.querySelector("input[data-filter]");
      var btn = p.querySelector(".picker-btn");
      var label = p.querySelector("[data-label]");
      var list = p.querySelector(".picker-list");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAll(p);
        list.hidden = !list.hidden;
      });
      list.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-val]");
        if (!b) return;
        input.value = b.getAttribute("data-val");
        label.innerHTML = b.innerHTML;
        list.hidden = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    document.addEventListener("click", function () { closeAll(null); });
  })();

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
      if (window.smeSyncSticky) window.smeSyncSticky();
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

  /* ---------- 表格：筛选栏 + 表头一起吸顶 ---------- */
  (function () {
    var wrap = document.querySelector(".table-wrap");
    if (!wrap) return;
    var table = wrap.querySelector("table.data");
    var thead = table && table.querySelector("thead");
    if (!table || !thead) return;

    var NAV = 68;
    var filters = document.querySelector(".filters");
    var home = filters && filters.parentNode;
    var next = filters && filters.nextSibling;

    /* 吸顶容器：上面放真实筛选栏，下面放克隆表头 */
    var bar = document.createElement("div");
    bar.className = "sticky-head";
    var inner = document.createElement("div");
    inner.className = "sticky-head-inner";
    inner.style.willChange = "transform";
    var clone = document.createElement("table");
    clone.style.width = "100%";
    clone.appendChild(thead.cloneNode(true));
    inner.appendChild(clone);
    bar.appendChild(inner);

    var groupBar = document.createElement("div");
    groupBar.className = "sticky-group";
    groupBar.style.display = "none";
    var groupText = document.createElement("span");
    groupBar.appendChild(groupText);
    bar.appendChild(groupBar);
    document.body.appendChild(bar);
    bar.style.display = "none";

    /* 占位块：筛选栏被移走时撑住原位置，避免页面跳动 */
    var spacer = document.createElement("div");
    spacer.style.display = "none";

    var attached = false;

    function attach() {
      if (!filters || attached) return;
      spacer.style.height = filters.offsetHeight + "px";
      spacer.style.display = "block";
      home.insertBefore(spacer, next);
      bar.insertBefore(filters, inner);
      filters.classList.add("in-bar");
      attached = true;
    }

    function detach() {
      if (!filters || !attached) return;
      filters.classList.remove("in-bar");
      home.insertBefore(filters, next);
      if (spacer.parentNode) spacer.parentNode.removeChild(spacer);
      spacer.style.display = "none";
      attached = false;
    }

    /* 逐列复制真实表头的宽度，保证克隆与表格对齐 */
    function syncWidths() {
      var src = thead.querySelectorAll("th");
      var dst = clone.querySelectorAll("th");
      if (!src.length || src.length !== dst.length) return;
      clone.style.tableLayout = "fixed";
      clone.style.width = table.offsetWidth + "px";
      var total = 0;
      for (var i = 0; i < src.length; i++) {
        var w = src[i].getBoundingClientRect().width;
        dst[i].style.width = w + "px";
        total += w;
      }
      clone.style.width = total + "px";
      inner.style.width = total + "px";
    }
    window.smeSyncSticky = function () {
      if (bar.style.display !== "none") syncWidths();
    };

    function sync() {
      var r = wrap.getBoundingClientRect();
      var h = thead.offsetHeight;
      var show = r.top < NAV && r.bottom > NAV + h + 40;
      if (!show) {
        bar.style.display = "none";
        groupBar.style.display = "none";
        detach();
        return;
      }
      bar.style.display = "block";
      bar.style.left = r.left + "px";
      bar.style.width = wrap.clientWidth + "px";
      syncWidths();
      inner.style.transform = "translateX(" + (-wrap.scrollLeft) + "px)";
      attach();
      showGroup();
    }

    /* 当前滚到哪个材料组 */
    function showGroup() {
      /* 以「当前正在跨越表头线的数据行」所属分组为准，避免慢一行 */
      var rows = Array.prototype.slice.call(wrap.querySelectorAll("tr.group-row"))
        .filter(function (r) { return r.offsetParent !== null; });
      if (!rows.length) { groupBar.style.display = "none"; return; }
      var line = NAV + bar.offsetHeight - groupBar.offsetHeight + 2;
      var current = null;
      for (var i = 0; i < rows.length; i++) {
        var g = rows[i];
        var next = rows[i + 1];
        var startY = g.getBoundingClientRect().top;
        var endY = next ? next.getBoundingClientRect().top : Infinity;
        if (startY <= line && endY > line) { current = g; break; }
      }
      if (!current) {
        /* 没命中（例如已滚过最后一组）就取最后一个在线上方的 */
        rows.forEach(function (r) {
          if (r.getBoundingClientRect().top <= line) current = r;
        });
      }
      if (!current) current = rows[0];
      if (!current) { groupBar.style.display = "none"; return; }
      var name = current.getAttribute("data-group") || "";
      var strong = current.querySelector(".group-cell strong");
      groupBar.style.display = "block";
      groupText.innerHTML = strong ? strong.innerHTML : name;
      var em = current.querySelector(".group-cell em");
      if (em) groupText.innerHTML += ' <em>' + em.textContent + "</em>";
    }

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    wrap.addEventListener("scroll", sync, { passive: true });
    sync();
  })();

})();
