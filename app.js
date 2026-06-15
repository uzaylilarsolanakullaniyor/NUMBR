/* ============================================================
   Numbr — financial freedom calculator
   Required Savings = (Monthly Expenses × 12) / Annual Return Rate
   ============================================================ */

// Net-yield deduction for real estate (taxes, maintenance, vacancy), in % points.
const NET_COST = 2;

// ---- Instrument definitions (default rates are editable in the UI) ----
const INSTRUMENTS = {
  USD: [
    { id: "savings",    name: "Savings / Money Market", sub: "High-yield savings",     rate: 4.5,  color: "#21d4fd" },
    { id: "treasury",   name: "US Treasury Bonds",       sub: "~10-year approx.",       rate: 4.25, color: "#4f8cff" },
    { id: "sp500",      name: "S&P 500",                 sub: "SPX historical avg.",    rate: 10,   color: "#2ee6a6", historical: true },
    { id: "nasdaq",     name: "Nasdaq 100",              sub: "Historical avg.",        rate: 13,   color: "#7c5cff", historical: true },
    { id: "btc",        name: "Bitcoin (BTC)",           sub: "Speculative — see note", rate: 25,   color: "#ffb454", warn: true, historical: true },
    { id: "realestate", name: "Real Estate",             sub: "Rental yield · rent ÷ value", rate: 6.6, color: "#ff7eb6", realEstate: true, historical: true },
  ],
  TL: [
    { id: "deposit",    name: "TL Deposit",              sub: "Annual interest rate",   rate: 42,   color: "#21d4fd" },
    { id: "gold",       name: "Gold (in TL)",            sub: "Gold priced in lira",    rate: 40,   color: "#ffd54a", historical: true },
    { id: "bist",       name: "BIST 100",                sub: "Borsa Istanbul avg.",    rate: 35,   color: "#2ee6a6", historical: true },
    { id: "eurobond",   name: "Eurobond / FX deposit",   sub: "FX-linked return",       rate: 25,   color: "#7c5cff" },
    { id: "btc",        name: "Bitcoin (BTC)",           sub: "Last 12 mo. · TRY",      rate: 36.9, color: "#ffb454", warn: true, historical: true, note: "Trailing ~12-month return in lira terms (≈ +37%, as of mid-2026, source: CoinGecko). Bitcoin is extremely volatile — a single year is not a forecast." },
    { id: "realestate", name: "Real Estate",             sub: "Rental yield · rent ÷ value", rate: 7.3, color: "#ff7eb6", realEstate: true, historical: true },
  ],
};

const CURRENCY_META = {
  USD: { symbol: "$", code: "USD", locale: "en-US", inflation: 3,  rentHint: "2,200", valueHint: "400,000" },
  TL:  { symbol: "₺", code: "TRY", locale: "tr-TR", inflation: 40, rentHint: "30,000", valueHint: "5,000,000" },
};

const RE_NOTE = {
  USD: "Default gross yield ≈ 6.6% (Global Property Guide national average, Q4 2025). Rental yields vary widely by city and property type — historical, not a guarantee.",
  TL:  "Default gross yield ≈ 7.3% (Global Property Guide national average, Q1 2026). Rental yields vary widely by city and property type — historical, not a guarantee.",
};

// ---- State ----
const state = {
  currency: "USD",
  monthlyExpenses: 3000,
  realMode: false,
  inflation: { USD: 3, TL: 40 },
  // editable rates kept per currency so toggling never loses edits
  rates: {
    USD: Object.fromEntries(INSTRUMENTS.USD.map((i) => [i.id, i.rate])),
    TL: Object.fromEntries(INSTRUMENTS.TL.map((i) => [i.id, i.rate])),
  },
  // real-estate custom inputs, per currency
  realEstate: {
    USD: { propertyValue: 0, monthlyRent: 0, netYield: false },
    TL: { propertyValue: 0, monthlyRent: 0, netYield: false },
  },
};

