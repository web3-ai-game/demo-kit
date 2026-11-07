window.CARD_SEED = {
  products: [
    {
      id: "prompt-pack",
      name: { zh: "提示詞包 · 夜班", en: "Prompt pack · night shift" },
      blurb: { zh: "十二條給值班工程師的短提示，改完就能貼進工單。", en: "Twelve short prompts for the on-call engineer. Paste them into a ticket as they are." },
      price: 18,
      keys: ["DW-NIGHT-4K2M", "DW-NIGHT-9QPL", "DW-NIGHT-1HXC"]
    },
    {
      id: "activate",
      name: { zh: "工作室激活碼", en: "Studio activation" },
      blurb: { zh: "一組一年的席位碼。買家付款後只拿到這一串。", en: "One seat code, good for a year. After payment the buyer gets this string and nothing else." },
      price: 48,
      keys: ["ACT-7F2C-91KD", "ACT-3M8Q-04WE"]
    },
    {
      id: "essay",
      name: { zh: "寫作包 · 品牌三語", en: "Writing pack · three languages" },
      blurb: { zh: "中英土三語首頁的句式。這一櫃目前是空的。", en: "Sentence patterns for a Chinese, English, and Turkish homepage. This shelf is empty." },
      price: 36,
      keys: []
    }
  ],
  orders: [
    {
      id: "ord-1042",
      productId: "prompt-pack",
      status: "pending",
      at: "2026-11-07T09:12:00+08:00",
      code: null
    },
    {
      id: "ord-1041",
      productId: "activate",
      status: "paid",
      at: "2026-11-07T08:40:00+08:00",
      code: null
    },
    {
      id: "ord-1038",
      productId: "prompt-pack",
      status: "issued",
      at: "2026-11-06T21:05:00+08:00",
      code: "DW-NIGHT-0OLD"
    }
  ]
};
