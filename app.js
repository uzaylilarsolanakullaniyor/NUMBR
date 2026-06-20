/* ============================================================
   NumBrrr, financial freedom calculator
   Required Savings = (Monthly Expenses × 12) / Annual Return Rate
   ============================================================ */

const NET_COST = 2; // real-estate net-yield deduction (% points)

// ---- Instrument definitions (names/subs are translated via I18N) ----
const INSTRUMENTS = {
  USD: [
    { id: "savings",    rate: 4.5,  color: "#21d4fd" },
    { id: "treasury",   rate: 4.25, color: "#4f8cff" },
    { id: "sp500",      rate: 10,   color: "#2ee6a6", historical: true },
    { id: "nasdaq",     rate: 13,   color: "#7c5cff", historical: true },
    { id: "btc",        rate: 25,   color: "#ffb454", warn: true, historical: true },
    { id: "realestate", rate: 6.6,  color: "#ff7eb6", realEstate: true, historical: true },
  ],
  TL: [
    { id: "deposit",    rate: 42,   color: "#21d4fd" },
    { id: "gold",       rate: 40,   color: "#ffd54a", historical: true },
    { id: "bist",       rate: 35,   color: "#2ee6a6", historical: true },
    { id: "eurobond",   rate: 25,   color: "#7c5cff" },
    { id: "btc",        rate: 36.9, color: "#ffb454", warn: true, historical: true, noteKey: "note_btc_tl" },
    { id: "realestate", rate: 7.3,  color: "#ff7eb6", realEstate: true, historical: true },
  ],
};

const CURRENCY_META = {
  USD: { symbol: "$", code: "USD", locale: "en-US", inflation: 3,  rentHint: "2,200", valueHint: "400,000" },
  TL:  { symbol: "₺", code: "TRY", locale: "tr-TR", inflation: 40, rentHint: "30,000", valueHint: "5,000,000" },
};

// Country selection. Each country maps 1:1 to a market/currency (which already
// carries its own deposit/interest rate via INSTRUMENTS) and a default language.
const COUNTRIES = {
  US: { flag: "🇺🇸", currency: "USD", lang: "en" },
  TR: { flag: "🇹🇷", currency: "TL",  lang: "tr" },
};
function countryForCurrency(cur) { return cur === "TL" ? "TR" : "US"; }

const SAVINGS_CATEGORIES = ["cigarettes","alcohol","subscriptions","eatingout","delivery","coffee","gaming","fuel","shopping"];
const SAVINGS_DEFAULT_INVEST = { USD: "sp500", TL: "deposit" };
// Income sources, pre-classified as passive (counts toward freedom) or active.
const INCOME_CATEGORIES = [
  { id: "salary", passive: false },
  { id: "rental", passive: true },
  { id: "interest", passive: true },
  { id: "dividends", passive: true },
  { id: "side", passive: false },
];
// Portfolio holding asset types (tags). Interest-bearing ones feed Income.
const ASSET_TYPES = ["usstock", "bist", "crypto", "gold", "deposit", "bonds", "cash"];
// Searchable company lists (symbol + display name). Prices fetched live from Yahoo.
const US_STOCKS = [
  { s: "AAPL", n: "Apple" }, { s: "MSFT", n: "Microsoft" }, { s: "GOOGL", n: "Alphabet (Google)" }, { s: "AMZN", n: "Amazon" },
  { s: "NVDA", n: "NVIDIA" }, { s: "META", n: "Meta Platforms" }, { s: "TSLA", n: "Tesla" }, { s: "BRK-B", n: "Berkshire Hathaway" },
  { s: "JPM", n: "JPMorgan Chase" }, { s: "V", n: "Visa" }, { s: "MA", n: "Mastercard" }, { s: "UNH", n: "UnitedHealth" },
  { s: "HD", n: "Home Depot" }, { s: "PG", n: "Procter & Gamble" }, { s: "JNJ", n: "Johnson & Johnson" }, { s: "XOM", n: "Exxon Mobil" },
  { s: "CVX", n: "Chevron" }, { s: "KO", n: "Coca-Cola" }, { s: "PEP", n: "PepsiCo" }, { s: "COST", n: "Costco" },
  { s: "WMT", n: "Walmart" }, { s: "DIS", n: "Disney" }, { s: "NFLX", n: "Netflix" }, { s: "ADBE", n: "Adobe" },
  { s: "CRM", n: "Salesforce" }, { s: "INTC", n: "Intel" }, { s: "AMD", n: "AMD" }, { s: "QCOM", n: "Qualcomm" },
  { s: "ORCL", n: "Oracle" }, { s: "CSCO", n: "Cisco" }, { s: "IBM", n: "IBM" }, { s: "BA", n: "Boeing" },
  { s: "F", n: "Ford" }, { s: "GM", n: "General Motors" }, { s: "NKE", n: "Nike" }, { s: "SBUX", n: "Starbucks" },
  { s: "MCD", n: "McDonald's" }, { s: "PYPL", n: "PayPal" }, { s: "BAC", n: "Bank of America" }, { s: "GS", n: "Goldman Sachs" },
  { s: "T", n: "AT&T" }, { s: "VZ", n: "Verizon" }, { s: "PFE", n: "Pfizer" }, { s: "MRK", n: "Merck" },
  { s: "LLY", n: "Eli Lilly" }, { s: "AVGO", n: "Broadcom" }, { s: "MU", n: "Micron" }, { s: "UBER", n: "Uber" },
  { s: "ABNB", n: "Airbnb" }, { s: "COIN", n: "Coinbase" }, { s: "PLTR", n: "Palantir" }, { s: "SHOP", n: "Shopify" },
  { s: "SPOT", n: "Spotify" }, { s: "BABA", n: "Alibaba" },
  // ETFs
  { s: "SPY", n: "SPDR S&P 500 ETF (SPY)" }, { s: "QQQ", n: "Invesco QQQ — Nasdaq 100 (QQQ)" },
  { s: "VOO", n: "Vanguard S&P 500 ETF (VOO)" }, { s: "IVV", n: "iShares Core S&P 500 (IVV)" },
  { s: "VTI", n: "Vanguard Total Stock Market (VTI)" }, { s: "DIA", n: "SPDR Dow Jones (DIA)" },
  { s: "IWM", n: "iShares Russell 2000 (IWM)" }, { s: "VEA", n: "Vanguard Developed Markets (VEA)" },
  { s: "VWO", n: "Vanguard Emerging Markets (VWO)" }, { s: "GLD", n: "SPDR Gold Shares (GLD)" },
  { s: "SLV", n: "iShares Silver Trust (SLV)" }, { s: "ARKK", n: "ARK Innovation ETF (ARKK)" },
  { s: "SCHD", n: "Schwab US Dividend (SCHD)" }, { s: "VYM", n: "Vanguard High Dividend (VYM)" },
  { s: "XLK", n: "Technology Select Sector (XLK)" }, { s: "XLF", n: "Financial Select Sector (XLF)" },
  { s: "XLE", n: "Energy Select Sector (XLE)" }, { s: "SMH", n: "VanEck Semiconductor (SMH)" },
];
const BIST_STOCKS = [
  { s: "AKBNK", n: "Akbank" }, { s: "GARAN", n: "Garanti BBVA" }, { s: "ISCTR", n: "İş Bankası" }, { s: "YKBNK", n: "Yapı Kredi" },
  { s: "VAKBN", n: "VakıfBank" }, { s: "HALKB", n: "Halkbank" }, { s: "THYAO", n: "Türk Hava Yolları" }, { s: "PGSUS", n: "Pegasus" },
  { s: "BIMAS", n: "BİM" }, { s: "MGROS", n: "Migros" }, { s: "SOKM", n: "Şok Marketler" }, { s: "ASELS", n: "Aselsan" },
  { s: "KCHOL", n: "Koç Holding" }, { s: "SAHOL", n: "Sabancı Holding" }, { s: "EREGL", n: "Ereğli Demir Çelik" }, { s: "KRDMD", n: "Kardemir" },
  { s: "SISE", n: "Şişecam" }, { s: "TUPRS", n: "Tüpraş" }, { s: "PETKM", n: "Petkim" }, { s: "SASA", n: "Sasa Polyester" },
  { s: "FROTO", n: "Ford Otosan" }, { s: "TOASO", n: "Tofaş" }, { s: "DOAS", n: "Doğuş Otomotiv" }, { s: "TTRAK", n: "Türk Traktör" },
  { s: "OTKAR", n: "Otokar" }, { s: "ARCLK", n: "Arçelik" }, { s: "VESTL", n: "Vestel" }, { s: "TCELL", n: "Turkcell" },
  { s: "TTKOM", n: "Türk Telekom" }, { s: "ENKAI", n: "Enka İnşaat" }, { s: "TKFEN", n: "Tekfen Holding" }, { s: "ALARK", n: "Alarko Holding" },
  { s: "ENJSA", n: "Enerjisa" }, { s: "AKSEN", n: "Aksa Enerji" }, { s: "ZOREN", n: "Zorlu Enerji" }, { s: "ODAS", n: "Odaş Elektrik" },
  { s: "KOZAL", n: "Koza Altın" }, { s: "KOZAA", n: "Koza Madencilik" }, { s: "GUBRF", n: "Gübretaş" }, { s: "HEKTS", n: "Hektaş" },
  { s: "OYAKC", n: "Oyak Çimento" }, { s: "CIMSA", n: "Çimsa" }, { s: "AEFES", n: "Anadolu Efes" }, { s: "CCOLA", n: "Coca-Cola İçecek" },
  { s: "ULKER", n: "Ülker" }, { s: "TAVHL", n: "TAV Havalimanları" }, { s: "EKGYO", n: "Emlak Konut GYO" }, { s: "ASTOR", n: "Astor Enerji" },
  { s: "BRSAN", n: "Borusan Boru" }, { s: "SMRTG", n: "Smart Güneş" }, { s: "GWIND", n: "Galata Wind" }, { s: "REEDR", n: "Reeder" },
];
const WITHHOLD_PCT = 15; // approx. withholding tax (stopaj) on deposit/bond interest
let cryptoMarkets = []; // top coins for the active currency: [{ id, symbol, name, price }]
let goldPriceGram = 0; // per-gram gold price in the active currency
const GRAMS_PER_OZ = 31.1034768;
let usdTry = 0; // TRY per 1 USD (for converting stock prices to the active currency)
let watchData = {}; // key -> { price, ccy, chg24, chg1mo, chg1y } for watchlist items