// ---- Elements ----
const el = {
  toggle: document.querySelector(".toggle"),
  toggleBtns: document.querySelectorAll(".toggle-btn"),
  currencySymbol: document.getElementById("currencySymbol"),
  expenses: document.getElementById("expenses"),
  realMode: document.getElementById("realMode"),
  inflationField: document.getElementById("inflationField"),
  inflation: document.getElementById("inflation"),
  cards: document.getElementById("cards"),
  bars: document.getElementById("bars"),
  bestAmount: document.getElementById("bestAmount"),
  bestLabel: document.getElementById("bestLabel"),
  bestRate: document.getElementById("bestRate"),
  headlineNote: document.getElementById("headlineNote"),
  ruleNumber: document.getElementById("ruleNumber"),
  ruleNote: document.getElementById("ruleNote"),
};

// ---- Helpers ----
function parseNumber(str) {
  if (typeof str !== "string") return Number(str) || 0;
  const cleaned = str.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function formatMoney(value, { compact = false } = {}) {
  const meta = CURRENCY_META[state.currency];
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}

function formatThousands(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

// Pretty-print a rate, trimming needless decimals.
function formatRate(value, withSign = true) {
  const rounded = Math.round(value * 100) / 100;
  return withSign ? rounded + "%" : String(rounded);
}

/** Effective annual rate: in real mode we subtract inflation (nominal − inflation). */
function effectiveRate(nominalPercent) {
  const infl = state.realMode ? state.inflation[state.currency] : 0;
  return (nominalPercent - infl) / 100;
}

function requiredSavings(nominalPercent) {
  const rate = effectiveRate(nominalPercent);
  if (rate <= 0) return Infinity; // can't outpace inflation / no growth
  return (state.monthlyExpenses * 12) / rate;
}

// ---- Real-estate yield helpers ----
function reCustomActive(cur) {
  const re = state.realEstate[cur];
  return re.propertyValue > 0 && re.monthlyRent > 0;
}
// Gross yield before net-cost deduction (custom if both fields filled, else the editable default).
function reGrossYield(cur) {
  const re = state.realEstate[cur];
  return reCustomActive(cur)
    ? (re.monthlyRent * 12) / re.propertyValue * 100
    : state.rates[cur].realestate;
}

// Nominal yearly return fed into the shared calculation.
function instrumentNominal(inst) {
  const cur = state.currency;
  if (!inst.realEstate) return state.rates[cur][inst.id];
  let gross = reGrossYield(cur);
  if (state.realEstate[cur].netYield) gross -= NET_COST;
  return gross;
}

// ============================================================
//  Build (structure, once per currency) + Refresh (values, live)
//  Splitting these keeps input elements alive between keystrokes,
//  so the caret stays put and decimals like "7.3" can be typed.
// ============================================================

function buildLayout() {
  const cur = state.currency;
  const meta = CURRENCY_META[cur];
  el.currencySymbol.textContent = meta.symbol;

  el.cards.innerHTML = "";
  INSTRUMENTS[cur].forEach((inst, idx) => {
    el.cards.appendChild(inst.realEstate ? buildRealEstateCard(inst, idx, meta) : buildSimpleCard(inst, idx));
  });

  el.bars.innerHTML = "";
  INSTRUMENTS[cur].forEach((inst) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.dataset.bar = inst.id;
    row.innerHTML = `
      <div class="bar-name">${inst.name}<small data-barbest hidden> · easiest</small></div>
      <div class="bar-track">
        <div class="bar-fill" style="--bar-color:${inst.color}"></div>
        <span class="bar-value"></span>
      </div>`;
    el.bars.appendChild(row);
  });

  wireDynamicInputs();
}

function buildSimpleCard(inst, idx) {
  const cur = state.currency;
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.card = inst.id;
  card.style.setProperty("--card-color", inst.color);
  card.style.animationDelay = `${idx * 55}ms`;

  const note =
    inst.note ||
    (inst.warn
      ? "Bitcoin is highly volatile; this figure is speculative."
      : inst.historical
      ? "Based on historical averages — not a guarantee."
      : "");

  card.innerHTML = `
    <div class="card-accent"></div>
    <div class="card-head">
      <div>
        <h3 class="card-title">${inst.name}</h3>
        <p class="card-sub">${inst.sub}</p>
      </div>
      <span class="card-badge" data-badge hidden></span>
    </div>
    <div class="card-rate">
      <span class="card-rate-label">Annual return</span>
      <div class="rate-input">
        <input type="text" inputmode="decimal" data-id="${inst.id}" value="${formatRate(state.rates[cur][inst.id], false)}" aria-label="${inst.name} annual return rate" />
        <span class="rate-sign">%</span>
      </div>
    </div>
    <div class="card-amount">
      <div class="card-amount-value" data-amount>—</div>
      <div class="card-amount-label">total savings required</div>
      <div class="card-effrate" data-eff hidden></div>
      ${note ? `<div class="card-warn-note">${note}</div>` : ""}
    </div>`;
  return card;
}

function buildRealEstateCard(inst, idx, meta) {
  const cur = state.currency;
  const re = state.realEstate[cur];
  const card = document.createElement("article");
  card.className = "card card--realestate";
  card.dataset.card = "realestate";
  card.style.setProperty("--card-color", inst.color);
  card.style.animationDelay = `${idx * 55}ms`;

  card.innerHTML = `
    <div class="card-accent"></div>
    <div class="re-grid">
      <div class="re-main">
        <div class="card-head">
          <div>
            <h3 class="card-title">${inst.name}</h3>
            <p class="card-sub">${inst.sub}</p>
          </div>
          <span class="card-badge" data-badge hidden></span>
        </div>
        <div class="card-rate">
          <span class="card-rate-label">Gross rental yield</span>
          <div class="rate-input">
            <input type="text" inputmode="decimal" data-id="realestate" value="${formatRate(state.rates[cur].realestate, false)}" aria-label="Gross rental yield" />
            <span class="rate-sign">%</span>
          </div>
        </div>
        <div class="card-amount">
          <div class="card-amount-value" data-amount>—</div>
          <div class="card-amount-label">total savings required (≈ property value)</div>
          <div class="card-effrate" data-eff hidden></div>
        </div>
      </div>
      <div class="re-calc">
        <div class="re-calc-title">Use your own property <span>(optional)</span></div>
        <label class="re-field">Property value
          <div class="money-input money-input--sm">
            <span class="money-symbol">${meta.symbol}</span>
            <input type="text" inputmode="numeric" data-re="propertyValue" value="${re.propertyValue ? formatThousands(re.propertyValue) : ""}" placeholder="e.g. ${meta.valueHint}" />
          </div>
        </label>
        <label class="re-field">Monthly rent
          <div class="money-input money-input--sm">
            <span class="money-symbol">${meta.symbol}</span>
            <input type="text" inputmode="numeric" data-re="monthlyRent" value="${re.monthlyRent ? formatThousands(re.monthlyRent) : ""}" placeholder="e.g. ${meta.rentHint}" />
          </div>
        </label>
        <div class="re-computed" data-recomputed hidden></div>
        <label class="switch switch--sm">
          <input type="checkbox" data-re="netYield" ${re.netYield ? "checked" : ""} />
          <span class="switch-track"><span class="switch-thumb"></span></span>
          <span class="switch-label">Net yield <small>−${NET_COST}% taxes, upkeep &amp; vacancy</small></span>
        </label>
      </div>
    </div>
    <div class="card-warn-note">${RE_NOTE[cur]}</div>`;
  return card;
}

function wireDynamicInputs() {
  el.cards.querySelectorAll("input[data-id]").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.disabled) return;
      state.rates[state.currency][input.dataset.id] = parseNumber(input.value);
      refresh();
    });
  });
  el.cards.querySelectorAll("input[data-re]").forEach((input) => {
    const field = input.dataset.re;
    if (field === "netYield") {
      input.addEventListener("change", () => {
        state.realEstate[state.currency].netYield = input.checked;
        refresh();
      });
    } else {
      input.addEventListener("input", () => {
        state.realEstate[state.currency][field] = parseNumber(input.value);
        refresh();
      });
      input.addEventListener("blur", () => {
        const v = state.realEstate[state.currency][field];
        if (v > 0) input.value = formatThousands(v);
      });
    }
  });
}

