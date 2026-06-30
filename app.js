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

const SAVINGS_DEFAULT_INVEST = { USD: "sp500", TL: "deposit" };
// Preset expense categories (translated; users can also type their own).
const EXPENSE_CATS = ["rent","bills","market","food","electric","water","internet","transport","health","shopping","entertainment","other"];
// Vehicle payment-reminder labels + vehicle expense categories (suggestions).
const VEH_SCHED_PRESETS = ["insurance","kasko","tax","inspection","service"];
const VEH_EXP_PRESETS = ["fuel","service","parking","fine","tires","wash"];
// Income sources, pre-classified as passive (counts toward freedom) or active.
const INCOME_CATEGORIES = [
  { id: "salary", passive: false },
  { id: "rental", passive: true },
  { id: "interest", passive: true },
  { id: "dividends", passive: true },
  { id: "side", passive: false },
];
// Portfolio holding asset types (tags). Interest-bearing ones feed Income.
const ASSET_TYPES = ["usstock", "bist", "crypto", "gold", "usd", "deposit", "bonds", "cash"];
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
  // More US stocks (NASDAQ-100 / S&P large & mid caps, popular names)
  { s: "GOOG", n: "Alphabet (Class C)" }, { s: "TMUS", n: "T-Mobile US" }, { s: "CMCSA", n: "Comcast" }, { s: "CHTR", n: "Charter Communications" },
  { s: "TXN", n: "Texas Instruments" }, { s: "AMAT", n: "Applied Materials" }, { s: "LRCX", n: "Lam Research" }, { s: "KLAC", n: "KLA Corp" },
  { s: "ADI", n: "Analog Devices" }, { s: "NXPI", n: "NXP Semiconductors" }, { s: "MRVL", n: "Marvell" }, { s: "ON", n: "ON Semiconductor" },
  { s: "MCHP", n: "Microchip Technology" }, { s: "SNPS", n: "Synopsys" }, { s: "CDNS", n: "Cadence Design" }, { s: "FTNT", n: "Fortinet" },
  { s: "PANW", n: "Palo Alto Networks" }, { s: "CRWD", n: "CrowdStrike" }, { s: "ZS", n: "Zscaler" }, { s: "NET", n: "Cloudflare" },
  { s: "DDOG", n: "Datadog" }, { s: "SNOW", n: "Snowflake" }, { s: "MDB", n: "MongoDB" }, { s: "NOW", n: "ServiceNow" },
  { s: "INTU", n: "Intuit" }, { s: "ADSK", n: "Autodesk" }, { s: "SMCI", n: "Super Micro Computer" }, { s: "ARM", n: "Arm Holdings" },
  { s: "ASML", n: "ASML Holding" }, { s: "TSM", n: "TSMC" }, { s: "DELL", n: "Dell Technologies" }, { s: "HPQ", n: "HP Inc" },
  { s: "WDC", n: "Western Digital" }, { s: "GLW", n: "Corning" }, { s: "TEAM", n: "Atlassian" }, { s: "WDAY", n: "Workday" },
  { s: "SNAP", n: "Snap" }, { s: "PINS", n: "Pinterest" }, { s: "RBLX", n: "Roblox" }, { s: "DASH", n: "DoorDash" },
  { s: "LYFT", n: "Lyft" }, { s: "ZM", n: "Zoom" }, { s: "DOCU", n: "DocuSign" }, { s: "TWLO", n: "Twilio" },
  { s: "OKTA", n: "Okta" }, { s: "ROKU", n: "Roku" }, { s: "TTD", n: "The Trade Desk" }, { s: "RDDT", n: "Reddit" },
  { s: "BIDU", n: "Baidu" }, { s: "JD", n: "JD.com" }, { s: "PDD", n: "PDD Holdings" }, { s: "NTES", n: "NetEase" },
  { s: "SE", n: "Sea Limited" }, { s: "MELI", n: "MercadoLibre" },
  { s: "WFC", n: "Wells Fargo" }, { s: "C", n: "Citigroup" }, { s: "MS", n: "Morgan Stanley" }, { s: "SCHW", n: "Charles Schwab" },
  { s: "BLK", n: "BlackRock" }, { s: "AXP", n: "American Express" }, { s: "BX", n: "Blackstone" }, { s: "KKR", n: "KKR" },
  { s: "SPGI", n: "S&P Global" }, { s: "ICE", n: "Intercontinental Exchange" }, { s: "CME", n: "CME Group" }, { s: "COF", n: "Capital One" },
  { s: "USB", n: "U.S. Bancorp" }, { s: "PNC", n: "PNC Financial" }, { s: "MCO", n: "Moody's" }, { s: "PGR", n: "Progressive" },
  { s: "MET", n: "MetLife" }, { s: "AIG", n: "AIG" }, { s: "TRV", n: "Travelers" }, { s: "MMC", n: "Marsh McLennan" },
  { s: "ABBV", n: "AbbVie" }, { s: "TMO", n: "Thermo Fisher" }, { s: "ABT", n: "Abbott" }, { s: "DHR", n: "Danaher" },
  { s: "BMY", n: "Bristol Myers Squibb" }, { s: "AMGN", n: "Amgen" }, { s: "GILD", n: "Gilead Sciences" }, { s: "ISRG", n: "Intuitive Surgical" },
  { s: "MDT", n: "Medtronic" }, { s: "SYK", n: "Stryker" }, { s: "BSX", n: "Boston Scientific" }, { s: "CI", n: "Cigna" },
  { s: "CVS", n: "CVS Health" }, { s: "ELV", n: "Elevance Health" }, { s: "ZTS", n: "Zoetis" }, { s: "VRTX", n: "Vertex Pharma" },
  { s: "REGN", n: "Regeneron" }, { s: "MRNA", n: "Moderna" }, { s: "BIIB", n: "Biogen" }, { s: "DXCM", n: "DexCom" },
  { s: "HCA", n: "HCA Healthcare" }, { s: "MCK", n: "McKesson" }, { s: "IDXX", n: "IDEXX Labs" }, { s: "GEHC", n: "GE HealthCare" },
  { s: "LOW", n: "Lowe's" }, { s: "TGT", n: "Target" }, { s: "TJX", n: "TJX Companies" }, { s: "DG", n: "Dollar General" },
  { s: "DLTR", n: "Dollar Tree" }, { s: "ROST", n: "Ross Stores" }, { s: "ULTA", n: "Ulta Beauty" }, { s: "LULU", n: "Lululemon" },
  { s: "CMG", n: "Chipotle" }, { s: "YUM", n: "Yum! Brands" }, { s: "EL", n: "Estée Lauder" }, { s: "CL", n: "Colgate-Palmolive" },
  { s: "KMB", n: "Kimberly-Clark" }, { s: "GIS", n: "General Mills" }, { s: "MDLZ", n: "Mondelez" }, { s: "MO", n: "Altria" },
  { s: "PM", n: "Philip Morris" }, { s: "STZ", n: "Constellation Brands" }, { s: "MNST", n: "Monster Beverage" }, { s: "KHC", n: "Kraft Heinz" },
  { s: "KR", n: "Kroger" }, { s: "KDP", n: "Keurig Dr Pepper" }, { s: "HSY", n: "Hershey" },
  { s: "CAT", n: "Caterpillar" }, { s: "DE", n: "Deere" }, { s: "HON", n: "Honeywell" }, { s: "GE", n: "GE Aerospace" },
  { s: "MMM", n: "3M" }, { s: "UPS", n: "UPS" }, { s: "FDX", n: "FedEx" }, { s: "LMT", n: "Lockheed Martin" },
  { s: "RTX", n: "RTX (Raytheon)" }, { s: "NOC", n: "Northrop Grumman" }, { s: "GD", n: "General Dynamics" }, { s: "UNP", n: "Union Pacific" },
  { s: "CSX", n: "CSX" }, { s: "NSC", n: "Norfolk Southern" }, { s: "EMR", n: "Emerson Electric" }, { s: "ETN", n: "Eaton" },
  { s: "ITW", n: "Illinois Tool Works" }, { s: "GEV", n: "GE Vernova" }, { s: "WM", n: "Waste Management" }, { s: "PH", n: "Parker Hannifin" },
  { s: "CMI", n: "Cummins" }, { s: "PCAR", n: "PACCAR" },
  { s: "COP", n: "ConocoPhillips" }, { s: "SLB", n: "Schlumberger" }, { s: "EOG", n: "EOG Resources" }, { s: "MPC", n: "Marathon Petroleum" },
  { s: "PSX", n: "Phillips 66" }, { s: "VLO", n: "Valero Energy" }, { s: "OXY", n: "Occidental" }, { s: "WMB", n: "Williams" },
  { s: "KMI", n: "Kinder Morgan" }, { s: "OKE", n: "ONEOK" }, { s: "HAL", n: "Halliburton" }, { s: "FANG", n: "Diamondback Energy" },
  { s: "RIVN", n: "Rivian" }, { s: "LCID", n: "Lucid" }, { s: "NIO", n: "NIO" }, { s: "LI", n: "Li Auto" }, { s: "XPEV", n: "XPeng" },
  { s: "HOOD", n: "Robinhood" }, { s: "SOFI", n: "SoFi" }, { s: "AFRM", n: "Affirm" }, { s: "DKNG", n: "DraftKings" },
  { s: "CVNA", n: "Carvana" }, { s: "MSTR", n: "MicroStrategy" }, { s: "GME", n: "GameStop" },
  { s: "DAL", n: "Delta Air Lines" }, { s: "UAL", n: "United Airlines" }, { s: "AAL", n: "American Airlines" }, { s: "LUV", n: "Southwest Airlines" },
  { s: "ETSY", n: "Etsy" }, { s: "EBAY", n: "eBay" }, { s: "CHWY", n: "Chewy" }, { s: "MAR", n: "Marriott" },
  { s: "BKNG", n: "Booking Holdings" }, { s: "HLT", n: "Hilton" }, { s: "CTAS", n: "Cintas" }, { s: "FAST", n: "Fastenal" },
  { s: "ODFL", n: "Old Dominion" }, { s: "PAYX", n: "Paychex" }, { s: "CPRT", n: "Copart" }, { s: "EA", n: "Electronic Arts" },
  { s: "TTWO", n: "Take-Two Interactive" }, { s: "WBD", n: "Warner Bros Discovery" }, { s: "PARA", n: "Paramount" },
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
  // Banks, finance & insurance
  { s: "TSKB", n: "Türkiye Sınai Kalkınma Bankası" }, { s: "ALBRK", n: "Albaraka Türk" }, { s: "SKBNK", n: "Şekerbank" }, { s: "QNBFB", n: "QNB Finansbank" },
  { s: "ISMEN", n: "İş Yatırım" }, { s: "GLCVY", n: "Gelecek Varlık" }, { s: "ISFIN", n: "İş Finansal Kiralama" }, { s: "AGESA", n: "Agesa Emeklilik" },
  { s: "ANHYT", n: "Anadolu Hayat Emeklilik" }, { s: "ANSGR", n: "Anadolu Sigorta" }, { s: "TURSG", n: "Türkiye Sigorta" }, { s: "RAYSG", n: "Ray Sigorta" },
  // Holdings
  { s: "DOHOL", n: "Doğan Holding" }, { s: "GLYHO", n: "Global Yatırım Holding" }, { s: "AGHOL", n: "AG Anadolu Grubu Holding" }, { s: "NTHOL", n: "Net Holding" },
  { s: "IHLAS", n: "İhlas Holding" }, { s: "BERA", n: "Bera Holding" }, { s: "POLHO", n: "Polisan Holding" }, { s: "VERUS", n: "Verusa Holding" },
  { s: "GSDHO", n: "GSD Holding" }, { s: "IEYHO", n: "Işıklar Enerji" }, { s: "ECZYT", n: "Eczacıbaşı Yatırım" }, { s: "ECILC", n: "Eczacıbaşı İlaç" },
  // Energy & utilities
  { s: "AKFYE", n: "Akfen Yenilenebilir Enerji" }, { s: "AYDEM", n: "Aydem Enerji" }, { s: "GESAN", n: "Girişim Elektrik" }, { s: "CWENE", n: "CW Enerji" },
  { s: "KONTR", n: "Kontrolmatik" }, { s: "NTGAZ", n: "Naturelgaz" }, { s: "AKSA", n: "Aksa Akrilik" }, { s: "AKSUE", n: "Aksu Enerji" },
  { s: "ESEN", n: "Esenboğa Elektrik" }, { s: "ALFAS", n: "Alfa Solar" }, { s: "EUPWR", n: "Europower Enerji" }, { s: "AYEN", n: "Ayen Enerji" },
  // Industrials & technology
  { s: "KORDS", n: "Kordsa" }, { s: "BRISA", n: "Brisa" }, { s: "GOODY", n: "Goodyear" }, { s: "EGEEN", n: "Ege Endüstri" },
  { s: "KARSN", n: "Karsan" }, { s: "KLMSN", n: "Klimasan" }, { s: "ARENA", n: "Arena Bilgisayar" }, { s: "INDES", n: "İndeks Bilgisayar" },
  { s: "LOGO", n: "Logo Yazılım" }, { s: "NETAS", n: "Netaş" }, { s: "KAREL", n: "Karel Elektronik" }, { s: "ALCTL", n: "Alcatel Lucent Teletaş" },
  { s: "ESCOM", n: "Escort Teknoloji" }, { s: "PKART", n: "Plastikkart" }, { s: "MIATK", n: "Mia Teknoloji" }, { s: "ARDYZ", n: "ARD Bilişim" },
  { s: "PAPIL", n: "Papilon Savunma" }, { s: "OBASE", n: "Obase" }, { s: "FORTE", n: "Forte Bilgi İletişim" }, { s: "KFEIN", n: "Kafein Yazılım" },
  { s: "SDTTR", n: "SDT Uzay ve Savunma" }, { s: "HTTBT", n: "Hitit Bilgisayar" }, { s: "INVEO", n: "Inveo Yatırım" }, { s: "LINK", n: "Link Bilgisayar" },
  { s: "DGATE", n: "Datagate Bilgisayar" }, { s: "ARMDA", n: "Armada Bilgisayar" }, { s: "PENTA", n: "Penta Teknoloji" }, { s: "FONET", n: "Fonet Bilgi Teknolojileri" },
  { s: "DESPC", n: "Despec Bilgisayar" }, { s: "ALCAR", n: "Alarko Carrier" }, { s: "MOBTL", n: "Mobiltel İletişim" },
  // Steel & metals
  { s: "ISDMR", n: "İskenderun Demir Çelik" }, { s: "CEMTS", n: "Çemtaş" }, { s: "BURCE", n: "Burçelik" }, { s: "DMSAS", n: "Demisaş" },
  // Chemicals & paint
  { s: "ALKIM", n: "Alkim Kimya" }, { s: "BAGFS", n: "Bagfaş" }, { s: "EGGUB", n: "Ege Gübre" }, { s: "DYOBY", n: "DYO Boya" },
  { s: "SODSN", n: "Sodaş Sodyum" }, { s: "MRSHL", n: "Marshall" },
  // Retail & consumer
  { s: "BIZIM", n: "Bizim Toptan" }, { s: "CRFSA", n: "CarrefourSA" }, { s: "TKNSA", n: "Teknosa" }, { s: "VAKKO", n: "Vakko" },
  { s: "MAVI", n: "Mavi Giyim" }, { s: "SELEC", n: "Selçuk Ecza Deposu" },
  // Food & beverage
  { s: "TATGD", n: "Tat Gıda" }, { s: "KERVT", n: "Kerevitaş" }, { s: "KNFRT", n: "Konfrut Gıda" }, { s: "PNSUT", n: "Pınar Süt" },
  { s: "BANVT", n: "Banvit" }, { s: "PETUN", n: "Pınar Et ve Un" }, { s: "TUKAS", n: "Tukaş" }, { s: "ULUUN", n: "Ulusoy Un" },
  { s: "TBORG", n: "Türk Tuborg" }, { s: "AVOD", n: "A.V.O.D. Gıda" }, { s: "KTSKR", n: "Kütahya Şeker" },
  // Cement & construction materials
  { s: "AKCNS", n: "Akçansa" }, { s: "BUCIM", n: "Bursa Çimento" }, { s: "GOLTS", n: "Göltaş Çimento" }, { s: "NUHCM", n: "Nuh Çimento" },
  { s: "BTCIM", n: "Batıçim" }, { s: "BSOKE", n: "Batısöke Çimento" }, { s: "AFYON", n: "Afyon Çimento" }, { s: "KONYA", n: "Konya Çimento" },
  { s: "ADANA", n: "Adana Çimento" }, { s: "BOLUC", n: "Bolu Çimento" }, { s: "MRDIN", n: "Mardin Çimento" }, { s: "UNYEC", n: "Ünye Çimento" },
  { s: "EGSER", n: "Ege Seramik" }, { s: "KUTPO", n: "Kütahya Porselen" }, { s: "QUAGR", n: "Qua Granite" },
  // Textile & apparel
  { s: "YATAS", n: "Yataş" }, { s: "BLCYT", n: "Bilici Yatırım" }, { s: "DAGI", n: "Dagi Giyim" }, { s: "DESA", n: "Desa Deri" },
  { s: "MNDRS", n: "Menderes Tekstil" }, { s: "KRTEK", n: "Karsu Tekstil" }, { s: "SKTAS", n: "Söktaş" }, { s: "YUNSA", n: "Yünsa" },
  { s: "ARSAN", n: "Arsan Tekstil" }, { s: "BOSSA", n: "Bossa" },
  // Health & pharma
  { s: "DEVA", n: "Deva Holding" }, { s: "RTALB", n: "RTA Laboratuvarları" }, { s: "LKMNH", n: "Lokman Hekim" }, { s: "MPARK", n: "MLP Sağlık" },
  // Real estate (GYO)
  { s: "TRGYO", n: "Torunlar GYO" }, { s: "KLGYO", n: "Kiler GYO" }, { s: "OZKGY", n: "Özak GYO" }, { s: "AKSGY", n: "Akiş GYO" },
  { s: "RYGYO", n: "Reysaş GYO" }, { s: "VKGYO", n: "Vakıf GYO" }, { s: "HLGYO", n: "Halk GYO" }, { s: "ISGYO", n: "İş GYO" },
  { s: "SNGYO", n: "Sinpaş GYO" },
  // Automotive parts
  { s: "PARSN", n: "Parsan" }, { s: "KATMR", n: "Katmerciler" }, { s: "JANTS", n: "Jantsa" }, { s: "BFREN", n: "Bosch Fren" }, { s: "DITAS", n: "Ditaş Doğan" },
  // Tourism, packaging, mining & other
  { s: "MAALT", n: "Marmaris Altınyunus" }, { s: "MARTI", n: "Martı Otel" }, { s: "AYCES", n: "Altınyunus Çeşme" },
  { s: "ANELE", n: "Anel Elektrik" }, { s: "KARTN", n: "Kartonsan" }, { s: "BAKAB", n: "Bak Ambalaj" },
  { s: "IPEKE", n: "İpek Doğal Enerji" }, { s: "PRKME", n: "Park Elektrik" },
];
// BIST 30 (XU030) constituents — used for the 1-year performance leaderboard in TR.
const BIST30 = [
  "AKBNK", "GARAN", "ISCTR", "YKBNK", "VAKBN", "THYAO", "PGSUS", "BIMAS", "MGROS", "ASELS",
  "KCHOL", "SAHOL", "EREGL", "KRDMD", "SISE", "TUPRS", "PETKM", "SASA", "FROTO", "TOASO",
  "ARCLK", "TCELL", "TTKOM", "ENKAI", "ALARK", "KOZAL", "GUBRF", "HEKTS", "OYAKC", "ASTOR",
];
const WITHHOLD_PCT = 15; // approx. withholding tax (stopaj) on deposit/bond interest
let cryptoMarkets = []; // top coins for the active currency: [{ id, symbol, name, price, chg24 }]
let goldPriceGram = 0; // per-gram gold price in the active currency
let goldChg24 = null;  // gold 24h % move
const GRAMS_PER_OZ = 31.1034768;
let usdTry = 0; // TRY per 1 USD (for converting stock prices to the active currency)
let usdTryChg24 = null; // USD/TRY 24h % move
let watchData = {}; // key -> { price, ccy, chg24, chg1mo, chg1y } for watchlist items