// ============================================================
//  i18n dictionary
// ============================================================
const I18N = {
  en: {
    nav_home: "Freedom", nav_savings: "Expenses", nav_settings: "Settings", nav_more: "More",
    currency: "Currency", monthly_expenses: "Monthly expenses", per_month: "/ month",
    real_mode: "Real return mode", real_mode_sub: "Subtract inflation from each rate",
    inflation_label: "Inflation (annual %)",
    headline_tag: "Your easiest path to freedom",
    via: "via {name}", return_word: "return", real_word: "real",
    headline_note: "Save this much and {name}'s return would generate about {monthly}/month, covering your expenses without touching the principal.",
    headline_note_extra: " Some instruments below don't reach freedom at the current inflation assumption.",
    not_reachable: "Not reachable", no_beat_inflation: "No instrument beats inflation",
    not_reachable_note: "At these rates, real returns are zero or negative, passive income can't outpace inflation. Lower your inflation assumption or raise a return rate.",
    rule_badge: "📚 The 4% Rule · Trinity Study", rule_title: "25× your annual expenses",
    rule_text: 'NumBrrr generalizes a classic idea: if your savings earn about <strong>4% a year</strong>, you need roughly <strong>25× your annual expenses</strong> so the returns alone cover your life, without ever draining the principal. That "safe withdrawal rate" comes from the <strong>Trinity Study (1998)</strong>, a landmark academic analysis of historical market data, and it\'s the foundation of the financial-independence (FIRE) movement.',
    rule_number_label: "Your 25× number (at 4%)", rule_link: "Read the Trinity Study →",
    rule_note_USD: "Based on ~30 years of historical US stock & bond returns and a balanced portfolio. A guideline, not a guarantee, past performance doesn't predict the future.",
    rule_note_TL: "Heads-up: the 4% rule is drawn from long-run US market history. In a high-inflation currency like the lira, think in real (after-inflation) terms, switch on Real return mode above for a more honest number.",
    compare_title: "Compare instruments", compare_sub: "Each card shows the savings you'd need so its yearly return pays your expenses. Rates are editable.",
    annual_return: "Annual return", total_required: "total savings required", total_required_re: "total savings required (≈ property value)",
    easiest: "Easiest", volatile: "Volatile", doesnt_outpace: "Doesn't outpace inflation",
    gross_yield: "Gross rental yield", use_property: "Use your own property", optional: "(optional)",
    property_value: "Property value", monthly_rent: "Monthly rent",
    computed_yield: "Computed yield {rate}, rent ÷ property value",
    net_yield: "Net yield", net_yield_sub: "−2% taxes, upkeep & vacancy",
    lbl_real_rate: "Real rate", word_inflation: "inflation", word_gross: "gross", word_costs: "costs", word_yield: "yield",
    eff_real: "Real", eff_net: "Net", eff_effective: "Effective",
    chart_title: "Savings required", chart_sub: "Lower is better, less to save before your money works for you.",
    bar_easiest: "· easiest", out_of_reach: "Out of reach",
    disc_title: "Good to know",
    disc_1: "<strong>Estimates, not advice.</strong> NumBrrr is an educational planning tool, not financial advice.",
    disc_2: "<strong>Historical ≠ future.</strong> Stock indices (S&P 500, Nasdaq, BIST 100) and Bitcoin returns are historical averages and do not guarantee future performance.",
    disc_3: "<strong>Bitcoin is highly volatile.</strong> Crypto can swing dramatically; treat its return as speculative.",
    disc_4: "<strong>Real estate yields vary.</strong> Rental yields differ widely by city and property type; defaults are national averages (Global Property Guide) and are historical, not a guarantee. Use the property-value & rent fields for your own number.",
    disc_5: "<strong>Rates are defaults.</strong> Every return rate is pre-filled with a reasonable default and is fully editable, tune them to your own assumptions.",
    cut_title: "Your expenses", cut_sub: "List what you spend each month. Toggle items on or off, and see what each could become if you invested it instead. These totals are what count as your expenses across the app.",
    add_custom: "+ Add custom category", custom_ph: "Custom category", eg: "e.g.",
    redirect_label: "If you redirect this every month", per_mo: "{x} /mo", per_year: "{x} a year",
    invested_in: "Invested in", yr1: "1 year", yr5: "5 years", yr10: "10 years",
    punch: "By cutting these habits and investing, you could have {x} in 10 years.",
    punch_empty: "Toggle on the habits you want to quit and type what you spend to see your number.",
    savings_note: "Projection compounds yearly contributions: FV = annual × [((1 + r)ⁿ − 1) / r], where r is the selected annual return. Returns are assumptions, not guarantees.",
    settings_title: "Settings", language: "Language", theme: "Theme", country: "Country",
    onb_title: "Welcome to NumBrrr", onb_sub: "Pick your country and language to get started. You can change these anytime in Settings.",
    onb_country: "Country", onb_language: "Language", onb_start: "Continue",
    theme_glass: "Liquid Glass", theme_glass_desc: "Modern frosted glass (default)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostalgic early-2000s Luna blue",
    theme_medieval: "Medieval", theme_medieval_desc: "Gritty 15th-century parchment & iron",
    theme_doge: "Doge", theme_doge_desc: "such wow · much finance · very meme",
    theme_vaporwave: "Vaporwave", theme_vaporwave_desc: "80s neon dream · A E S T H E T I C",
    more_soon: "More features coming soon ✨",
    nav_portfolio: "Portfolio",
    portfolio_title: "Your portfolio", portfolio_sub: "Add what you already own and see how it's spread across your assets.",
    holding_ph: "Holding name", add_holding: "+ Add holding", total_value: "Total portfolio value",
    flow_title: "Monthly cash flow", flow_income: "Income", flow_expenses: "Expenses", flow_net: "Net / month",
    flow_savings_note: "+{x}/month more if you cut your tracked spending.",
    cat_cash: "Cash", cat_investment: "Investment",
    asset_stocks: "Stocks", asset_usstock: "US Stocks", asset_bist: "Turkish (BIST)", asset_crypto: "Crypto", asset_deposit: "Deposit", asset_bonds: "Bonds", asset_realestate: "Real estate", asset_gold: "Gold", asset_cash: "Cash",
    stock_search_ph: "Search stock (e.g. Apple)", shares_ph: "Shares",
    nav_watchlist: "Watch", watch_title: "Watchlist", watch_sub: "Search and favorite assets to track their price and performance.",
    watch_search_ph: "Search gold, stocks, crypto…", watch_empty: "Search above and tap to add assets to your watchlist.",
    lbl_24h: "24h", lbl_1mo: "1M", lbl_1yr: "1Y",
    inc_from_portfolio: "+{x}/mo from portfolio",
    net_tax: "Net (−15% tax)", coin_search_ph: "Search coin (e.g. Solana)", qty_ph: "Qty", coin_loading: "Loading live prices…", grams_ph: "Grams", oz_ph: "Ounces",
    target_via: "Freedom target via (pick one or more)", target_x: "Target {x}", to_freedom: "to financial freedom", blended_return: "Blended return",
    income_line: "Right now your portfolio could generate about {income}/month, covering {pct} of your expenses.",
    freedom_reached: "🎉 You've reached your freedom number. Your investments can cover your expenses!",
    portfolio_empty: "Add holdings below to see the breakdown.",
    portfolio_note: "Freedom target = yearly expenses ÷ chosen return. Passive income = value × return. Estimates, not advice.",
    nav_income: "Income",
    income_title: "Your income", income_sub: "Add your monthly income. Mark the passive ones (rent, interest, dividends); only passive income counts toward freedom.",
    add_income: "+ Add income", income_ph: "Income source", total_income: "Total monthly income",
    passive_label: "Passive", active_label: "Active", covered_by_passive: "covered by passive income",
    surplus_line: "You have about {x}/month left to invest.", deficit_line: "You spend about {x}/month more than you earn.",
    income_free: "🎉 Financially free: your passive income already covers your expenses!",
    income_empty: "Add your income above to see where you stand.",
    income_note: "Passive income = rent, interest, dividends, and similar. Financial freedom = passive income ≥ your expenses.",
    inc: { salary: "Salary", rental: "Rental income", interest: "Interest income", dividends: "Dividends", side: "Side / freelance income" },
    note_historical: "Based on historical averages, not a guarantee.",
    note_btc_warn: "Bitcoin is highly volatile; this figure is speculative.",
    note_btc_tl: "Trailing ~12-month return in lira terms (≈ +37%, as of mid-2026, source: CoinGecko). Bitcoin is extremely volatile, a single year is not a forecast.",
    re_note_USD: "Default gross yield ≈ 6.6% (Global Property Guide national average, Q4 2025). Rental yields vary widely by city and property type, historical, not a guarantee.",
    re_note_TL: "Default gross yield ≈ 7.3% (Global Property Guide national average, Q1 2026). Rental yields vary widely by city and property type, historical, not a guarantee.",
    inst: {
      savings: { name: "Savings / Money Market", sub: "High-yield savings" },
      treasury: { name: "US Treasury Bonds", sub: "~10-year approx." },
      sp500: { name: "S&P 500", sub: "SPX historical avg." },
      nasdaq: { name: "Nasdaq 100", sub: "Historical avg." },
      btc: { name: "Bitcoin (BTC)", sub: "Speculative", sub_tl: "Last 12 mo. · TRY" },
      realestate: { name: "Real Estate", sub: "Rental yield · rent ÷ value" },
      deposit: { name: "TL Deposit", sub: "Annual interest rate" },
      gold: { name: "Gold (in TL)", sub: "Gold priced in lira" },
      bist: { name: "BIST 100", sub: "Borsa Istanbul avg." },
      eurobond: { name: "Eurobond / FX deposit", sub: "FX-linked return" },
    },
    cat: {
      cigarettes: "Cigarettes", alcohol: "Alcohol", subscriptions: "Digital subscriptions",
      subscriptions_hint: "Netflix, Spotify, YouTube Premium, etc.",
      eatingout: "Eating out / restaurants", delivery: "Food delivery", coffee: "Daily coffee",
      gaming: "Gaming subs + in-game purchases", fuel: "Fuel / gas",
      shopping: "Shopping",
    },
  },

  tr: {
    nav_home: "Özgürlük", nav_savings: "Gider", nav_settings: "Ayarlar", nav_more: "Daha",
    currency: "Para Birimi", monthly_expenses: "Aylık giderler", per_month: "/ ay",
    real_mode: "Reel getiri modu", real_mode_sub: "Her orandan enflasyonu düş",
    inflation_label: "Enflasyon (yıllık %)",
    headline_tag: "Özgürlüğe en kolay yolun",
    via: "{name} ile", return_word: "getiri", real_word: "reel",
    headline_note: "Bu kadar biriktir; {name} getirisi ayda yaklaşık {monthly} üretir, anaparaya dokunmadan giderlerini karşılar.",
    headline_note_extra: " Aşağıdaki bazı araçlar mevcut enflasyon varsayımında özgürlüğe ulaşamıyor.",
    not_reachable: "Ulaşılamaz", no_beat_inflation: "Hiçbir araç enflasyonu yenmiyor",
    not_reachable_note: "Bu oranlarda reel getiriler sıfır veya negatif, pasif gelir enflasyonu geçemez. Enflasyon varsayımını düşür veya bir getiri oranını yükselt.",
    rule_badge: "📚 %4 Kuralı · Trinity Çalışması", rule_title: "Yıllık giderinin 25 katı",
    rule_text: 'NumBrrr klasik bir fikri genelleştirir: birikimin yılda yaklaşık <strong>%4</strong> kazandırırsa, getirinin tek başına yaşamını karşılaması için kabaca <strong>yıllık giderinin 25 katına</strong> ihtiyacın vardır, anaparaya hiç dokunmadan. Bu "güvenli çekim oranı" <strong>Trinity Çalışması (1998)</strong>\'ndan gelir; tarihsel piyasa verilerinin dönüm noktası niteliğinde akademik analizidir ve finansal bağımsızlık (FIRE) hareketinin temelidir.',
    rule_number_label: "25× rakamın (%4'te)", rule_link: "Trinity Çalışması'nı oku →",
    rule_note_USD: "~30 yıllık ABD hisse ve tahvil getirilerine ve dengeli bir portföye dayanır. Bir kılavuzdur, garanti değildir, geçmiş performans geleceği belirlemez.",
    rule_note_TL: "Not: %4 kuralı uzun vadeli ABD piyasa geçmişinden gelir. Lira gibi yüksek enflasyonlu bir para biriminde reel (enflasyon sonrası) düşün, daha dürüst bir rakam için yukarıdaki Reel getiri modunu aç.",
    compare_title: "Araçları karşılaştır", compare_sub: "Her kart, yıllık getirisinin giderlerini karşılaması için gereken birikimi gösterir. Oranlar düzenlenebilir.",
    annual_return: "Yıllık getiri", total_required: "gereken toplam birikim", total_required_re: "gereken toplam birikim (≈ mülk değeri)",
    easiest: "En kolay", volatile: "Oynak", doesnt_outpace: "Enflasyonu geçemiyor",
    gross_yield: "Brüt kira getirisi", use_property: "Kendi mülkünü gir", optional: "(opsiyonel)",
    property_value: "Mülk değeri", monthly_rent: "Aylık kira",
    computed_yield: "Hesaplanan getiri {rate}, kira ÷ mülk değeri",
    net_yield: "Net getiri", net_yield_sub: "−%2 vergi, bakım ve boşluk",
    lbl_real_rate: "Reel oran", word_inflation: "enflasyon", word_gross: "brüt", word_costs: "maliyet", word_yield: "getiri",
    eff_real: "Reel", eff_net: "Net", eff_effective: "Efektif",
    chart_title: "Gereken birikim", chart_sub: "Düşük olması iyidir, paran senin için çalışmadan önce daha az birikim.",
    bar_easiest: "· en kolay", out_of_reach: "Ulaşılamaz",
    disc_title: "Bilmekte fayda var",
    disc_1: "<strong>Tahmin, tavsiye değil.</strong> NumBrrr eğitim amaçlı bir planlama aracıdır, finansal tavsiye değildir.",
    disc_2: "<strong>Geçmiş ≠ gelecek.</strong> Hisse endeksleri (S&P 500, Nasdaq, BIST 100) ve Bitcoin getirileri tarihsel ortalamalardır ve gelecekteki performansı garanti etmez.",
    disc_3: "<strong>Bitcoin son derece oynaktır.</strong> Kripto sert dalgalanabilir; getirisini spekülatif olarak değerlendir.",
    disc_4: "<strong>Kira getirileri değişir.</strong> Kira getirileri şehre ve mülk tipine göre çok farklılaşır; varsayılanlar ulusal ortalamalardır (Global Property Guide) ve tarihseldir, garanti değildir. Kendi rakamın için mülk değeri ve kira alanlarını kullan.",
    disc_5: "<strong>Oranlar varsayılandır.</strong> Her getiri oranı makul bir varsayılanla doldurulmuştur ve tamamen düzenlenebilir, kendi varsayımlarına göre ayarla.",
    cut_title: "Giderlerin", cut_sub: "Her ay ne harcadığını yaz. Kalemleri aç veya kapat, her birini yatırsan ne olabileceğini gör. Uygulamadaki gider rakamı yalnızca buradaki toplamdır.",
    add_custom: "+ Özel kategori ekle", custom_ph: "Özel kategori", eg: "örn.",
    redirect_label: "Bunu her ay yatırıma yönlendirsen", per_mo: "{x} /ay", per_year: "{x} yıllık",
    invested_in: "Şuna yatırılırsa", yr1: "1 yıl", yr5: "5 yıl", yr10: "10 yıl",
    punch: "Bu alışkanlıkları bırakıp yatırım yaparak 10 yılda {x} elde edebilirsin.",
    punch_empty: "Bırakmak istediğin alışkanlıkları aç ve harcamanı yaz; rakamını gör.",
    savings_note: "Projeksiyon yıllık katkıları bileşik hesaplar: GD = yıllık × [((1 + r)ⁿ − 1) / r], r seçilen yıllık getiridir. Getiriler varsayımdır, garanti değildir.",
    settings_title: "Ayarlar", language: "Dil", theme: "Tema", country: "Ülke",
    onb_title: "NumBrrr'a hoş geldin", onb_sub: "Başlamak için ülkeni ve dilini seç. Bunları istediğin zaman Ayarlar'dan değiştirebilirsin.",
    onb_country: "Ülke", onb_language: "Dil", onb_start: "Devam",
    theme_glass: "Sıvı Cam", theme_glass_desc: "Modern buzlu cam (varsayılan)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostaljik 2000'ler Luna mavisi",
    theme_medieval: "Ortaçağ", theme_medieval_desc: "Sert 15. yüzyıl parşömen ve demir",
    theme_doge: "Doge", theme_doge_desc: "çok vov · büyük para · efsane meme",
    theme_vaporwave: "Vaporwave", theme_vaporwave_desc: "80'ler neon rüyası · A E S T H E T I C",
    more_soon: "Yeni özellikler yakında ✨",
    nav_portfolio: "Portföy",
    portfolio_title: "Portföyün", portfolio_sub: "Sahip olduklarını ekle, varlıklarına nasıl dağıldığını gör.",
    holding_ph: "Varlık adı", add_holding: "+ Varlık ekle", total_value: "Toplam portföy değeri",
    flow_title: "Aylık nakit akışı", flow_income: "Gelir", flow_expenses: "Gider", flow_net: "Aylık net",
    flow_savings_note: "Takip ettiğin harcamaları kısarsan ayda +{x} daha.",
    cat_cash: "Nakit", cat_investment: "Yatırım",
    asset_stocks: "Hisse", asset_usstock: "ABD Hisse", asset_bist: "Türk Hisse (BIST)", asset_crypto: "Kripto", asset_deposit: "Mevduat", asset_bonds: "Tahvil", asset_realestate: "Gayrimenkul", asset_gold: "Altın", asset_cash: "Nakit",
    stock_search_ph: "Hisse ara (örn. THY)", shares_ph: "Adet",
    nav_watchlist: "Takip", watch_title: "Takip Listesi", watch_sub: "Varlık ara ve favorile; fiyatını ve performansını takip et.",
    watch_search_ph: "Altın, hisse, kripto ara…", watch_empty: "Yukarıdan ara ve takip listene varlık ekle.",
    lbl_24h: "24s", lbl_1mo: "1A", lbl_1yr: "1Y",
    inc_from_portfolio: "+{x}/ay portföyden",
    net_tax: "Net (stopaj −%15)", coin_search_ph: "Coin ara (örn. Solana)", qty_ph: "Adet", coin_loading: "Canlı fiyatlar yükleniyor…", grams_ph: "Gram", oz_ph: "Ons",
    target_via: "Özgürlük hedefi (bir veya birkaçını seç)", target_x: "Hedef {x}", to_freedom: "finansal özgürlüğe", blended_return: "Karma getiri",
    income_line: "Şu an portföyün ayda yaklaşık {income} üretebilir, giderlerinin {pct} kadarını karşılar.",
    freedom_reached: "🎉 Özgürlük rakamına ulaştın. Yatırımların giderlerini karşılayabilir!",
    portfolio_empty: "Dağılımı görmek için aşağıdan varlık ekle.",
    portfolio_note: "Özgürlük hedefi = yıllık gider ÷ seçilen getiri. Pasif gelir = değer × getiri. Tahmindir, tavsiye değildir.",
    nav_income: "Gelirler",
    income_title: "Gelirlerin", income_sub: "Aylık gelirini ekle. Pasif olanları işaretle (kira, faiz, temettü); özgürlüğe yalnızca pasif gelir sayılır.",
    add_income: "+ Gelir ekle", income_ph: "Gelir kaynağı", total_income: "Toplam aylık gelir",
    passive_label: "Pasif", active_label: "Aktif", covered_by_passive: "pasif gelirle karşılanıyor",
    surplus_line: "Yatırıma ayırabileceğin yaklaşık {x}/ay artıyor.", deficit_line: "Kazandığından ayda yaklaşık {x} fazla harcıyorsun.",
    income_free: "🎉 Finansal özgürsün: pasif gelirin giderlerini zaten karşılıyor!",
    income_empty: "Durumunu görmek için yukarıdan gelir ekle.",
    income_note: "Pasif gelir = kira, faiz, temettü ve benzeri. Finansal özgürlük = pasif gelir ≥ giderlerin.",
    inc: { salary: "Maaş", rental: "Kira geliri", interest: "Faiz geliri", dividends: "Temettü", side: "Ek / serbest gelir" },
    note_historical: "Tarihsel ortalamalara dayanır, garanti değildir.",
    note_btc_warn: "Bitcoin son derece oynaktır; bu rakam spekülatiftir.",
    note_btc_tl: "Lira bazında son ~12 ayın getirisi (≈ +%37, 2026 ortası itibarıyla, kaynak: CoinGecko). Bitcoin son derece oynaktır, tek bir yıl tahmin değildir.",
    re_note_USD: "Varsayılan brüt getiri ≈ %6,6 (Global Property Guide ulusal ortalaması, 2025 Ç4). Kira getirileri şehre ve mülk tipine göre çok değişir, tarihseldir, garanti değildir.",
    re_note_TL: "Varsayılan brüt getiri ≈ %7,3 (Global Property Guide ulusal ortalaması, 2026 Ç1). Kira getirileri şehre ve mülk tipine göre çok değişir, tarihseldir, garanti değildir.",
    inst: {
      savings: { name: "Tasarruf / Para Piyasası", sub: "Yüksek getirili tasarruf" },
      treasury: { name: "ABD Hazine Tahvilleri", sub: "~10 yıllık" },
      sp500: { name: "S&P 500", sub: "SPX tarihsel ort." },
      nasdaq: { name: "Nasdaq 100", sub: "Tarihsel ort." },
      btc: { name: "Bitcoin (BTC)", sub: "Spekülatif", sub_tl: "Son 12 ay · TRY" },
      realestate: { name: "Gayrimenkul", sub: "Kira getirisi · kira ÷ değer" },
      deposit: { name: "TL Mevduat", sub: "Yıllık faiz oranı" },
      gold: { name: "Altın (TL)", sub: "Lira cinsinden altın" },
      bist: { name: "BIST 100", sub: "Borsa İstanbul ort." },
      eurobond: { name: "Eurobond / Döviz mevduatı", sub: "Dövize bağlı getiri" },
    },
    cat: {
      cigarettes: "Sigara", alcohol: "Alkol", subscriptions: "Dijital abonelikler",
      subscriptions_hint: "Netflix, Spotify, YouTube Premium vb.",
      eatingout: "Dışarıda yemek / restoran", delivery: "Yemek siparişi", coffee: "Günlük kahve",
      gaming: "Oyun abonelikleri + oyun içi harcama", fuel: "Yakıt harcamaları",
      shopping: "Alışveriş",
    },
  },
};

