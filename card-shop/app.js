(function () {
  "use strict";

  var KEY = "dw-card-shop-v1";
  var state = DW.load(KEY) || {
    stock: {},
    orders: window.CARD_SEED.orders.map(function (order) { return Object.assign({}, order); }),
    seq: 1100
  };
  window.CARD_SEED.products.forEach(function (product) {
    if (!state.stock[product.id]) state.stock[product.id] = product.keys.slice();
  });

  var view = "shelf";
  var selected = null;
  var selectedOrder = null;
  var copied = "";

  function persist() { DW.save(KEY, state); }
  function product(id) {
    return window.CARD_SEED.products.filter(function (item) { return item.id === id; })[0];
  }
  function stockOf(id) { return (state.stock[id] || []).length; }

  function statusLabel(status) {
    return {
      pending: { zh: "待付", en: "Unpaid" },
      paid: { zh: "已付", en: "Paid" },
      issued: { zh: "已發放", en: "Issued" }
    }[status];
  }

  function soldToday() {
    var today = DW.ymd(new Date());
    return state.orders.filter(function (order) {
      return order.status === "issued" && DW.ymd(order.at) === today;
    }).length;
  }

  function place() {
    var item = product(selected);
    if (!item || stockOf(item.id) < 1) return;
    state.seq += 1;
    var order = {
      id: "ord-" + state.seq,
      productId: item.id,
      status: "pending",
      at: new Date().toISOString(),
      code: null
    };
    state.orders.unshift(order);
    selectedOrder = order.id;
    view = "orders";
    persist();
    render();
  }

  function pay(id) {
    var order = state.orders.filter(function (item) { return item.id === id; })[0];
    if (!order || order.status !== "pending") return;
    var pile = state.stock[order.productId] || [];
    if (!pile.length) return;
    order.code = pile.shift();
    order.status = "paid";
    persist();
    render();
  }

  function issue(id) {
    var order = state.orders.filter(function (item) { return item.id === id; })[0];
    if (!order || order.status !== "paid" || !order.code) return;
    order.status = "issued";
    order.at = new Date().toISOString();
    persist();
    render();
  }

  function copyCode(code, button) {
    var done = function () {
      copied = code;
      button.textContent = DW.lang() === "en" ? "Copied" : "已複製";
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(function () { fallback(code, done); });
    } else {
      fallback(code, done);
    }
  }

  function fallback(code, done) {
    var area = document.createElement("textarea");
    area.value = code;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); } catch (e) {}
    area.remove();
    done();
  }

  function intake(form) {
    var id = form.product.value;
    var lines = form.batch.value.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    if (!lines.length) return;
    state.stock[id] = (state.stock[id] || []).concat(lines);
    form.batch.value = "";
    persist();
    render();
  }

  function render() {
    var root = document.getElementById("main");
    var L = DW.lang();
    var admin = DW.role() === "admin";
    if (view === "admin" && !admin) view = "shelf";
    var zh = L !== "en";
    root.innerHTML =
      '<p class="kicker">CARD-SHOP</p>' +
      '<div class="intro"><h1>' + (zh ? "卡密商店" : "Card shop") + "</h1>" +
      '<p class="lede">' + (zh
        ? "賣提示詞和激活碼的人，在這裡把一串卡密交到付款的人手上。"
        : "For people who sell prompts and activation codes. Payment hands the buyer one string.") + "</p></div>" +
      '<div class="tabs" role="tablist">' +
        tab("shelf", zh ? "貨架" : "Shelf") +
        tab("orders", zh ? "訂單" : "Orders") +
        (admin ? tab("admin", zh ? "入庫" : "Intake") : "") +
      "</div>" +
      (view === "shelf" ? shelf() : view === "orders" ? orders() : adminView());
    bind(root);
  }

  function tab(id, label) {
    return '<button type="button" role="tab" data-view="' + id + '" aria-pressed="' + (view === id) + '">' + label + "</button>";
  }

  function shelf() {
    var zh = DW.lang() !== "en";
    var list = window.CARD_SEED.products.map(function (item) {
      var left = stockOf(item.id);
      var hot = left === 0 ? " hot" : "";
      return '<button type="button" class="row" data-pick="' + item.id + '" aria-pressed="' + (selected === item.id) + '">' +
        '<span class="dot' + hot + '"></span>' +
        '<span><span class="name">' + DW.esc(DW.t(item.name)) + '</span><span class="sub">' +
          (left === 0 ? (zh ? "缺貨" : "None left") : (zh ? "剩餘 " : "") + left + (zh ? " 張" : " left")) +
        '</span></span><span class="end num">' + DW.money(item.price) + "</span></button>";
    }).join("");
    var detail = "";
    if (selected) {
      var item = product(selected);
      var left = stockOf(item.id);
      detail = '<section class="panel detail-sticky"><p class="meta">' + DW.esc(item.id) + "</p>" +
        "<h2>" + DW.esc(DW.t(item.name)) + "</h2>" +
        '<p class="note">' + DW.esc(DW.t(item.blurb)) + "</p>" +
        '<p class="figure">' + DW.money(item.price) + "</p>" +
        '<p class="note">' + (DW.lang() !== "en" ? "剩餘 " : "") + left + (DW.lang() !== "en" ? " 張" : " left") + "</p>" +
        (left < 1 ? '<p class="empty">' + (DW.lang() !== "en" ? "架子空著。卡密還沒進庫。" : "The shelf is bare. No codes have come in.") + "</p>" : "") +
        '<div class="actions"><button type="button" class="btn" id="place" ' + (left < 1 ? "disabled" : "") + ">" +
          (left < 1 ? (DW.lang() !== "en" ? "缺貨，不能下單" : "Out of stock") : (DW.lang() !== "en" ? "下單" : "Place order")) +
        "</button></div></section>";
    }
    return '<div class="split two"><div>' + list + "</div>" + detail + "</div>";
  }

  function orders() {
    var zh = DW.lang() !== "en";
    if (!state.orders.length) {
      return '<p class="empty">' + (zh ? "架子空著。卡密還沒進庫。" : "The shelf is bare. No codes have come in.") + "</p>";
    }
    if (!state.orders.some(function (order) { return order.id === selectedOrder; })) {
      selectedOrder = state.orders[0].id;
    }
    var list = state.orders.map(function (order) {
      var item = product(order.productId);
      return '<button type="button" class="row" data-order="' + order.id + '" aria-pressed="' + (selectedOrder === order.id) + '">' +
        '<span class="dot' + (order.status === "issued" ? "" : " hot") + '"></span>' +
        '<span><span class="name">' + DW.esc(order.id) + " · " + DW.esc(DW.t(item.name)) + '</span>' +
        '<span class="sub">' + DW.esc(DW.t(statusLabel(order.status))) + "</span></span>" +
        '<span class="end num">' + DW.esc(DW.ymd(order.at)) + "</span></button>";
    }).join("");
    var order = state.orders.filter(function (item) { return item.id === selectedOrder; })[0] || state.orders[0];
    selectedOrder = order.id;
    var item = product(order.productId);
    var left = stockOf(order.productId);
    var body = '<p class="meta">' + DW.esc(order.id) + "</p><h2>" + DW.esc(DW.t(item.name)) + "</h2>" +
      '<p class="status"><span class="dot' + (order.status === "issued" ? "" : " hot") + '"></span>' + DW.esc(DW.t(statusLabel(order.status))) + "</p>" +
      '<p class="note num">' + DW.money(item.price) + " · " + DW.esc(DW.stamp(order.at)) + "</p>";
    if (order.status === "pending") {
      body += '<div class="actions"><button type="button" class="btn" id="pay" ' + (left < 1 ? "disabled" : "") + ">" +
        (zh ? "演示，不扣款" : "Demo, no charge") + "</button></div>";
      if (left < 1) body += '<p class="note">' + (zh ? "庫存空了，這張單付不出去。" : "Nothing left to hand over.") + "</p>";
    } else if (order.status === "paid") {
      body += '<div class="actions"><button type="button" class="btn" id="issue" ' + (left < 1 ? "disabled" : "") + ">" +
        (zh ? "發放卡密" : "Issue code") + "</button></div>";
    } else {
      body += '<div class="codebox" id="code">' + DW.esc(order.code) + "</div>" +
        '<div class="actions"><button type="button" class="btn-ghost" id="copy">' +
        (copied === order.code ? (zh ? "已複製" : "Copied") : (zh ? "複製卡密" : "Copy code")) + "</button></div>";
    }
    return '<div class="split two"><div>' + list + '</div><section class="panel detail-sticky">' + body + "</section></div>";
  }

  function adminView() {
    var zh = DW.lang() !== "en";
    var options = window.CARD_SEED.products.map(function (item) {
      return '<option value="' + item.id + '">' + DW.esc(DW.t(item.name)) + " · " + stockOf(item.id) + "</option>";
    }).join("");
    return '<section class="panel"><p class="meta">' + (zh ? "今天賣出" : "Sold today") + '</p>' +
      '<p class="figure">' + soldToday() + "</p>" +
      '<p class="note">' + (zh ? "只算已發放、而且時間落在今天的單。" : "Issued orders whose time falls on today.") + "</p></section>" +
      '<form class="panel" id="intake" style="margin-top:16px">' +
        '<label class="field-label">' + (zh ? "進哪一櫃" : "Which shelf") +
          '<select class="field" name="product">' + options + "</select></label>" +
        '<label class="field-label">' + (zh ? "一批卡密，一行一張" : "A batch of codes, one per line") +
          '<textarea class="field" name="batch" required placeholder="DW-XXXX-0000"></textarea></label>' +
        '<button class="btn" type="submit">' + (zh ? "放進庫存" : "Add to stock") + "</button>" +
      "</form>";
  }

  function bind(root) {
    root.querySelectorAll("[data-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        view = btn.dataset.view;
        render();
      });
    });
    root.querySelectorAll("[data-pick]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selected = btn.dataset.pick;
        render();
      });
    });
    root.querySelectorAll("[data-order]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedOrder = btn.dataset.order;
        render();
      });
    });
    var placeBtn = root.querySelector("#place");
    if (placeBtn) placeBtn.addEventListener("click", place);
    var payBtn = root.querySelector("#pay");
    if (payBtn) payBtn.addEventListener("click", function () { pay(selectedOrder); });
    var issueBtn = root.querySelector("#issue");
    if (issueBtn) issueBtn.addEventListener("click", function () { issue(selectedOrder); });
    var copyBtn = root.querySelector("#copy");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var order = state.orders.filter(function (item) { return item.id === selectedOrder; })[0];
      if (order && order.code) copyCode(order.code, copyBtn);
    });
    var form = root.querySelector("#intake");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      intake(form);
    });
  }

  DW.onChange(render);
  render();
})();
