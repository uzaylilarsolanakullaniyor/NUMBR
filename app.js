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
// Portfolio holding asset types (tags). Interest-bearing & rental ones feed Income.
const ASSET_TYPES = ["stocks", "crypto", "deposit", "bonds", "realestate", "gold", "cash"];

// ============================================================
//  i18n dictionary
// ============================================================
const I18N = {
  en: {
    nav_home: "Home", nav_savings: "Savings", nav_settings: "Settings", nav_more: "More",
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
    cut_title: "Cut your spending", cut_sub: "Toggle the habits you'd quit, type what you actually spend, and see what it becomes if invested. No averages, every number is yours.",
    add_custom: "+ Add custom category", custom_ph: "Custom category", eg: "e.g.",
    redirect_label: "If you redirect this every month", per_mo: "{x} /mo", per_year: "{x} a year",
    invested_in: "Invested in", yr1: "1 year", yr5: "5 years", yr10: "10 years",
    punch: "By cutting these habits and investing, you could have {x} in 10 years.",
    punch_empty: "Toggle on the habits you want to quit and type what you spend to see your number.",
    savings_note: "Projection compounds yearly contributions: FV = annual × [((1 + r)ⁿ − 1) / r], where r is the selected annual return. Returns are assumptions, not guarantees.",
    settings_title: "Settings", language: "Language", theme: "Theme",
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
    asset_stocks: "Stocks", asset_crypto: "Crypto", asset_deposit: "Deposit", asset_bonds: "Bonds", asset_realestate: "Real estate", asset_gold: "Gold", asset_cash: "Cash",
    inc_from_portfolio: "+{x}/mo from portfolio",
    target_via: "Freedom target via (pick one or more)", target_x: "Target {x}", to_freedom: "to financial freedom", blended_return: "Blended return",
    income_line: "Right now your portfolio could generate about {income}/month, covering {pct} of your expenses.",
    freedom_reached: "🎉 You've reached your freedom number. Your investments can cover your expenses!",
    portfolio_empty: "Add your holdings above to see the breakdown.",
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
      shopping: "Impulse / fast-fashion shopping",
    },
  },

  tr: {
    nav_home: "Ana Sayfa", nav_savings: "Tasarruf", nav_settings: "Ayarlar", nav_more: "Daha",
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
    cut_title: "Harcamanı azalt", cut_sub: "Bırakacağın alışkanlıkları aç/kapat, gerçekte ne harcadığını yaz ve yatırılırsa ne olacağını gör. Ortalama yok, her rakam senin.",
    add_custom: "+ Özel kategori ekle", custom_ph: "Özel kategori", eg: "örn.",
    redirect_label: "Bunu her ay yatırıma yönlendirsen", per_mo: "{x} /ay", per_year: "{x} yıllık",
    invested_in: "Şuna yatırılırsa", yr1: "1 yıl", yr5: "5 yıl", yr10: "10 yıl",
    punch: "Bu alışkanlıkları bırakıp yatırım yaparak 10 yılda {x} elde edebilirsin.",
    punch_empty: "Bırakmak istediğin alışkanlıkları aç ve harcamanı yaz; rakamını gör.",
    savings_note: "Projeksiyon yıllık katkıları bileşik hesaplar: GD = yıllık × [((1 + r)ⁿ − 1) / r], r seçilen yıllık getiridir. Getiriler varsayımdır, garanti değildir.",
    settings_title: "Ayarlar", language: "Dil", theme: "Tema",
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
    asset_stocks: "Hisse", asset_crypto: "Kripto", asset_deposit: "Mevduat", asset_bonds: "Tahvil", asset_realestate: "Gayrimenkul", asset_gold: "Altın", asset_cash: "Nakit",
    inc_from_portfolio: "+{x}/ay portföyden",
    target_via: "Özgürlük hedefi (bir veya birkaçını seç)", target_x: "Hedef {x}", to_freedom: "finansal özgürlüğe", blended_return: "Karma getiri",
    income_line: "Şu an portföyün ayda yaklaşık {income} üretebilir, giderlerinin {pct} kadarını karşılar.",
    freedom_reached: "🎉 Özgürlük rakamına ulaştın. Yatırımların giderlerini karşılayabilir!",
    portfolio_empty: "Dağılımı görmek için yukarıdan varlık ekle.",
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
      shopping: "Dürtüsel / hızlı moda alışveriş",
    },
  },

  zh: {
    nav_home: "首页", nav_savings: "储蓄", nav_settings: "设置", nav_more: "更多",
    currency: "货币", monthly_expenses: "每月支出", per_month: "/ 月",
    real_mode: "实际收益模式", real_mode_sub: "从每个收益率中减去通胀",
    inflation_label: "通胀（年 %）",
    headline_tag: "通往自由最简单的路径",
    via: "通过 {name}", return_word: "收益", real_word: "实际",
    headline_note: "存下这么多，{name} 的收益每月约产生 {monthly}，无需动用本金即可覆盖你的支出。",
    headline_note_extra: " 在当前通胀假设下，下面部分工具无法实现自由。",
    not_reachable: "无法实现", no_beat_inflation: "没有工具能跑赢通胀",
    not_reachable_note: "在这些利率下，实际收益为零或为负，被动收入无法跑赢通胀。请降低通胀假设或提高某个收益率。",
    rule_badge: "📚 4% 法则 · Trinity 研究", rule_title: "年支出的 25 倍",
    rule_text: 'NumBrrr 概括了一个经典理念：如果你的储蓄每年约赚 <strong>4%</strong>，那么你大约需要 <strong>年支出的 25 倍</strong>，仅靠收益就能覆盖生活，而无需动用本金。这个"安全提取率"来自 <strong>Trinity 研究 (1998)</strong>，一项对历史市场数据具有里程碑意义的学术分析，也是财务独立（FIRE）运动的基础。',
    rule_number_label: "你的 25 倍数字（按 4%）", rule_link: "阅读 Trinity 研究 →",
    rule_note_USD: "基于约 30 年的美国股票与债券历史收益及均衡投资组合。这是一个参考，并非保证，过往业绩不预示未来。",
    rule_note_TL: "提示：4% 法则源自长期的美国市场历史。在里拉这样的高通胀货币中，请以实际（扣除通胀后）口径思考，打开上方的实际收益模式以获得更真实的数字。",
    compare_title: "比较投资工具", compare_sub: "每张卡片显示：为使其年收益覆盖你的支出所需的储蓄。收益率可编辑。",
    annual_return: "年收益率", total_required: "所需总储蓄", total_required_re: "所需总储蓄（≈ 房产价值）",
    easiest: "最易", volatile: "高波动", doesnt_outpace: "跑不赢通胀",
    gross_yield: "毛租金收益率", use_property: "使用你自己的房产", optional: "（可选）",
    property_value: "房产价值", monthly_rent: "每月租金",
    computed_yield: "计算得出的收益率 {rate}, 租金 ÷ 房产价值",
    net_yield: "净收益", net_yield_sub: "−2% 税费、维护与空置",
    lbl_real_rate: "实际收益率", word_inflation: "通胀", word_gross: "毛", word_costs: "成本", word_yield: "收益率",
    eff_real: "实际", eff_net: "净", eff_effective: "有效",
    chart_title: "所需储蓄", chart_sub: "越低越好，让钱为你工作前需要存的更少。",
    bar_easiest: "· 最易", out_of_reach: "无法实现",
    disc_title: "须知",
    disc_1: "<strong>仅为估算，非建议。</strong> NumBrrr 是一个教育性规划工具，并非财务建议。",
    disc_2: "<strong>历史 ≠ 未来。</strong> 股票指数（标普 500、纳斯达克、BIST 100）和比特币的收益为历史平均，不保证未来表现。",
    disc_3: "<strong>比特币极度波动。</strong> 加密货币可能剧烈波动；请将其收益视为投机性。",
    disc_4: "<strong>房地产收益各异。</strong> 租金收益率因城市和房产类型差异很大；默认值为全国平均（Global Property Guide），属历史数据，不构成保证。请使用房产价值与租金字段计算你自己的数字。",
    disc_5: "<strong>收益率为默认值。</strong> 每个收益率都预填了合理默认值且完全可编辑，根据你自己的假设调整。",
    cut_title: "削减你的开支", cut_sub: "打开你想戒掉的习惯，输入你实际花费的金额，看看若拿去投资会变成多少。没有平均值，每个数字都是你自己的。",
    add_custom: "+ 添加自定义类别", custom_ph: "自定义类别", eg: "例如",
    redirect_label: "如果你每月把这些钱拿去投资", per_mo: "{x} / 月", per_year: "{x} / 年",
    invested_in: "投资于", yr1: "1 年", yr5: "5 年", yr10: "10 年",
    punch: "戒掉这些习惯并进行投资，10 年后你可能拥有 {x}。",
    punch_empty: "打开你想戒掉的习惯并输入花费，查看你的数字。",
    savings_note: "预测对每年的投入进行复利计算：终值 = 年投入 × [((1 + r)ⁿ − 1) / r]，其中 r 为所选年收益率。收益为假设，并非保证。",
    settings_title: "设置", language: "语言", theme: "主题",
    theme_glass: "液态玻璃", theme_glass_desc: "现代磨砂玻璃（默认）",
    theme_xp: "Windows XP", theme_xp_desc: "怀旧的 2000 年代 Luna 蓝",
    theme_medieval: "中世纪", theme_medieval_desc: "粗犷的 15 世纪羊皮纸与铁",
    theme_doge: "Doge", theme_doge_desc: "这么哇 · 很多钱 · 非常迷因",
    theme_vaporwave: "Vaporwave", theme_vaporwave_desc: "80 年代霓虹梦 · 美 学",
    more_soon: "更多功能即将推出 ✨",
    nav_portfolio: "投资组合",
    portfolio_title: "你的投资组合", portfolio_sub: "添加你已持有的资产，查看它们的分布。",
    holding_ph: "持仓名称", add_holding: "+ 添加持仓", total_value: "投资组合总价值",
    flow_title: "每月现金流", flow_income: "收入", flow_expenses: "支出", flow_net: "每月净额",
    flow_savings_note: "如果削减你记录的开支，每月可多 +{x}。",
    cat_cash: "现金", cat_investment: "投资",
    asset_stocks: "股票", asset_crypto: "加密货币", asset_deposit: "存款", asset_bonds: "债券", asset_realestate: "房地产", asset_gold: "黄金", asset_cash: "现金",
    inc_from_portfolio: "+{x}/月 来自投资组合",
    target_via: "自由目标（可选一个或多个）", target_x: "目标 {x}", to_freedom: "距财务自由", blended_return: "混合收益率",
    income_line: "目前你的投资组合每月约可产生 {income}，覆盖你支出的 {pct}。",
    freedom_reached: "🎉 你已达到自由数字。你的投资可以覆盖你的支出！",
    portfolio_empty: "在上方添加持仓以查看资产分布。",
    portfolio_note: "自由目标 = 年支出 ÷ 所选收益率。被动收入 = 价值 × 收益率。仅为估算，非建议。",
    nav_income: "收入",
    income_title: "你的收入", income_sub: "添加你的每月收入。标记其中的被动收入（租金、利息、股息）；只有被动收入计入财务自由。",
    add_income: "+ 添加收入", income_ph: "收入来源", total_income: "每月总收入",
    passive_label: "被动", active_label: "主动", covered_by_passive: "由被动收入覆盖",
    surplus_line: "你每月大约还剩 {x} 可用于投资。", deficit_line: "你每月支出比收入多约 {x}。",
    income_free: "🎉 财务自由：你的被动收入已覆盖你的支出！",
    income_empty: "在上方添加收入以查看你的状况。",
    income_note: "被动收入 = 租金、利息、股息等。财务自由 = 被动收入 ≥ 你的支出。",
    inc: { salary: "工资", rental: "租金收入", interest: "利息收入", dividends: "股息", side: "副业 / 自由职业收入" },
    note_historical: "基于历史平均，不构成保证。",
    note_btc_warn: "比特币极度波动；该数字为投机性。",
    note_btc_tl: "以里拉计的近 ~12 个月收益（≈ +37%，截至 2026 年中，来源：CoinGecko）。比特币极度波动，单一年份并非预测。",
    re_note_USD: "默认毛收益率 ≈ 6.6%（Global Property Guide 全国平均，2025 Q4）。租金收益率因城市和房产类型差异很大，属历史数据，不构成保证。",
    re_note_TL: "默认毛收益率 ≈ 7.3%（Global Property Guide 全国平均，2026 Q1）。租金收益率因城市和房产类型差异很大，属历史数据，不构成保证。",
    inst: {
      savings: { name: "储蓄 / 货币市场", sub: "高收益储蓄" },
      treasury: { name: "美国国债", sub: "约 10 年期" },
      sp500: { name: "标普 500", sub: "SPX 历史平均" },
      nasdaq: { name: "纳斯达克 100", sub: "历史平均" },
      btc: { name: "比特币 (BTC)", sub: "投机性", sub_tl: "近 12 个月 · TRY" },
      realestate: { name: "房地产", sub: "租金收益率 · 租金 ÷ 价值" },
      deposit: { name: "里拉存款", sub: "年利率" },
      gold: { name: "黄金（里拉）", sub: "以里拉计价的黄金" },
      bist: { name: "BIST 100", sub: "伊斯坦布尔交易所平均" },
      eurobond: { name: "欧洲债券 / 外汇存款", sub: "与外汇挂钩的收益" },
    },
    cat: {
      cigarettes: "香烟", alcohol: "酒", subscriptions: "数字订阅",
      subscriptions_hint: "Netflix、Spotify、YouTube Premium 等",
      eatingout: "外出就餐 / 餐厅", delivery: "外卖", coffee: "每日咖啡",
      gaming: "游戏订阅 + 游戏内购买", fuel: "燃油 / 加油",
      shopping: "冲动 / 快时尚购物",
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
  income: { amounts: {}, passive: {}, custom: [], seq: 0 },
};
SAVINGS_CATEGORIES.forEach((id) => { state.savings.amounts[id] = 0; state.savings.on[id] = true; });
INCOME_CATEGORIES.forEach((c) => { state.income.amounts[c.id] = 0; state.income.passive[c.id] = c.passive; });
// start with a few empty holding rows (no preset values)
[0, 1, 2].forEach(() => state.portfolio.holdings.push({ id: "h" + ++state.portfolio.seq, label: "", value: 0, assetType: "stocks" }));

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
    row.querySelector("[data-cat-name]").addEventListener("input", (e) => { const c = state.savings.custom.find((x) => x.id === id); if (c) c.label = e.target.value; });
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
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-savings .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  let monthly = 0;
  SAVINGS_CATEGORIES.forEach((id) => { if (state.savings.on[id]) monthly += state.savings.amounts[id] || 0; });
  state.savings.custom.forEach((c) => { if (state.savings.on[c.id]) monthly += state.savings.amounts[c.id] || 0; });
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

function makeHoldingRow(id) {
  const meta = CURRENCY_META[state.currency];
  const h = state.portfolio.holdings.find((x) => x.id === id);
  const row = document.createElement("div");
  row.className = "cat-row port-row";
  row.dataset.hold = id;
  const safeLabel = h && h.label ? h.label.replace(/"/g, "&quot;") : "";
  const at = (h && h.assetType) || "stocks";
  const options = ASSET_TYPES.map((tp) => `<option value="${tp}" ${tp === at ? "selected" : ""}>${t("asset_" + tp)}</option>`).join("");
  row.innerHTML = `
    <div class="port-namecell">
      <input class="cat-name port-name" data-hold-name="${id}" value="${safeLabel}" placeholder="${t("holding_ph")}" />
      <select class="hold-type" data-hold-type="${id}" aria-label="asset type">${options}</select>
    </div>
    <div class="money-input money-input--sm cat-amount">
      <span class="money-symbol savings-symbol">${meta.symbol}</span>
      <input type="text" inputmode="numeric" data-hold-val="${id}" value="${h && h.value ? formatThousands(h.value) : ""}" placeholder="0" />
    </div>
    <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;

  row.querySelector("[data-hold-name]").addEventListener("input", (e) => {
    const x = state.portfolio.holdings.find((y) => y.id === id);
    if (x) x.label = e.target.value;
  });
  row.querySelector("[data-hold-type]").addEventListener("change", (e) => {
    const x = state.portfolio.holdings.find((y) => y.id === id);
    if (x) x.assetType = e.target.value;
    refreshPortfolio();
    refreshIncome();
  });
  const v = row.querySelector("[data-hold-val]");
  v.addEventListener("input", () => {
    const x = state.portfolio.holdings.find((y) => y.id === id);
    if (x) x.value = parseNumber(v.value);
    refreshPortfolio();
    refreshIncome();
  });
  v.addEventListener("blur", () => {
    const x = state.portfolio.holdings.find((y) => y.id === id);
    if (x && x.value > 0) v.value = formatThousands(x.value);
  });
  row.querySelector("[data-hold-del]").addEventListener("click", () => {
    state.portfolio.holdings = state.portfolio.holdings.filter((y) => y.id !== id);
    row.remove();
    refreshPortfolio();
    refreshIncome();
  });
  return row;
}

function addHolding() {
  const id = "h" + ++state.portfolio.seq;
  state.portfolio.holdings.push({ id, label: "", value: 0, assetType: "stocks" });
  const row = makeHoldingRow(id);
  el.portList.appendChild(row);
  row.querySelector("[data-hold-name]").focus();
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
    const monthly = (h.value * (assetRate(h.assetType, cur) / 100)) / 12;
    if (h.assetType === "deposit" || h.assetType === "bonds") interest += monthly;
    else if (h.assetType === "realestate") rental += monthly;
  });
  return { interest, rental };
}
function incomeManualTotal() {
  let t = 0;
  INCOME_CATEGORIES.forEach((c) => (t += state.income.amounts[c.id] || 0));
  state.income.custom.forEach((c) => (t += state.income.amounts[c.id] || 0));
  return t;
}

function refreshPortfolio() {
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-portfolio .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  // --- Monthly cash flow (Income incl. portfolio yield − Expenses) ---
  const py = portfolioYield();
  const income = incomeManualTotal() + py.interest + py.rental;
  let sav = 0;
  SAVINGS_CATEGORIES.forEach((id) => { if (state.savings.on[id]) sav += state.savings.amounts[id] || 0; });
  state.savings.custom.forEach((c) => { if (state.savings.on[c.id]) sav += state.savings.amounts[c.id] || 0; });
  const exp = state.monthlyExpenses;
  const net = income - exp;
  el.flowIncome.textContent = formatMoney(income);
  el.flowExpenses.textContent = "−" + formatMoney(exp);
  el.flowNet.textContent = formatMoney(net);
  el.flowNetRow.classList.toggle("is-pos", net >= 0);
  el.flowNetRow.classList.toggle("is-neg", net < 0);
  el.flowSavings.textContent = sav > 0 ? t("flow_savings_note", { x: formatMoney(sav) }) : "";

  // --- Holdings total + donut (categorized Cash / Investment) ---
  const total = state.portfolio.holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  el.portTotal.textContent = formatMoney(total);

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
    row.querySelector("[data-inc-name]").addEventListener("input", (e) => { const c = state.income.custom.find((x) => x.id === id); if (c) c.label = e.target.value; });
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
  const exp = state.monthlyExpenses;

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
  updateSettingsActive();
  try { localStorage.setItem("numbr_lang", lang); } catch (e) {}
}
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  updateSettingsActive();
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
  updateSettingsActive();
  try { localStorage.setItem("numbr_currency", cur); } catch (e) {}
}

// ---- Event wiring ----
document.querySelectorAll("[data-currency]").forEach((b) => b.addEventListener("click", () => setCurrency(b.dataset.currency)));

el.addCat.addEventListener("click", addCustomCategory);
el.investSelect.addEventListener("change", () => { state.savings.invest[state.currency] = el.investSelect.value; refreshSavings(); });

el.addHolding.addEventListener("click", addHolding);
el.addIncome.addEventListener("click", addIncome);

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
    document.querySelector(".brand").hidden = name !== "home"; // logo only on Home
    if (name === "savings") refreshSavings();
    if (name === "portfolio") refreshPortfolio();
    if (name === "income") refreshIncome();
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

// ---- Init ----
try {
  const savedLang = localStorage.getItem("numbr_lang");
  const savedTheme = localStorage.getItem("numbr_theme");
  const savedCur = localStorage.getItem("numbr_currency");
  if (savedLang && I18N[savedLang]) state.lang = savedLang;
  if (savedTheme) state.theme = savedTheme;
  if (savedCur && CURRENCY_META[savedCur]) state.currency = savedCur;
} catch (e) {}

el.expenses.value = formatThousands(state.monthlyExpenses);
el.inflation.value = formatRate(state.inflation[state.currency], false);
applyTheme(state.theme);
applyLanguage(state.lang); // builds layout + savings, applies all translations