// ---- State ----
const state = {
  lang: "en",
  theme: "glass",
  currency: "USD",
  monthlyExpenses: 3000,
  realMode: false,
  inflation: { USD: 3, TL: 40 },
  rates: {
    USD: Object.fromEntries(INSTRUMENTS.USD.map((i) => [i.id, i.rate])),
    TL: Object.fromEntries(INSTRUMENTS.TL.map((i) => [i.id, i.rate])),
  },
  realEstate: {
    USD: { propertyValue: 0, monthlyRent: 0, netYield: false },
    TL: { propertyValue: 0, monthlyRent: 0, netYield: false },
  },
  savings: {
    amounts: {}, on: {}, custom: [], customSeq: 0,
    invest: { USD: SAVINGS_DEFAULT_INVEST.USD, TL: SAVINGS_DEFAULT_INVEST.TL },
  },
  portfolio: {
    holdings: [], seq: 0,
    target: { USD: [SAVINGS_DEFAULT_INVEST.USD], TL: [SAVINGS_DEFAULT_INVEST.TL] },
  },
  portTotalUSD: false, // when currency is TL, show the total portfolio value in USD instead
  watchlist: [], // [{ type, key, name }] — assets to monitor (price + 24h/1mo/1yr performance)
  income: { amounts: {}, passive: {}, custom: [], seq: 0 },
};
SAVINGS_CATEGORIES.forEach((id) => { state.savings.amounts[id] = 0; state.savings.on[id] = true; });
INCOME_CATEGORIES.forEach((c) => { state.income.amounts[c.id] = 0; state.income.passive[c.id] = c.passive; });
// start with a few empty holding rows (no preset values)
[0, 1, 2].forEach(() => state.portfolio.holdings.push({ id: "h" + ++state.portfolio.seq, label: "", value: 0, assetType: "usstock" }));

// ---- i18n helpers ----
function L() { return I18N[state.lang] || I18N.en; }
function t(key, vars) {
  let s = L()[key];
  if (s == null) s = I18N.en[key];
  if (s == null) s = key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}
function instName(id) { return (L().inst[id] || I18N.en.inst[id] || {}).name || id; }
function instSub(inst) {
  const d = L().inst[inst.id] || I18N.en.inst[inst.id] || {};
  if (inst.id === "btc" && state.currency === "TL") return d.sub_tl || d.sub || "";
  return d.sub || "";
}
function instNote(inst) {
  if (inst.realEstate) return t("re_note_" + state.currency);
  if (inst.noteKey) return t(inst.noteKey);
  if (inst.warn) return t("note_btc_warn");
  if (inst.historical) return t("note_historical");
  return "";
}
function catLabel(id) { return L().cat[id] || I18N.en.cat[id] || id; }
function incLabel(id) { return (L().inc && L().inc[id]) || I18N.en.inc[id] || id; }
function catHint(id) { const k = id + "_hint"; return L().cat[k] || I18N.en.cat[k] || ""; }