function refresh() {
  const list = INSTRUMENTS[state.currency];
  const results = list.map((inst) => {
    const nominal = instrumentNominal(inst);
    return { inst, nominal, eff: effectiveRate(nominal) * 100, required: requiredSavings(nominal) };
  });

  const reachable = results.filter((r) => isFinite(r.required));
  const best = reachable.reduce((a, b) => (b.required < a.required ? b : a), reachable[0] || null);

  results.forEach((r) => {
    const card = el.cards.querySelector(`[data-card="${r.inst.id}"]`);
    if (card) updateCard(card, r, best);
  });

  const finite = results.filter((r) => isFinite(r.required)).map((r) => r.required);
  const max = finite.length ? Math.max(...finite) : 0;
  results.forEach((r) => {
    const row = el.bars.querySelector(`[data-bar="${r.inst.id}"]`);
    if (row) updateBar(row, r, best, max);
  });

  renderHeadline(best, results, reachable.length);
  renderRule();
}

function updateCard(card, r, best) {
  const { inst, nominal, eff, required } = r;
  const isBest = best && inst.id === best.inst.id;
  const unreachable = !isFinite(required);

  card.classList.toggle("is-best", !!isBest);

  const amountEl = card.querySelector("[data-amount]");
  if (unreachable) {
    amountEl.textContent = "Doesn't outpace inflation";
    amountEl.classList.add("unreachable");
  } else {
    amountEl.textContent = formatMoney(required);
    amountEl.classList.remove("unreachable");
  }

  const badge = card.querySelector("[data-badge]");
  if (isBest) {
    badge.hidden = false;
    badge.className = "card-badge badge-best";
    badge.textContent = "Easiest";
  } else if (inst.warn) {
    badge.hidden = false;
    badge.className = "card-badge badge-warn";
    badge.textContent = "Volatile";
  } else {
    badge.hidden = true;
    badge.textContent = "";
  }

  const effEl = card.querySelector("[data-eff]");
  if (inst.realEstate) {
    updateReCard(card, effEl);
  } else if (state.realMode) {
    effEl.hidden = false;
    effEl.innerHTML = `Real rate: ${formatRate(eff)} &nbsp;(${formatRate(nominal)} − ${formatRate(state.inflation[state.currency])} inflation)`;
  } else {
    effEl.hidden = true;
  }
}