// ============================================================
//  i18n dictionary
// ============================================================
const I18N = {
  en: {
    nav_home: "Freedom", nav_savings: "Expenses", nav_settings: "Settings", nav_more: "More",
    home_title: "Freedom", home_sub: "See how much to save so passive returns cover your expenses.",
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
    rule_text: 'Earn about <strong>4% a year</strong> and you need roughly <strong>25× your annual expenses</strong>, so the returns alone cover your life without draining the principal.',
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
    disc_1: "Estimates for education, not financial advice. Returns are historical or assumed, not guaranteed, and every rate is editable.",
    disc_2: "<strong>Historical ≠ future.</strong> Stock indices (S&P 500, Nasdaq, BIST 100) and Bitcoin returns are historical averages and do not guarantee future performance.",
    disc_3: "<strong>Bitcoin is highly volatile.</strong> Crypto can swing dramatically; treat its return as speculative.",
    disc_4: "<strong>Real estate yields vary.</strong> Rental yields differ widely by city and property type; defaults are national averages (Global Property Guide) and are historical, not a guarantee. Use the property-value & rent fields for your own number.",
    disc_5: "<strong>Rates are defaults.</strong> Every return rate is pre-filled with a reasonable default and is fully editable, tune them to your own assumptions.",
    cut_title: "Your expenses", cut_sub: "Your monthly spending. See what investing it instead could become.",
    exp_reminders: "Upcoming payments", exp_total: "This month's expenses",
    exp_recurring: "Recurring expenses", exp_add_recurring: "+ Add recurring",
    exp_thismonth: "This month's spending", exp_add: "+ Add expense", exp_history: "Past months",
    exp_cat_ph: "Category", exp_day_ph: "Day", exp_paid: "Paid",
    exp_due_fmt: "Day {day}", exp_empty: "No expenses logged yet.",
    exp_overdue: "Overdue", exp_soon: "Due soon",
    veh_title: "My vehicles", veh_add: "+ Add vehicle", veh_model_ph: "Vehicle model",
    veh_reminders: "Payment reminders", veh_add_reminder: "+ Add reminder", veh_label_ph: "Insurance, tax…",
    veh_expenses: "Expenses", veh_add_expense: "+ Add expense", veh_monthly: "This month",
    vsched: { insurance: "Insurance", kasko: "Casco", tax: "Tax", inspection: "Inspection", service: "Service" },
    vcat: { fuel: "Fuel", service: "Service", parking: "Parking", fine: "Fine", tires: "Tires", wash: "Wash" },
    ecat: { rent: "Rent", bills: "Bills", market: "Groceries", food: "Eating out", electric: "Electricity", water: "Water", internet: "Internet", transport: "Transport", health: "Health", shopping: "Shopping", entertainment: "Entertainment", other: "Other" },
    add_custom: "+ Add custom category", custom_ph: "Custom category", eg: "e.g.",
    redirect_label: "If you redirect this every month", per_mo: "{x} /mo", per_year: "{x} a year",
    invested_in: "Invested in", yr1: "1 year", yr5: "5 years", yr10: "10 years",
    punch: "By cutting these habits and investing, you could have {x} in 10 years.",
    punch_empty: "Toggle on the habits you want to quit and type what you spend to see your number.",
    savings_note: "Projection compounds yearly contributions: FV = annual × [((1 + r)ⁿ − 1) / r], where r is the selected annual return. Returns are assumptions, not guarantees.",
    settings_title: "Settings", language: "Language", theme: "Theme", country: "Country", sound: "Sound", sound_fx: "Sound effects",
    onb_title: "Welcome to NumBrrr", onb_sub: "Pick your country and language to get started. You can change these anytime in Settings.",
    onb_country: "Country", onb_language: "Language", onb_start: "Continue",
    guide_title: "Quick guide", guide_intro: "Here's what each tab does:", guide_ok: "Got it",
    guide_portfolio: "Add everything you own: stocks, crypto, gold, dollars, cash. You'll see your breakdown and monthly cash flow.",
    guide_income: "Enter your monthly income. Tick the passive ones like rent and interest, since only those count toward freedom.",
    guide_expenses: "Enter this month's spending, set reminders for your regular bills, and add what your car costs you.",
    guide_freedom: "Works out how much you need saved for your passive income alone to cover your expenses (the 4% rule).",
    guide_watch: "Search for the assets you care about, favorite them, and keep an eye on their prices.",
    theme_glass: "Liquid Glass", theme_glass_desc: "Modern frosted glass (default)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostalgic early-2000s Luna blue",
    theme_medieval: "Medieval", theme_medieval_desc: "Gritty 15th-century parchment & iron",
    theme_doge: "Doge", theme_doge_desc: "such wow · much finance · very meme",
    theme_neon: "Neon", theme_neon_desc: "80s neon dream · A E S T H E T I C",
    theme_solana: "Solana", theme_solana_desc: "Purple & green · degen mode",
    more_soon: "More features coming soon ✨",
    nav_portfolio: "Portfolio",
    portfolio_title: "Your portfolio", portfolio_sub: "Add what you own and see your allocation.",
    holding_ph: "Holding name", add_holding: "+ Add holding", total_value: "Total portfolio value",
    flow_title: "Monthly cash flow", flow_income: "Income", flow_expenses: "Expenses", flow_net: "Net / month", flow_last_month: "Last month: {x}",
    flow_savings_note: "+{x}/month more if you cut your tracked spending.",
    cat_cash: "Cash", cat_investment: "Investment",
    asset_stocks: "Stocks", asset_usstock: "US Stocks", asset_bist: "Turkish (BIST)", asset_crypto: "Crypto", asset_deposit: "Deposit", asset_bonds: "Bonds", asset_realestate: "Real estate", asset_gold: "Gold", asset_usd: "US Dollar", asset_cash: "Cash",
    stock_search_ph: "Search stock (e.g. Apple)", shares_ph: "Shares",
    nav_watchlist: "Watch", watch_title: "Watchlist", watch_sub: "Search and favorite assets to track them.",
    watch_search_ph: "Search gold, stocks, crypto…", watch_empty: "Search above and tap to add assets to your watchlist.", watch_chart: "Open chart on TradingView",
    top_perf_title: "This year's top performers", asset_silver: "Silver", top_perf_loading: "Ranking the past year…",
    watch_ccy: "Show price in USD / TL", watch_chart_full: "Open full chart on TradingView ↗",
    tr_forex: "Currencies", tr_gold: "Gold (TRY)",
    gold_gram: "Gram Gold", gold_quarter: "Quarter Gold", gold_half: "Half Gold", gold_full: "Full Gold",
    tr_gold_note: "Coin values are approximate (metal content, excluding the workmanship premium).",
    lbl_24h: "24h", lbl_1mo: "1M", lbl_1yr: "1Y",
    inc_from_portfolio: "+{x}/mo from portfolio",
    net_tax: "Net (−15% tax)", coin_search_ph: "Search coin (e.g. Solana)", qty_ph: "Qty", coin_loading: "Loading live prices…", grams_ph: "Grams", oz_ph: "Ounces",
    target_via: "Freedom target via (pick one or more)", target_x: "Target {x}", to_freedom: "to financial freedom", blended_return: "Blended return",
    income_line: "Right now your portfolio could generate about {income}/month, covering {pct} of your expenses.",
    freedom_reached: "🎉 You've reached your freedom number. Your investments can cover your expenses!",
    portfolio_empty: "Add holdings below to see the breakdown.",
    portfolio_note: "Freedom target = yearly expenses ÷ chosen return. Passive income = value × return. Estimates, not advice.",
    nav_income: "Income",
    income_title: "Your income", income_sub: "Add your income. Mark the passive ones, only they count toward freedom.",
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
  },

  tr: {
    nav_home: "Özgürlük", nav_savings: "Gider", nav_settings: "Ayarlar", nav_more: "Daha",
    home_title: "Özgürlük", home_sub: "Giderlerini pasif gelirle karşılamak için ne kadar biriktirmen gerektiğini gör.",
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
    rule_text: 'Yılda yaklaşık <strong>%4</strong> kazanırsan, getirinin tek başına yaşamını karşılaması için kabaca <strong>yıllık giderinin 25 katına</strong> ihtiyacın olur, anaparaya dokunmadan.',
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
    disc_1: "Eğitim amaçlı tahminlerdir, finansal tavsiye değildir. Getiriler tarihsel ya da varsayımdır, garanti edilmez ve tüm oranlar düzenlenebilir.",
    disc_2: "<strong>Geçmiş ≠ gelecek.</strong> Hisse endeksleri (S&P 500, Nasdaq, BIST 100) ve Bitcoin getirileri tarihsel ortalamalardır ve gelecekteki performansı garanti etmez.",
    disc_3: "<strong>Bitcoin son derece oynaktır.</strong> Kripto sert dalgalanabilir; getirisini spekülatif olarak değerlendir.",
    disc_4: "<strong>Kira getirileri değişir.</strong> Kira getirileri şehre ve mülk tipine göre çok farklılaşır; varsayılanlar ulusal ortalamalardır (Global Property Guide) ve tarihseldir, garanti değildir. Kendi rakamın için mülk değeri ve kira alanlarını kullan.",
    disc_5: "<strong>Oranlar varsayılandır.</strong> Her getiri oranı makul bir varsayılanla doldurulmuştur ve tamamen düzenlenebilir, kendi varsayımlarına göre ayarla.",
    cut_title: "Giderlerin", cut_sub: "Aylık harcamaların. Yatırsan ne olabileceğini gör.",
    exp_reminders: "Yaklaşan ödemeler", exp_total: "Bu ayki giderler",
    exp_recurring: "Düzenli giderler", exp_add_recurring: "+ Düzenli gider ekle",
    exp_thismonth: "Bu ayki harcamaların", exp_add: "+ Harcama ekle", exp_history: "Geçmiş aylar",
    exp_cat_ph: "Kategori", exp_day_ph: "Gün", exp_paid: "Ödendi",
    exp_due_fmt: "Ayın {day}'i", exp_empty: "Henüz harcama eklenmedi.",
    exp_overdue: "Gecikmiş", exp_soon: "Yaklaşıyor",
    veh_title: "Araçlarım", veh_add: "+ Araç ekle", veh_model_ph: "Araç modeli",
    veh_reminders: "Ödeme hatırlatmaları", veh_add_reminder: "+ Hatırlatma ekle", veh_label_ph: "Sigorta, vergi…",
    veh_expenses: "Harcamalar", veh_add_expense: "+ Harcama ekle", veh_monthly: "Bu ay",
    vsched: { insurance: "Sigorta", kasko: "Kasko", tax: "Vergi (MTV)", inspection: "Muayene", service: "Bakım" },
    vcat: { fuel: "Yakıt", service: "Bakım", parking: "Otopark", fine: "Ceza", tires: "Lastik", wash: "Yıkama" },
    ecat: { rent: "Kira", bills: "Fatura", market: "Market", food: "Yemek", electric: "Elektrik", water: "Su", internet: "İnternet", transport: "Ulaşım", health: "Sağlık", shopping: "Alışveriş", entertainment: "Eğlence", other: "Diğer" },
    add_custom: "+ Özel kategori ekle", custom_ph: "Özel kategori", eg: "örn.",
    redirect_label: "Bunu her ay yatırıma yönlendirsen", per_mo: "{x} /ay", per_year: "{x} yıllık",
    invested_in: "Şuna yatırılırsa", yr1: "1 yıl", yr5: "5 yıl", yr10: "10 yıl",
    punch: "Bu alışkanlıkları bırakıp yatırım yaparak 10 yılda {x} elde edebilirsin.",
    punch_empty: "Bırakmak istediğin alışkanlıkları aç ve harcamanı yaz; rakamını gör.",
    savings_note: "Projeksiyon yıllık katkıları bileşik hesaplar: GD = yıllık × [((1 + r)ⁿ − 1) / r], r seçilen yıllık getiridir. Getiriler varsayımdır, garanti değildir.",
    settings_title: "Ayarlar", language: "Dil", theme: "Tema", country: "Ülke", sound: "Ses", sound_fx: "Ses efektleri",
    onb_title: "NumBrrr'a hoş geldin", onb_sub: "Başlamak için ülkeni ve dilini seç. Bunları istediğin zaman Ayarlar'dan değiştirebilirsin.",
    onb_country: "Ülke", onb_language: "Dil", onb_start: "Devam",
    guide_title: "Hızlı rehber", guide_intro: "Her sekme ne işe yarıyor:", guide_ok: "Anladım",
    guide_portfolio: "Neyin varsa ekle: hisse, kripto, altın, dolar, nakit. Dağılımını ve aylık nakit akışını görürsün.",
    guide_income: "Aylık gelirlerini gir. Kira, faiz gibi pasif olanları işaretle, çünkü özgürlük hesabına sadece onlar giriyor.",
    guide_expenses: "Bu ayın harcamalarını gir, düzenli faturaların için hatırlatıcı kur, araç masraflarını da ekle.",
    guide_freedom: "Giderlerini sadece pasif gelirinle karşılaman için ne kadar birikim gerektiğini hesaplar (%4 kuralı).",
    guide_watch: "Merak ettiğin varlıkları ara, favorine ekle ve fiyatlarını takip et.",
    theme_glass: "Sıvı Cam", theme_glass_desc: "Modern buzlu cam (varsayılan)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostaljik 2000'ler Luna mavisi",
    theme_medieval: "Ortaçağ", theme_medieval_desc: "Sert 15. yüzyıl parşömen ve demir",
    theme_doge: "Doge", theme_doge_desc: "çok vov · büyük para · efsane meme",
    theme_neon: "Neon", theme_neon_desc: "80'ler neon rüyası · A E S T H E T I C",
    theme_solana: "Solana", theme_solana_desc: "Mor & yeşil · degen modu",
    more_soon: "Yeni özellikler yakında ✨",
    nav_portfolio: "Portföy",
    portfolio_title: "Portföyün", portfolio_sub: "Sahip olduklarını ekle, dağılımını gör.",
    holding_ph: "Varlık adı", add_holding: "+ Varlık ekle", total_value: "Toplam portföy değeri",
    flow_title: "Aylık nakit akışı", flow_income: "Gelir", flow_expenses: "Gider", flow_net: "Aylık net", flow_last_month: "Geçen ay: {x}",
    flow_savings_note: "Takip ettiğin harcamaları kısarsan ayda +{x} daha.",
    cat_cash: "Nakit", cat_investment: "Yatırım",
    asset_stocks: "Hisse", asset_usstock: "ABD Hisse", asset_bist: "Türk Hisse (BIST)", asset_crypto: "Kripto", asset_deposit: "Mevduat", asset_bonds: "Tahvil", asset_realestate: "Gayrimenkul", asset_gold: "Altın", asset_usd: "Dolar (USD)", asset_cash: "Nakit",
    stock_search_ph: "Hisse ara (örn. THY)", shares_ph: "Adet",
    nav_watchlist: "Takip", watch_title: "Takip Listesi", watch_sub: "Varlık ara, favorile ve takip et.",
    watch_search_ph: "Altın, hisse, kripto ara…", watch_empty: "Yukarıdan ara ve takip listene varlık ekle.", watch_chart: "TradingView'de grafiği aç",
    top_perf_title: "Son 1 yılın yıldızları", asset_silver: "Gümüş", top_perf_loading: "Son 1 yıl sıralanıyor…",
    watch_ccy: "Fiyatı dolar / TL göster", watch_chart_full: "TradingView'de tam grafiği aç ↗",
    tr_forex: "Döviz", tr_gold: "Altın (TL)",
    gold_gram: "Gram Altın", gold_quarter: "Çeyrek Altın", gold_half: "Yarım Altın", gold_full: "Tam Altın",
    tr_gold_note: "Sarrafiye değerleri yaklaşıktır (altın içeriği; işçilik primi hariç).",
    lbl_24h: "24s", lbl_1mo: "1A", lbl_1yr: "1Y",
    inc_from_portfolio: "+{x}/ay portföyden",
    net_tax: "Net (stopaj −%15)", coin_search_ph: "Coin ara (örn. Solana)", qty_ph: "Adet", coin_loading: "Canlı fiyatlar yükleniyor…", grams_ph: "Gram", oz_ph: "Ons",
    target_via: "Özgürlük hedefi (bir veya birkaçını seç)", target_x: "Hedef {x}", to_freedom: "finansal özgürlüğe", blended_return: "Karma getiri",
    income_line: "Şu an portföyün ayda yaklaşık {income} üretebilir, giderlerinin {pct} kadarını karşılar.",
    freedom_reached: "🎉 Özgürlük rakamına ulaştın. Yatırımların giderlerini karşılayabilir!",
    portfolio_empty: "Dağılımı görmek için aşağıdan varlık ekle.",
    portfolio_note: "Özgürlük hedefi = yıllık gider ÷ seçilen getiri. Pasif gelir = değer × getiri. Tahmindir, tavsiye değildir.",
    nav_income: "Gelirler",
    income_title: "Gelirlerin", income_sub: "Gelirini ekle. Pasif olanları işaretle; özgürlüğe yalnızca onlar sayılır.",
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
  },
};