// ---- Elements ----
const el = {
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
  savingsList: document.getElementById("savingsList"),
  addCat: document.getElementById("addCat"),
  savingsMonthly: document.getElementById("savingsMonthly"),
  savingsAnnual: document.getElementById("savingsAnnual"),
  investSelect: document.getElementById("investSelect"),
  savingsPunch: document.getElementById("savingsPunch"),
  // portfolio view
  portList: document.getElementById("portList"),
  addHolding: document.getElementById("addHolding"),
  portTotal: document.getElementById("portTotal"),
  portCcyToggle: document.getElementById("portCcyToggle"),
  portChart: document.getElementById("portChart"),
  portDonut: document.getElementById("portDonut"),
  portLegend: document.getElementById("portLegend"),
  portEmpty: document.getElementById("portEmpty"),
  flowIncome: document.getElementById("flowIncome"),
  flowExpenses: document.getElementById("flowExpenses"),
  flowNet: document.getElementById("flowNet"),
  flowNetRow: document.getElementById("flowNetRow"),
  flowSavings: document.getElementById("flowSavings"),
  // income view
  incList: document.getElementById("incList"),
  addIncome: document.getElementById("addIncome"),
  incTotal: document.getElementById("incTotal"),
  incBreakdown: document.getElementById("incBreakdown"),
  incPct: document.getElementById("incPct"),
  incBarFill: document.getElementById("incBarFill"),
  incPunch: document.getElementById("incPunch"),
  incSurplus: document.getElementById("incSurplus"),
  // watchlist view
  watchSearch: document.getElementById("watchSearch"),
  watchDd: document.getElementById("watchDd"),
  watchList: document.getElementById("watchList"),
  watchEmpty: document.getElementById("watchEmpty"),
};