function updateReCard(card, effEl) {
  const cur = state.currency;
  const customActive = reCustomActive(cur);
  const grossRaw = reGrossYield(cur);
  const net = state.realEstate[cur].netYield ? NET_COST : 0;
  const infl = state.realMode ? state.inflation[cur] : 0;
  const effective = grossRaw - net - infl;

  // Auto-fill / lock the gross-yield field when a custom property is supplied.
  const yInput = card.querySelector('input[data-id="realestate"]');
  if (customActive) {
    yInput.disabled = true;
    yInput.classList.add("is-auto");
    if (yInput !== document.activeElement) yInput.value = formatRate(grossRaw, false);
  } else if (yInput.disabled) {
    yInput.disabled = false;
    yInput.classList.remove("is-auto");
    yInput.value = formatRate(state.rates[cur].realestate, false);
  }

  const comp = card.querySelector("[data-recomputed]");
  if (customActive) {
    comp.hidden = false;
    comp.textContent = `Computed yield ${formatRate(grossRaw)} — rent ÷ property value`;
  } else {
    comp.hidden = true;
  }

  const parts = [];
  if (net) parts.push(`−${net}% costs`);
  if (infl) parts.push(`− ${formatRate(infl)} inflation`);
  if (parts.length) {
    effEl.hidden = false;
    const label = net && infl ? "Effective" : net ? "Net" : "Real";
    effEl.innerHTML = `${label} yield: ${formatRate(effective)} &nbsp;(${formatRate(grossRaw)} gross ${parts.join(" ")})`;
  } else {
    effEl.hidden = true;
  }
}

