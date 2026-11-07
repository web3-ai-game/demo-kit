(function () {
  "use strict";

  var KEY = "dw-ticket-v1";
  var state = DW.load(KEY) || {
    tickets: window.TICKET_SEED.tickets.map(function (ticket) {
      return {
        id: ticket.id,
        title: ticket.title,
        from: ticket.from,
        status: ticket.status,
        at: ticket.at,
        body: ticket.body,
        replies: ticket.replies.map(function (reply) { return Object.assign({}, reply); })
      };
    }),
    seq: 320
  };
  var selected = state.tickets[0] ? state.tickets[0].id : null;
  var mobileDetail = false;
  var composing = false;

  function persist() { DW.save(KEY, state); }

  function statusLabel(status) {
    return {
      new: { zh: "新的", en: "New" },
      open: { zh: "處理中", en: "In progress" },
      done: { zh: "已解決", en: "Resolved" }
    }[status];
  }

  function current() {
    return state.tickets.filter(function (ticket) { return ticket.id === selected; })[0] || null;
  }

  function render() {
    var root = document.getElementById("main");
    var zh = DW.lang() !== "en";
    var admin = DW.role() === "admin";
    root.innerHTML =
      '<p class="kicker">TICKETS</p>' +
      '<div class="intro"><h1>' + (zh ? "工單" : "Tickets") + "</h1>" +
      '<p class="lede">' + (zh
        ? "小工作室的客服。左欄是信，右欄是內容。沒有即時聊天。"
        : "A small studio inbox. Letters on the left, the letter on the right. No live chat.") + "</p></div>" +
      '<div class="split ticket' + (mobileDetail ? " show-detail" : "") + '">' +
        '<div class="list">' +
          '<div class="actions" style="margin-top:0"><button type="button" class="btn" id="compose">' + (zh ? "寫一張" : "Write one") + "</button></div>" +
          (state.tickets.length ? list() : '<p class="empty">' + (zh ? "信箱是空的。有事再寫進來。" : "The inbox is empty. Write when there is something to say.") + "</p>") +
        "</div>" +
        '<div class="detail">' + detail(admin) + "</div>" +
      "</div>";
    bind(root);
  }

  function list() {
    return state.tickets.map(function (ticket) {
      return '<button type="button" class="row" data-id="' + ticket.id + '" aria-pressed="' + (ticket.id === selected) + '">' +
        '<span class="dot' + (ticket.status === "done" ? "" : " hot") + '"></span>' +
        '<span><span class="name">' + DW.esc(DW.t(ticket.title)) + '</span>' +
        '<span class="sub">' + DW.esc(ticket.from) + " · " + DW.esc(DW.t(statusLabel(ticket.status))) + "</span></span>" +
        '<span class="end num">' + DW.esc(ticket.id) + "</span></button>";
    }).join("");
  }

  function detail(admin) {
    var zh = DW.lang() !== "en";
    if (composing) {
      return '<section class="panel">' +
        '<button type="button" class="btn-ghost back" id="back">' + (zh ? "返回列表" : "Back to the list") + "</button>" +
        "<h2>" + (zh ? "新工單" : "New ticket") + "</h2>" +
        '<form id="new-ticket">' +
          '<label class="field-label">' + (zh ? "你的名字" : "Your name") +
            '<input class="field" name="from" required></label>' +
          '<label class="field-label">' + (zh ? "標題" : "Subject") +
            '<input class="field" name="title" required></label>' +
          '<label class="field-label">' + (zh ? "內容" : "Message") +
            '<textarea class="field" name="body" required></textarea></label>' +
          '<button class="btn" type="submit">' + (zh ? "送出" : "Send") + "</button>" +
        "</form></section>";
    }
    var ticket = current();
    if (!ticket) {
      return '<p class="empty">' + (zh ? "信箱是空的。有事再寫進來。" : "The inbox is empty. Write when there is something to say.") + "</p>";
    }
    var replies = ticket.replies.map(function (reply) {
      return '<article class="bubble"><p class="meta">' + DW.esc(reply.by) + " · " + DW.esc(DW.stamp(reply.at)) + "</p><p>" +
        DW.esc(DW.t(reply.text)) + "</p></article>";
    }).join("");
    var manage = "";
    if (admin) {
      manage = '<div class="composer"><label class="field-label">' + (zh ? "回覆" : "Reply") +
        '<textarea class="field" id="reply" placeholder="' + (zh ? "寫給對方的一句話" : "One note back to them") + '"></textarea></label>' +
        '<div class="actions">' +
          '<button type="button" class="btn" id="send-reply">' + (zh ? "加上這條回覆" : "Add this reply") + "</button>" +
          '<button type="button" class="btn-ghost" data-status="open">' + (zh ? "標成處理中" : "Mark in progress") + "</button>" +
          '<button type="button" class="btn-ghost" data-status="done">' + (zh ? "標成已解決" : "Mark resolved") + "</button>" +
        "</div></div>";
    }
    return '<section class="panel">' +
      '<button type="button" class="btn-ghost back" id="back">' + (zh ? "返回列表" : "Back to the list") + "</button>" +
      '<p class="meta">' + DW.esc(ticket.id) + " · " + DW.esc(DW.stamp(ticket.at)) + "</p>" +
      "<h2>" + DW.esc(DW.t(ticket.title)) + "</h2>" +
      '<p class="status"><span class="dot' + (ticket.status === "done" ? "" : " hot") + '"></span>' +
        DW.esc(DW.t(statusLabel(ticket.status))) + " · " + DW.esc(ticket.from) + "</p>" +
      '<div class="thread"><article class="bubble"><p>' + DW.esc(DW.t(ticket.body)) + "</p></article>" + replies + "</div>" +
      manage + "</section>";
  }

  function bind(root) {
    var compose = root.querySelector("#compose");
    if (compose) compose.addEventListener("click", function () {
      composing = true;
      mobileDetail = true;
      render();
    });
    root.querySelectorAll("[data-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selected = btn.dataset.id;
        composing = false;
        mobileDetail = true;
        render();
      });
    });
    var back = root.querySelector("#back");
    if (back) back.addEventListener("click", function () {
      mobileDetail = false;
      composing = false;
      render();
    });
    var form = root.querySelector("#new-ticket");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      state.seq += 1;
      var id = "tk-" + state.seq;
      var text = form.body.value.trim();
      var title = form.title.value.trim();
      state.tickets.unshift({
        id: id,
        title: { zh: title, en: title },
        from: form.from.value.trim(),
        status: "new",
        at: new Date().toISOString(),
        body: { zh: text, en: text },
        replies: []
      });
      selected = id;
      composing = false;
      mobileDetail = true;
      persist();
      render();
    });
    var send = root.querySelector("#send-reply");
    if (send) send.addEventListener("click", function () {
      var ticket = current();
      var field = root.querySelector("#reply");
      if (!ticket || !field || !field.value.trim()) return;
      var text = field.value.trim();
      ticket.replies.push({
        at: new Date().toISOString(),
        by: "DeepWeay",
        text: { zh: text, en: text }
      });
      if (ticket.status === "new") ticket.status = "open";
      persist();
      render();
    });
    root.querySelectorAll("[data-status]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ticket = current();
        if (!ticket) return;
        ticket.status = btn.dataset.status;
        persist();
        render();
      });
    });
  }

  DW.onChange(render);
  render();
})();