// ---- Helpers ----
function parseNumber(str) {
  if (typeof str !== "string") return Number(str) || 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
function formatMoney(value, { compact = false } = {}) {
  const meta = CURRENCY_META[state.currency];
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat(meta.locale, {
    style: "currency", currency: meta.code,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}
// Format a value in a specific currency (USD or TL), independent of state.currency.
function formatMoneyCcy(value, curKey, { compact = false } = {}) {
  const meta = CURRENCY_META[curKey] || CURRENCY_META[state.currency];
  if (!isFinite(value)) return "—";
  return new Intl.NumberFormat(meta.locale, {
    style: "currency", currency: meta.code,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}
function formatThousands(n) { return new Intl.NumberFormat("en-US").format(Math.round(n)); }
function formatRate(value, withSign = true) {
  const r = Math.round(value * 100) / 100;
  return withSign ? r + "%" : String(r);
}
function effectiveRate(nominalPercent) {
  const infl = state.realMode ? state.inflation[state.currency] : 0;
  return (nominalPercent - infl) / 100;
}
function requiredSavings(nominalPercent) {
  const rate = effectiveRate(nominalPercent);
  if (rate <= 0) return Infinity;
  return (state.monthlyExpenses * 12) / rate;
}

// ---- Real-estate yield helpers ----
function reCustomActive(cur) { const re = state.realEstate[cur]; return re.propertyValue > 0 && re.monthlyRent > 0; }
function reGrossYield(cur) {
  const re = state.realEstate[cur];
  return reCustomActive(cur) ? (re.monthlyRent * 12) / re.propertyValue * 100 : state.rates[cur].realestate;
}
function instrumentNominal(inst) {
  const cur = state.currency;
  if (!inst.realEstate) return state.rates[cur][inst.id];
  let gross = reGrossYield(cur);
  if (state.realEstate[cur].netYield) gross -= NET_COST;
  return gross;
}

// ============================================================
//  Build (structure) + Refresh (values)
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
      <div class="bar-name">${instName(inst.id)}</div>
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

  card.innerHTML = `
    <div class="card-accent"></div>
    <div class="card-head">
      <div>
        <h3 class="card-title">${instName(inst.id)}</h3>
        <p class="card-sub">${instSub(inst)}</p>
      </div>
      <span class="card-badge" data-badge hidden></span>
    </div>
    <div class="card-rate">
      <span class="card-rate-label">${t("annual_return")}</span>
      <div class="rate-input">
        <input type="text" inputmode="decimal" data-id="${inst.id}" value="${formatRate(state.rates[cur][inst.id], false)}" />
        <span class="rate-sign">%</span>
      </div>
    </div>
    <div class="card-amount">
      <div class="card-amount-value" data-amount>—</div>
      <div class="card-amount-label">${t("total_required")}</div>
      <div class="card-effrate" data-eff hidden></div>
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
            <h3 class="card-title">${instName("realestate")}</h3>
            <p class="card-sub">${instSub(inst)}</p>
          </div>
          <span class="card-badge" data-badge hidden></span>
        </div>
        <div class="card-rate">
          <span class="card-rate-label">${t("gross_yield")}</span>
          <div class="rate-input">
            <input type="text" inputmode="decimal" data-id="realestate" value="${formatRate(state.rates[cur].realestate, false)}" />
            <span class="rate-sign">%</span>
          </div>
        </div>
        <div class="card-amount">
          <div class="card-amount-value" data-amount>—</div>
          <div class="card-amount-label">${t("total_required_re")}</div>
          <div class="card-effrate" data-eff hidden></div>
        </div>
      </div>
      <div class="re-calc">
        <div class="re-calc-title">${t("use_property")} <span>${t("optional")}</span></div>
        <label class="re-field">${t("property_value")}
          <div class="money-input money-input--sm">
            <span class="money-symbol">${meta.symbol}</span>
            <input type="text" inputmode="numeric" data-re="propertyValue" value="${re.propertyValue ? formatThousands(re.propertyValue) : ""}" placeholder="${t("eg")} ${meta.valueHint}" />
          </div>
        </label>
        <label class="re-field">${t("monthly_rent")}
          <div class="money-input money-input--sm">
            <span class="money-symbol">${meta.symbol}</span>
            <input type="text" inputmode="numeric" data-re="monthlyRent" value="${re.monthlyRent ? formatThousands(re.monthlyRent) : ""}" placeholder="${t("eg")} ${meta.rentHint}" />
          </div>
        </label>
        <div class="re-computed" data-recomputed hidden></div>
        <label class="switch switch--sm">
          <input type="checkbox" data-re="netYield" ${re.netYield ? "checked" : ""} />
          <span class="switch-track"><span class="switch-thumb"></span></span>
          <span class="switch-label">${t("net_yield")} <small>${t("net_yield_sub")}</small></span>
        </label>
      </div>
    </div>`;
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
      input.addEventListener("change", () => { state.realEstate[state.currency].netYield = input.checked; refresh(); });
    } else {
      input.addEventListener("input", () => { state.realEstate[state.currency][field] = parseNumber(input.value); refresh(); });
      input.addEventListener("blur", () => { const v = state.realEstate[state.currency][field]; if (v > 0) input.value = formatThousands(v); });
    }
  });
}

function refresh() {
  saveState();
  const list = INSTRUMENTS[state.currency];
  const results = list.map((inst) => {
    const nominal = instrumentNominal(inst);
    return { inst, nominal, eff: effectiveRate(nominal) * 100, required: requiredSavings(nominal) };
  });
  const reachable = results.filter((r) => isFinite(r.required));
  const best = reachable.reduce((a, b) => (b.required < a.required ? b : a), reachable[0] || null);

  results.forEach((r) => { const card = el.cards.querySelector(`[data-card="${r.inst.id}"]`); if (card) updateCard(card, r, best); });

  const finite = results.filter((r) => isFinite(r.required)).map((r) => r.required);
  const max = finite.length ? Math.max(...finite) : 0;
  results.forEach((r) => { const row = el.bars.querySelector(`[data-bar="${r.inst.id}"]`); if (row) updateBar(row, r, best, max); });

  renderHeadline(best, results, reachable.length);
  renderRule();
}

function updateCard(card, r, best) {
  const { inst, nominal, eff, required } = r;
  const isBest = best && inst.id === best.inst.id;
  const unreachable = !isFinite(required);
  card.classList.toggle("is-best", !!isBest);

  const amountEl = card.querySelector("[data-amount]");
  if (unreachable) { amountEl.textContent = t("doesnt_outpace"); amountEl.classList.add("unreachable"); }
  else { amountEl.textContent = formatMoney(required); amountEl.classList.remove("unreachable"); }

  const badge = card.querySelector("[data-badge]");
  if (isBest) { badge.hidden = false; badge.className = "card-badge badge-best"; badge.textContent = t("easiest"); }
  else if (inst.warn) { badge.hidden = false; badge.className = "card-badge badge-warn"; badge.textContent = t("volatile"); }
  else { badge.hidden = true; badge.textContent = ""; }

  const effEl = card.querySelector("[data-eff]");
  if (inst.realEstate) {
    updateReCard(card, effEl);
  } else if (state.realMode) {
    effEl.hidden = false;
    effEl.innerHTML = `${t("lbl_real_rate")}: ${formatRate(eff)} &nbsp;(${formatRate(nominal)} − ${formatRate(state.inflation[state.currency])} ${t("word_inflation")})`;
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

  const yInput = card.querySelector('input[data-id="realestate"]');
  if (customActive) {
    yInput.disabled = true; yInput.classList.add("is-auto");
    if (yInput !== document.activeElement) yInput.value = formatRate(grossRaw, false);
  } else if (yInput.disabled) {
    yInput.disabled = false; yInput.classList.remove("is-auto");
    yInput.value = formatRate(state.rates[cur].realestate, false);
  }

  const comp = card.querySelector("[data-recomputed]");
  if (customActive) { comp.hidden = false; comp.textContent = t("computed_yield", { rate: formatRate(grossRaw) }); }
  else comp.hidden = true;

  const parts = [];
  if (net) parts.push(`−${net}% ${t("word_costs")}`);
  if (infl) parts.push(`− ${formatRate(infl)} ${t("word_inflation")}`);
  if (parts.length) {
    effEl.hidden = false;
    const label = net && infl ? t("eff_effective") : net ? t("eff_net") : t("eff_real");
    effEl.innerHTML = `${label} ${t("word_yield")}: ${formatRate(effective)} &nbsp;(${formatRate(grossRaw)} ${t("word_gross")} ${parts.join(" ")})`;
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
  if (unreachable) { fill.classList.add("unreachable"); fill.style.width = "100%"; val.textContent = t("out_of_reach"); }
  else { fill.classList.remove("unreachable"); fill.style.width = (max === 0 ? 0 : Math.max(4, (required / max) * 100)) + "%"; val.textContent = formatMoney(required, { compact: true }); }
}

function renderHeadline(best, results, reachableCount) {
  if (!best) {
    el.bestAmount.textContent = t("not_reachable");
    el.bestLabel.textContent = t("no_beat_inflation");
    el.bestRate.textContent = "";
    el.headlineNote.textContent = t("not_reachable_note");
    return;
  }
  el.bestAmount.textContent = formatMoney(best.required);
  el.bestLabel.textContent = t("via", { name: instName(best.inst.id) });
  el.bestRate.textContent = `${formatRate(best.eff)} ${state.realMode ? t("real_word") + " " : ""}${t("return_word")}`;
  const note = t("headline_note", { name: instName(best.inst.id), monthly: formatMoney(state.monthlyExpenses) });
  el.headlineNote.textContent = note + (reachableCount < results.length ? t("headline_note_extra") : "");
}

function renderRule() {
  el.ruleNumber.textContent = formatMoney(state.monthlyExpenses * 12 * 25);
  el.ruleNote.textContent = t("rule_note_" + state.currency);
}

// ============================================================
//  Savings, "Cut your spending"
// ============================================================
function buildSavings() {
  el.savingsList.innerHTML = "";
  SAVINGS_CATEGORIES.forEach((id) => el.savingsList.appendChild(makeCatRow(id, false)));
  state.savings.custom.forEach((c) => el.savingsList.appendChild(makeCatRow(c.id, true)));
}

function makeCatRow(id, isCustom) {
  const meta = CURRENCY_META[state.currency];
  const custom = isCustom ? state.savings.custom.find((x) => x.id === id) : null;
  const label = isCustom ? (custom ? custom.label : "") : catLabel(id);
  const hint = isCustom ? "" : catHint(id);
  const row = document.createElement("div");
  row.className = "cat-row" + (state.savings.on[id] ? "" : " is-off");
  row.dataset.cat = id;

  const labelHtml = isCustom
    ? `<input class="cat-name" data-cat-name="${id}" value="${label}" placeholder="${t("custom_ph")}" />`
    : `${label}${hint ? `<small>${hint}</small>` : ""}`;
  const amt = state.savings.amounts[id];

  row.innerHTML = `
    <label class="switch switch--sm cat-toggle">
      <input type="checkbox" data-cat-on="${id}" ${state.savings.on[id] ? "checked" : ""} />
      <span class="switch-track"><span class="switch-thumb"></span></span>
    </label>
    <div class="cat-label">${labelHtml}</div>
    <div class="money-input money-input--sm cat-amount">
      <span class="money-symbol savings-symbol">${meta.symbol}</span>
      <input type="text" inputmode="numeric" data-cat-amt="${id}" value="${amt ? formatThousands(amt) : ""}" placeholder="0" />
    </div>
    ${isCustom ? `<button class="cat-remove" type="button" data-cat-del="${id}" aria-label="remove">×</button>` : ""}`;

  row.querySelector("[data-cat-on]").addEventListener("change", (e) => {
    state.savings.on[id] = e.target.checked;
    row.classList.toggle("is-off", !e.target.checked);
    refreshSavings();
  });
  const amtInput = row.querySelector("[data-cat-amt]");
  amtInput.addEventListener("input", () => { state.savings.amounts[id] = parseNumber(amtInput.value); refreshSavings(); });
  amtInput.addEventListener("blur", () => { if (state.savings.amounts[id] > 0) amtInput.value = formatThousands(state.savings.amounts[id]); });
  if (isCustom) {
    row.querySelector("[data-cat-name]").addEventListener("input", (e) => { const c = state.savings.custom.find((x) => x.id === id); if (c) c.label = e.target.value; saveState(); });
    row.querySelector("[data-cat-del]").addEventListener("click", () => {
      state.savings.custom = state.savings.custom.filter((x) => x.id !== id);
      delete state.savings.amounts[id]; delete state.savings.on[id];
      row.remove(); refreshSavings();
    });
  }
  return row;
}

function addCustomCategory() {
  const id = "custom-" + ++state.savings.customSeq;
  state.savings.amounts[id] = 0; state.savings.on[id] = true;
  state.savings.custom.push({ id, label: "" });
  const row = makeCatRow(id, true);
  el.savingsList.appendChild(row);
  row.querySelector("[data-cat-name]").focus();
  refreshSavings();
}

function savingsInvestRate() {
  const rate = state.rates[state.currency][state.savings.invest[state.currency]];
  return typeof rate === "number" ? rate : 0;
}
// Total monthly expenses tracked in the Expenses (Gider) view. This is the only
// figure that counts as expenses for the Income and Portfolio cash-flow views.
// The Home page's state.monthlyExpenses stays local to the Home freedom calculator.
function expensesTotal() {
  let total = 0;
  SAVINGS_CATEGORIES.forEach((id) => { if (state.savings.on[id]) total += state.savings.amounts[id] || 0; });
  state.savings.custom.forEach((c) => { if (state.savings.on[c.id]) total += state.savings.amounts[c.id] || 0; });
  return total;
}
function buildInvestOptions() {
  const cur = state.currency;
  el.investSelect.innerHTML = INSTRUMENTS[cur]
    .map((inst) => `<option value="${inst.id}">${instName(inst.id)} (${formatRate(state.rates[cur][inst.id])})</option>`)
    .join("");
  el.investSelect.value = state.savings.invest[cur];
}
function futureValue(annual, ratePct, years) {
  const r = ratePct / 100;
  if (r <= 0) return annual * years;
  return annual * ((Math.pow(1 + r, years) - 1) / r);
}
function refreshSavings() {
  saveState();
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-savings .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  const monthly = expensesTotal();
  const annual = monthly * 12;

  el.savingsMonthly.textContent = t("per_mo", { x: formatMoney(monthly) });
  el.savingsAnnual.textContent = t("per_year", { x: formatMoney(annual) });

  buildInvestOptions();
  const ratePct = savingsInvestRate();
  [1, 5, 10].forEach((n) => { document.getElementById("proj" + n).textContent = formatMoney(futureValue(annual, ratePct, n)); });

  el.savingsPunch.textContent = monthly > 0
    ? t("punch", { x: formatMoney(futureValue(annual, ratePct, 10)) })
    : t("punch_empty");
}

// ============================================================
//  Portfolio
// ============================================================
function buildPortfolio() {
  el.portList.innerHTML = "";
  state.portfolio.holdings.forEach((h) => el.portList.appendChild(makeHoldingRow(h.id)));
}

function holdById(id) { return state.portfolio.holdings.find((y) => y.id === id); }
function rebuildHoldingRow(id) {
  const old = el.portList.querySelector(`[data-hold="${id}"]`);
  if (old) old.replaceWith(makeHoldingRow(id));
}
function wireTypeSelect(row, id) {
  row.querySelector("[data-hold-type]").addEventListener("change", (e) => {
    const x = holdById(id);
    if (x) x.assetType = e.target.value;
    rebuildHoldingRow(id); // switch input mode (crypto search / net toggle)
    refreshPortfolio();
    refreshIncome();
  });
}
function wireRemove(row, id) {
  row.querySelector("[data-hold-del]").addEventListener("click", () => {
    state.portfolio.holdings = state.portfolio.holdings.filter((y) => y.id !== id);
    row.remove();
    refreshPortfolio();
    refreshIncome();
  });
}
function fmtPrice(n) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function updateStockValue(row, id, loading) {
  const x = holdById(id);
  const node = row.querySelector("[data-stock-value]");
  if (!node || !x) return;
  if (loading) { node.innerHTML = `<small>${t("coin_loading")}</small>`; return; }
  const ccy = x.assetType === "bist" ? "₺" : "$";
  if (x.nativePrice && x.shares) node.innerHTML = `${formatMoney(stockValue(x))} <small>${x.shares} @ ${ccy}${fmtPrice(x.nativePrice)}</small>`;
  else if (x.nativePrice) node.innerHTML = `<small>@ ${ccy}${fmtPrice(x.nativePrice)}</small>`;
  else if (x.symbol) node.innerHTML = `<small>${x.symbol}</small>`;
  else node.textContent = "";
}
function wireStockRow(row, id, type) {
  wireTypeSelect(row, id);
  wireRemove(row, id);
  const list = type === "bist" ? BIST_STOCKS : US_STOCKS;
  const search = row.querySelector("[data-stock-search]");
  const dd = row.querySelector("[data-stock-dd]");
  const sh = row.querySelector("[data-stock-shares]");
  function renderDropdown(q) {
    const ql = (q || "").trim().toLowerCase();
    const matches = (ql ? list.filter((s) => s.n.toLowerCase().includes(ql) || s.s.toLowerCase().includes(ql)) : list).slice(0, 8);
    if (!matches.length) { dd.hidden = true; return; }
    dd.innerHTML = matches.map((s) => `<button type="button" class="coin-opt" data-stk="${s.s}">${escapeHtml(s.n)} <span>${s.s}</span></button>`).join("");
    dd.hidden = false;
    dd.querySelectorAll("[data-stk]").forEach((b) =>
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const item = list.find((s) => s.s === b.dataset.stk);
        const x = holdById(id);
        x.symbol = item.s; x.stockName = item.n; x.label = item.n; x.nativePrice = 0;
        search.value = item.n; dd.hidden = true;
        updateStockValue(row, id, true); // show loading
        const ys = type === "bist" ? item.s + ".IS" : item.s;
        getStockPrice(ys).then((p) => {
          const y = holdById(id);
          if (!y || y.symbol !== item.s) return;
          if (p != null) y.nativePrice = p;
          y.value = stockValue(y);
          updateStockValue(row, id);
          refreshPortfolio(); refreshIncome();
        });
        x.value = stockValue(x);
        refreshPortfolio(); refreshIncome();
      })
    );
  }
  search.addEventListener("input", () => renderDropdown(search.value));
  search.addEventListener("focus", () => renderDropdown(search.value));
  search.addEventListener("blur", () => setTimeout(() => { dd.hidden = true; }, 150));
  sh.addEventListener("input", () => {
    const x = holdById(id);
    x.shares = parseNumber(sh.value);
    x.value = stockValue(x);
    updateStockValue(row, id);
    refreshPortfolio(); refreshIncome();
  });
  updateStockValue(row, id);
}
// Gold unit: ounces in USD, grams in TL.
function goldOz() { return state.currency !== "TL"; }
function goldFactor() { return goldOz() ? GRAMS_PER_OZ : 1; } // grams per display unit
function goldUnit() { return goldOz() ? "oz" : "g"; }
function fmtQty(n) { return Math.round(n * 10000) / 10000; }
function updateGoldValue(row, id) {
  const x = holdById(id);
  const node = row.querySelector("[data-gold-value]");
  if (!node || !x) return;
  const perGram = goldPriceGram || x.price || 0; // app-currency price per gram (fallback to last saved)
  const factor = goldFactor(), unit = goldUnit();
  const unitPrice = perGram * factor;
  const qty = x.grams ? x.grams / factor : 0;
  if (perGram && qty) node.innerHTML = `${formatMoney(x.grams * perGram)} <small>${fmtQty(qty)} ${unit} @ ${formatMoney(unitPrice)}/${unit}</small>`;
  else if (x.grams && x.value) node.innerHTML = `${formatMoney(x.value)}`;
  else if (perGram) node.innerHTML = `<small>@ ${formatMoney(unitPrice)}/${unit}</small>`;
  else node.textContent = "";
}
function updateCryptoValue(row, id) {
  const x = holdById(id);
  const node = row.querySelector("[data-coin-value]");
  if (!node || !x) return;
  if (x.price && x.qty) node.innerHTML = `${formatMoney(x.value)} <small>${x.qty} ${x.coinSymbol || ""} @ ${formatMoney(x.price)}</small>`;
  else if (x.price) node.innerHTML = `<small>@ ${formatMoney(x.price)} / ${x.coinSymbol || ""}</small>`;
  else node.textContent = "";
}
function wireCryptoRow(row, id) {
  const search = row.querySelector("[data-coin-search]");
  const dd = row.querySelector("[data-coin-dd]");
  const qty = row.querySelector("[data-coin-qty]");
  function renderDropdown(q) {
    if (!cryptoMarkets.length) { dd.innerHTML = `<div class="coin-opt coin-opt--msg">${t("coin_loading")}</div>`; dd.hidden = false; return; }
    const ql = (q || "").trim().toLowerCase();
    const list = ql ? cryptoMarkets.filter((c) => c.name.toLowerCase().includes(ql) || c.symbol.toLowerCase().includes(ql)) : cryptoMarkets;
    const matches = list.slice(0, 8);
    if (!matches.length) { dd.hidden = true; return; }
    dd.innerHTML = matches.map((c) => `<button type="button" class="coin-opt" data-coin-id="${c.id}">${escapeHtml(c.name)} <span>${c.symbol}</span></button>`).join("");
    dd.hidden = false;
    dd.querySelectorAll("[data-coin-id]").forEach((b) =>
      b.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const c = cryptoMarkets.find((x) => x.id === b.dataset.coinId);
        const x = holdById(id);
        x.coinId = c.id; x.coinName = c.name; x.coinSymbol = c.symbol; x.price = c.price; x.label = c.name;
        x.value = (x.qty || 0) * c.price;
        search.value = c.name; dd.hidden = true;
        updateCryptoValue(row, id);
        refreshPortfolio(); refreshIncome();
      })
    );
  }
  search.addEventListener("input", () => renderDropdown(search.value));
  search.addEventListener("focus", () => renderDropdown(search.value));
  search.addEventListener("blur", () => setTimeout(() => { dd.hidden = true; }, 150));
  qty.addEventListener("input", () => {
    const x = holdById(id);
    x.qty = parseNumber(qty.value);
    x.value = (x.qty || 0) * (x.price || 0);
    updateCryptoValue(row, id);
    refreshPortfolio(); refreshIncome();
  });
  updateCryptoValue(row, id);
}