// ---- State ----
const state = {
  lang: "en",
  theme: "glass",
  currency: "USD",
  monthlyExpenses: 3000,
  realMode: false,
  sound: true,
  inflation: { USD: 3, TL: 40 },
  rates: {
    USD: Object.fromEntries(INSTRUMENTS.USD.map((i) => [i.id, i.rate])),
    TL: Object.fromEntries(INSTRUMENTS.TL.map((i) => [i.id, i.rate])),
  },
  realEstate: {
    USD: { propertyValue: 0, monthlyRent: 0, netYield: false },
    TL: { propertyValue: 0, monthlyRent: 0, netYield: false },
  },
  // Monthly expense tracker. recurring = fixed monthly bills (also shown as
  // reminders); oneoff = this month's logged spends (reset each month); history
  // = archived past-month totals. month = the month currently being tracked.
  expenses: {
    month: "", recurring: [], oneoff: [], history: [], recSeq: 0, oneSeq: 0,
  },
  // Vehicles: each has a plate, dated payment reminders (sched) and logged
  // expenses (oneoff). Vehicle costs roll into the monthly expense total.
  vehicles: [], vehSeq: 0,
  portfolio: {
    holdings: [], seq: 0,
    target: { USD: [SAVINGS_DEFAULT_INVEST.USD], TL: [SAVINGS_DEFAULT_INVEST.TL] },
  },
  portTotalUSD: false, // when currency is TL, show the total portfolio value in USD instead
  watchlist: [], // [{ type, key, name }] — assets to monitor (price + 24h/1mo/1yr performance)
  income: { amounts: {}, passive: {}, custom: [], seq: 0 },
};
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
function incLabel(id) { return (L().inc && L().inc[id]) || I18N.en.inc[id] || id; }

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
  // expenses (Gider) view
  expMonthLabel: document.getElementById("expMonthLabel"),
  expReminders: document.getElementById("expReminders"),
  expRemTotal: document.getElementById("expRemTotal"),
  expReminderList: document.getElementById("expReminderList"),
  expTotal: document.getElementById("expTotal"),
  expRecList: document.getElementById("expRecList"),
  addRecurring: document.getElementById("addRecurring"),
  expOneList: document.getElementById("expOneList"),
  addExpense: document.getElementById("addExpense"),
  expHistorySec: document.getElementById("expHistorySec"),
  expHistToggle: document.getElementById("expHistToggle"),
  expHistList: document.getElementById("expHistList"),
  vehList: document.getElementById("vehList"),
  addVehicle: document.getElementById("addVehicle"),
  vehSchedList: document.getElementById("vehSchedList"),
  vehCatList: document.getElementById("vehCatList"),
  expCatList: document.getElementById("expCatList"),
  // portfolio view
  portList: document.getElementById("portList"),
  addHolding: document.getElementById("addHolding"),
  portTotal: document.getElementById("portTotal"),
  port24h: document.getElementById("port24h"),
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
  flowLastMonth: document.getElementById("flowLastMonth"),
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
  watchBubblesSec: document.getElementById("watchBubblesSec"),
  watchBubbles: document.getElementById("watchBubbles"),
};

// ---- Helpers ----
function parseNumber(str) {
  if (typeof str !== "string") return Number(str) || 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}
// For decimal inputs (rates, quantities, grams) a comma means the decimal point —
// TR phone keyboards type "5,21". Money fields keep parseNumber (comma = grouping).
function parseDecimal(str) {
  if (typeof str !== "string") return Number(str) || 0;
  let s = str.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const i = s.indexOf(".");
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, ""); // keep only the first dot
  const n = parseFloat(s);
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
// Show a comma as the decimal separator for Turkish (round-trips with parseDecimal).
function locDec(n) { const s = String(n); return state.lang === "tr" ? s.replace(".", ",") : s; }
function formatRate(value, withSign = true) {
  const r = Math.round(value * 100) / 100;
  return withSign ? locDec(r) + "%" : locDec(r);
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
      state.rates[state.currency][input.dataset.id] = parseDecimal(input.value);
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
}

