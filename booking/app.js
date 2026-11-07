(function () {
  "use strict";

  var KEY = "dw-booking-v1";
  var state = DW.load(KEY) || { closed: {}, bookings: [] };
  var days = buildDays();
  var selectedDay = days[0].ymd;
  var selectedSlot = null;
  var confirmId = null;

  function persist() { DW.save(KEY, state); }

  function buildDays() {
    var names = {
      zh: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
      en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    };
    var start = new Date();
    start.setHours(12, 0, 0, 0);
    var list = [];
    for (var i = 0; i < 7; i += 1) {
      var date = new Date(start.getTime() + i * 86400000);
      list.push({
        ymd: DW.ymd(date),
        weekday: date.getDay(),
        label: names,
        day: date.getDate(),
        month: date.getMonth() + 1
      });
    }
    return list;
  }

  function dayName(day) {
    var L = DW.lang() === "en" ? "en" : "zh";
    return day.label[L][day.weekday];
  }

  function taken(ymd, slotId) {
    return state.bookings.some(function (item) { return item.ymd === ymd && item.slot === slotId; });
  }

  function blocked(day, slotId) {
    if (state.closed[day.ymd]) return "closed";
    if (day.weekday === window.BOOK_SEED.full.weekday && slotId === window.BOOK_SEED.full.slot) return "full";
    if (taken(day.ymd, slotId)) return "taken";
    return "";
  }

  function openCount(day) {
    return window.BOOK_SEED.slots.filter(function (slot) { return !blocked(day, slot.id); }).length;
  }

  function slotName(id) {
    var slot = window.BOOK_SEED.slots.filter(function (item) { return item.id === id; })[0];
    return DW.lang() === "en" ? slot.en : slot.zh;
  }

  function render() {
    var root = document.getElementById("main");
    var zh = DW.lang() !== "en";
    var admin = DW.role() === "admin";
    var anyOpen = days.some(function (day) { return openCount(day) > 0; });
    root.innerHTML =
      '<p class="kicker">BOOKING</p>' +
      '<div class="intro"><h1>' + (zh ? "預約" : "Booking") + "</h1>" +
      '<p class="lede">' + (zh
        ? "顧問或家教把未來七天的空檔放出來。留下名字和 Telegram 就夠了。"
        : "A tutor or a consultant opens the next seven days. A name and a Telegram handle are enough.") + "</p></div>" +
      (admin ? adminBar() : "") +
      (anyOpen ? calendar() : '<p class="empty">' + (zh ? "這七天沒有可約的空檔。" : "Nothing open across these seven days.") + "</p>") +
      (confirmId ? slip() : "");
    bind(root);
  }

  function adminBar() {
    var zh = DW.lang() !== "en";
    var friday = days.filter(function (day) { return day.weekday === 5; })[0];
    if (!friday) return "";
    var closed = !!state.closed[friday.ymd];
    return '<div class="panel" style="margin-bottom:20px"><p class="meta">' + friday.ymd + "</p>" +
      "<h2>" + (zh ? "週五整天" : "Friday") + "</h2>" +
      '<p class="note">' + (closed
        ? (zh ? "已關掉。四個時段都不能選。" : "Closed. None of the four hours can be chosen.")
        : (zh ? "開著。關掉之後，這一天全部不可選。" : "Open. Closing it makes every hour on that day unavailable.")) + "</p>" +
      '<div class="actions"><button type="button" class="btn" id="toggle-friday" data-ymd="' + friday.ymd + '">' +
        (closed ? (zh ? "重新開放週五" : "Reopen Friday") : (zh ? "關掉週五整天" : "Close Friday")) +
      "</button></div></div>";
  }

  function calendar() {
    var zh = DW.lang() !== "en";
    var day = days.filter(function (item) { return item.ymd === selectedDay; })[0] || days[0];
    selectedDay = day.ymd;
    var dayButtons = days.map(function (item) {
      var n = openCount(item);
      return '<button type="button" class="day" data-day="' + item.ymd + '" aria-pressed="' + (item.ymd === selectedDay) + '">' +
        dayName(item) + '<small class="num">' + item.month + "/" + item.day + " · " + n + "</small></button>";
    }).join("");
    var slots = window.BOOK_SEED.slots.map(function (slot) {
      var why = blocked(day, slot.id);
      var reason = why === "full"
        ? (zh ? "已滿" : "Full")
        : why === "closed"
          ? (zh ? "這天已關" : "Day closed")
          : why === "taken"
            ? (zh ? "已約" : "Taken")
            : (zh ? "可約" : "Open");
      var disabled = why ? " disabled" : "";
      return '<button type="button" class="row slot" data-slot="' + slot.id + '" aria-pressed="' + (selectedSlot === slot.id && !why) + '"' + disabled + ">" +
        '<span class="dot' + (why ? " hot" : "") + '"></span>' +
        '<span><span class="name">' + (zh ? slot.zh : slot.en) + '</span><span class="sub">' + reason + "</span></span>" +
        '<span class="end num">' + slot.time + "</span></button>";
    }).join("");
    var form = selectedSlot && !blocked(day, selectedSlot)
      ? '<form class="panel" id="book" style="margin-top:16px">' +
          '<p class="meta">' + day.ymd + " · " + slotName(selectedSlot) + "</p>" +
          '<label class="field-label">' + (zh ? "名字" : "Name") +
            '<input class="field" name="name" required autocomplete="name"></label>' +
          '<label class="field-label">Telegram' +
            '<input class="field" name="telegram" required placeholder="@name" autocomplete="off"></label>' +
          '<button class="btn" type="submit">' + (zh ? "送出預約" : "Send request") + "</button>" +
        "</form>"
      : "";
    return '<div class="days" role="tablist">' + dayButtons + "</div>" + slots + form;
  }

  function slip() {
    var item = state.bookings.filter(function (row) { return row.id === confirmId; })[0];
    if (!item) return "";
    var zh = DW.lang() !== "en";
    var slot = window.BOOK_SEED.slots.filter(function (row) { return row.id === item.slot; })[0];
    return '<section class="panel" id="slip" style="margin-top:20px">' +
      '<p class="meta">' + DW.esc(item.id) + "</p>" +
      "<h2>" + (zh ? "確認單" : "Confirmation") + "</h2>" +
      '<p class="note">' + (zh ? "只存在這台瀏覽器。關掉分頁還在，換一台機器就沒有了。" : "It lives in this browser. Close the tab and it stays. Another machine will not have it.") + "</p>" +
      '<p class="figure">' + DW.esc(slot.time) + "</p>" +
      '<p class="note num">' + DW.esc(item.ymd) + " · " + DW.esc(zh ? slot.zh : slot.en) + "</p>" +
      '<p class="note">' + DW.esc(item.name) + " · " + DW.esc(item.telegram) + "</p>" +
      "</section>";
  }

  function bind(root) {
    root.querySelectorAll("[data-day]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectedDay = btn.dataset.day;
        selectedSlot = null;
        render();
      });
    });
    root.querySelectorAll("[data-slot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        selectedSlot = btn.dataset.slot;
        confirmId = null;
        render();
      });
    });
    var form = root.querySelector("#book");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      var day = days.filter(function (item) { return item.ymd === selectedDay; })[0];
      if (!day || !selectedSlot || blocked(day, selectedSlot)) return;
      var id = "bk-" + Date.now().toString(36);
      state.bookings.push({
        id: id,
        ymd: selectedDay,
        slot: selectedSlot,
        name: form.name.value.trim(),
        telegram: form.telegram.value.trim(),
        at: new Date().toISOString()
      });
      confirmId = id;
      selectedSlot = null;
      persist();
      render();
      var slipNode = document.getElementById("slip");
      if (slipNode) slipNode.scrollIntoView({ block: "nearest" });
    });
    var toggle = root.querySelector("#toggle-friday");
    if (toggle) toggle.addEventListener("click", function () {
      var ymd = toggle.dataset.ymd;
      if (state.closed[ymd]) delete state.closed[ymd];
      else state.closed[ymd] = true;
      if (selectedDay === ymd) selectedSlot = null;
      persist();
      render();
    });
  }

  DW.onChange(render);
  render();
})();