function makeHoldingRow(id) {
  const meta = CURRENCY_META[state.currency];
  const h = holdById(id) || {};
  const at = h.assetType || "stocks";
  const row = document.createElement("div");
  row.className = "cat-row port-row";
  row.dataset.hold = id;
  const options = ASSET_TYPES.map((tp) => `<option value="${tp}" ${tp === at ? "selected" : ""}>${t("asset_" + tp)}</option>`).join("");
  const typeSelect = `<select class="hold-type" data-hold-type="${id}" aria-label="asset type">${options}</select>`;

  if (at === "usstock" || at === "bist") {
    const stockName = h.stockName ? h.stockName.replace(/"/g, "&quot;") : "";
    row.innerHTML = `
      <div class="port-namecell">
        <div class="coin-search">
          <input class="cat-name" type="text" autocomplete="off" data-stock-search="${id}" value="${stockName}" placeholder="${t("stock_search_ph")}" />
          <div class="coin-dropdown" data-stock-dd="${id}" hidden></div>
        </div>
        ${typeSelect}
      </div>
      <div class="crypto-cell">
        <input class="qty-field" type="text" inputmode="decimal" data-stock-shares="${id}" value="${h.shares ? h.shares : ""}" placeholder="${t("shares_ph")}" />
        <div class="crypto-value" data-stock-value="${id}"></div>
      </div>
      <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;
    wireStockRow(row, id, at);
  } else if (at === "crypto") {
    const coinName = h.coinName ? h.coinName.replace(/"/g, "&quot;") : "";
    row.innerHTML = `
      <div class="port-namecell">
        <div class="coin-search">
          <input class="cat-name" type="text" autocomplete="off" data-coin-search="${id}" value="${coinName}" placeholder="${t("coin_search_ph")}" />
          <div class="coin-dropdown" data-coin-dd="${id}" hidden></div>
        </div>
        ${typeSelect}
      </div>
      <div class="crypto-cell">
        <input class="qty-field" type="text" inputmode="decimal" data-coin-qty="${id}" value="${h.qty ? h.qty : ""}" placeholder="${t("qty_ph")}" />
        <div class="crypto-value" data-coin-value="${id}"></div>
      </div>
      <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;
    wireTypeSelect(row, id);
    wireRemove(row, id);
    wireCryptoRow(row, id);
  } else if (at === "gold") {
    const safeLabel = h.label ? h.label.replace(/"/g, "&quot;") : "";
    row.innerHTML = `
      <div class="port-namecell">
        <input class="cat-name port-name" data-hold-name="${id}" value="${safeLabel}" placeholder="${t("asset_gold")}" />
        ${typeSelect}
      </div>
      <div class="crypto-cell">
        <input class="qty-field" type="text" inputmode="decimal" data-gold-grams="${id}" value="${h.grams ? fmtQty(h.grams / goldFactor()) : ""}" placeholder="${goldOz() ? t("oz_ph") : t("grams_ph")}" />
        <div class="crypto-value" data-gold-value="${id}"></div>
      </div>
      <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;
    wireTypeSelect(row, id);
    wireRemove(row, id);
    row.querySelector("[data-hold-name]").addEventListener("input", (e) => { const x = holdById(id); if (x) x.label = e.target.value; saveState(); });
    const g = row.querySelector("[data-gold-grams]");
    g.addEventListener("input", () => {
      const x = holdById(id);
      x.grams = parseNumber(g.value) * goldFactor(); // store canonical grams
      const p = goldPriceGram || x.price || 0;
      x.price = p;
      x.value = (x.grams || 0) * p;
      updateGoldValue(row, id);
      refreshPortfolio();
      refreshIncome();
    });
    updateGoldValue(row, id);
  } else {
    const safeLabel = h.label ? h.label.replace(/"/g, "&quot;") : "";
    const isInterest = at === "deposit" || at === "bonds";
    const netBtn = isInterest
      ? `<button type="button" class="net-tax-btn ${h.netTax ? "is-on" : ""}" data-hold-net="${id}">${t("net_tax")}</button>`
      : "";
    row.innerHTML = `
      <div class="port-namecell">
        <input class="cat-name port-name" data-hold-name="${id}" value="${safeLabel}" placeholder="${t("holding_ph")}" />
        <div class="port-tags">${typeSelect}${netBtn}</div>
      </div>
      <div class="money-input money-input--sm cat-amount">
        <span class="money-symbol savings-symbol">${meta.symbol}</span>
        <input type="text" inputmode="numeric" data-hold-val="${id}" value="${h.value ? formatThousands(h.value) : ""}" placeholder="0" />
      </div>
      <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;
    wireTypeSelect(row, id);
    wireRemove(row, id);
    row.querySelector("[data-hold-name]").addEventListener("input", (e) => { const x = holdById(id); if (x) x.label = e.target.value; saveState(); });
    const v = row.querySelector("[data-hold-val]");
    v.addEventListener("input", () => { const x = holdById(id); if (x) x.value = parseNumber(v.value); refreshPortfolio(); refreshIncome(); });
    v.addEventListener("blur", () => { const x = holdById(id); if (x && x.value > 0) v.value = formatThousands(x.value); });
    const netBtnEl = row.querySelector("[data-hold-net]");
    if (netBtnEl) netBtnEl.addEventListener("click", () => { const x = holdById(id); x.netTax = !x.netTax; netBtnEl.classList.toggle("is-on", x.netTax); refreshPortfolio(); refreshIncome(); });
  }
  return row;
}

// ---- Live crypto prices (CoinGecko, client-side; works on the deployed site) ----
async function loadCryptoMarkets() {
  const vs = state.currency === "TL" ? "try" : "usd";
  const key = "numbr_crypto_" + vs;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { cryptoMarkets = c.data; return; } } catch (e) {}
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=50&page=1&sparkline=false`);
    if (!res.ok) return;
    const json = await res.json();
    cryptoMarkets = json.map((c) => ({ id: c.id, symbol: (c.symbol || "").toUpperCase(), name: c.name, price: c.current_price }));
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: cryptoMarkets })); } catch (e) {}
  } catch (e) { /* offline / local file:// — silently ignore, works once deployed */ }
}
// Live gold price (per gram) via PAX Gold (1 PAXG ≈ 1 troy oz), client-side, daily-cached.
async function loadGoldPrice() {
  const vs = state.currency === "TL" ? "try" : "usd";
  const key = "numbr_gold_" + vs;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { goldPriceGram = c.v; return; } } catch (e) {}
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=${vs}`);
    if (!res.ok) return;
    const j = await res.json();
    const oz = j["pax-gold"] && j["pax-gold"][vs];
    if (oz) { goldPriceGram = oz / GRAMS_PER_OZ; try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: goldPriceGram })); } catch (e) {} }
  } catch (e) { /* offline / local — works once deployed */ }
}
// Live stock price via Yahoo Finance (through a CORS proxy; works on the deployed site).
async function fetchYahoo(symbol) {
  // 1) Same-origin serverless function — reliable on the deployed (Vercel) site.
  try {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
    if (r.ok) { const j = await r.json(); if (typeof j.price === "number") return j.price; }
  } catch (e) { /* not deployed / local — fall back to public proxies */ }
  // 2) Public CORS proxies (fallback, mainly for local preview).
  const y = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const proxies = [`https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`, `https://corsproxy.io/?url=${encodeURIComponent(y)}`];
  for (const url of proxies) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const j = await res.json();
      const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
      if (m && typeof m.regularMarketPrice === "number") return m.regularMarketPrice;
    } catch (e) { /* try next proxy */ }
  }
  return null;
}
function parseYahooChart(j) {
  const r0 = j && j.chart && j.chart.result && j.chart.result[0];
  if (!r0) return null;
  const meta = r0.meta;
  const closes = (r0.indicators && r0.indicators.quote && r0.indicators.quote[0] && r0.indicators.quote[0].close) || [];
  const valid = closes.filter((c) => typeof c === "number");
  const price = meta && typeof meta.regularMarketPrice === "number" ? meta.regularMarketPrice : (valid.length ? valid[valid.length - 1] : null);
  if (price == null) return null;
  // previous *daily* close (yesterday) for the 24h move — chartPreviousClose is ~1y ago on a 1y range
  const prev = valid.length >= 2 ? valid[valid.length - 2] : (meta && (meta.chartPreviousClose || meta.previousClose));
  const pct = (a, b) => (a != null && b ? (a / b - 1) * 100 : null);
  return { price, ccy: meta ? meta.currency : null, chg24: pct(price, prev), chg1mo: valid.length > 22 ? pct(price, valid[valid.length - 22]) : null, chg1y: valid.length ? pct(price, valid[0]) : null };
}
// Full quote (price + 24h/1mo/1yr %) — serverless first, public proxy fallback.
async function fetchStockData(symbol) {
  try {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}&range=1y`);
    if (r.ok) { const j = await r.json(); if (typeof j.price === "number") return { price: j.price, ccy: j.currency, chg24: j.chg24, chg1mo: j.chg1mo, chg1y: j.chg1y }; }
  } catch (e) {}
  const y = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
  for (const url of [`https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`, `https://corsproxy.io/?url=${encodeURIComponent(y)}`]) {
    try { const res = await fetch(url); if (!res.ok) continue; const d = parseYahooChart(await res.json()); if (d) return d; } catch (e) {}
  }
  return null;
}
async function getStockPrice(yahooSymbol) {
  const key = "numbr_stk_" + yahooSymbol;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) return c.v; } catch (e) {}
  const v = await fetchYahoo(yahooSymbol);
  if (v != null) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) {} }
  return v;
}
async function loadUsdTry() {
  const key = "numbr_usdtry";
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { usdTry = c.v; return; } } catch (e) {}
  const v = await fetchYahoo("TRY=X");
  if (v) { usdTry = v; try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) {} }
}
// Convert a stock's native-currency value into the app's active currency.
function stockValue(h) {
  const native = h.nativePrice || 0;
  const shares = h.shares || 0;
  const nativeCcy = h.assetType === "bist" ? "TRY" : "USD";
  const appCcy = state.currency === "TL" ? "TRY" : "USD";
  let fx = 1;
  if (nativeCcy !== appCcy) fx = appCcy === "TRY" ? usdTry : (usdTry ? 1 / usdTry : 0);
  return shares * native * fx;
}

async function refreshCryptoPrices() {
  await loadCryptoMarkets();
  await loadGoldPrice();
  await loadUsdTry();
  for (const h of state.portfolio.holdings) {
    if (h.assetType === "crypto" && h.coinId) {
      const m = cryptoMarkets.find((x) => x.id === h.coinId);
      if (m) { h.price = m.price; h.value = (h.qty || 0) * m.price; }
    } else if (h.assetType === "gold" && goldPriceGram > 0) {
      h.price = goldPriceGram;
      h.value = (h.grams || 0) * goldPriceGram;
    } else if ((h.assetType === "usstock" || h.assetType === "bist") && h.symbol) {
      const ys = h.assetType === "bist" ? h.symbol + ".IS" : h.symbol;
      const p = await getStockPrice(ys);
      if (p != null) h.nativePrice = p;
      h.value = stockValue(h);
    }
  }
  buildPortfolio();
  refreshPortfolio();
  refreshIncome();
}

function addHolding() {
  const id = "h" + ++state.portfolio.seq;
  state.portfolio.holdings.push({ id, label: "", value: 0, assetType: "usstock" });
  const row = makeHoldingRow(id);
  el.portList.appendChild(row);
  const nameInput = row.querySelector("[data-hold-name]");
  if (nameInput) nameInput.focus();
  refreshPortfolio();
}

