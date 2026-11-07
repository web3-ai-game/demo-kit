(function () {
  "use strict";

  var KEY = "dw-stock-v1";
  var state = DW.load(KEY) || {
    qty: {},
    log: []
  };
  window.STOCK_SEED.items.forEach(function (item) {
    if (typeof state.qty[item.id] !== "number") state.qty[item.id] = item.qty;
  });
  var selected = window.STOCK_SEED.items[1].id;

  function persist() { DW.save(KEY, state); }

  function itemBy(id) {
    return window.STOCK_SEED.items.filter(function (item) { return item.id === id; })[0];
  }

  function move(id, delta, reason) {
    var item = itemBy(id);
    if (!item) return;
    var next = state.qty[id] + delta;
    if (next < 0) return;
    state.qty[id] = next;
    state.log.unshift({
      id: id,
      delta: delta,
      qty: next,
      reason: reason,
      at: new Date().toISOString()
    });
    persist();
    render();
  }

  function render() {
    var root = document.getElementById("main");
    var zh = DW.lang() !== "en";
    var items = window.STOCK_SEED.items;
    root.innerHTML =
      '<p class="kicker">STOCK</p>' +
      '<div class="intro"><h1>' + (zh ? "庫存" : "Stock") + "</h1>" +
      '<p class="lede">' + (zh
        ? "八個品項。低於門檻的，旁邊一個陶土色圓點。沒有購物車。"
        : "Eight items. A terracotta dot marks anything under its threshold. There is no cart.") + "</p></div>" +
      (items.length ? '<div class="split two"><div>' + list() + '</div>' + detail() + "</div>" :
        '<p class="empty">' + (zh ? "倉裡沒有品項。先記下一筆再盤。" : "The room has no items yet. Write one down before you count.") + "</p>");
    bind(root);
  }

  function list() {
    var zh = DW.lang() !== "en";
    return window.STOCK_SEED.items.map(function (item) {
      var qty = state.qty[item.id];
      var low = qty < item.min;
      return '<button type="button" class="row" data-id="' + item.id + '" aria-pressed="' + (item.id === selected) + '">' +
        '<span class="dot' + (low ? " hot" : "") + '"></span>' +
        '<span><span class="name">' + DW.esc(DW.t(item.name)) + '</span>' +
        '<span class="sub">' + (low ? (zh ? "低於門檻 " : "Under ") + item.min : (zh ? "門檻 " : "Threshold ") + item.min) + "</span></span>" +
        '<span class="end num">' + qty + "</span></button>";
    }).join("");
  }

  function detail() {
    var item = itemBy(selected) || window.STOCK_SEED.items[0];
    if (!item) return "";
    selected = item.id;
    var zh = DW.lang() !== "en";
    var qty = state.qty[item.id];
    var low = qty < item.min;
    var recent = state.log.filter(function (row) { return row.id === item.id; }).slice(0, 5);
    var log = recent.length
      ? '<ul class="log">' + recent.map(function (row) {
          var sign = row.delta > 0 ? "+" + row.delta : String(row.delta);
          return "<li><span class=\"num\">" + DW.esc(DW.stamp(row.at)) + " · " + sign + " → " + row.qty + "</span></li>";
        }).join("") + "</ul>"
      : '<p class="note">' + (zh ? "還沒有進出紀錄。" : "No movements yet.") + "</p>";
    return '<section class="panel detail-sticky">' +
      '<p class="meta">' + DW.esc(item.id) + "</p>" +
      "<h2>" + DW.esc(DW.t(item.name)) + "</h2>" +
      '<p class="status"><span class="dot' + (low ? " hot" : "") + '"></span>' +
        (low ? (zh ? "低於門檻" : "Under the threshold") : (zh ? "夠用" : "Enough")) + "</p>" +
      '<p class="figure">' + qty + "</p>" +
      '<p class="note">' + (zh ? "單位 " : "Unit ") + DW.esc(DW.t(item.unit)) + (zh ? " · 門檻 " : " · threshold ") + item.min + "</p>" +
      '<form id="move">' +
        '<label class="field-label">' + (zh ? "數量" : "Quantity") +
          '<input class="field qty" name="amount" type="number" min="1" step="1" value="1" required></label>' +
        '<div class="actions">' +
          '<button class="btn-ghost" type="submit" name="dir" value="in">' + (zh ? "入庫" : "Stock in") + "</button>" +
          '<button class="btn" type="submit" name="dir" value="out"' + (qty < 1 ? " disabled" : "") + ">" + (zh ? "出庫" : "Stock out") + "</button>" +
        "</div>" +
      "</form>" + log + "</section>";
  }

  function bind(root) {
    root.querySelectorAll("[data-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selected = btn.dataset.id;
        render();
      });
    });
    var form = root.querySelector("#move");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var amount = Math.floor(Number(form.amount.value));
      if (!amount || amount < 1) return;
      var dir = event.submitter && event.submitter.value === "out" ? -1 : 1;
      if (dir < 0 && state.qty[selected] < 1) return;
      if (dir < 0) amount = Math.min(amount, state.qty[selected]);
      move(selected, dir * amount);
    });
  }

  DW.onChange(render);
  render();
})();