// ============================================================
//  Expenses (Gider) — monthly tracker with reminders + history
// ============================================================
function currentYM(d = new Date()) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function monthLabel(ym) {
  const [y, m] = (ym || currentYM()).split("-").map(Number);
  const locale = state.lang === "tr" ? "tr-TR" : "en-US";
  return new Date(y, m - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
}
function ecatName(c) { return (L().ecat && L().ecat[c]) || (I18N.en.ecat && I18N.en.ecat[c]) || c; }

// Roll over to the current calendar month: archive the previous month's total,
// clear one-off entries, and reset each recurring bill's "paid" flag.
function rollExpenseMonth() {
  const e = state.expenses;
  const now = currentYM();
  if (!e.month) { e.month = now; return; }
  if (e.month === now) return;
  e.history.unshift({ month: e.month, total: expensesTotal() });
  if (e.history.length > 36) e.history.length = 36;
  e.oneoff = [];
  (e.recurring || []).forEach((r) => (r.paid = false));
  (state.vehicles || []).forEach((v) => (v.oneoff = [])); // reset per-vehicle spends too
  e.month = now;
}

// Spent so far this month = PAID recurring bills + this month's logged spends.
// Shown as the Expenses view's "this month" total — an unpaid bill is only an
// upcoming reminder, not yet a real spend.
function expensesTotal() {
  const e = state.expenses;
  let total = 0;
  (e.recurring || []).forEach((r) => { if (r.paid) total += r.amount || 0; });
  (e.oneoff || []).forEach((o) => (total += o.amount || 0));
  return total + vehiclesMonthlyTotal();
}
// Monthly expense level = ALL recurring bills (fixed monthly obligations, paid or
// not) + this month's spends + vehicle costs. Used by the Income freedom check and
// the Portfolio cash flow, so an unpaid rent doesn't make you look "financially free".
function monthlyBurn() {
  const e = state.expenses;
  let total = 0;
  (e.recurring || []).forEach((r) => (total += r.amount || 0));
  (e.oneoff || []).forEach((o) => (total += o.amount || 0));
  return total + vehiclesMonthlyTotal();
}

// A vehicle's spend this month = its logged expenses + scheduled payments paid
// this month. Scheduled (dated) payments are one-time, so they only count in the
// month they were marked paid.
function vehMonthlyTotal(v) {
  let t = 0;
  (v.oneoff || []).forEach((o) => (t += o.amount || 0));
  (v.sched || []).forEach((s) => { if (s.paidMonth && s.paidMonth === state.expenses.month) t += s.amount || 0; });
  return t;
}
function vehiclesMonthlyTotal() { return (state.vehicles || []).reduce((a, v) => a + vehMonthlyTotal(v), 0); }

function buildExpenses() {
  // category suggestions (translated presets; users can still type their own)
  el.expCatList.innerHTML = EXPENSE_CATS.map((c) => `<option value="${ecatName(c).replace(/"/g, "&quot;")}"></option>`).join("");
  el.expRecList.innerHTML = "";
  state.expenses.recurring.forEach((r) => el.expRecList.appendChild(makeRecRow(r)));
  el.expOneList.innerHTML = "";
  state.expenses.oneoff.forEach((o) => el.expOneList.appendChild(makeOneRow(o)));
  buildVehicles();
  refreshExpenses();
}

function makeRecRow(r) {
  const sym = CURRENCY_META[state.currency].symbol;
  const row = document.createElement("div");
  row.className = "cat-row exp-row";
  row.dataset.rec = r.id;
  row.innerHTML = `
    <input class="cat-name exp-cat" list="expCatList" data-rec-cat="${r.id}" value="${(r.cat || "").replace(/"/g, "&quot;")}" placeholder="${t("exp_cat_ph")}" />
    <div class="exp-day"><span class="exp-day-pre">📅</span><input class="exp-dayfield" inputmode="numeric" data-rec-day="${r.id}" value="${r.dueDay || ""}" placeholder="${t("exp_day_ph")}" maxlength="2" /></div>
    <div class="money-input money-input--sm cat-amount"><span class="money-symbol exp-symbol">${sym}</span><input type="text" inputmode="numeric" data-rec-amt="${r.id}" value="${r.amount ? formatThousands(r.amount) : ""}" placeholder="0" /></div>
    <button class="cat-remove" type="button" data-rec-del="${r.id}" aria-label="remove">×</button>`;

  row.querySelector("[data-rec-cat]").addEventListener("input", (e) => { r.cat = e.target.value; refreshExpenses(); });
  const day = row.querySelector("[data-rec-day]");
  day.addEventListener("input", () => { r.dueDay = clampDay(parseNumber(day.value)); refreshExpenses(); });
  const amt = row.querySelector("[data-rec-amt]");
  amt.addEventListener("input", () => { r.amount = parseNumber(amt.value); refreshExpenses(); });
  amt.addEventListener("blur", () => { if (r.amount > 0) amt.value = formatThousands(r.amount); });
  row.querySelector("[data-rec-del]").addEventListener("click", () => {
    state.expenses.recurring = state.expenses.recurring.filter((x) => x.id !== r.id);
    row.remove(); refreshExpenses();
  });
  return row;
}

function makeOneRow(o) {
  const sym = CURRENCY_META[state.currency].symbol;
  const row = document.createElement("div");
  row.className = "cat-row exp-row";
  row.dataset.one = o.id;
  row.innerHTML = `
    <div class="exp-day"><input class="exp-dayfield" inputmode="numeric" data-one-day="${o.id}" value="${o.day || ""}" placeholder="${t("exp_day_ph")}" maxlength="2" /></div>
    <input class="cat-name exp-cat" list="expCatList" data-one-cat="${o.id}" value="${(o.cat || "").replace(/"/g, "&quot;")}" placeholder="${t("exp_cat_ph")}" />
    <div class="money-input money-input--sm cat-amount"><span class="money-symbol exp-symbol">${sym}</span><input type="text" inputmode="numeric" data-one-amt="${o.id}" value="${o.amount ? formatThousands(o.amount) : ""}" placeholder="0" /></div>
    <button class="cat-remove" type="button" data-one-del="${o.id}" aria-label="remove">×</button>`;

  const day = row.querySelector("[data-one-day]");
  day.addEventListener("input", () => { o.day = clampDay(parseNumber(day.value)); refreshExpenses(); });
  row.querySelector("[data-one-cat]").addEventListener("input", (e) => { o.cat = e.target.value; saveState(); });
  const amt = row.querySelector("[data-one-amt]");
  amt.addEventListener("input", () => { o.amount = parseNumber(amt.value); refreshExpenses(); });
  amt.addEventListener("blur", () => { if (o.amount > 0) amt.value = formatThousands(o.amount); });
  row.querySelector("[data-one-del]").addEventListener("click", () => {
    state.expenses.oneoff = state.expenses.oneoff.filter((x) => x.id !== o.id);
    row.remove(); refreshExpenses();
  });
  return row;
}

function clampDay(n) { n = Math.round(n) || 0; return n < 1 ? 0 : n > 31 ? 31 : n; }

function addRecurring() {
  const r = { id: "r" + ++state.expenses.recSeq, cat: "", amount: 0, dueDay: 1, paid: false };
  state.expenses.recurring.push(r);
  const row = makeRecRow(r);
  el.expRecList.appendChild(row);
  row.querySelector("[data-rec-cat]").focus();
  refreshExpenses();
}
function addExpense() {
  const o = { id: "o" + ++state.expenses.oneSeq, day: new Date().getDate(), cat: "", amount: 0 };
  state.expenses.oneoff.push(o);
  const row = makeOneRow(o);
  el.expOneList.appendChild(row);
  row.querySelector("[data-one-cat]").focus();
  refreshExpenses();
}

function refreshExpenses() {
  saveState();
  const sym = CURRENCY_META[state.currency].symbol;
  document.querySelectorAll("#view-savings .exp-symbol").forEach((s) => (s.textContent = sym));
  el.expMonthLabel.textContent = monthLabel(state.expenses.month);
  el.expTotal.textContent = formatMoney(expensesTotal());

  // Reminders: recurring bills + vehicle dated payments, combined into one list.
  const todayDay = new Date().getDate();
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const items = [];
  state.expenses.recurring.forEach((r) => {
    if (!((r.amount || 0) > 0 || r.cat)) return;
    const st = remStatusRec(r, todayDay);
    items.push({ id: "rec|" + r.id, title: r.cat || t("exp_cat_ph"), sub: t("exp_due_fmt", { day: r.dueDay || "—" }), urg: (r.dueDay || 99) - todayDay, amount: r.amount || 0, paid: !!r.paid, cls: st.cls, badge: st.badge });
  });
  (state.vehicles || []).forEach((v) => {
    (v.sched || []).forEach((s) => {
      if (!((s.amount || 0) > 0 || s.label)) return;
      const st = remStatusVeh(s, today0);
      const tag = v.plate ? ` · <span class="exp-rem-tag">${escapeHtml(v.plate)}</span>` : "";
      items.push({ id: "veh|" + v.id + "|" + s.id, title: s.label || t("veh_label_ph"), sub: vehDateLabel(s) + tag, urg: st.urg, amount: s.amount || 0, paid: !!s.paidMonth, cls: st.cls, badge: st.badge });
    });
  });
  el.expReminders.hidden = items.length === 0;
  el.expRemTotal.textContent = formatMoney(items.reduce((a, it) => a + (it.paid ? 0 : it.amount), 0));
  items.sort((a, b) => (a.paid - b.paid) || (a.urg - b.urg));
  el.expReminderList.innerHTML = items.map((it) => `
    <div class="exp-reminder ${it.cls}" data-rem-id="${it.id}">
      <button class="exp-paid" type="button" data-rem-paid="${it.id}" aria-label="${t("exp_paid")}">✓</button>
      <div class="exp-rem-main"><div class="exp-rem-cat">${escapeHtml(it.title)}</div>
        <div class="exp-rem-sub">${it.sub}${it.badge ? ` · <span class="exp-rem-badge">${it.badge}</span>` : ""}</div></div>
      <div class="exp-rem-amt">${formatMoney(it.amount)}</div>
    </div>`).join("");
  el.expReminderList.querySelectorAll("[data-rem-paid]").forEach((b) => b.addEventListener("click", () => toggleReminderPaid(b.dataset.remPaid)));

  // History (archived past months)
  const hist = state.expenses.history || [];
  el.expHistorySec.hidden = hist.length === 0;
  el.expHistList.innerHTML = hist
    .map((h) => `<div class="exp-hist-row"><span>${monthLabel(h.month)}</span><strong>${formatMoney(h.total)}</strong></div>`)
    .join("");

  refreshVehicles();
}

// Reminder status helpers (shared by recurring bills + vehicle dated payments).
function remStatusRec(r, todayDay) {
  if (r.paid) return { cls: "is-paid", badge: "" };
  if (r.dueDay && todayDay > r.dueDay) return { cls: "is-over", badge: t("exp_overdue") };
  if (r.dueDay && r.dueDay - todayDay <= 3) return { cls: "is-soon", badge: t("exp_soon") };
  return { cls: "is-up", badge: "" };
}
function remStatusVeh(s, today0) {
  if (s.paidMonth) return { cls: "is-paid", badge: "", urg: 9999 };
  if (!s.date) return { cls: "is-up", badge: "", urg: 999 };
  const due = new Date(s.date + "T00:00:00");
  if (isNaN(due)) return { cls: "is-up", badge: "", urg: 999 };
  const days = Math.round((due - today0) / 86400000);
  if (days < 0) return { cls: "is-over", badge: t("exp_overdue"), urg: days };
  if (days <= 14) return { cls: "is-soon", badge: t("exp_soon"), urg: days };
  return { cls: "is-up", badge: "", urg: days };
}
function vehDateLabel(s) {
  if (!s.date) return "—";
  const d = new Date(s.date + "T00:00:00");
  if (isNaN(d)) return s.date;
  return d.toLocaleDateString(state.lang === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" });
}
function toggleReminderPaid(id) {
  if (id.indexOf("rec|") === 0) {
    const r = state.expenses.recurring.find((x) => x.id === id.slice(4));
    if (r) r.paid = !r.paid;
  } else if (id.indexOf("veh|") === 0) {
    const p = id.split("|");
    const v = (state.vehicles || []).find((x) => x.id === p[1]);
    const s = v && (v.sched || []).find((x) => x.id === p[2]);
    if (s) s.paidMonth = s.paidMonth ? "" : state.expenses.month;
  }
  refreshExpenses();
}

// ============================================================
//  Vehicles (Araçlarım) — plate, dated payment reminders, expenses
// ============================================================
function vschedName(c) { return (L().vsched && L().vsched[c]) || (I18N.en.vsched && I18N.en.vsched[c]) || c; }
function vcatName(c) { return (L().vcat && L().vcat[c]) || (I18N.en.vcat && I18N.en.vcat[c]) || c; }

function buildVehicles() {
  el.vehSchedList.innerHTML = VEH_SCHED_PRESETS.map((c) => `<option value="${vschedName(c).replace(/"/g, "&quot;")}"></option>`).join("");
  el.vehCatList.innerHTML = VEH_EXP_PRESETS.map((c) => `<option value="${vcatName(c).replace(/"/g, "&quot;")}"></option>`).join("");
  el.vehList.innerHTML = "";
  (state.vehicles || []).forEach((v) => el.vehList.appendChild(makeVehicleCard(v)));
}

function refreshVehicles() {
  (state.vehicles || []).forEach((v) => {
    const card = el.vehList.querySelector(`[data-veh="${v.id}"]`);
    if (!card) return;
    const tEl = card.querySelector("[data-veh-total]");
    if (tEl) tEl.textContent = `${t("veh_monthly")}: ${formatMoney(vehMonthlyTotal(v))}`;
    (v.sched || []).forEach((s) => {
      const row = card.querySelector(`[data-vsched="${s.id}"]`);
      if (row) updateVehSchedStatus(row, s);
    });
  });
}

function makeVehicleCard(v) {
  const card = document.createElement("div");
  card.className = "veh-card";
  card.dataset.veh = v.id;
  card.innerHTML = `
    <div class="veh-head">
      <input class="veh-plate" data-veh-plate value="${(v.plate || "").replace(/"/g, "&quot;")}" placeholder="${t("veh_model_ph")}" />
      <span class="veh-monthly" data-veh-total></span>
      <button class="cat-remove veh-del" type="button" data-veh-del aria-label="remove">×</button>
    </div>
    <div class="veh-sub">
      <div class="veh-sub-head">${t("veh_reminders")}</div>
      <div class="veh-sched-wrap" data-veh-sched-list></div>
      <button class="veh-add-btn" type="button" data-veh-add-sched>${t("veh_add_reminder")}</button>
    </div>
    <div class="veh-sub">
      <div class="veh-sub-head">${t("veh_expenses")}</div>
      <div class="veh-exp-wrap" data-veh-exp-list></div>
      <button class="veh-add-btn" type="button" data-veh-add-exp>${t("veh_add_expense")}</button>
    </div>`;

  card.querySelector("[data-veh-plate]").addEventListener("input", (e) => { v.plate = e.target.value; saveState(); });
  card.querySelector("[data-veh-del]").addEventListener("click", () => {
    state.vehicles = state.vehicles.filter((x) => x.id !== v.id);
    card.remove(); refreshExpenses();
  });

  const sl = card.querySelector("[data-veh-sched-list]");
  (v.sched || []).forEach((s) => sl.appendChild(makeVehSchedRow(v, s)));
  const xl = card.querySelector("[data-veh-exp-list]");
  (v.oneoff || []).forEach((o) => xl.appendChild(makeVehExpRow(v, o)));

  card.querySelector("[data-veh-add-sched]").addEventListener("click", () => {
    const s = { id: "s" + ++v.schedSeq, label: "", amount: 0, date: "", paidMonth: "" };
    v.sched.push(s);
    const row = makeVehSchedRow(v, s); sl.appendChild(row);
    row.querySelector("[data-vs-label]").focus();
    refreshExpenses();
  });
  card.querySelector("[data-veh-add-exp]").addEventListener("click", () => {
    const o = { id: "x" + ++v.expSeq, day: new Date().getDate(), cat: "", amount: 0 };
    v.oneoff.push(o);
    const row = makeVehExpRow(v, o); xl.appendChild(row);
    row.querySelector("[data-vx-cat]").focus();
    refreshExpenses();
  });
  return card;
}

function makeVehSchedRow(v, s) {
  const sym = CURRENCY_META[state.currency].symbol;
  const row = document.createElement("div");
  row.className = "veh-sched-row";
  row.dataset.vsched = s.id;
  row.innerHTML = `
    <button class="exp-paid" type="button" data-vs-paid aria-label="${t("exp_paid")}">✓</button>
    <input class="cat-name veh-sched-label" list="vehSchedList" data-vs-label value="${(s.label || "").replace(/"/g, "&quot;")}" placeholder="${t("veh_label_ph")}" />
    <input type="date" class="veh-date" data-vs-date value="${s.date || ""}" />
    <div class="money-input money-input--sm veh-amt"><span class="money-symbol exp-symbol">${sym}</span><input type="text" inputmode="numeric" data-vs-amt value="${s.amount ? formatThousands(s.amount) : ""}" placeholder="0" /></div>
    <button class="cat-remove" type="button" data-vs-del aria-label="remove">×</button>`;

  row.querySelector("[data-vs-paid]").addEventListener("click", () => { s.paidMonth = s.paidMonth ? "" : state.expenses.month; refreshExpenses(); });
  row.querySelector("[data-vs-label]").addEventListener("input", (e) => { s.label = e.target.value; saveState(); });
  row.querySelector("[data-vs-date]").addEventListener("input", (e) => { s.date = e.target.value; updateVehSchedStatus(row, s); saveState(); });
  const amt = row.querySelector("[data-vs-amt]");
  amt.addEventListener("input", () => { s.amount = parseNumber(amt.value); refreshExpenses(); });
  amt.addEventListener("blur", () => { if (s.amount > 0) amt.value = formatThousands(s.amount); });
  row.querySelector("[data-vs-del]").addEventListener("click", () => { v.sched = v.sched.filter((x) => x.id !== s.id); row.remove(); refreshExpenses(); });
  updateVehSchedStatus(row, s);
  return row;
}

function updateVehSchedStatus(row, s) {
  row.classList.remove("is-paid", "is-over", "is-soon");
  if (s.paidMonth) { row.classList.add("is-paid"); return; }
  if (!s.date) return;
  const due = new Date(s.date + "T00:00:00");
  if (isNaN(due)) return;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.round((due - now) / 86400000);
  if (days < 0) row.classList.add("is-over");
  else if (days <= 14) row.classList.add("is-soon");
}

function makeVehExpRow(v, o) {
  const sym = CURRENCY_META[state.currency].symbol;
  const row = document.createElement("div");
  row.className = "cat-row exp-row";
  row.dataset.vexp = o.id;
  row.innerHTML = `
    <div class="exp-day"><input class="exp-dayfield" inputmode="numeric" data-vx-day value="${o.day || ""}" placeholder="${t("exp_day_ph")}" maxlength="2" /></div>
    <input class="cat-name exp-cat" list="vehCatList" data-vx-cat value="${(o.cat || "").replace(/"/g, "&quot;")}" placeholder="${t("exp_cat_ph")}" />
    <div class="money-input money-input--sm cat-amount"><span class="money-symbol exp-symbol">${sym}</span><input type="text" inputmode="numeric" data-vx-amt value="${o.amount ? formatThousands(o.amount) : ""}" placeholder="0" /></div>
    <button class="cat-remove" type="button" data-vx-del aria-label="remove">×</button>`;

  const day = row.querySelector("[data-vx-day]");
  day.addEventListener("input", () => { o.day = clampDay(parseNumber(day.value)); saveState(); });
  row.querySelector("[data-vx-cat]").addEventListener("input", (e) => { o.cat = e.target.value; saveState(); });
  const amt = row.querySelector("[data-vx-amt]");
  amt.addEventListener("input", () => { o.amount = parseNumber(amt.value); refreshExpenses(); });
  amt.addEventListener("blur", () => { if (o.amount > 0) amt.value = formatThousands(o.amount); });
  row.querySelector("[data-vx-del]").addEventListener("click", () => { v.oneoff = v.oneoff.filter((x) => x.id !== o.id); row.remove(); refreshExpenses(); });
  return row;
}

function addVehicle() {
  const v = { id: "v" + ++state.vehSeq, plate: "", sched: [], oneoff: [], schedSeq: 0, expSeq: 0 };
  state.vehicles.push(v);
  const card = makeVehicleCard(v);
  el.vehList.appendChild(card);
  card.querySelector("[data-veh-plate]").focus();
  refreshExpenses();
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
  if (x.nativePrice && x.shares) node.textContent = formatMoney(stockValue(x));
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
        getStockPrice(ys).then((q) => {
          const y = holdById(id);
          if (!y || y.symbol !== item.s) return;
          if (q && q.price != null) { y.nativePrice = q.price; y.chg24 = q.chg24; }
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
    x.shares = parseDecimal(sh.value);
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
function fmtQty(n) { return locDec(Math.round(n * 10000) / 10000); }
function updateGoldValue(row, id) {
  const x = holdById(id);
  const node = row.querySelector("[data-gold-value]");
  if (!node || !x) return;
  const perGram = goldPriceGram || x.price || 0; // app-currency price per gram (fallback to last saved)
  const qty = x.grams ? x.grams / goldFactor() : 0;
  if (perGram && qty) node.textContent = formatMoney(x.grams * perGram);
  else if (x.grams && x.value) node.textContent = formatMoney(x.value);
  else node.textContent = "";
}
// USD held as an investment: the dollar amount is canonical; its app-currency
// value is the live TL conversion (or 1:1 if the app is in USD).
function usdHoldingValue(usd) { return state.currency === "TL" ? (usd || 0) * (usdTry || 0) : (usd || 0); }
function updateUsdValue(row, id) {
  const x = holdById(id);
  const node = row.querySelector("[data-usd-value]");
  if (!node || !x) return;
  const usd = x.usd || 0;
  if (usd && state.currency === "TL" && usdTry) {
    node.textContent = formatMoney(usd * usdTry);
  } else if (usd) {
    node.textContent = formatMoney(x.value || usd);
  } else {
    node.textContent = "";
  }
}
function updateCryptoValue(row, id) {
  const x = holdById(id);
  const node = row.querySelector("[data-coin-value]");
  if (!node || !x) return;
  if (x.price && x.qty) node.textContent = formatMoney(x.value);
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
        x.coinId = c.id; x.coinName = c.name; x.coinSymbol = c.symbol; x.price = c.price; x.label = c.name; x.chg24 = c.chg24;
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
    x.qty = parseDecimal(qty.value);
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
  // "usd" (holding dollars as an investment) is only offered while the app is in
  // TL; in USD mode it would just be cash. Keep it visible if already selected.
  const options = ASSET_TYPES
    .filter((tp) => tp !== "usd" || state.currency === "TL" || tp === at)
    .map((tp) => `<option value="${tp}" ${tp === at ? "selected" : ""}>${t("asset_" + tp)}</option>`).join("");
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
        <input class="qty-field" type="text" inputmode="decimal" data-stock-shares="${id}" value="${h.shares ? fmtQty(h.shares) : ""}" placeholder="${t("shares_ph")}" />
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
        <input class="qty-field" type="text" inputmode="decimal" data-coin-qty="${id}" value="${h.qty ? fmtQty(h.qty) : ""}" placeholder="${t("qty_ph")}" />
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
      x.grams = parseDecimal(g.value) * goldFactor(); // store canonical grams
      const p = goldPriceGram || x.price || 0;
      x.price = p;
      x.value = (x.grams || 0) * p;
      updateGoldValue(row, id);
      refreshPortfolio();
      refreshIncome();
    });
    updateGoldValue(row, id);
  } else if (at === "usd") {
    const safeLabel = h.label ? h.label.replace(/"/g, "&quot;") : "";
    row.innerHTML = `
      <div class="port-namecell">
        <input class="cat-name port-name" data-hold-name="${id}" value="${safeLabel}" placeholder="${t("asset_usd")}" />
        ${typeSelect}
      </div>
      <div class="crypto-cell">
        <div class="money-input money-input--sm usd-input"><span class="money-symbol">$</span><input type="text" inputmode="numeric" data-usd-amt="${id}" value="${h.usd ? formatThousands(h.usd) : ""}" placeholder="0" /></div>
        <div class="crypto-value" data-usd-value="${id}"></div>
      </div>
      <button class="cat-remove" type="button" data-hold-del="${id}" aria-label="remove">×</button>`;
    wireTypeSelect(row, id);
    wireRemove(row, id);
    row.querySelector("[data-hold-name]").addEventListener("input", (e) => { const x = holdById(id); if (x) x.label = e.target.value; saveState(); });
    const u = row.querySelector("[data-usd-amt]");
    u.addEventListener("input", () => {
      const x = holdById(id);
      x.usd = parseNumber(u.value);
      x.value = usdHoldingValue(x.usd);
      updateUsdValue(row, id);
      refreshPortfolio();
      refreshIncome();
    });
    u.addEventListener("blur", () => { const x = holdById(id); if (x && x.usd > 0) u.value = formatThousands(x.usd); });
    updateUsdValue(row, id);
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
  const key = "numbr_crypto3_" + vs;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { cryptoMarkets = c.data; return; } } catch (e) {}
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`);
    if (!res.ok) return;
    const json = await res.json();
    cryptoMarkets = json.map((c) => ({ id: c.id, symbol: (c.symbol || "").toUpperCase(), name: c.name, price: c.current_price, chg24: c.price_change_percentage_24h_in_currency }));
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: cryptoMarkets })); } catch (e) {}
  } catch (e) { /* offline / local file:// — silently ignore, works once deployed */ }
}
// Live gold price (per gram) via PAX Gold (1 PAXG ≈ 1 troy oz), client-side, daily-cached.
async function loadGoldPrice() {
  const vs = state.currency === "TL" ? "try" : "usd";
  const key = "numbr_gold2_" + vs;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { goldPriceGram = c.v; goldChg24 = c.chg; return; } } catch (e) {}
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=${vs}&include_24hr_change=true`);
    if (!res.ok) return;
    const j = await res.json();
    const g = j["pax-gold"];
    const oz = g && g[vs];
    if (oz) {
      goldPriceGram = oz / GRAMS_PER_OZ;
      goldChg24 = (g && typeof g[vs + "_24h_change"] === "number") ? g[vs + "_24h_change"] : null;
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: goldPriceGram, chg: goldChg24 })); } catch (e) {}
    }
  } catch (e) { /* offline / local — works once deployed */ }
}
// Live stock price via Yahoo Finance (through a CORS proxy; works on the deployed site).
// Returns { price, chg24 } (chg24 may be null) or null on failure.
async function fetchYahoo(symbol) {
  // 1) Same-origin serverless function — reliable on the deployed (Vercel) site.
  try {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
    if (r.ok) { const j = await r.json(); if (typeof j.price === "number") return { price: j.price, chg24: typeof j.chg24 === "number" ? j.chg24 : null }; }
  } catch (e) { /* not deployed / local — fall back to public proxies */ }
  // 2) Public CORS proxies (fallback, mainly for local preview).
  const y = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const proxies = [`https://api.allorigins.win/raw?url=${encodeURIComponent(y)}`, `https://corsproxy.io/?url=${encodeURIComponent(y)}`];
  for (const url of proxies) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const j = await res.json();
      const parsed = parseYahooChart(j);
      if (parsed && parsed.price != null) return { price: parsed.price, chg24: typeof parsed.chg24 === "number" ? parsed.chg24 : null };
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
// Returns { price, chg24 } (chg24 may be null) or null.
async function getStockPrice(yahooSymbol) {
  const key = "numbr_stk2_" + yahooSymbol;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) return { price: c.price, chg24: c.chg24 }; } catch (e) {}
  const v = await fetchYahoo(yahooSymbol);
  if (v && v.price != null) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), price: v.price, chg24: v.chg24 })); } catch (e) {} return v; }
  return null;
}
async function loadUsdTry() {
  const key = "numbr_usdtry2";
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) { usdTry = c.v; usdTryChg24 = c.chg; return; } } catch (e) {}
  const v = await fetchYahoo("TRY=X");
  if (v && v.price) { usdTry = v.price; usdTryChg24 = v.chg24; try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: usdTry, chg: usdTryChg24 })); } catch (e) {} }
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
      if (m) { h.price = m.price; h.value = (h.qty || 0) * m.price; h.chg24 = m.chg24; }
    } else if (h.assetType === "gold" && goldPriceGram > 0) {
      h.price = goldPriceGram;
      h.value = (h.grams || 0) * goldPriceGram;
      h.chg24 = goldChg24;
    } else if (h.assetType === "usd") {
      h.value = usdHoldingValue(h.usd || 0);
      // In TL the $ holding moves with USD/TRY; in USD mode it's just cash (flat).
      h.chg24 = state.currency === "TL" ? usdTryChg24 : 0;
    } else if ((h.assetType === "usstock" || h.assetType === "bist") && h.symbol) {
      const ys = h.assetType === "bist" ? h.symbol + ".IS" : h.symbol;
      const q = await getStockPrice(ys);
      if (q && q.price != null) { h.nativePrice = q.price; h.chg24 = q.chg24; }
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

// 24h portfolio move: sum the last-24h delta of holdings that have a known % move
// (crypto/gold/stocks/USD). Cash, deposits and bonds are flat, so they add 0.
// Shown small next to the total. Hidden when no priced asset has 24h data.
function renderPort24h(totalNative) {
  if (!el.port24h) return;
  let abs = 0; // 24h change in the app's native currency
  let hasData = false;
  for (const h of state.portfolio.holdings) {
    const c = h.chg24;
    if (typeof c === "number" && isFinite(c) && c > -100 && h.value) {
      abs += h.value - h.value / (1 + c / 100);
      hasData = true;
    }
  }
  if (!hasData || totalNative <= 0) { el.port24h.hidden = true; el.port24h.textContent = ""; return; }
  const prev = totalNative - abs;
  const pct = prev > 0 ? (abs / prev) * 100 : 0;
  const up = abs >= 0;
  const showUSD = state.currency === "TL" && state.portTotalUSD && usdTry > 0;
  const money = Math.abs(showUSD ? abs / usdTry : abs);
  const sign = up ? "+" : "−";
  const moneyTxt = showUSD ? formatMoneyCcy(money, "USD") : formatMoney(money);
  el.port24h.hidden = false;
  el.port24h.className = "port-24h " + (up ? "is-pos" : "is-neg");
  el.port24h.innerHTML = `${sign}${Math.abs(pct).toFixed(1)}% <span class="port-24h-amt">${sign}${moneyTxt}</span> <span class="port-24h-lbl">${t("lbl_24h")}</span>`;
}

function refreshPortfolio() {
  saveState();
  const meta = CURRENCY_META[state.currency];
  document.querySelectorAll("#view-portfolio .savings-symbol").forEach((s) => (s.textContent = meta.symbol));

  // --- Monthly cash flow (Income incl. portfolio yield − Expenses) ---
  const py = portfolioYield();
  const income = incomeManualTotal() + py.interest + py.rental;
  // Monthly burn (all recurring + this month + vehicles), not just what's paid yet.
  const exp = monthlyBurn();
  const net = income - exp;
  el.flowIncome.textContent = formatMoney(income);
  el.flowExpenses.textContent = "−" + formatMoney(exp);
  // last month's total expense (from the Expenses history), shown as a small note
  const lastMonth = (state.expenses.history || [])[0];
  el.flowLastMonth.hidden = !lastMonth;
  if (lastMonth) el.flowLastMonth.textContent = t("flow_last_month", { x: formatMoney(lastMonth.total) });
  el.flowNet.textContent = formatMoney(net);
  el.flowNetRow.classList.toggle("is-pos", net >= 0);
  el.flowNetRow.classList.toggle("is-neg", net < 0);
  el.flowSavings.textContent = "";

  // --- Holdings total + donut (categorized Cash / Investment) ---
  const total = state.portfolio.holdings.reduce((sum, h) => sum + (h.value || 0), 0);
  renderPortTotal(total);
  renderPort24h(total);

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
  // Use the full monthly burn so unpaid recurring bills still count toward freedom.
  const exp = monthlyBurn();

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
// The currency a row's price is shown in (native by type), optionally flipped by
// the per-row toggle (TR users only).
function watchNativeCcy(w) {
  if (w.type === "usstock") return "USD";
  if (w.type === "bist") return "TRY";
  return state.currency === "TL" ? "TRY" : "USD"; // gold, crypto follow the app
}
// The per-row toggle only applies for TR users (the feature is TL-only).
function watchFlipped(w) { return !!w.altCcy && state.currency === "TL"; }
function watchDisplayCcy(w) {
  const native = watchNativeCcy(w);
  return watchFlipped(w) ? (native === "USD" ? "TRY" : "USD") : native;
}
function watchPriceLabel(w) {
  const d = watchData[w.key];
  if (!d || d.price == null) return "…";
  const suffix = w.type === "gold" ? "/" + goldUnit() : "";
  let value = w.type === "gold" ? d.price * goldFactor() : d.price;
  const native = watchNativeCcy(w);
  let ccy = native;
  if (watchFlipped(w) && usdTry > 0) {
    if (native === "USD") { value *= usdTry; ccy = "TRY"; }
    else { value /= usdTry; ccy = "USD"; }
  }
  return (ccy === "TRY" ? "₺" : "$") + fmtPrice(value) + suffix;
}
// Map a watchlist item to a TradingView symbol and open its chart in a new tab.
function tradingViewSymbol(w) {
  const sym = (w.sym || w.key || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (w.type === "gold") return "TVC:GOLD";
  if (w.type === "silver") return "TVC:SILVER";
  if (w.type === "index") return "TVC:" + sym; // TVC:SPX / TVC:NDX / TVC:DJI
  if (w.type === "crypto") return "BINANCE:" + sym + "USDT";
  if (w.type === "bist") return "BIST:" + sym;
  return sym; // US stocks: TradingView resolves the bare ticker
}
// Open the chart inside the app as a popup with an embedded TradingView widget,
// instead of leaving the site for a new tab.
function openTradingView(w) {
  const s = tradingViewSymbol(w);
  if (!s) return;
  const modal = document.getElementById("tvModal");
  const frame = document.getElementById("tvFrame");
  const fullUrl = "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(s);
  // The free embedded widget has no Borsa İstanbul data (it errors out and falls
  // back to a default chart), so BIST symbols open on TradingView in a new tab.
  if (!modal || !frame || w.type === "bist") {
    window.open(fullUrl, "_blank", "noopener,noreferrer");
    return;
  }
  const dark = !["xp", "doge", "medieval"].includes(state.theme);
  const locale = state.lang === "tr" ? "tr" : "en";
  frame.src = "https://s.tradingview.com/widgetembed/?frameElementId=tvFrame&symbol=" +
    encodeURIComponent(s) + "&interval=D&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=rgba(0,0,0,0)" +
    "&studies=[]&theme=" + (dark ? "dark" : "light") + "&style=1&timezone=Etc/UTC&withdateranges=1&hideideas=1&locale=" + locale;
  const title = document.getElementById("tvTitle");
  const sym = w.sym ? String(w.sym).toUpperCase() : "";
  if (title) title.textContent = [w.name, sym].filter(Boolean).join(" · ");
  const openLink = document.getElementById("tvOpen");
  if (openLink) openLink.href = fullUrl;
  modal.hidden = false;
}
function closeChartModal() {
  const modal = document.getElementById("tvModal");
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  const frame = document.getElementById("tvFrame");
  if (frame) frame.src = "about:blank"; // stop the embedded chart when closed
}
// ---- Crypto bubbles: floating, draggable physics field ----
// One circle per watched asset, sized by 24h-move magnitude, colored by direction.
// Bubbles drift, collide, bounce off the walls, and can be dragged/flung.
const bubbleSim = { raf: 0, bubbles: [], drag: null };
function clampN(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Radius is proportional to how big the 24h move is relative to the biggest
// mover currently in the list, so the largest gainer/loser is the largest
// bubble and the smallest move is the smallest, with a clear spread.
const BUBBLE_MIN_R = 26, BUBBLE_MAX_R = 52;
function bubbleRadius(ch, maxMag) {
  const mag = ch == null ? 0 : Math.abs(ch);
  const frac = maxMag > 0 ? Math.min(mag / maxMag, 1) : 0.35;
  return Math.round(BUBBLE_MIN_R + frac * (BUBBLE_MAX_R - BUBBLE_MIN_R));
}
function paintBubble(b) {
  const cls = b.ch == null ? "flat" : b.ch >= 0 ? "up" : "down";
  b.node.className = "bubble " + cls + (bubbleSim.drag === b ? " is-drag" : "");
  b.node.style.width = b.node.style.height = b.r * 2 + "px";
  b.node.style.setProperty("--fs", Math.max(10, Math.round(b.r * 0.32)) + "px");
  const chTxt = b.ch == null ? "—" : (b.ch >= 0 ? "+" : "") + b.ch.toFixed(1) + "%";
  b.node.innerHTML = `<span class="bubble-sym">${escapeHtml(b.sym)}</span><span class="bubble-chg">${chTxt}</span>`;
  b.node.title = b.name;
}
function syncBubbles() {
  if (!el.watchBubbles) return;
  el.watchBubblesSec.hidden = !state.watchlist.length;
  if (!state.watchlist.length) { stopBubbles(); el.watchBubbles.innerHTML = ""; bubbleSim.bubbles = []; return; }
  // Biggest absolute 24h move in the current set → drives proportional sizing.
  const maxMag = state.watchlist.reduce((m, w) => {
    const c = (watchData[w.key] || {}).chg24;
    return (typeof c === "number" && !isNaN(c)) ? Math.max(m, Math.abs(c)) : m;
  }, 0);
  const existing = new Map(bubbleSim.bubbles.map((b) => [b.key, b]));
  const keep = [];
  state.watchlist.forEach((w) => {
    const d = watchData[w.key] || {};
    const ch = (typeof d.chg24 === "number" && !isNaN(d.chg24)) ? d.chg24 : null;
    let b = existing.get(w.key);
    if (!b) {
      b = { key: w.key, node: document.createElement("div"), x: 0, y: 0, vx: 0, vy: 0, place: true };
      b.node.addEventListener("pointerdown", (e) => startBubbleDrag(b, e));
      el.watchBubbles.appendChild(b.node);
    }
    existing.delete(w.key);
    b.name = w.name; b.sym = (w.sym || w.name || "").toUpperCase().slice(0, 5); b.ch = ch; b.r = bubbleRadius(ch, maxMag);
    paintBubble(b);
    keep.push(b);
  });
  existing.forEach((b) => b.node.remove());
  bubbleSim.bubbles = keep;
  kickBubbles();
}
// Place any new bubbles, un-overlap them, give them a gentle initial drift, then
// run the damped physics loop (motion fades to rest). Bubbles also move when
// dragged/flung and collide with each other; friction brings everything to a stop.
function kickBubbles() {
  const host = el.watchBubbles;
  if (!host || host.offsetParent === null) return;
  const W = host.clientWidth, H = host.clientHeight;
  if (!W || !H) return;
  let placedNew = false;
  for (const b of bubbleSim.bubbles) {
    if (b.place) {
      b.x = b.r + Math.random() * Math.max(1, W - 2 * b.r);
      b.y = b.r + Math.random() * Math.max(1, H - 2 * b.r);
      b.place = false; placedNew = true;
    }
  }
  for (const b of bubbleSim.bubbles) { b.x = clampN(b.x, b.r, W - b.r); b.y = clampN(b.y, b.r, H - b.r); }
  if (placedNew) {
    relaxBubbles(W, H);                 // pack without overlap on first appearance
    for (const b of bubbleSim.bubbles) { // start a gentle drift
      const a = Math.random() * 6.283, s = 0.4 + Math.random() * 0.5;
      b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s;
    }
  }
  renderBubbles();
  startBubbles();
}
function renderBubbles() {
  for (const b of bubbleSim.bubbles) b.node.style.transform = `translate(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px)`;
}
// One-time synchronous un-overlap pass (used for the initial layout).
function relaxBubbles(W, H) {
  const bs = bubbleSim.bubbles;
  for (let it = 0; it < 140; it++) {
    for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
      const a = bs[i], c = bs[j];
      let dx = c.x - a.x, dy = c.y - a.y, dist = Math.hypot(dx, dy) || 0.01, sep = a.r + c.r + 2 - dist;
      if (sep <= 0) continue;
      const nx = dx / dist, ny = dy / dist;
      a.x -= nx * sep / 2; a.y -= ny * sep / 2; c.x += nx * sep / 2; c.y += ny * sep / 2;
    }
    for (const b of bs) { b.x = clampN(b.x, b.r, W - b.r); b.y = clampN(b.y, b.r, H - b.r); }
  }
}
// Physics step: gentle perpetual drift (each bubble keeps a small ambient speed
// so it never looks frozen), light friction, wall bounce, and collisions that
// transfer momentum. A fling decays back down to the ambient drift. Never sleeps.
function stepBubbles() {
  bubbleSim.raf = requestAnimationFrame(stepBubbles);
  const host = el.watchBubbles;
  if (!host || host.offsetParent === null || !host.clientWidth || !host.clientHeight) return; // hidden → idle
  const W = host.clientWidth, H = host.clientHeight, bs = bubbleSim.bubbles;
  for (const b of bs) {
    if (bubbleSim.drag === b) continue;
    b.x += b.vx; b.y += b.vy;
    b.vx *= 0.992; b.vy *= 0.992; // very light friction
    const sp = Math.hypot(b.vx, b.vy);
    if (sp < 0.22) { const a = Math.random() * 6.283; b.vx += Math.cos(a) * 0.1; b.vy += Math.sin(a) * 0.1; } // keep a gentle drift alive
    else if (sp > 6) { b.vx *= 6 / sp; b.vy *= 6 / sp; } // cap fling speed
    if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.85 || 0.25; } else if (b.x > W - b.r) { b.x = W - b.r; b.vx = -(Math.abs(b.vx) * 0.85 || 0.25); }
    if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.85 || 0.25; } else if (b.y > H - b.r) { b.y = H - b.r; b.vy = -(Math.abs(b.vy) * 0.85 || 0.25); }
  }
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) {
    const a = bs[i], c = bs[j];
    let dx = c.x - a.x, dy = c.y - a.y, dist = Math.hypot(dx, dy) || 0.01, min = a.r + c.r;
    if (dist < min) {
      const nx = dx / dist, ny = dy / dist, ov = min - dist;
      const aF = bubbleSim.drag === a, cF = bubbleSim.drag === c;
      if (aF) { c.x += nx * ov; c.y += ny * ov; }
      else if (cF) { a.x -= nx * ov; a.y -= ny * ov; }
      else { a.x -= nx * ov / 2; a.y -= ny * ov / 2; c.x += nx * ov / 2; c.y += ny * ov / 2; }
      const diff = (c.vx * nx + c.vy * ny) - (a.vx * nx + a.vy * ny); // momentum transfer
      if (!aF) { a.vx += diff * nx; a.vy += diff * ny; }
      if (!cF) { c.vx -= diff * nx; c.vy -= diff * ny; }
    }
  }
  for (const b of bs) {
    if (bubbleSim.drag !== b) { b.x = clampN(b.x, b.r, W - b.r); b.y = clampN(b.y, b.r, H - b.r); }
    b.node.style.transform = `translate(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px)`;
  }
}
function startBubbles() { if (!bubbleSim.raf) bubbleSim.raf = requestAnimationFrame(stepBubbles); }
function stopBubbles() { if (bubbleSim.raf) { cancelAnimationFrame(bubbleSim.raf); bubbleSim.raf = 0; } }
function startBubbleDrag(b, e) {
  e.preventDefault();
  const rect = el.watchBubbles.getBoundingClientRect();
  bubbleSim.drag = b;
  b.vx = 0; b.vy = 0;
  b.node.classList.add("is-drag");
  if (b.node.setPointerCapture) try { b.node.setPointerCapture(e.pointerId); } catch (err) {}
  startBubbles(); // run physics so other bubbles get shoved while dragging
  let lx = e.clientX, ly = e.clientY, fvx = 0, fvy = 0;
  const move = (ev) => {
    fvx = ev.clientX - lx; fvy = ev.clientY - ly; lx = ev.clientX; ly = ev.clientY;
    b.x = clampN(ev.clientX - rect.left, b.r, rect.width - b.r);
    b.y = clampN(ev.clientY - rect.top, b.r, rect.height - b.r);
    b.node.style.transform = `translate(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px)`;
  };
  const up = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    b.node.classList.remove("is-drag");
    b.vx = clampN(fvx, -30, 30) * 0.7; b.vy = clampN(fvy, -30, 30) * 0.7; // fling it
    bubbleSim.drag = null;
    startBubbles();
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
}