const PIE_COLORS = ["#7c5cff", "#21d4fd", "#2ee6a6", "#ffb454", "#ff7eb6", "#ffd54a", "#4f8cff", "#ff5ca8"];
function escapeHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// Annual return rate (%) for a holding's asset type, currency-aware.
function assetRate(type, cur) {
  const r = state.rates[cur];
  switch (type) {
    case "stocks": return cur === "TL" ? r.bist : r.sp500;
    case "crypto": return r.btc;
    case "deposit": return cur === "TL" ? r.deposit : r.savings;
    case "bonds": return cur === "TL" ? r.eurobond : r.treasury;
    case "realestate": return r.realestate;
    case "gold": return cur === "TL" ? r.gold : 0;
    default: return 0; // cash
  }
}
// Monthly income generated by holdings: interest (deposit/bonds), rent (real estate).
function portfolioYield() {
  const cur = state.currency;
  let interest = 0, rental = 0;
  state.portfolio.holdings.forEach((h) => {
    if (!h.value) return;
    let monthly = (h.value * (assetRate(h.assetType, cur) / 100)) / 12;
    if (h.assetType === "deposit" || h.assetType === "bonds") {
      if (h.netTax) monthly *= 1 - WITHHOLD_PCT / 100; // deduct withholding tax (stopaj)
      interest += monthly;
    } else if (h.assetType === "realestate") {
      rental += monthly;
    }
  });
  return { interest, rental };
}
function incomeManualTotal() {
  let t = 0;
  INCOME_CATEGORIES.forEach((c) => (t += state.income.amounts[c.id] || 0));
  state.income.custom.forEach((c) => (t += state.income.amounts[c.id] || 0));
  return t;
}

// Render the total portfolio value. For Turkey (TL) a small toggle lets the user
// view the total in USD (converted via the live USD/TRY rate); USA always shows USD.
function renderPortTotal(totalNative) {
  const isTL = state.currency === "TL";
  el.portCcyToggle.hidden = !isTL;
  if (!isTL) { state.portTotalUSD = false; }

  const showUSD = isTL && state.portTotalUSD && usdTry > 0;
  if (showUSD) {
    el.portTotal.textContent = formatMoneyCcy(totalNative / usdTry, "USD");
  } else {
    el.portTotal.textContent = formatMoney(totalNative);
  }
  // Button shows the currency you'd switch TO.
  if (isTL) el.portCcyToggle.textContent = state.portTotalUSD ? "₺ TL" : "$ USD";
}

