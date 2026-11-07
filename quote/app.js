(function () {
  "use strict";

  var KEY = "dw-quote-v1";
  var state = DW.load(KEY) || { status: "open", at: null, note: "" };

  function persist() { DW.save(KEY, state); }

  function total() {
    return window.QUOTE_SEED.lines.reduce(function (sum, line) {
      return sum + line.qty * line.unit;
    }, 0);
  }

  function validUntil() {
    var date = new Date(window.QUOTE_SEED.issued + "T12:00:00+08:00");
    date.setDate(date.getDate() + window.QUOTE_SEED.validDays);
    return DW.ymd(date);
  }

  function render() {
    var root = document.getElementById("main");
    var zh = DW.lang() !== "en";
    var seed = window.QUOTE_SEED;
    var lines = seed.lines.map(function (line) {
      var amount = line.qty * line.unit;
      return '<div class="line" data-math="' + line.qty + " × " + DW.money(line.unit) + '">' +
        "<span><strong>" + DW.esc(DW.t(line.name)) + "</strong><br><span class=\"prose-soft\">" + DW.esc(DW.t(line.detail)) + "</span></span>" +
        '<span class="qty num">' + line.qty + "</span>" +
        '<span class="unit num">' + DW.money(line.unit) + "</span>" +
        '<span class="num">' + DW.money(amount) + "</span></div>";
    }).join("");
    var stamp = state.status === "accepted"
      ? '<div class="stamp" aria-label="' + (zh ? "已接受" : "Accepted") + '">' + (zh ? "已接受" : "ACCEPTED") + "</div>"
      : "";
    var decision = "";
    if (state.status === "open") {
      decision = '<p class="empty prose-soft" style="padding:18px 0 8px">' +
        (zh ? "這封信還在桌上。接受或拒絕，都只留在這台瀏覽器。" : "The letter is still on the desk. Accept or decline, and the answer stays in this browser.") +
        "</p>" +
        '<form id="decide"><label class="field-label">' + (zh ? "一句話，可留白" : "One line, optional") +
          '<input class="field" name="note" maxlength="80"></label>' +
          '<div class="actions">' +
            '<button class="btn" type="submit" name="choice" value="accepted">' + (zh ? "接受" : "Accept") + "</button>" +
            '<button class="btn-ghost" type="submit" name="choice" value="declined">' + (zh ? "拒絕" : "Decline") + "</button>" +
          "</div></form>";
    } else if (state.status === "declined") {
      decision = '<p class="note" style="color:var(--paper-ink)">' +
        (zh ? "已拒絕。沒有後續，也沒有收款。" : "Declined. Nothing follows, and nothing is charged.") +
        (state.note ? " " + DW.esc(state.note) : "") + "</p>" +
        '<button type="button" class="btn-ghost redo" id="reset">' + (zh ? "收回這句" : "Take that back") + "</button>";
    } else {
      decision = '<p class="note" style="color:var(--paper-ink)">' +
        (zh ? "已接受。文件停在這裡，不進入收款。" : "Accepted. The page stops here. There is no payment step.") +
        "</p>" +
        '<button type="button" class="btn-ghost redo" id="reset">' + (zh ? "重新打開這封信" : "Reopen the letter") + "</button>";
    }
    root.innerHTML =
      '<p class="kicker">QUOTE</p>' +
      '<div class="intro"><h1>' + (zh ? "報價單" : "Quote") + "</h1>" +
      '<p class="lede">' + (zh ? "像一封信，不像後台。" : "It should read as a letter, not as an admin screen.") + "</p></div>" +
      '<article class="letter" id="letter">' +
        '<div class="letter-top"><div>' +
          '<p class="meta">' + seed.number + " · " + seed.issued + "</p>" +
          "<p>" + DW.esc(DW.t(seed.client)) + "</p>" +
        "</div><div class=\"marks\">" + stamp +
          '<div class="vseal">周文</div></div></div>' +
        '<p class="prose-soft">' + DW.esc(DW.t(seed.letter)) + "</p>" +
        '<div class="line-head"><span>' + (zh ? "項目" : "Item") + "</span><span class=\"qty\">" + (zh ? "數量" : "Qty") +
          "</span><span class=\"unit\">" + (zh ? "單價" : "Rate") + "</span><span>" + (zh ? "合計" : "Amount") + "</span></div>" +
        '<div class="lines">' + lines + "</div>" +
        '<div class="total-row"><span>' + (zh ? "合計　示範數字" : "Total · sample figures") + "</span><span></span><span></span><span class=\"num\">" + DW.money(total()) + "</span></div>" +
        '<p class="meta" style="margin-top:8px">' + (zh ? "有效至 " : "Valid through ") + validUntil() + (zh ? " · 十四天" : " · 14 days") + "</p>" +
        '<p class="disclaimer">' + (zh ? "示範，不是合約。" : "A sample, not a contract.") + "</p>" +
        decision +
      "</article>";
    bind(root);
  }

  function bind(root) {
    var form = root.querySelector("#decide");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      var choice = event.submitter ? event.submitter.value : "accepted";
      state.status = choice === "declined" ? "declined" : "accepted";
      state.note = form.note.value.trim();
      state.at = new Date().toISOString();
      persist();
      render();
    });
    var reset = root.querySelector("#reset");
    if (reset) reset.addEventListener("click", function () {
      state = { status: "open", at: null, note: "" };
      persist();
      render();
    });
  }

  DW.onChange(render);
  render();
})();