function buildWatchlist() {
  if (el.watchSearch) el.watchSearch.placeholder = t("watch_search_ph");
  syncBubbles();
  if (!state.watchlist.length) { el.watchList.innerHTML = ""; el.watchEmpty.hidden = false; return; }
  el.watchEmpty.hidden = true;
  const showCcyToggle = state.currency === "TL";
  el.watchList.innerHTML = state.watchlist.map((w) => {
    const d = watchData[w.key] || {};
    const toSym = watchDisplayCcy(w) === "TRY" ? "$" : "₺"; // switch-to currency
    const ccyBtn = showCcyToggle
      ? `<button class="watch-ccy" type="button" data-wccy="${w.type}|${w.key}" aria-label="${t("watch_ccy")}" title="${t("watch_ccy")}">${toSym}</button>`
      : "";
    return `<div class="watch-row" data-wkey="${w.type}|${w.key}">
      <button class="watch-grip" type="button" data-wgrip aria-label="reorder">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="5" cy="3" r="1.3"/><circle cx="11" cy="3" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="5" cy="13" r="1.3"/><circle cx="11" cy="13" r="1.3"/></svg>
      </button>
      <div class="watch-body">
        <div class="watch-top">
          <div class="watch-name">${escapeHtml(w.name)} <small>${escapeHtml((w.sym || "").toUpperCase())}</small></div>
          <div class="watch-price">${watchPriceLabel(w)}</div>
        </div>
        <div class="watch-perf">
          ${chgHtml(t("lbl_24h"), d.chg24)}${chgHtml(t("lbl_1mo"), d.chg1mo)}${chgHtml(t("lbl_1yr"), d.chg1y)}
          <div class="watch-actions">
            ${ccyBtn}
            <button class="watch-chart" type="button" data-wchart="${w.type}|${w.key}" aria-label="${t("watch_chart")}" title="${t("watch_chart")}">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16l3.5-4 3 3L20 8"/></svg>
            </button>
            <button class="watch-del" type="button" data-wdel="${w.type}|${w.key}" aria-label="remove">×</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join("");
  el.watchList.querySelectorAll("[data-wdel]").forEach((b) => b.addEventListener("click", () => {
    const idx = b.dataset.wdel.indexOf("|");
    removeWatch(b.dataset.wdel.slice(0, idx), b.dataset.wdel.slice(idx + 1));
  }));
  el.watchList.querySelectorAll("[data-wchart]").forEach((b) => b.addEventListener("click", () => {
    const idx = b.dataset.wchart.indexOf("|");
    const type = b.dataset.wchart.slice(0, idx), key = b.dataset.wchart.slice(idx + 1);
    const w = state.watchlist.find((x) => x.type === type && x.key === key);
    if (w) openTradingView(w);
  }));
  el.watchList.querySelectorAll("[data-wccy]").forEach((b) => b.addEventListener("click", () => {
    const idx = b.dataset.wccy.indexOf("|");
    const type = b.dataset.wccy.slice(0, idx), key = b.dataset.wccy.slice(idx + 1);
    const w = state.watchlist.find((x) => x.type === type && x.key === key);
    if (w) { w.altCcy = !w.altCcy; saveState(); buildWatchlist(); }
  }));
  el.watchList.querySelectorAll("[data-wgrip]").forEach((g) => g.addEventListener("pointerdown", startWatchReorder));
}
// Drag-to-reorder the watchlist via each row's grip handle (touch + mouse).
function startWatchReorder(e) {
  e.preventDefault();
  const list = el.watchList;
  const grip = e.currentTarget;
  const row = grip.closest(".watch-row");
  if (!row) return;
  row.classList.add("wl-dragging");
  if (grip.setPointerCapture) try { grip.setPointerCapture(e.pointerId); } catch (err) {}
  const move = (ev) => {
    const others = [...list.querySelectorAll(".watch-row:not(.wl-dragging)")];
    let before = null;
    for (const r of others) {
      const rect = r.getBoundingClientRect();
      if (ev.clientY < rect.top + rect.height / 2) { before = r; break; }
    }
    if (before) list.insertBefore(row, before); else list.appendChild(row);
  };
  const up = () => {
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
    row.classList.remove("wl-dragging");
    const order = [...list.querySelectorAll(".watch-row")].map((r) => r.dataset.wkey);
    state.watchlist.sort((a, b) => order.indexOf(a.type + "|" + a.key) - order.indexOf(b.type + "|" + b.key));
    saveState();
  };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
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

// ---- Best 1-year performers (fixed pool: top-10 crypto, top-10 US stocks, gold,
// silver, and the BIST 30 when on TL). Ranked by 1y return, best 15 shown. ----
let topPerfData = null;      // ranked list currently shown
let topPerfBuiltFor = null;  // currency it was built for (rebuild on change)
async function getStock1y(ysym) {
  const key = "numbr_p1y_" + ysym;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) return c.d; } catch (e) {}
  const d = await fetchStockData(ysym);
  if (d && d.price != null) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {} return d; }
  return null;
}
// Stablecoins (~0% return) and wrapped/staked tokens (near-duplicates of BTC/ETH)
// are excluded from the leaderboard so they don't crowd out real performers.
const TOP_PERF_SKIP = new Set([
  "USDT", "USDC", "DAI", "BUSD", "TUSD", "USDD", "FDUSD", "PYUSD", "USDE", "USDS",
  "USD1", "GUSD", "FRAX", "LUSD", "USDP", "EURT", "EURS", "RLUSD", "USDG", "USDTB",
  "BUIDL", "AEUR", "EURC", "USDX", "CRVUSD",
  "WBTC", "WETH", "STETH", "WSTETH", "WEETH", "WBETH", "CBBTC", "RETH", "LBTC",
  "SOLVBTC", "BNSOL", "JITOSOL", "METH", "RSETH", "EZETH", "CBETH",
]);
async function getTopCrypto1y() {
  const key = "numbr_topcrypto1y2";
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 24 * 3600 * 1000) return c.data; } catch (e) {}
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=40&page=1&price_change_percentage=1y");
    if (r.ok) {
      const data = (await r.json())
        .filter((c) => !TOP_PERF_SKIP.has((c.symbol || "").toUpperCase()))
        .slice(0, 25)
        .map((c) => ({ type: "crypto", key: c.id, sym: (c.symbol || "").toUpperCase(), name: c.name, price: c.current_price, ccy: "USD", chg1y: c.price_change_percentage_1y_in_currency }));
      try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), data })); } catch (e) {}
      return data;
    }
  } catch (e) {}
  return [];
}
function rankTopPerf(candidates) {
  return candidates
    .filter((c) => typeof c.chg1y === "number" && isFinite(c.chg1y))
    .sort((a, b) => b.chg1y - a.chg1y)
    .slice(0, 15);
}
async function buildTopPerformers() {
  const listEl = document.getElementById("topPerfList");
  if (!listEl) return;
  if (topPerfData && topPerfBuiltFor === state.currency) { renderTopPerformers(); return; }
  if (topPerfBuiltFor !== state.currency || !listEl.children.length) listEl.innerHTML = `<div class="top-perf-msg">${t("top_perf_loading")}</div>`;
  const built = state.currency; // guard against currency changing mid-fetch
  topPerfBuiltFor = built;
  const isTL = built === "TL";

  // Gather every source, then render once. Showing the crypto-only batch first
  // made the list look all-crypto while the stocks/metals were still loading.
  const candidates = [];
  (await getTopCrypto1y()).forEach((c) => candidates.push(c));
  if (topPerfBuiltFor !== built) return;

  const jobs = [];
  // Curated megacaps plus a few notable high-momentum names for the US pool.
  const usPool = US_STOCKS.slice(0, 18).map((s) => s.s);
  ["AVGO", "LLY", "UBER", "COIN", "PLTR", "MSTR", "HOOD", "AMD", "NFLX", "CRWD"]
    .forEach((s) => { if (!usPool.includes(s)) usPool.push(s); });
  const usName = {}; US_STOCKS.forEach((s) => (usName[s.s] = s.n));
  usPool.forEach((s) => jobs.push({ type: "usstock", key: s, sym: s, name: usName[s] || s, ysym: s, ccy: "USD" }));
  // Major US indices.
  jobs.push({ type: "index", key: "spx", sym: "SPX", name: "S&P 500", ysym: "^GSPC", ccy: "USD" });
  jobs.push({ type: "index", key: "ndx", sym: "NDX", name: "Nasdaq 100", ysym: "^NDX", ccy: "USD" });
  jobs.push({ type: "index", key: "dji", sym: "DJI", name: "Dow Jones", ysym: "^DJI", ccy: "USD" });
  jobs.push({ type: "gold", key: "gold", sym: "XAU", name: t("asset_gold"), ysym: "GC=F", ccy: "USD" });
  jobs.push({ type: "silver", key: "silver", sym: "XAG", name: t("asset_silver"), ysym: "SI=F", ccy: "USD" });
  if (isTL) {
    const bistName = {};
    BIST_STOCKS.forEach((s) => (bistName[s.s] = s.n));
    BIST30.forEach((sym) => jobs.push({ type: "bist", key: sym, sym, name: bistName[sym] || sym, ysym: sym + ".IS", ccy: "TRY" }));
  }

  // Per-job timeout so one stuck quote can't hang the whole leaderboard.
  const withTimeout = (p, ms) => Promise.race([p, new Promise((res) => setTimeout(() => res(null), ms))]);
  // Fetch the USD/TRY rate in parallel with the quotes (not before them).
  const fxP = isTL ? withTimeout(getStock1y("TRY=X"), 7000) : Promise.resolve(null);
  const resultsP = Promise.all(jobs.map(async (j) => {
    const d = await withTimeout(getStock1y(j.ysym), 7000);
    return d && typeof d.chg1y === "number" ? Object.assign({}, j, { price: d.price, chg1y: d.chg1y }) : null;
  }));
  const [fx, results] = await Promise.all([fxP, resultsP]);
  if (topPerfBuiltFor !== built) return; // a newer build owns the list now
  const fxChg = fx && typeof fx.chg1y === "number" ? fx.chg1y : null;
  results.forEach((r) => {
    if (!r) return;
    // BIST: rank on the USD return (lira inflation aside), but keep the ₺ price.
    if (r.type === "bist") {
      if (fxChg == null) return; // no USD/TRY → can't express a dollar return
      r.chg1y = ((1 + r.chg1y / 100) / (1 + fxChg / 100) - 1) * 100;
    }
    candidates.push(r);
  });
  topPerfData = rankTopPerf(candidates);
  renderTopPerformers();
}
function perfPrice(c) {
  if (c.price == null) return "";
  if (c.type === "index") return fmtPrice(c.price); // index level, no currency symbol
  return (c.ccy === "TRY" ? "₺" : "$") + fmtPrice(c.price);
}
function renderTopPerformers() {
  const listEl = document.getElementById("topPerfList");
  if (!listEl) return;
  const ranked = topPerfData || [];
  if (!ranked.length) { listEl.innerHTML = `<div class="top-perf-msg">${t("top_perf_loading")}</div>`; return; }
  listEl.innerHTML = ranked.map((c, i) => {
    const cls = c.chg1y >= 0 ? "up" : "down";
    const txt = (c.chg1y >= 0 ? "+" : "") + c.chg1y.toFixed(1) + "%";
    return `<button class="top-perf-row" type="button" data-tv="${c.type}|${c.key}|${c.sym}" title="${t("watch_chart")}">
      <span class="top-perf-rank">${i + 1}</span>
      <span class="top-perf-name">${escapeHtml(c.name)} <small>${escapeHtml(c.sym)}</small></span>
      <span class="top-perf-price">${perfPrice(c)}</span>
      <span class="top-perf-chg ${cls}">${txt}</span>
    </button>`;
  }).join("");
  listEl.querySelectorAll("[data-tv]").forEach((b) => b.addEventListener("click", () => {
    const p = b.dataset.tv.split("|");
    const item = (topPerfData || []).find((c) => c.type === p[0] && c.key === p[1]);
    openTradingView({ type: p[0], key: p[1], sym: p[2], name: item ? item.name : p[2] });
  }));
}

// ---- Turkey panel: live FX rates + gram/quarter gold in lira (TL mode only) ----
// Standard Turkish gold coins as a multiple of the 24k gram price (metal content).
const GOLD_COIN_MULT = { gram: 1, quarter: 1.6, half: 3.2, full: 6.4 };
async function getFxQuote(ysym) {
  const key = "numbr_fx_" + ysym;
  try { const c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 3600 * 1000) return c.d; } catch (e) {}
  const d = await fetchYahoo(ysym); // { price, chg24 } or null
  if (d && d.price != null) { try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {} return d; }
  return null;
}
async function buildTrPanel() {
  const sec = document.getElementById("trPanel");
  if (!sec) return;
  if (state.currency !== "TL") { sec.hidden = true; return; }
  sec.hidden = false;
  renderTrGold(); // gold is derived from already-loaded data — render right away

  const forexEl = document.getElementById("trForexList");
  if (forexEl && !forexEl.children.length) forexEl.innerHTML = `<div class="tr-msg">${t("coin_loading")}</div>`;
  const pairs = [
    { sym: "USD/TRY", ysym: "TRY=X", try: true },
    { sym: "EUR/TRY", ysym: "EURTRY=X", try: true },
    { sym: "GBP/TRY", ysym: "GBPTRY=X", try: true },
    { sym: "EUR/USD", ysym: "EURUSD=X", try: false },
  ];
  const rows = await Promise.all(pairs.map(async (p) => {
    const d = await getFxQuote(p.ysym);
    return Object.assign({}, p, { price: d ? d.price : null, chg24: d ? d.chg24 : null });
  }));
  if (state.currency !== "TL") return; // currency changed mid-fetch
  if (!forexEl) return;
  forexEl.innerHTML = rows.map((r) => {
    const price = r.price == null ? "…" : (r.try ? "₺" : "$") + fmtPrice(r.price);
    const chg = typeof r.chg24 === "number" ? `<span class="tr-chg ${r.chg24 >= 0 ? "up" : "down"}">${r.chg24 >= 0 ? "+" : ""}${r.chg24.toFixed(2)}%</span>` : "";
    return `<div class="tr-row"><span class="tr-name">${r.sym}</span><span class="tr-vals"><span class="tr-price">${price}</span>${chg}</span></div>`;
  }).join("");
}
function renderTrGold() {
  const goldEl = document.getElementById("trGoldList");
  if (!goldEl) return;
  const gram = goldPriceGram; // TL per gram when on TL
  const items = [
    { key: "gold_gram", m: GOLD_COIN_MULT.gram },
    { key: "gold_quarter", m: GOLD_COIN_MULT.quarter },
    { key: "gold_half", m: GOLD_COIN_MULT.half },
    { key: "gold_full", m: GOLD_COIN_MULT.full },
  ];
  goldEl.innerHTML = items.map((it) => {
    const price = gram > 0 ? formatMoney(gram * it.m) : "…";
    return `<div class="tr-row"><span class="tr-name">${t(it.key)}</span><span class="tr-vals"><span class="tr-price">${price}</span></span></div>`;
  }).join("");
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
  buildExpenses();
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
// Warm the browser cache with the wallpaper-backed themes so switching to them is
// instant instead of waiting ~1s for the image to download on first use.
let themeWallpapersPreloaded = false;
function preloadThemeWallpapers() {
  if (themeWallpapersPreloaded) return;
  themeWallpapersPreloaded = true;
  ["Themes/Neon/neon2.jpg", "Themes/win/winwal.jpg"].forEach((src) => { const img = new Image(); img.src = src; });
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
  // USD holdings convert differently per app currency; recompute before rendering.
  state.portfolio.holdings.forEach((h) => { if (h.assetType === "usd") h.value = usdHoldingValue(h.usd || 0); });
  buildLayout(); refresh(); refreshExpenses(); buildPortfolio(); refreshPortfolio(); refreshIncome();
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
  // Default to USA + English; the user can switch.
  obCountry = "US"; obLang = "en";
  applyLanguage(obLang);
  updateObActive();
  document.getElementById("onboard").hidden = false;
}
function finishOnboarding() {
  applyLanguage(obLang);
  setCurrency(COUNTRIES[obCountry].currency);
  try { localStorage.setItem("numbr_onboarded", "1"); } catch (e) {}
  document.getElementById("onboard").hidden = true;
  showGuide(); // first-run section guide right after onboarding
}
document.querySelectorAll(".ob-country").forEach((b) => b.addEventListener("click", () => { obCountry = b.dataset.obCountry; updateObActive(); }));
document.querySelectorAll(".ob-lang").forEach((b) => b.addEventListener("click", () => { obLang = b.dataset.obLang; applyLanguage(obLang); updateObActive(); }));
document.getElementById("obStart").addEventListener("click", finishOnboarding);

// ---- First-run section guide (what each tab does; shown once) ----
function showGuide() { const g = document.getElementById("guide"); if (g) g.hidden = false; }
function dismissGuide() {
  const g = document.getElementById("guide"); if (g) g.hidden = true;
  try { localStorage.setItem("numbr_guide_seen", "1"); } catch (e) {}
}
document.getElementById("guideClose").addEventListener("click", dismissGuide);
document.getElementById("guideStart").addEventListener("click", dismissGuide);

// Chart popup close handlers (button, backdrop, Escape).
const tvCloseBtn = document.getElementById("tvClose");
const tvBackdrop = document.getElementById("tvBackdrop");
if (tvCloseBtn) tvCloseBtn.addEventListener("click", closeChartModal);
if (tvBackdrop) tvBackdrop.addEventListener("click", closeChartModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeChartModal(); });

// ---- Sound effects (Web Audio, synthesized; respects the Sound setting) ----
let audioCtx = null;
function sfx(name) {
  if (!state.sound) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const now = audioCtx.currentTime;
    const P = {
      tap:    { type: "sine",     f1: 380, f2: 300, dur: 0.06, gain: 0.05 },
      add:    { type: "triangle", f1: 520, f2: 820, dur: 0.13, gain: 0.06 },
      remove: { type: "triangle", f1: 480, f2: 200, dur: 0.13, gain: 0.06 },
      toggle: { type: "square",   f1: 660, f2: 660, dur: 0.05, gain: 0.035 },
    }[name] || { type: "sine", f1: 380, f2: 300, dur: 0.06, gain: 0.05 };
    const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
    osc.type = P.type;
    osc.frequency.setValueAtTime(P.f1, now);
    osc.frequency.exponentialRampToValueAtTime(P.f2, now + P.dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(P.gain, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + P.dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + P.dur + 0.03);
  } catch (e) {}
}
// One delegated listener picks the right sound from the clicked control.
document.addEventListener("click", (e) => {
  if (!state.sound) return;
  const t = e.target;
  if (t.closest(".cat-remove, .watch-del")) sfx("remove");
  else if (t.closest(".add-cat, .veh-add-btn, .coin-opt")) sfx("add");
  else if (t.closest(".opt, .exp-paid, .net-tax-btn, .port-ccy-toggle, .exp-hist-toggle, .switch, .watch-grip")) sfx("toggle");
  else if (t.closest(".tab")) sfx("tap");
}, true);

// ---- Event wiring ----
document.querySelectorAll("[data-currency]").forEach((b) => b.addEventListener("click", () => setCurrency(b.dataset.currency)));

el.addRecurring.addEventListener("click", addRecurring);
el.addExpense.addEventListener("click", addExpense);
el.addVehicle.addEventListener("click", addVehicle);
el.expHistToggle.addEventListener("click", () => {
  const open = el.expHistList.hidden;
  el.expHistList.hidden = !open;
  el.expHistToggle.setAttribute("aria-expanded", String(open));
  el.expHistToggle.classList.toggle("is-open", open);
});

el.addHolding.addEventListener("click", addHolding);
el.addIncome.addEventListener("click", addIncome);
el.portCcyToggle.addEventListener("click", () => { state.portTotalUSD = !state.portTotalUSD; refreshPortfolio(); });

el.expenses.addEventListener("input", () => { state.monthlyExpenses = parseNumber(el.expenses.value); refresh(); });
el.expenses.addEventListener("blur", () => { if (state.monthlyExpenses > 0) el.expenses.value = formatThousands(state.monthlyExpenses); });

el.realMode.addEventListener("change", () => { state.realMode = el.realMode.checked; el.inflationField.hidden = !state.realMode; refresh(); });

const soundToggle = document.getElementById("soundToggle");
soundToggle.addEventListener("change", () => { state.sound = soundToggle.checked; saveState(); if (state.sound) sfx("toggle"); });
el.inflation.addEventListener("input", () => { state.inflation[state.currency] = parseDecimal(el.inflation.value); refresh(); });

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
    if (name === "savings") { rollExpenseMonth(); buildExpenses(); }
    if (name === "portfolio") refreshPortfolio();
    if (name === "income") refreshIncome();
    if (name === "watch") { refreshWatchData(); buildTopPerformers(); buildTrPanel(); kickBubbles(); }
    else stopBubbles(); // pause the bubble animation loop off the Watch view
    if (name === "settings") preloadThemeWallpapers(); // user is about to pick a theme
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
      monthlyExpenses: state.monthlyExpenses, realMode: state.realMode, sound: state.sound,
      inflation: state.inflation, rates: state.rates, realEstate: state.realEstate,
      expenses: state.expenses, vehicles: state.vehicles, vehSeq: state.vehSeq,
      income: state.income, portfolio: state.portfolio, watchlist: state.watchlist,
      portTotalUSD: state.portTotalUSD,
    }));
  } catch (e) {}
}
function loadState() {
  let s;
  try { s = JSON.parse(localStorage.getItem("numbr_state") || "null"); } catch (e) { return; }
  if (!s) return;
  if (s.lang && I18N[s.lang]) state.lang = s.lang;
  if (s.theme) state.theme = s.theme === "vaporwave" ? "neon" : s.theme;
  if (s.currency && CURRENCY_META[s.currency]) state.currency = s.currency;
  if (typeof s.monthlyExpenses === "number") state.monthlyExpenses = s.monthlyExpenses;
  if (typeof s.realMode === "boolean") state.realMode = s.realMode;
  if (typeof s.sound === "boolean") state.sound = s.sound;
  if (s.inflation) state.inflation = s.inflation;
  if (s.rates) state.rates = s.rates;
  if (s.realEstate) state.realEstate = s.realEstate;
  if (s.expenses && Array.isArray(s.expenses.recurring)) {
    const e = s.expenses;
    state.expenses = {
      month: e.month || "", recurring: e.recurring || [], oneoff: e.oneoff || [],
      history: e.history || [], recSeq: e.recSeq || 0, oneSeq: e.oneSeq || 0,
    };
  }
  if (Array.isArray(s.vehicles)) {
    state.vehicles = s.vehicles.map((v) => ({
      id: v.id, plate: v.plate || "", sched: v.sched || [], oneoff: v.oneoff || [],
      schedSeq: v.schedSeq || (v.sched ? v.sched.length : 0), expSeq: v.expSeq || (v.oneoff ? v.oneoff.length : 0),
    }));
  }
  if (typeof s.vehSeq === "number") state.vehSeq = s.vehSeq;
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
  if (savedTheme) state.theme = savedTheme === "vaporwave" ? "neon" : savedTheme;
  if (savedCur && CURRENCY_META[savedCur]) state.currency = savedCur;
} catch (e) {}
loadState(); // full saved snapshot takes precedence over the legacy per-key values
rollExpenseMonth(); // archive past months + start the current month before rendering

el.expenses.value = formatThousands(state.monthlyExpenses);
el.inflation.value = formatRate(state.inflation[state.currency], false);
applyTheme(state.theme);
soundToggle.checked = state.sound;
applyLanguage(state.lang); // builds layout + savings, applies all translations

if (isFirstRun) showOnboarding();
else { try { if (!localStorage.getItem("numbr_guide_seen")) showGuide(); } catch (e) {} }
wireWatchSearch();
refreshCryptoPrices(); // fetch live crypto prices (works on the deployed site)
refreshWatchData(); // fetch performance for any saved watchlist items
// Prefetch theme wallpapers once the page is idle so theme switches are instant.
if (typeof requestIdleCallback === "function") requestIdleCallback(preloadThemeWallpapers, { timeout: 3000 });
else setTimeout(preloadThemeWallpapers, 1500);