function refreshPortfolio() {
  saveState();
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-portfolio .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  // --- Monthly cash flow (Income incl. portfolio yield − Expenses) ---
  const py = portfolioYield();
  const income = incomeManualTotal() + py.interest + py.rental;
  // Expenses come from the Expenses (Gider) view only, not the Home page.
  const exp = expensesTotal();
  const net = income - exp;
  el.flowIncome.textContent = formatMoney(income);
  el.flowExpenses.textContent = "−" + formatMoney(exp);
  el.flowNet.textContent = formatMoney(net);
  el.flowNetRow.classList.toggle("is-pos", net >= 0);
  el.flowNetRow.classList.toggle("is-neg", net < 0);
  el.flowSavings.textContent = "";

  // --- Holdings total + donut (categorized Cash / Investment) ---
  const total = state.portfolio.holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  renderPortTotal(total);

  const segs = state.portfolio.holdings.filter((h) => h.value > 0);
  if (!segs.length) {
    el.portChart.hidden = true;
    el.portEmpty.hidden = false;
    el.portDonut.innerHTML = "";
    el.portLegend.innerHTML = "";
    return;
  }
  el.portChart.hidden = false;
  el.portEmpty.hidden = true;

  const colorOf = {};
  segs.forEach((h, i) => (colorOf[h.id] = PIE_COLORS[i % PIE_COLORS.length]));

  let cum = 0;
  const ring = segs
    .map((h) => {
      const pct = (h.value / total) * 100;
      const circle = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${colorOf[h.id]}" stroke-width="6" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${25 - cum}" />`;
      cum += pct;
      return circle;
    })
    .join("");
  el.portDonut.innerHTML = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6" />${ring}`;

  // Legend grouped by asset type with subtotals
  el.portLegend.innerHTML = ASSET_TYPES
    .map((key) => {
      const items = segs.filter((h) => (h.assetType || "stocks") === key);
      if (!items.length) return "";
      const label = t("asset_" + key);
      const sub = items.reduce((s, h) => s + h.value, 0);
      const rows = items
        .map((h) => {
          const pct = Math.round((h.value / total) * 100);
          const name = h.label && h.label.trim() ? escapeHtml(h.label.trim()) : t("holding_ph");
          return `<div class="leg-item"><span class="leg-dot" style="background:${colorOf[h.id]}"></span><span class="leg-name">${name}</span><span class="leg-val">${formatMoney(h.value)} · ${pct}%</span></div>`;
        })
        .join("");
      return `<div class="leg-group"><div class="leg-head">${label} <span>${formatMoney(sub)} · ${Math.round((sub / total) * 100)}%</span></div>${rows}</div>`;
    })
    .join("");
}

// ============================================================
//  Income
// ============================================================
function buildIncome() {
  el.incList.innerHTML = "";
  INCOME_CATEGORIES.forEach((c) => el.incList.appendChild(makeIncomeRow(c.id, false)));
  state.income.custom.forEach((c) => el.incList.appendChild(makeIncomeRow(c.id, true)));
}

function makeIncomeRow(id, isCustom) {
  const meta = CURRENCY_META[state.currency];
  const custom = isCustom ? state.income.custom.find((x) => x.id === id) : null;
  const label = isCustom ? (custom ? custom.label : "") : incLabel(id);
  const passive = !!state.income.passive[id];
  const amt = state.income.amounts[id];
  const row = document.createElement("div");
  row.className = "cat-row inc-row" + (passive ? " is-passive" : "");
  row.dataset.inc = id;

  const labelHtml = isCustom
    ? `<input class="cat-name" data-inc-name="${id}" value="${label ? label.replace(/"/g, "&quot;") : ""}" placeholder="${t("income_ph")}" />`
    : label;

  // Type badge: fixed (read-only) for preset categories, clickable only for custom ones.
  const badge = isCustom
    ? `<button type="button" class="inc-type inc-type--btn" data-inc-toggle="${id}">${passive ? t("passive_label") : t("active_label")}</button>`
    : `<span class="inc-type">${passive ? t("passive_label") : t("active_label")}</span>`;

  row.innerHTML = `
    <div class="cat-label">${labelHtml}${badge}<small class="inc-from-port" data-inc-port="${id}"></small></div>
    <div class="money-input money-input--sm cat-amount">
      <span class="money-symbol savings-symbol">${meta.symbol}</span>
      <input type="text" inputmode="numeric" data-inc-amt="${id}" value="${amt ? formatThousands(amt) : ""}" placeholder="0" />
    </div>
    ${isCustom ? `<button class="cat-remove" type="button" data-inc-del="${id}" aria-label="remove">×</button>` : ""}`;

  if (isCustom) {
    const toggleBtn = row.querySelector("[data-inc-toggle]");
    toggleBtn.addEventListener("click", () => {
      const next = !state.income.passive[id];
      state.income.passive[id] = next;
      row.classList.toggle("is-passive", next);
      toggleBtn.textContent = next ? t("passive_label") : t("active_label");
      refreshIncome();
    });
  }
  const amtInput = row.querySelector("[data-inc-amt]");
  amtInput.addEventListener("input", () => { state.income.amounts[id] = parseNumber(amtInput.value); refreshIncome(); });
  amtInput.addEventListener("blur", () => { if (state.income.amounts[id] > 0) amtInput.value = formatThousands(state.income.amounts[id]); });
  if (isCustom) {
    row.querySelector("[data-inc-name]").addEventListener("input", (e) => { const c = state.income.custom.find((x) => x.id === id); if (c) c.label = e.target.value; saveState(); });
    row.querySelector("[data-inc-del]").addEventListener("click", () => {
      state.income.custom = state.income.custom.filter((x) => x.id !== id);
      delete state.income.amounts[id]; delete state.income.passive[id];
      row.remove(); refreshIncome();
    });
  }
  return row;
}

function addIncome() {
  const id = "inc" + ++state.income.seq;
  state.income.amounts[id] = 0; state.income.passive[id] = false;
  state.income.custom.push({ id, label: "" });
  const row = makeIncomeRow(id, true);
  el.incList.appendChild(row);
  row.querySelector("[data-inc-name]").focus();
  refreshIncome();
}

function refreshIncome() {
  saveState();
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-income .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  let total = 0, passive = 0;
  const add = (id) => { const a = state.income.amounts[id] || 0; total += a; if (state.income.passive[id]) passive += a; };
  INCOME_CATEGORIES.forEach((c) => add(c.id));
  state.income.custom.forEach((c) => add(c.id));

  // Income generated by the portfolio (interest from deposits/bonds, rent from real estate)
  const py = portfolioYield();
  total += py.interest + py.rental;
  passive += py.interest + py.rental;
  const noteFor = (id, amt) => {
    const node = document.querySelector(`#view-income [data-inc-port="${id}"]`);
    if (node) node.textContent = amt > 0 ? t("inc_from_portfolio", { x: formatMoney(amt) }) : "";
  };
  noteFor("interest", py.interest);
  noteFor("rental", py.rental);

  const active = total - passive;
  // Expenses come from the Expenses (Gider) view only, not the Home page.
  const exp = expensesTotal();

  el.incTotal.textContent = formatMoney(total);
  el.incBreakdown.textContent = `${t("passive_label")}: ${formatMoney(passive)} · ${t("active_label")}: ${formatMoney(active)}`;

  const pct = exp > 0 ? (passive / exp) * 100 : 0;
  el.incPct.textContent = Math.round(pct) + "%";
  el.incBarFill.style.width = Math.max(0, Math.min(100, pct)) + "%";

  const surplus = total - exp;
  if (total <= 0) {
    el.incPunch.textContent = t("income_empty");
    el.incSurplus.textContent = "";
  } else if (pct >= 100) {
    el.incPunch.textContent = t("income_free");
    el.incSurplus.textContent = surplus > 0 ? t("surplus_line", { x: formatMoney(surplus) }) : "";
  } else {
    el.incPunch.textContent = surplus >= 0 ? t("surplus_line", { x: formatMoney(surplus) }) : t("deficit_line", { x: formatMoney(-surplus) });
    el.incSurplus.textContent = "";
  }
}

// ============================================================
//  Watchlist
// ============================================================
function watchSearchPool() {
  const pool = [{ type: "gold", key: "gold", name: t("asset_gold"), sym: "XAU", tag: t("asset_gold") }];
  US_STOCKS.forEach((s) => pool.push({ type: "usstock", key: s.s, name: s.n, sym: s.s, tag: t("asset_usstock") }));
  BIST_STOCKS.forEach((s) => pool.push({ type: "bist", key: s.s, name: s.n, sym: s.s, tag: t("asset_bist") }));
  cryptoMarkets.forEach((c) => pool.push({ type: "crypto", key: c.id, name: c.name, sym: c.symbol, tag: t("asset_crypto") }));
  return pool;
}
function addWatch(item) {
  if (state.watchlist.some((w) => w.type === item.type && w.key === item.key)) return;
  state.watchlist.push({ type: item.type, key: item.key, name: item.name, sym: item.sym });
  buildWatchlist(); saveState(); refreshWatchData();
}
function removeWatch(type, key) {
  state.watchlist = state.watchlist.filter((w) => !(w.type === type && w.key === key));
  buildWatchlist(); saveState();
}
function chgHtml(label, v) {
  if (v == null || isNaN(v)) return `<span class="perf-chip"><span class="perf-lbl">${label}</span> <b>—</b></span>`;
  return `<span class="perf-chip ${v >= 0 ? "up" : "down"}"><span class="perf-lbl">${label}</span> <b>${v >= 0 ? "+" : ""}${v.toFixed(1)}%</b></span>`;
}
function watchPriceLabel(w) {
  const d = watchData[w.key];
  if (!d || d.price == null) return "…";
  if (w.type === "usstock") return "$" + fmtPrice(d.price);
  if (w.type === "bist") return "₺" + fmtPrice(d.price);
  const sym = state.currency === "TL" ? "₺" : "$";
  if (w.type === "gold") return sym + fmtPrice(d.price * goldFactor()) + "/" + goldUnit();
  return sym + fmtPrice(d.price);
}
function buildWatchlist() {
  if (el.watchSearch) el.watchSearch.placeholder = t("watch_search_ph");
  if (!state.watchlist.length) { el.watchList.innerHTML = ""; el.watchEmpty.hidden = false; return; }
  el.watchEmpty.hidden = true;
  el.watchList.innerHTML = state.watchlist.map((w) => {
    const d = watchData[w.key] || {};
    return `<div class="watch-row">
      <div class="watch-top">
        <div class="watch-name">${escapeHtml(w.name)} <small>${escapeHtml((w.sym || "").toUpperCase())}</small></div>
        <div class="watch-price">${watchPriceLabel(w)}</div>
      </div>
      <div class="watch-perf">
        ${chgHtml(t("lbl_24h"), d.chg24)}${chgHtml(t("lbl_1mo"), d.chg1mo)}${chgHtml(t("lbl_1yr"), d.chg1y)}
        <button class="watch-del" type="button" data-wdel="${w.type}|${w.key}" aria-label="remove">×</button>
      </div>
    </div>`;
  }).join("");
  el.watchList.querySelectorAll("[data-wdel]").forEach((b) => b.addEventListener("click", () => {
    const idx = b.dataset.wdel.indexOf("|");
    removeWatch(b.dataset.wdel.slice(0, idx), b.dataset.wdel.slice(idx + 1));
  }));
}
async function refreshWatchData() {
  if (!state.watchlist.length) return;
  const vs = state.currency === "TL" ? "try" : "usd";
  const ids = state.watchlist.filter((w) => w.type === "crypto").map((w) => w.key);
  if (state.watchlist.some((w) => w.type === "gold")) ids.push("pax-gold");
  if (ids.length) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&ids=${ids.join(",")}&price_change_percentage=24h,30d,1y`);
      if (r.ok) {
        (await r.json()).forEach((c) => {
          const d = { price: c.current_price, chg24: c.price_change_percentage_24h_in_currency, chg1mo: c.price_change_percentage_30d_in_currency, chg1y: c.price_change_percentage_1y_in_currency };
          if (c.id === "pax-gold") watchData["gold"] = Object.assign({}, d, { price: c.current_price / GRAMS_PER_OZ });
          else watchData[c.id] = d;
        });
      }
    } catch (e) {}
  }
  for (const w of state.watchlist) {
    if (w.type === "usstock" || w.type === "bist") {
      const d = await fetchStockData(w.type === "bist" ? w.key + ".IS" : w.key);
      if (d) watchData[w.key] = d;
    }
  }
  buildWatchlist();
}
function wireWatchSearch() {
  const search = el.watchSearch, dd = el.watchDd;
  if (!search) return;
  function render(q) {
    const ql = (q || "").trim().toLowerCase();
    if (!ql) { dd.hidden = true; return; }
    const matches = watchSearchPool().filter((p) => p.name.toLowerCase().includes(ql) || (p.sym || "").toLowerCase().includes(ql)).slice(0, 10);
    if (!matches.length) { dd.hidden = true; return; }
    dd.innerHTML = matches.map((p, i) => `<button type="button" class="coin-opt" data-wi="${i}">${escapeHtml(p.name)} <span>${escapeHtml(p.sym || "")} · ${escapeHtml(p.tag)}</span></button>`).join("");
    dd.hidden = false;
    dd.querySelectorAll("[data-wi]").forEach((b) => b.addEventListener("mousedown", (e) => { e.preventDefault(); addWatch(matches[+b.dataset.wi]); search.value = ""; dd.hidden = true; }));
  }
  search.addEventListener("input", () => render(search.value));
  search.addEventListener("focus", () => render(search.value));
  search.addEventListener("blur", () => setTimeout(() => { dd.hidden = true; }, 150));
}

// ============================================================
//  Language + Theme
// ============================================================
function applyLanguage(lang) {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => { node.textContent = t(node.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((node) => { node.innerHTML = t(node.dataset.i18nHtml); });
  buildLayout(); refresh();
  buildSavings(); refreshSavings();
  buildPortfolio(); refreshPortfolio();
  buildIncome(); refreshIncome();
  buildWatchlist();
  updateSettingsActive();
  try { localStorage.setItem("numbr_lang", lang); } catch (e) {}
}
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  updateSettingsActive();
  saveState();
  try { localStorage.setItem("numbr_theme", theme); } catch (e) {}
}
function updateSettingsActive() {
  document.querySelectorAll(".opt-cur").forEach((b) => b.classList.toggle("is-active", b.dataset.currency === state.currency));
  document.querySelectorAll(".opt-lang").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === state.lang));
  document.querySelectorAll(".opt-theme").forEach((b) => b.classList.toggle("is-active", b.dataset.themePick === state.theme));
}

function setCurrency(cur) {
  if (cur === state.currency || !CURRENCY_META[cur]) return;
  state.currency = cur;
  el.inflation.value = formatRate(state.inflation[cur], false);
  buildLayout(); refresh(); refreshSavings(); refreshPortfolio(); refreshIncome();
  refreshCryptoPrices(); // refetch crypto prices in the new currency
  buildWatchlist(); refreshWatchData();
  updateSettingsActive();
  try { localStorage.setItem("numbr_currency", cur); } catch (e) {}
}

// ---- First-run onboarding (country + language, shown once) ----
let obCountry = "US", obLang = "en";
function updateObActive() {
  document.querySelectorAll(".ob-country").forEach((b) => b.classList.toggle("is-active", b.dataset.obCountry === obCountry));
  document.querySelectorAll(".ob-lang").forEach((b) => b.classList.toggle("is-active", b.dataset.obLang === obLang));
}
function showOnboarding() {
  // Pre-select sensible defaults from the browser locale.
  const navLang = (navigator.language || "en").toLowerCase();
  if (navLang.startsWith("tr")) { obCountry = "TR"; obLang = "tr"; }
  applyLanguage(obLang);
  updateObActive();
  document.getElementById("onboard").hidden = false;
}
function finishOnboarding() {
  applyLanguage(obLang);
  setCurrency(COUNTRIES[obCountry].currency);
  try { localStorage.setItem("numbr_onboarded", "1"); } catch (e) {}
  document.getElementById("onboard").hidden = true;
}
document.querySelectorAll(".ob-country").forEach((b) => b.addEventListener("click", () => { obCountry = b.dataset.obCountry; updateObActive(); }));
document.querySelectorAll(".ob-lang").forEach((b) => b.addEventListener("click", () => { obLang = b.dataset.obLang; applyLanguage(obLang); updateObActive(); }));
document.getElementById("obStart").addEventListener("click", finishOnboarding);

// ---- Event wiring ----
document.querySelectorAll("[data-currency]").forEach((b) => b.addEventListener("click", () => setCurrency(b.dataset.currency)));

el.addCat.addEventListener("click", addCustomCategory);
el.investSelect.addEventListener("change", () => { state.savings.invest[state.currency] = el.investSelect.value; refreshSavings(); });

el.addHolding.addEventListener("click", addHolding);
el.addIncome.addEventListener("click", addIncome);
el.portCcyToggle.addEventListener("click", () => { state.portTotalUSD = !state.portTotalUSD; refreshPortfolio(); });

el.expenses.addEventListener("input", () => { state.monthlyExpenses = parseNumber(el.expenses.value); refresh(); });
el.expenses.addEventListener("blur", () => { if (state.monthlyExpenses > 0) el.expenses.value = formatThousands(state.monthlyExpenses); });

el.realMode.addEventListener("change", () => { state.realMode = el.realMode.checked; el.inflationField.hidden = !state.realMode; refresh(); });
el.inflation.addEventListener("input", () => { state.inflation[state.currency] = parseNumber(el.inflation.value); refresh(); });

document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => applyLanguage(b.dataset.lang)));
document.querySelectorAll("[data-theme-pick]").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.themePick)));

// ---- Bottom navigation ----
(function () {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }
  function setActive(tab) {
    tabs.forEach((tt) => { const on = tt === tab; tt.classList.toggle("is-active", on); if (on) tt.setAttribute("aria-current", "page"); else tt.removeAttribute("aria-current"); });
  }
  function showView(name) {
    document.getElementById("view-home").hidden = name !== "home";
    document.getElementById("view-savings").hidden = name !== "savings";
    document.getElementById("view-settings").hidden = name !== "settings";
    document.getElementById("view-portfolio").hidden = name !== "portfolio";
    document.getElementById("view-income").hidden = name !== "income";
    document.getElementById("view-watch").hidden = name !== "watch";
    document.querySelector(".brand").hidden = name !== "home"; // logo only on Home
    if (name === "savings") refreshSavings();
    if (name === "portfolio") refreshPortfolio();
    if (name === "income") refreshIncome();
    if (name === "watch") refreshWatchData();
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (tab.hasAttribute("data-soon")) { showToast(t("more_soon")); return; }
      const view = tab.dataset.view;
      if (!view) return;
      setActive(tab); showView(view);
    });
  });
})();

// ---- Persistence (localStorage; survives page refresh) ----
function saveState() {
  try {
    localStorage.setItem("numbr_state", JSON.stringify({
      v: 1,
      lang: state.lang, theme: state.theme, currency: state.currency,
      monthlyExpenses: state.monthlyExpenses, realMode: state.realMode,
      inflation: state.inflation, rates: state.rates, realEstate: state.realEstate,
      savings: state.savings, income: state.income, portfolio: state.portfolio, watchlist: state.watchlist,
      portTotalUSD: state.portTotalUSD,
    }));
  } catch (e) {}
}
function loadState() {
  let s;
  try { s = JSON.parse(localStorage.getItem("numbr_state") || "null"); } catch (e) { return; }
  if (!s) return;
  if (s.lang && I18N[s.lang]) state.lang = s.lang;
  if (s.theme) state.theme = s.theme;
  if (s.currency && CURRENCY_META[s.currency]) state.currency = s.currency;
  if (typeof s.monthlyExpenses === "number") state.monthlyExpenses = s.monthlyExpenses;
  if (typeof s.realMode === "boolean") state.realMode = s.realMode;
  if (s.inflation) state.inflation = s.inflation;
  if (s.rates) state.rates = s.rates;
  if (s.realEstate) state.realEstate = s.realEstate;
  if (s.savings) state.savings = s.savings;
  if (s.income) state.income = s.income;
  if (s.portfolio) state.portfolio = s.portfolio;
  if (Array.isArray(s.watchlist)) state.watchlist = s.watchlist;
  if (typeof s.portTotalUSD === "boolean") state.portTotalUSD = s.portTotalUSD;
  // normalize any legacy/removed asset types from older saves
  if (state.portfolio && Array.isArray(state.portfolio.holdings)) {
    state.portfolio.holdings.forEach((h) => {
      if (!ASSET_TYPES.includes(h.assetType)) h.assetType = h.assetType === "stocks" ? "usstock" : "cash";
    });
  }
}

// ---- Init ----
// Detect a brand-new user BEFORE anything writes to localStorage (applyLanguage/
// refresh call saveState, which would otherwise create numbr_state immediately).
let isFirstRun = false;
try { isFirstRun = !(localStorage.getItem("numbr_onboarded") || localStorage.getItem("numbr_state")); } catch (e) {}

try {
  const savedLang = localStorage.getItem("numbr_lang");
  const savedTheme = localStorage.getItem("numbr_theme");
  const savedCur = localStorage.getItem("numbr_currency");
  if (savedLang && I18N[savedLang]) state.lang = savedLang;
  if (savedTheme) state.theme = savedTheme;
  if (savedCur && CURRENCY_META[savedCur]) state.currency = savedCur;
} catch (e) {}
loadState(); // full saved snapshot takes precedence over the legacy per-key values

el.expenses.value = formatThousands(state.monthlyExpenses);
el.inflation.value = formatRate(state.inflation[state.currency], false);
applyTheme(state.theme);
applyLanguage(state.lang); // builds layout + savings, applies all translations

if (isFirstRun) showOnboarding();
wireWatchSearch();
refreshCryptoPrices(); // fetch live crypto prices (works on the deployed site)
refreshWatchData(); // fetch performance for any saved watchlist items