function updateBar(row, r, best, max) {
  const { inst, required } = r;
  const unreachable = !isFinite(required);
  const isBest = best && inst.id === best.inst.id;
  const fill = row.querySelector(".bar-fill");
  const val = row.querySelector(".bar-value");
  row.querySelector("[data-barbest]").hidden = !isBest;

  if (unreachable) {
    fill.classList.add("unreachable");
    fill.style.width = "100%";
    val.textContent = "Out of reach";
  } else {
    fill.classList.remove("unreachable");
    fill.style.width = (max === 0 ? 0 : Math.max(4, (required / max) * 100)) + "%";
    val.textContent = formatMoney(required, { compact: true });
  }
}

function renderHeadline(best, results, reachableCount) {
  if (!best) {
    el.bestAmount.textContent = "Not reachable";
    el.bestLabel.textContent = "No instrument beats inflation";
    el.bestRate.textContent = "";
    el.headlineNote.textContent =
      "At these rates, real returns are zero or negative — passive income can't outpace inflation. Lower your inflation assumption or raise a return rate.";
    return;
  }
  el.bestAmount.textContent = formatMoney(best.required);
  el.bestLabel.textContent = `via ${best.inst.name}`;
  el.bestRate.textContent = `${formatRate(best.eff)} ${state.realMode ? "real" : ""} return`.trim();
  const monthly = formatMoney(state.monthlyExpenses);
  el.headlineNote.textContent =
    `Save this much and ${best.inst.name}'s return would generate about ${monthly}/month — covering your expenses without touching the principal.` +
    (reachableCount < results.length ? " Some instruments below don't reach freedom at the current inflation assumption." : "");
}

// The canonical "4% rule" figure: 25× annual expenses (1 / 0.04 = 25).
function renderRule() {
  el.ruleNumber.textContent = formatMoney(state.monthlyExpenses * 12 * 25);
  el.ruleNote.textContent =
    state.currency === "TL"
      ? "Heads-up: the 4% rule is drawn from long-run US market history. In a high-inflation currency like the lira, think in real (after-inflation) terms — switch on Real return mode above for a more honest number."
      : "Based on ~30 years of historical US stock & bond returns and a balanced portfolio. A guideline, not a guarantee — past performance doesn't predict the future.";
}

// ---- Event wiring (static elements) ----
el.toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const cur = btn.dataset.currency;
    if (cur === state.currency) return;
    state.currency = cur;

    el.toggleBtns.forEach((b) => {
      const active = b.dataset.currency === cur;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    el.toggle.classList.toggle("tl", cur === "TL");
    el.inflation.value = formatRate(state.inflation[cur], false);

    buildLayout();
    refresh();
  });
});

el.expenses.addEventListener("input", () => {
  state.monthlyExpenses = parseNumber(el.expenses.value);
  refresh();
});
el.expenses.addEventListener("blur", () => {
  if (state.monthlyExpenses > 0) el.expenses.value = formatThousands(state.monthlyExpenses);
});

el.realMode.addEventListener("change", () => {
  state.realMode = el.realMode.checked;
  el.inflationField.hidden = !state.realMode;
  refresh();
});

el.inflation.addEventListener("input", () => {
  state.inflation[state.currency] = parseNumber(el.inflation.value);
  refresh();
});

// ---- Init ----
el.expenses.value = formatThousands(state.monthlyExpenses);
el.inflation.value = formatRate(state.inflation.USD, false);
buildLayout();
refresh();
