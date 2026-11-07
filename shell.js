(function () {
  "use strict";

  var LANG_KEY = "dw-demo-lang";
  var listeners = [];

  var PRODUCTS = [
    ["card-shop", "卡密", "Cards"],
    ["booking", "預約", "Book"],
    ["quote", "報價", "Quote"],
    ["ticket", "工單", "Tickets"],
    ["stock", "庫存", "Stock"]
  ];

  function lang() {
    try {
      return localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh";
    } catch (e) {
      return "zh";
    }
  }

  function t(map) {
    if (!map) return "";
    if (typeof map === "string") return map;
    return map[lang()] || map.zh || "";
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function ymd(input) {
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
    var d = input instanceof Date ? input : new Date(input);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function hm(input) {
    var d = input instanceof Date ? input : new Date(input);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function stamp(input) {
    if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
      return input.slice(0, 10).replace(/-/g, ".") + " " + input.slice(11, 16);
    }
    return ymd(input).replace(/-/g, ".") + " " + hm(input);
  }

  function money(n) {
    return "US$" + Number(n).toLocaleString("en-US");
  }

  function productId() {
    return document.body.dataset.product || "home";
  }

  function role() {
    try {
      return localStorage.getItem("dw-role-" + productId()) === "admin" ? "admin" : "guest";
    } catch (e) {
      return "guest";
    }
  }

  function applyLangAttr() {
    var L = lang();
    document.documentElement.lang = L === "en" ? "en" : "zh-Hant";
    document.documentElement.dataset.lang = L;
  }

  function applyStatic() {
    var L = lang();
    document.querySelectorAll("[data-zh]").forEach(function (el) {
      var value = el.getAttribute(L === "en" ? "data-en" : "data-zh");
      if (value != null) el.textContent = value;
    });
    var skip = document.querySelector(".skip");
    if (skip && !skip.hasAttribute("data-zh")) skip.textContent = L === "en" ? "Content" : "內容";
  }

  function hrefFor(id) {
    var home = productId() === "home";
    return home ? id + "/" : "../" + id + "/";
  }

  function paintChrome() {
    var header = document.querySelector("[data-chrome]");
    if (!header) return;
    var L = lang();
    var current = productId();
    var showRole = document.body.dataset.roles !== "off";
    var R = role();
    var links = PRODUCTS.map(function (item) {
      var currentAttr = item[0] === current ? ' aria-current="page"' : "";
      return '<a href="' + hrefFor(item[0]) + '"' + currentAttr + ">" + esc(L === "en" ? item[2] : item[1]) + "</a>";
    }).join("");
    var roleHtml = showRole
      ? '<div class="seg" role="group" aria-label="' + (L === "en" ? "Role" : "身份") + '">' +
          '<button type="button" data-set-role="guest" aria-pressed="' + (R !== "admin") + '">' + (L === "en" ? "Guest" : "訪客") + "</button>" +
          '<button type="button" data-set-role="admin" aria-pressed="' + (R === "admin") + '">' + (L === "en" ? "Manage" : "管理") + "</button>" +
        "</div>"
      : "";
    header.innerHTML =
      '<div class="top-inner">' +
        '<a class="brand" href="' + (current === "home" ? "./" : "../") + '">DeepWeay</a>' +
        '<nav class="prod" aria-label="' + (L === "en" ? "Demos" : "演示") + '">' + links + "</nav>" +
        '<div class="tools">' + roleHtml +
          '<div class="seg" role="group" aria-label="' + (L === "en" ? "Language" : "語言") + '">' +
            '<button type="button" data-set-lang="zh" aria-pressed="' + (L !== "en") + '">繁</button>' +
            '<button type="button" data-set-lang="en" aria-pressed="' + (L === "en") + '">EN</button>' +
          "</div>" +
        "</div>" +
      "</div>";
    header.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.addEventListener("click", function () { setLang(btn.dataset.setLang); });
    });
    header.querySelectorAll("[data-set-role]").forEach(function (btn) {
      btn.addEventListener("click", function () { setRole(btn.dataset.setRole); });
    });
  }

  function emit() {
    applyLangAttr();
    applyStatic();
    paintChrome();
    listeners.forEach(function (fn) { fn(); });
  }

  function setLang(next) {
    try { localStorage.setItem(LANG_KEY, next === "en" ? "en" : "zh"); } catch (e) {}
    emit();
  }

  function setRole(next) {
    try { localStorage.setItem("dw-role-" + productId(), next === "admin" ? "admin" : "guest"); } catch (e) {}
    emit();
  }

  function onChange(fn) { listeners.push(fn); }

  applyLangAttr();
  applyStatic();
  paintChrome();

  window.DW = {
    lang: lang,
    setLang: setLang,
    role: role,
    setRole: setRole,
    t: t,
    esc: esc,
    load: load,
    save: save,
    ymd: ymd,
    hm: hm,
    stamp: stamp,
    money: money,
    onChange: onChange
  };
})();
