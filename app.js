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
    guide_car: "Plan an intercity route with distance, time, radar and checkpoint counts, save car profiles, and track fuel cost and trip expenses.",
    guide_freedom: "Works out how much you need saved for your passive income alone to cover your expenses (the 4% rule).",
    guide_watch: "Search for the assets you care about, favorite them, and keep an eye on their prices.",
    theme_glass: "Liquid Glass", theme_glass_desc: "Modern frosted glass (default)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostalgic early-2000s Luna blue",
    theme_medieval: "Medieval", theme_medieval_desc: "Gritty 15th-century parchment & iron",
    theme_doge: "Doge", theme_doge_desc: "such wow · much finance · very meme",
    theme_neon: "Neon", theme_neon_desc: "80s neon dream · A E S T H E T I C",
    theme_solana: "Solana", theme_solana_desc: "Purple & green · degen mode",
    more_soon: "More features coming soon ✨",
    nav_car: "My car",
    car_title: "My car", car_sub: "Plan a route, track fuel cost and trip expenses.",
    car_route: "Route", car_from: "From", car_to: "To", car_pick_province: "Select province",
    car_center: "Center (province seat)", car_need_provinces: "Pick origin and destination province.", car_district: "District",
    car_calc: "Calculate route", car_calculating: "Calculating…",
    car_same_province: "Pick two different provinces.", car_route_fail: "Couldn't reach the route service, showing an estimate.",
    car_no_profile: "Add a car profile to see fuel cost.",
    car_distance: "Distance", car_duration: "Est. time", car_radar: "Radars",
    car_corridor: "Speed corridors", car_checkpoint: "Checkpoints",
    car_cost_one: "One way fuel", car_cost_round: "Round trip fuel",
    car_save_trip: "Save trip", car_trip_saved: "Trip saved ✓",
    car_data_note: "Radar, speed corridor and checkpoint counts are static reference figures (origin + destination province). Replace with official İçişleri figures when available.",
    car_profiles: "Car profiles", car_add_profile: "+ Add car", car_model_ph: "Brand & model",
    car_fuel_type: "Fuel", car_consumption: "Consumption", car_consumption_hint: "/100 km",
    car_price: "Fuel price", car_price_hint: "per L / kWh", car_active: "Active",
    car_fuel_gas: "Petrol", car_fuel_diesel: "Diesel", car_fuel_lpg: "LPG", car_fuel_electric: "Electric", car_fuel_hybrid: "Hybrid",
    car_history: "Trip history", car_history_empty: "No trips saved yet.",
    car_oneway_label: "one way", car_roundtrip_label: "round trip",
    car_expenses: "Trip expenses", car_add_expense: "+ Add expense", car_exp_empty: "No expenses added yet.",
    car_general_trip: "General", car_amount_ph: "Amount", car_link_trip: "Trip",
    car_cat_fuel: "Fuel", car_cat_food: "Food", car_cat_parking: "Parking", car_cat_toll: "Toll", car_cat_maintenance: "Maintenance", car_cat_other: "Other",
    car_report: "Expense report", car_report_total: "Grand total", car_report_fuel_est: "Estimated route fuel",
    car_report_empty: "Add trips and expenses to see the report.",
    nav_portfolio: "Portfolio",
    portfolio_title: "Your portfolio", portfolio_sub: "Add what you own and see your allocation.",
    holding_ph: "Holding name", add_holding: "+ Add holding", total_value: "Total portfolio value",
    flow_title: "Monthly cash flow", flow_income: "Income", flow_expenses: "Expenses", flow_net: "Net / month", flow_last_month: "Last month: {x}",
    flow_savings_note: "+{x}/month more if you cut your tracked spending.",
    cat_cash: "Cash", cat_investment: "Investment",
    asset_stocks: "Stocks", asset_usstock: "US Stocks", asset_bist: "Turkish (BIST)", asset_crypto: "Crypto", asset_deposit: "Deposit", asset_bonds: "Bonds", asset_realestate: "Real estate", asset_gold: "Gold", asset_gold_oz: "Gold (oz)", asset_usd: "US Dollar", asset_cash: "Cash",
    stock_search_ph: "Search stock (e.g. Apple)", shares_ph: "Shares",
    nav_watchlist: "Watch", watch_title: "Watchlist", watch_sub: "Search and favorite assets to track them.",
    watch_search_ph: "Search gold, stocks, crypto…", watch_empty: "Search above and tap to add assets to your watchlist.", watch_chart: "Open chart on TradingView",
    top_perf_title: "This year's top performers", asset_silver: "Silver", top_perf_loading: "Ranking the past year…",
    watch_ccy: "Show price in USD / TL", watch_chart_full: "Open full chart on TradingView ↗",
    tr_index: "Borsa Istanbul", tr_forex: "Currencies", tr_gold: "Gold (TRY)",
    gold_gram: "Gram Gold", gold_quarter: "Quarter Gold", gold_half: "Half Gold", gold_full: "Full Gold",
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
    guide_car: "Şehirler arası rota planla: mesafe, süre, radar ve kontrol noktası sayısı; araç profilleri kaydet, yakıt maliyeti ve yolculuk harcamalarını takip et.",
    guide_freedom: "Giderlerini sadece pasif gelirinle karşılaman için ne kadar birikim gerektiğini hesaplar (%4 kuralı).",
    guide_watch: "Merak ettiğin varlıkları ara, favorine ekle ve fiyatlarını takip et.",
    theme_glass: "Sıvı Cam", theme_glass_desc: "Modern buzlu cam (varsayılan)",
    theme_xp: "Windows XP", theme_xp_desc: "Nostaljik 2000'ler Luna mavisi",
    theme_medieval: "Ortaçağ", theme_medieval_desc: "Sert 15. yüzyıl parşömen ve demir",
    theme_doge: "Doge", theme_doge_desc: "çok vov · büyük para · efsane meme",
    theme_neon: "Neon", theme_neon_desc: "80'ler neon rüyası · A E S T H E T I C",
    theme_solana: "Solana", theme_solana_desc: "Mor & yeşil · degen modu",
    more_soon: "Yeni özellikler yakında ✨",
    nav_car: "Aracım",
    car_title: "Aracım", car_sub: "Rota planla, yakıt maliyetini ve yolculuk harcamalarını takip et.",
    car_route: "Rota", car_from: "Nereden", car_to: "Nereye", car_pick_province: "İl seç",
    car_center: "Merkez (il merkezi)", car_need_provinces: "Kalkış ve varış ilini seç.", car_district: "İlçe",
    car_calc: "Rotayı hesapla", car_calculating: "Hesaplanıyor…",
    car_same_province: "İki farklı il seç.", car_route_fail: "Rota servisine ulaşılamadı, tahmini değer gösteriliyor.",
    car_no_profile: "Yakıt maliyeti için araç profili ekle.",
    car_distance: "Mesafe", car_duration: "Tahmini süre", car_radar: "Radar",
    car_corridor: "Hız koridoru", car_checkpoint: "Kontrol noktası",
    car_cost_one: "Gidiş yakıt", car_cost_round: "Gidiş-dönüş yakıt",
    car_save_trip: "Yolculuğu kaydet", car_trip_saved: "Yolculuk kaydedildi ✓",
    car_data_note: "Radar, hız koridoru ve kontrol noktası sayıları statik referans değerdir (kalkış + varış ili). Resmi İçişleri verisiyle güncellenebilir.",
    car_profiles: "Araç profilleri", car_add_profile: "+ Araç ekle", car_model_ph: "Marka ve model",
    car_fuel_type: "Yakıt", car_consumption: "Tüketim", car_consumption_hint: "/100 km",
    car_price: "Yakıt fiyatı", car_price_hint: "L / kWh başına", car_active: "Aktif",
    car_fuel_gas: "Benzin", car_fuel_diesel: "Dizel", car_fuel_lpg: "LPG", car_fuel_electric: "Elektrik", car_fuel_hybrid: "Hibrit",
    car_history: "Yolculuk geçmişi", car_history_empty: "Henüz yolculuk kaydedilmedi.",
    car_oneway_label: "tek yön", car_roundtrip_label: "gidiş-dönüş",
    car_expenses: "Yolculuk harcamaları", car_add_expense: "+ Harcama ekle", car_exp_empty: "Henüz harcama eklenmedi.",
    car_general_trip: "Genel", car_amount_ph: "Tutar", car_link_trip: "Yolculuk",
    car_cat_fuel: "Yakıt", car_cat_food: "Yemek", car_cat_parking: "Otopark", car_cat_toll: "Otoyol", car_cat_maintenance: "Bakım", car_cat_other: "Diğer",
    car_report: "Harcama raporu", car_report_total: "Genel toplam", car_report_fuel_est: "Tahmini rota yakıtı",
    car_report_empty: "Rapor için yolculuk ve harcama ekle.",
    nav_portfolio: "Portföy",
    portfolio_title: "Portföyün", portfolio_sub: "Sahip olduklarını ekle, dağılımını gör.",
    holding_ph: "Varlık adı", add_holding: "+ Varlık ekle", total_value: "Toplam portföy değeri",
    flow_title: "Aylık nakit akışı", flow_income: "Gelir", flow_expenses: "Gider", flow_net: "Aylık net", flow_last_month: "Geçen ay: {x}",
    flow_savings_note: "Takip ettiğin harcamaları kısarsan ayda +{x} daha.",
    cat_cash: "Nakit", cat_investment: "Yatırım",
    asset_stocks: "Hisse", asset_usstock: "ABD Hisse", asset_bist: "Türk Hisse (BIST)", asset_crypto: "Kripto", asset_deposit: "Mevduat", asset_bonds: "Tahvil", asset_realestate: "Gayrimenkul", asset_gold: "Altın", asset_gold_oz: "Ons Altın", asset_usd: "Dolar (USD)", asset_cash: "Nakit",
    stock_search_ph: "Hisse ara (örn. THY)", shares_ph: "Adet",
    nav_watchlist: "Takip", watch_title: "Takip Listesi", watch_sub: "Varlık ara, favorile ve takip et.",
    watch_search_ph: "Altın, hisse, kripto ara…", watch_empty: "Yukarıdan ara ve takip listene varlık ekle.", watch_chart: "TradingView'de grafiği aç",
    top_perf_title: "Son 1 yılın yıldızları", asset_silver: "Gümüş", top_perf_loading: "Son 1 yıl sıralanıyor…",
    watch_ccy: "Fiyatı dolar / TL göster", watch_chart_full: "TradingView'de tam grafiği aç ↗",
    tr_index: "Borsa İstanbul", tr_forex: "Döviz", tr_gold: "Altın (TL)",
    gold_gram: "Gram Altın", gold_quarter: "Çeyrek Altın", gold_half: "Yarım Altın", gold_full: "Tam Altın",
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
  // Vehicles: each has a name (brand-model), fuel specs (fuel/consumption/price for
  // route fuel cost), dated payment reminders (sched) and logged expenses (oneoff).
  // Vehicle costs roll into the monthly expense total.
  vehicles: [], vehSeq: 0,
  // Aracım (car hub): route planner + trip history. activeVehicle = the car used for
  // route fuel cost (a state.vehicles entry).
  vehicleHub: {
    activeVehicle: "", trips: [],
    fromP: "", fromD: "", toP: "", toD: "", lastRoute: null, seq: 0,
  },
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
  // Aracım (car) view
  carFromP: document.getElementById("carFromP"),
  carFromD: document.getElementById("carFromD"),
  carToP: document.getElementById("carToP"),
  carToD: document.getElementById("carToD"),
  carCalc: document.getElementById("carCalc"),
  carRouteMsg: document.getElementById("carRouteMsg"),
  carResults: document.getElementById("carResults"),
  carSaveTrip: document.getElementById("carSaveTrip"),
  carHistList: document.getElementById("carHistList"),
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
  const sym = CURRENCY_META[state.currency].symbol;
  const multi = (state.vehicles || []).length > 1;
  const isActive = (activeVehicle() || {}).id === v.id;
  const card = document.createElement("div");
  card.className = "veh-card" + (multi && isActive ? " is-active" : "");
  card.dataset.veh = v.id;
  const fuelOpts = CAR_FUELS.map((f) => `<option value="${f}"${v.fuel === f ? " selected" : ""}>${t("car_fuel_" + f)}</option>`).join("");
  card.innerHTML = `
    <div class="veh-head">
      ${multi ? `<button class="car-prof-pick veh-active" type="button" data-veh-active aria-label="${t("car_active")}"></button>` : ""}
      <input class="veh-plate" data-veh-plate value="${(v.plate || "").replace(/"/g, "&quot;")}" placeholder="${t("car_model_ph")}" />
      <span class="veh-monthly" data-veh-total></span>
      <button class="cat-remove veh-del" type="button" data-veh-del aria-label="remove">×</button>
    </div>
    <div class="car-prof-grid veh-specs">
      <label class="car-field"><span>${t("car_fuel_type")}</span><select class="car-select" data-veh-fuel>${fuelOpts}</select></label>
      <label class="car-field"><span>${t("car_consumption")} <small>${t("car_consumption_hint")}</small></span>
        <input class="car-num" inputmode="decimal" data-veh-cons value="${v.consumption ? locDec(v.consumption) : ""}" placeholder="7" /></label>
      <label class="car-field"><span>${t("car_price")} <small>${t("car_price_hint")}</small></span>
        <div class="money-input money-input--sm"><span class="money-symbol">${sym}</span><input inputmode="decimal" data-veh-price value="${v.price ? locDec(v.price) : ""}" placeholder="0" /></div></label>
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
  const active = card.querySelector("[data-veh-active]");
  if (active) active.addEventListener("click", () => { state.vehicleHub.activeVehicle = v.id; buildVehicles(); refreshVehicles(); renderCarRoute(); saveState(); });
  card.querySelector("[data-veh-fuel]").addEventListener("change", (e) => { v.fuel = e.target.value; saveState(); });
  const vcons = card.querySelector("[data-veh-cons]");
  vcons.addEventListener("input", () => { v.consumption = parseDecimal(vcons.value); renderCarRoute(); });
  vcons.addEventListener("blur", saveState);
  const vprice = card.querySelector("[data-veh-price]");
  vprice.addEventListener("input", () => { v.price = parseDecimal(vprice.value); renderCarRoute(); });
  vprice.addEventListener("blur", saveState);
  card.querySelector("[data-veh-del]").addEventListener("click", () => {
    state.vehicles = state.vehicles.filter((x) => x.id !== v.id);
    if (state.vehicleHub.activeVehicle === v.id) state.vehicleHub.activeVehicle = "";
    buildVehicles(); refreshVehicles(); renderCarRoute(); refreshExpenses();
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
  const v = { id: "v" + ++state.vehSeq, plate: "", fuel: "gas", consumption: 0, price: 0, sched: [], oneoff: [], schedSeq: 0, expSeq: 0 };
  state.vehicles.push(v);
  if (!state.vehicleHub.activeVehicle) state.vehicleHub.activeVehicle = v.id;
  buildVehicles(); refreshVehicles(); // rebuild so the active picker appears when >1 car
  const card = el.vehList.querySelector(`[data-veh="${v.id}"]`);
  if (card) card.querySelector("[data-veh-plate]").focus();
  refreshExpenses();
}

// ============================================================
//  Aracım (car hub): route planner, profiles, trips, expenses
// ============================================================
// Turkish provinces (plate order) with center coordinates and STATIC reference
// counts: [plate, name, lat, lng, radar, speedCorridor, checkpoint].
// The İçişleri site only exposes these via an interactive route tool, so these are
// representative placeholders (origin + destination province are summed for a route).
// Swap in official figures when a data table becomes available.
const TR_PROVINCES = [
  [1,"Adana",37.00,35.32,9,3,7],[2,"Adıyaman",37.76,38.28,4,1,4],[3,"Afyonkarahisar",38.76,30.54,8,3,6],
  [4,"Ağrı",39.72,43.05,3,1,5],[5,"Amasya",40.65,35.83,4,1,3],[6,"Ankara",39.93,32.86,16,6,12],
  [7,"Antalya",36.90,30.70,12,5,9],[8,"Artvin",41.18,41.82,3,1,4],[9,"Aydın",37.85,27.84,8,3,6],
  [10,"Balıkesir",39.65,27.88,9,3,7],[11,"Bilecik",40.14,29.98,4,2,3],[12,"Bingöl",38.88,40.50,3,1,4],
  [13,"Bitlis",38.40,42.11,3,1,4],[14,"Bolu",40.74,31.61,7,3,5],[15,"Burdur",37.72,30.29,4,2,3],
  [16,"Bursa",40.19,29.06,12,5,9],[17,"Çanakkale",40.16,26.41,6,2,5],[18,"Çankırı",40.60,33.62,4,1,3],
  [19,"Çorum",40.55,34.95,6,2,4],[20,"Denizli",37.78,29.09,8,3,6],[21,"Diyarbakır",37.91,40.24,7,2,7],
  [22,"Edirne",41.68,26.56,6,2,5],[23,"Elazığ",38.68,39.22,5,2,5],[24,"Erzincan",39.75,39.50,4,1,4],
  [25,"Erzurum",39.90,41.27,6,2,6],[26,"Eskişehir",39.78,30.52,8,3,6],[27,"Gaziantep",37.07,37.38,10,4,8],
  [28,"Giresun",40.91,38.39,5,2,4],[29,"Gümüşhane",40.46,39.48,3,1,3],[30,"Hakkari",37.58,43.74,2,0,4],
  [31,"Hatay",36.20,36.16,8,3,7],[32,"Isparta",37.76,30.55,5,2,4],[33,"Mersin",36.81,34.64,10,4,8],
  [34,"İstanbul",41.01,28.98,20,7,15],[35,"İzmir",38.42,27.14,15,6,11],[36,"Kars",40.60,43.10,3,1,4],
  [37,"Kastamonu",41.39,33.78,5,2,4],[38,"Kayseri",38.73,35.49,9,3,7],[39,"Kırklareli",41.74,27.22,5,2,4],
  [40,"Kırşehir",39.15,34.16,4,1,3],[41,"Kocaeli",40.77,29.92,11,4,8],[42,"Konya",37.87,32.48,12,5,9],
  [43,"Kütahya",39.42,29.98,6,2,5],[44,"Malatya",38.36,38.31,6,2,5],[45,"Manisa",38.61,27.43,8,3,6],
  [46,"Kahramanmaraş",37.58,36.93,7,3,6],[47,"Mardin",37.31,40.74,5,2,5],[48,"Muğla",37.22,28.36,9,3,7],
  [49,"Muş",38.73,41.49,3,1,4],[50,"Nevşehir",38.62,34.71,5,2,4],[51,"Niğde",37.97,34.68,5,2,4],
  [52,"Ordu",40.98,37.88,6,2,5],[53,"Rize",41.02,40.52,4,1,4],[54,"Sakarya",40.78,30.40,9,3,7],
  [55,"Samsun",41.29,36.33,9,3,7],[56,"Siirt",37.93,41.94,3,1,4],[57,"Sinop",42.03,35.15,3,1,3],
  [58,"Sivas",39.75,37.02,6,2,6],[59,"Tekirdağ",40.98,27.51,8,3,6],[60,"Tokat",40.31,36.55,5,2,4],
  [61,"Trabzon",41.00,39.72,7,3,6],[62,"Tunceli",39.11,39.55,2,0,3],[63,"Şanlıurfa",37.17,38.79,8,3,7],
  [64,"Uşak",38.68,29.41,4,2,3],[65,"Van",38.49,43.41,5,2,6],[66,"Yozgat",39.82,34.81,6,2,5],
  [67,"Zonguldak",41.45,31.79,6,2,5],[68,"Aksaray",38.37,34.03,5,2,4],[69,"Bayburt",40.26,40.23,2,0,3],
  [70,"Karaman",37.18,33.22,4,1,3],[71,"Kırıkkale",39.85,33.51,5,2,4],[72,"Batman",37.88,41.13,4,1,5],
  [73,"Şırnak",37.52,42.46,3,1,4],[74,"Bartın",41.63,32.34,3,1,3],[75,"Ardahan",41.11,42.70,2,0,3],
  [76,"Iğdır",39.92,44.04,2,1,3],[77,"Yalova",40.65,29.28,4,2,3],[78,"Karabük",41.20,32.62,4,1,3],
  [79,"Kilis",36.72,37.12,3,1,4],[80,"Osmaniye",37.07,36.25,5,2,5],[81,"Düzce",40.84,31.16,5,2,4],
].map((p) => ({ plate: p[0], name: p[1], lat: p[2], lng: p[3], radar: p[4], corridor: p[5], checkpoint: p[6] }));

// Turkish districts (ilçe) by province plate: [name, lat, lng]. Centroids from OSM
// admin-level-6 boundaries (ODbL, openstreetmap.org). ~966 districts; provinces
// or districts missing here fall back to the province center (Merkez) option.
const TR_DISTRICTS = {
  1:[["Aladağ",37.5218,35.4798],["Ceyhan",37.1188,35.8479],["Feke",37.874,35.7548],["Karaisalı",37.2471,35.1743],["Karataş",36.615,35.3033],["Kozan",37.5276,35.7723],["Pozantı",37.4934,34.9048],["Saimbeyli",38.0004,36.1267],["Sarıçam",37.1069,35.4131],["Seyhan",36.887,35.2338],["Tufanbeyli",38.3132,36.3139],["Yumurtalık",36.734,35.699],["Yüreğir",36.9017,35.3473],["Çukurova",37.0883,35.2252],["İmamoğlu",37.3095,35.5407]],
  2:[["Adıyaman merkez",37.6553,38.1472],["Besni",37.6369,37.983],["Gerger",38.0154,39.0097],["Gölbaşı",37.7826,37.6376],["Kahta",37.8252,38.7533],["Samsat",37.5622,38.4895],["Sincik",38.04,38.5902],["Tut",37.7778,37.97],["Çelikhan",38.0548,38.2756]],
  3:[["Afyonkarahisar (Merkez İlçe)",38.7984,30.5448],["Bayat",39.0215,30.9228],["Başmakçı",37.8899,30.0191],["Bolvadin",38.7899,31.0573],["Dazkırı",37.9577,29.776],["Dinar",38.1494,30.2424],["Emirdağ",38.9874,31.5792],["Evciler",38.0535,29.9437],["Hocalar",38.5841,29.9502],["Kızılören",38.2706,30.1688],["Sandıklı",38.4612,30.1808],["Sinanpaşa",38.7128,30.267],["Sultandağı",38.5568,31.3273],["Çay",38.4908,30.8673],["Çobanlar",38.7433,30.8488],["İhsaniye",39.0266,30.4707],["İscehisar",38.9321,30.7822],["Şuhut",38.454,30.6046]],
  4:[["Ağrı merkez",39.8241,43.1461],["Diyadin",39.4447,43.6619],["Doğubayazıt",39.4845,44.2986],["Eleşkirt",39.8361,42.6024],["Hamur",39.477,43.0415],["Patnos",39.1624,42.7786],["Taşlıçay",39.625,43.4126],["Tutak",39.4335,42.6112]],
  5:[["Amasya merkez",40.5524,35.9406],["Göynücek",40.3697,35.5121],["Gümüşhacıköy",40.973,35.1387],["Hamamözü",40.7869,35.0728],["Merzifon",40.9104,35.4694],["Suluova",40.8614,35.7077],["Taşova",40.9247,36.2767]],
  6:[["Akyurt",40.1338,33.1384],["Altındağ",39.9822,32.9257],["Ayaş",40.0162,32.2554],["Bala",39.4674,33.1355],["Beypazarı",40.1602,31.918],["Elmadağ",39.8641,33.214],["Etimesgut",39.8629,32.6357],["Evren",39.0062,33.7254],["Gölbaşı",39.5817,32.8115],["Güdül",40.1726,32.2128],["Haymana",39.3119,32.5212],["Kahramankazan",40.2161,32.6731],["Kalecik",40.2232,33.4006],["Keçiören",40.0638,32.8278],["Kızılcahamam",40.4451,32.5768],["Mamak",39.91,32.9591],["Nallıhan",40.2013,31.344],["Polatlı",39.379,32.09],["Pursaklar",40.0826,32.9088],["Sincan",39.8469,32.4627],["Yenimahalle",40.0057,32.7413],["Çamlıdere",40.4878,32.3738],["Çankaya",39.8397,32.8373],["Çubuk",40.2887,33.0573],["Şereflikoçhisar",39.0254,33.532]],
  7:[["Akseki",37.1591,31.735],["Aksu",36.9699,30.8709],["Alanya",36.5672,31.8843],["Demre",36.2096,29.8964],["Döşemealtı",37.0744,30.5768],["Elmalı",36.7159,29.9295],["Finike",36.2878,30.1294],["Gazipaşa",36.2107,32.3947],["Gündoğmuş",36.7734,32.0036],["Kaş",36.2097,29.5768],["Kemer",36.5279,30.5353],["Kepez",36.9781,30.7196],["Konyaaltı",36.7916,30.5671],["Korkuteli",37.0596,30.2187],["Kumluca",36.2904,30.4303],["Manavgat",36.8107,31.3801],["Muratpaşa",36.8672,30.7526],["Serik",36.9578,31.044],["İbradi",37.16,31.4737]],
  8:[["Ardanuç",41.1409,41.9831],["Arhavi",41.3217,41.3248],["Artvin Merkez",41.1477,41.8017],["Borçka",41.4588,41.8364],["Hopa",41.4032,41.4268],["Kemalpaşa",41.4865,41.5287],["Murgul",41.2645,41.5755],["Yusufeli",40.8138,41.5001],["Şavşat",41.4404,42.3084]],
  9:[["Bozdoğan",37.6313,28.4132],["Buharkent",37.9686,28.7557],["Didim",37.4119,27.2717],["Efeler",37.8497,27.9738],["Germencik",37.9032,27.5517],["Karacasu",37.7239,28.6687],["Karpuzlu",37.5628,27.8285],["Koçarlı",37.7637,27.6833],["Kuyucak",37.9487,28.5765],["Kuşadası",37.7835,27.2091],["Köşk",37.9076,28.0443],["Nazilli",38.0573,28.3707],["Sultanhisar",37.9227,28.1895],["Söke",37.6253,27.2086],["Yenipazar",37.8369,28.1921],["Çine",37.6063,28.0675],["İncirliova",37.9205,27.7503]],
  10:[["Altıeylül",39.6228,27.9056],["Ayvalık",39.3252,26.6771],["Balya",39.7875,27.6931],["Bandırma",40.3617,27.9774],["Bigadiç",39.4427,28.225],["Burhaniye",39.4803,26.9411],["Dursunbey",39.546,28.8742],["Edremit",39.5797,26.789],["Erdek",40.4688,27.7678],["Gömeç",39.4098,26.8137],["Gönen",40.246,27.6358],["Havran",39.6281,27.2077],["Karesi",39.7601,27.8358],["Kepsut",39.6584,28.2234],["Manyas",39.9763,27.9028],["Marmara",40.5462,27.5509],["Savaştepe",39.4319,27.6958],["Susurluk",39.8884,28.0853],["Sındırgı",39.2406,28.2852],["İvrindi",39.5238,27.501]],
  11:[["Bilecik (merkez)",40.181,29.9822],["Bozüyük",39.8427,29.9764],["Gölpazarı",40.3436,30.311],["Osmaneli",40.3966,30.0186],["Pazaryeri",40.0015,29.8786],["Söğüt",39.9711,30.2588],["Yenipazar",40.2007,30.5384],["İnhisar",40.0389,30.3926]],
  12:[["Adaklı",39.2212,40.5549],["Bingöl merkez",38.8194,40.5347],["Genç",38.678,40.5166],["Karlıova",39.2896,41.0195],["Kiğı",39.2711,40.2396],["Solhan",38.8706,41.0527],["Yayladere",39.1641,40.0455],["Yedisu",39.474,40.5167]],
  13:[["Adilcevaz",38.8861,42.812],["Ahlat",38.8634,42.3344],["Bitlis merkez",38.3246,42.0773],["Güroymak",38.6393,41.9887],["Hizan",38.1344,42.5568],["Mutki",38.5002,41.7454],["Tatvan",38.396,42.5308]],
  14:[["Bolu merkez",40.7901,31.7062],["Dörtdivan",40.6177,32.0183],["Gerede",40.6513,32.3562],["Göynük",40.3244,30.8311],["Kıbrıscık",40.3805,31.8839],["Mengen",40.9213,32.0539],["Mudurnu",40.4703,31.2757],["Seben",40.4315,31.5185],["Yeniçağa",40.8003,32.0652]],
  15:[["Altınyayla",36.9088,29.4793],["Ağlasun",37.6327,30.6258],["Bucak",37.3748,30.556],["Burdur (merkez)",37.6017,30.2533],["Gölhisar",37.0748,29.473],["Karamanlı",37.3676,29.8214],["Kemer",37.3585,30.0816],["Tefenni",37.2508,29.7664],["Yeşilova",37.57,29.682],["Çavdır",37.1115,29.7132],["Çeltikçi",37.5351,30.4574]],
  16:[["Büyükorhan",39.7293,28.8508],["Gemlik",40.4402,29.1151],["Gürsu",40.2435,29.1774],["Harmancık",39.715,29.0963],["Karacabey",40.3509,28.3951],["Keles",39.8858,29.2091],["Kestel",40.1885,29.2348],["Mudanya",40.3422,28.8181],["Mustafakemalpaşa",39.9401,28.6194],["Nilüfer",40.215,28.862],["Orhaneli",39.9069,28.9921],["Orhangazi",40.5303,29.3117],["Osmangazi",40.2099,29.0431],["Yenişehir",40.2716,29.6452],["Yıldırım",40.1932,29.1491],["İnegöl",39.997,29.497],["İznik",40.5365,29.6823]],
  17:[["Ayvacik",39.522,26.3132],["Bayramiç",39.835,26.695],["Biga",40.4158,27.1989],["Bozcaada",39.8155,26.0495],["Eceabat",40.1905,26.3077],["Ezine",39.817,26.1699],["Gelibolu",40.4707,26.6717],["Gökçeada",40.1695,25.8631],["Lapseki",40.3504,26.7523],["Yenice",39.935,27.3426],["Çan",40.0564,26.9575],["Çanakkale merkez",40.1168,26.3837]],
  18:[["Atkaracalar",40.8833,33.0972],["Bayramören",41.0019,33.1887],["Eldivan",40.4492,33.4682],["Ilgaz",40.956,33.626],["Korgun",40.7064,33.4712],["Kurşunlu",40.8492,33.303],["Kızılırmak",40.3844,34.002],["Orta",40.5602,32.9923],["Yapraklı",40.7585,33.8832],["Çankırı merkez",40.4179,33.7485],["Çerkeş",40.8022,32.8161],["Şabanözü",40.4087,33.2819]],
  19:[["Alaca",40.1419,34.9123],["Bayat",40.6097,34.1801],["Boğazkale",40.0391,34.5778],["Dodurga",40.8288,34.7984],["Kargı",41.1812,34.4938],["Laçin",40.7855,34.8658],["Mecitözü",40.5097,35.3048],["Ortaköy",40.2922,35.2389],["Osmancık",41.027,34.9056],["Oğuzlar",40.7729,34.6724],["Sungurlu",40.287,34.2513],["Uğurludağ",40.4718,34.3722],["Çorum merkez",40.506,34.888],["İskilip",40.7557,34.4694]],
  20:[["Acıpayam",37.3001,29.2591],["Babadağ",37.8167,28.8857],["Balkan",38.0531,29.5672],["Bekilli",38.2294,29.3681],["Beyağaç",37.2237,28.8663],["Bozkurt",37.8107,29.5647],["Buldan",38.1082,28.86],["Güney",38.1731,29.0064],["Honaz",37.8113,29.3386],["Kale",37.4185,28.7445],["Merkezefendi",37.8035,29.0537],["Pamukkale",37.8608,29.1671],["Sarayköy",37.9245,28.8675],["Serinhisar",37.6001,29.3178],["Tavas",37.4962,29.0132],["Çal",38.0551,29.3625],["Çameli",37.0423,29.2974],["Çardak",37.7134,29.664],["Çivril",38.2298,29.7637]],
  21:[["Bağlar",37.8683,40.107],["Bismil",37.9036,40.7579],["Dicle",38.3565,40.2183],["Ergani",38.1928,39.7166],["Eğil",38.1769,40.1568],["Hani",38.4498,40.3395],["Hazro",38.2119,40.6565],["Kayapınar",37.9571,40.0441],["Kocaköy",38.2174,40.5745],["Kulp",38.4993,41.1216],["Lice",38.4557,40.7772],["Silvan",38.1335,40.9123],["Sur",38.0505,40.371],["Yenişehir",38.0208,40.1881],["Çermik",38.042,39.4507],["Çüngüş",38.2294,39.2487],["Çınar",37.7115,40.3086]],
  22:[["Edirne merkez",41.6454,26.5207],["Enez",40.6663,26.1238],["Havsa",41.5825,26.8692],["Keşan",40.6483,26.5646],["Lalapaşa",41.9431,26.7146],["Meriç",41.1856,26.3758],["Süloğlu",41.7719,26.8985],["Uzunköprü",41.2908,26.6712],["İpsala",40.8937,26.2652]],
  23:[["Alacakaya",38.4911,39.9124],["Arıcak",38.4874,40.1489],["Ağın",38.9434,38.6727],["Baskil",38.5718,38.6868],["Elazığ merkez",38.6403,39.2569],["Karakoçan",39.0128,39.959],["Keban",38.7585,38.698],["Kovancılar",38.7725,39.8225],["Maden",38.3787,39.6046],["Palu",38.6793,40.0177],["Sivrice",38.386,39.2311]],
  24:[["Erzincan merkez",39.6787,39.5434],["Ilıç",39.634,38.3763],["Kemah",39.5985,39.0548],["Kemaliye",39.2166,38.5847],["Otlukbeli",39.9923,40.0519],["Refahiye",39.9436,38.756],["Tercan",39.7805,40.306],["Çayırlı",39.8599,40.0843],["Üzümlü",39.6313,39.871]],
  25:[["Aziziye",40.0675,40.9711],["Aşkale",39.9125,40.6916],["Horasan",40.0305,42.1358],["Hınıs",39.3737,41.7178],["Karayazı",39.6339,42.0575],["Karaçoban",39.3582,42.0732],["Köprüköy",39.9269,41.8778],["Narman",40.2825,41.8589],["Oltu",40.5822,41.9612],["Olur",40.8496,42.1211],["Palandöken",39.8379,41.1675],["Pasinler",39.9755,41.6804],["Pazaryolu",40.4308,40.6955],["Tekman",39.6257,41.5004],["Tortum",40.3472,41.4421],["Uzundere",40.5725,41.5891],["Yakutiye",40.0795,41.2804],["Çat",39.6012,40.9212],["İspir",40.5511,40.9982],["Şenkaya",40.6258,42.3398]],
  26:[["Alpu",39.9236,30.9812],["Beylikova",39.7396,31.251],["Günyüzü",39.2763,31.9106],["Han",39.1796,30.8029],["Mahmudiye",39.541,30.9568],["Mihalgazi",40.0009,30.5095],["Mihalıççık",39.8905,31.6519],["Odunpazarı",39.7097,30.4801],["Sarıcakaya",40.082,30.748],["Seyitgazi",39.3675,30.6296],["Sivrihisar",39.3259,31.6927],["Tepebaşı",39.7616,30.4665],["Çifteler",39.3149,31.1046],["İnönü",39.7773,30.1665]],
  27:[["Araban",37.4376,37.8029],["Karkamış",36.8338,37.9374],["Nizip",37.0891,37.8131],["Nurdağı",37.2254,36.8251],["Oğuzeli",36.8582,37.5968],["Yavuzeli",37.3119,37.6623],["İslahiye",36.8954,36.7339],["Şahinbey",37.021,37.3304],["Şehitkamil",37.0931,37.385]],
  28:[["Alucra",40.3676,38.7305],["Bulancak",40.8772,38.1966],["Dereli",40.6247,38.4379],["Doğankent",40.793,38.9475],["Espiye",40.8824,38.7113],["Eynesil",41.0297,39.131],["Giresun merkez",40.8935,38.3919],["Görele",41.0032,39.037],["Güce",40.7893,38.8266],["Keşap",40.9149,38.5464],["Piraziz",40.9267,38.1284],["Tirebolu",40.9723,38.8538],["Yağlıdere",40.6523,38.6004],["Çamoluk",40.1416,38.7467],["Çanakçı",40.8719,39.0446],["Şebinkarahisar",40.2932,38.4347]],
  29:[["Gümüşhane merkez",40.5536,39.7418],["Kelkit",39.9932,39.4599],["Köse",40.2145,39.6941],["Kürtün",40.6607,39.0314],["Torul",40.5269,39.3324],["Şiran",40.1772,39.0384]],
  30:[["Derecik",37.1083,44.399],["Hakkari merkez",37.6074,43.863],["Yüksekova",37.521,44.3078],["Çukurca",37.262,43.6406],["Şemdinli",37.2487,44.5442]],
  31:[["Altınözü",36.0664,36.349],["Anamur",36.0887,32.7872],["Antakya (merkez)",36.1945,36.2379],["Arsuz",36.4453,35.9571],["Aydıncık",36.1446,33.3481],["Belen",36.5173,36.1699],["Bozyazı",36.1157,33.0437],["Defne",36.1575,36.1082],["Dörtyol",36.8421,36.1968],["Erdemli",36.6023,34.2508],["Erzin",36.9197,36.0371],["Gülnar",36.2109,33.4665],["Hassa",36.7528,36.6252],["Kumlu",36.3698,36.5235],["Kırıkhan",36.5154,36.5106],["Mut",36.7216,33.3885],["Payas",36.7551,36.2073],["Reyhanlı",36.2786,36.5742],["Samandağ",36.1407,35.9206],["Silifke",36.2909,33.8408],["Yayladağı",35.9426,36.0056],["İskenderun",36.6189,36.1876]],
  32:[["Aksu",37.707,31.1778],["Atabey",38.0074,30.6322],["Eğirdir",37.8272,30.9211],["Gelendost",38.1033,31.0288],["Gönen",37.9404,30.4554],["Isparta merkez",37.7167,30.6486],["Keçiborlu",37.9078,30.2526],["Senirkent",38.1363,30.6548],["Sütçüler",37.5376,31.0998],["Uluborlu",38.1039,30.4575],["Yalvaç",38.3416,31.0317],["Yenişarbademli",37.7886,31.3412],["Şarkîkaraağaç",37.9969,31.3562]],
  33:[["Akdeniz",36.8112,34.679],["Mezitli",36.7838,34.4758],["Tarsus",36.8655,34.9342],["Toroslar",36.88,34.5425],["Yenişehir",36.7981,34.5736],["Çamlıyayla",37.2441,34.6325]],
  34:[["Adalar",40.8571,29.1034],["Arnavutköy",41.2702,28.6856],["Ataşehir",40.98,29.1403],["Avcılar",41.0133,28.7137],["Bahçelievler",41.0137,28.8422],["Bakırköy",40.9705,28.8379],["Bayrampaşa",41.044,28.9008],["Bağcılar",41.0408,28.8459],["Başakşehir",41.0911,28.7367],["Beykoz",41.1655,29.1646],["Beylikdüzü",40.9756,28.6404],["Beyoğlu",41.0402,28.9638],["Beşiktaş",41.0745,29.0253],["Büyükçekmece",41.0295,28.5359],["Esenler",41.0496,28.8732],["Esenyurt",41.0409,28.6682],["Eyüpsultan",41.1521,28.8895],["Fatih",41.0117,28.9536],["Gaziosmanpaşa",41.0681,28.9163],["Güngören",41.0223,28.8783],["Kadıköy",40.9768,29.045],["Kartal",40.9078,29.1987],["Kağıthane",41.0827,28.9766],["Küçükçekmece",40.9921,28.7765],["Maltepe",40.946,29.1564],["Pendik",40.9122,29.2986],["Sancaktepe",40.9964,29.2377],["Sarıyer",41.187,29.0543],["Silivri",41.131,28.1529],["Sultanbeyli",40.9725,29.2668],["Sultangazi",41.1202,28.8786],["Tuzla",40.8437,29.3172],["Zeytinburnu",40.9973,28.9037],["Çatalca",41.3653,28.2939],["Çekmeköy",41.0709,29.258],["Ümraniye",41.0321,29.1253],["Üsküdar",41.0323,29.0477],["Şile",41.1482,29.6311],["Şişli",41.0621,28.9886]],
  35:[["Aliağa",38.8162,27.0029],["Balçova",38.3937,27.0522],["Bayraklı",38.4802,27.1584],["Bayındır",38.2011,27.621],["Bergama",39.0218,27.1058],["Beydağ",38.108,28.2476],["Bornova",38.4602,27.2727],["Buca",38.3412,27.243],["Dikili",39.0136,26.8723],["Foça",38.6841,26.809],["Gaziemir",38.3334,27.1377],["Güzelbahçe",38.3402,26.8812],["Karabağlar",38.3501,27.0658],["Karaburun",38.5625,26.4778],["Karşıyaka",38.4892,27.1189],["Kemalpaşa",38.4212,27.5125],["Kiraz",38.1758,28.3532],["Konak",38.4173,27.1426],["Kınık",39.078,27.4005],["Menderes",38.0937,27.1453],["Menemen",38.629,27.0315],["Narlıdere",38.3856,26.9901],["Seferihisar",38.1722,26.8405],["Selçuk",37.9463,27.3826],["Tire",38.0687,27.7156],["Torbalı",38.2022,27.3655],["Urla",38.327,26.6896],["Çeşme",38.3147,26.3635],["Çiğli",38.4794,27.0092],["Ödemiş",38.1909,27.9914]],
  36:[["Akyaka",40.78,43.6846],["Arpaçay",40.8815,43.5015],["Digor",40.2944,43.6052],["Kars merkez",40.5463,43.4415],["Kağızman",40.1537,43.1586],["Sarıkamış",40.229,42.4633],["Selim",40.4449,42.7637],["Susuz",40.7646,43.1334]],
  37:[["Abana",41.9759,34.0443],["Araç",41.1585,33.2721],["Azdavay",41.7084,33.3486],["Ağlı",41.6992,33.5581],["Bozkurt",41.9148,33.9891],["Cide",41.9259,33.068],["Daday",41.4951,33.3629],["Devrekani",41.6839,33.8917],["Doğanyurt",41.9974,33.4594],["Hanönü",41.635,34.4442],["Kastamonu merkez",41.367,33.8026],["Küre",41.8284,33.6506],["Pınarbaşı",41.6137,33.0503],["Seydiler",41.6403,33.6943],["Taşköprü",41.4399,34.1903],["Tosya",41.0281,34.0975],["Çatalzeytin",41.9278,34.1877],["İhsangazi",41.1489,33.5497],["İnebolu",41.9655,33.7487],["Şenpazar",41.8177,33.2428]],
  38:[["Akkışla",39.0068,36.1568],["Bünyan",38.7842,35.9629],["Develi",38.2852,35.636],["Felahiye",39.1239,35.5494],["Hacılar",38.6654,35.42],["Kocasinan",38.9036,35.3056],["Melikgazi",38.7479,35.6074],["Pınarbaşı",38.794,36.3088],["Sarıoğlan",39.1085,35.9736],["Sarız",38.4532,36.4953],["Talas",38.6217,35.7307],["Tomarza",38.4654,35.84],["Yahyalı",38.0814,35.4808],["Yeşilhisar",38.3379,35.0234],["Özvatan",39.1301,35.7379],["İncesu",38.696,35.163]],
  39:[["Babaeski",41.3538,27.109],["Demirköy",41.9384,27.8393],["Kofçaz",42.0556,27.1997],["Kırklareli merkez",41.9645,27.3863],["Lüleburgaz",41.3319,27.3984],["Pehlivanköy",41.3646,26.9433],["Pınarhisar",41.6805,27.5722],["Vize",41.6615,28.0065]],
  41:[["Akpınar",39.531,33.8887],["Akçakent",39.6416,34.0741],["Başiskele",40.6917,29.9172],["Boztepe",39.3243,34.3576],["Darıca",40.7752,29.3652],["Derince",40.8475,29.8663],["Dilovası",40.8127,29.5668],["Gebze",40.856,29.4938],["Gölcük",40.6927,29.8134],["Kaman",39.3479,33.5606],["Kandıra",41.1158,30.1304],["Karamürsel",40.6242,29.598],["Kartepe",40.6986,30.06],["Körfez",40.8262,29.7244],["Kırşehir merkez",39.0965,34.1118],["Mucur",39.0866,34.5006],["Çayırova",40.8397,29.3905],["Çiçekdağı",39.6969,34.2991],["İzmit",40.8213,29.9945]],
  42:[["Ahırlı",37.2685,32.0884],["Akören",37.315,32.3407],["Akşehir",38.3621,31.4655],["Altınekin",38.3258,32.9251],["Beyşehir",37.7203,31.6274],["Bozkır",37.2513,32.323],["Cihanbeyli",38.7751,32.7146],["Derbent",37.987,31.9842],["Derebucak",37.4192,31.6006],["Doğanhisar",38.1372,31.6513],["Emirgazi",37.9701,33.8283],["Ereğli",37.5859,33.9582],["Güneysınır",37.1461,32.7077],["Hadim",36.9721,32.5436],["Halkapınar",37.402,34.286],["Hüyük",37.9126,31.6441],["Ilgın",38.2673,31.922],["Kadınhanı",38.4058,32.2067],["Karapınar",37.7189,33.6014],["Karatay",37.9081,32.728],["Kulu",39.18,32.986],["Meram",37.7814,32.4418],["Sarayönü",38.4419,32.4592],["Selçuklu",37.9868,32.5308],["Seydişehir",37.4596,31.9062],["Taşkent",36.9277,32.5539],["Tuzlukçu",38.4818,31.6673],["Yalıhüyük",37.3216,32.08],["Yunak",38.9228,31.8085],["Çeltik",38.9915,31.7858],["Çumra",37.5087,32.7136]],
  43:[["Altıntaş",39.0286,30.0568],["Aslanapa",39.1936,29.7624],["Domaniç",39.7815,29.5412],["Dumlupınar",38.9094,30.0171],["Emet",39.3196,29.469],["Gediz Merkez",39.002,29.4908],["Hisarcık",39.197,29.2427],["Kütahya merkez",39.4343,30.0991],["Pazarlar",38.948,29.1089],["Simav",39.2923,28.9227],["Tavşanlı",39.5827,29.1744],["Çavdarhisar",39.2739,29.6178],["Şaphane",38.9646,29.1896]],
  44:[["Akçadağ",38.4478,37.973],["Arapgir",38.956,38.5426],["Arguvan",38.8331,38.2607],["Battalgazi",38.3505,38.398],["Darende",38.5297,37.69],["Doğanyol",38.2774,39.0393],["Doğanşehir",38.0821,37.8872],["Hekimhan",38.8327,37.9153],["Kale",38.3758,38.8021],["Kuluncak",38.8891,37.6838],["Pütürge",38.1971,38.843],["Yazıhan",38.5317,38.1039],["Yeşilyurt",38.3367,38.1889]],
  45:[["Ahmetli",38.5277,27.9021],["Akhisar",38.993,27.731],["Alaşehir",38.2321,28.4632],["Demirci",38.943,28.7174],["Gölmarmara",38.6814,27.9445],["Gördes",38.9529,28.3499],["Kula",38.6358,28.6347],["Köprübaşı",38.7234,28.4866],["Kırkağaç",39.2026,27.8079],["Salihli",38.4627,28.1333],["Saruhanlı",38.7428,27.686],["Sarıgöl",38.1873,28.6834],["Selendi",38.8169,28.7844],["Soma",39.1858,27.4919],["Turgutlu",38.4177,27.769],["Yunusemre",38.7582,27.2384],["Şehzadeler",38.5186,27.5399]],
  46:[["Afşin",38.387,36.8528],["Andırın",37.5441,36.3307],["Dulkadiroğlu",37.6431,37.0287],["Ekinözü",38.0091,37.0806],["Elbistan",38.2729,37.2582],["Göksun",38.126,36.444],["Nurhak",37.9127,37.429],["Onikişubat",37.5894,36.6785],["Pazarcık",37.469,37.2894],["Türkoğlu",37.2855,36.808],["Çağlayancerit",37.8596,37.4179]],
  47:[["Artuklu",37.2118,40.8072],["Dargeçit",37.4896,41.8181],["Derik",37.2531,40.0915],["Kızıltepe",37.0479,40.3932],["Mazıdağı",37.4639,40.4355],["Midyat",37.3978,41.4313],["Nusaybin",37.1299,41.3169],["Savur",37.5849,40.855],["Yeşilli",37.3298,40.855],["Ömerli",37.3773,40.9888]],
  48:[["Bodrum",37.055,27.3946],["Dalaman",36.6813,28.877],["Datça",36.738,27.6947],["Fethiye",36.6106,29.0349],["Kavaklıdere",37.5077,28.3247],["Köyceğiz",36.8729,28.6118],["Marmaris",36.762,28.146],["Menteşe",37.1261,28.267],["Milas",37.2008,27.621],["Ortaca",36.7407,28.6657],["Seydikemer",36.4255,29.3103],["Ula",37.0527,28.3521],["Yatağan",37.3143,28.1931]],
  49:[["Bulanık",39.1224,42.2072],["Hasköy",38.6896,41.7563],["Korkut",38.7109,41.9042],["Malazgirt",39.2179,42.4707],["Muş merkez",38.8271,41.5117],["Varto",39.0922,41.5339]],
  50:[["Acıgöl",38.5319,34.493],["Avanos",38.8546,34.9674],["Derinkuyu",38.399,34.7279],["Gülşehir",38.7564,34.4763],["Hacıbektaş",39.0058,34.6421],["Kozaklı",39.1777,34.8267],["Nevşehir merkez",38.5971,34.6678],["Ürgüp",38.5128,35.0202]],
  51:[["Altunhisar",38.0195,34.2851],["Bor",37.8892,34.5522],["Niğde (merkez)",38.2171,34.966],["Ulukisla",37.5542,34.6032],["Çamardı",37.8735,35.0665],["Çiftlik",38.1772,34.4811]],
  52:[["Akkuş",40.8955,36.8506],["Altınordu",40.9645,37.8379],["Aybastı",40.6407,37.394],["Fatsa",40.9721,37.5327],["Gölköy",40.6989,37.5416],["Gülyalı",40.9613,38.0681],["Gürgentepe",40.836,37.5901],["Kabadüz",40.7554,37.8897],["Kabataş",40.7352,37.4417],["Korgan",40.7317,37.327],["Kumru",40.8647,37.287],["Mesudiye",40.5694,37.7954],["Perşembe",41.0594,37.7323],["Ulubey",40.817,37.7478],["Çamaş",40.888,37.5421],["Çatalpınar",40.8589,37.4546],["Çaybaşı",40.9757,37.0689],["Ünye",41.086,37.2589],["İkizce",41.0227,36.9926]],
  53:[["Ardeşen",41.1885,41.0433],["Derepazarı",41.0221,40.4238],["Fındıklı",41.2695,41.1816],["Güneysu",40.9464,40.6327],["Hemşin",41.0121,40.889],["Kalkandere",40.898,40.4501],["Çamlıhemşin",40.8686,41.0026],["Çayeli",41.056,40.7251],["İkizdere",40.6787,40.6503],["İyidere",41.0082,40.365]],
  54:[["Adapazarı",40.8365,30.398],["Akyazı",40.6221,30.676],["Arifiye",40.6919,30.383],["Erenler",40.7091,30.4424],["Ferizli",40.9907,30.5048],["Geyve",40.4375,30.2899],["Hendek",40.8155,30.7626],["Karapürçek",40.6272,30.5407],["Karasu",41.0722,30.6555],["Kaynarca",41.0776,30.3708],["Kocaali",41.0162,30.8929],["Pamukova",40.504,30.1343],["Sapanca",40.6545,30.2795],["Serdivan",40.7825,30.3023],["Söğütlü",40.9028,30.4996],["Taraklı",40.4275,30.5087]],
  55:[["Alaçam",41.4876,35.5769],["Asarcık",41.0183,36.2956],["Atakum",41.3267,36.1312],["Ayvacık",40.9894,36.5715],["Bafra",41.4678,35.7953],["Canik",41.1843,36.3027],["Havza",41.0795,35.7468],["Kavak",41.1458,36.0729],["Ladik",40.9458,35.9174],["Ondokuzmayıs",41.4436,36.0688],["Salıpazarı",41.0298,36.8375],["Tekkeköy",41.1478,36.4535],["Terme",41.1351,36.9324],["Vezirköprü",41.1953,35.3683],["Yakakent",41.6036,35.4393],["Çarşamba",41.1352,36.6539],["İlkadım",41.2575,36.2603]],
  56:[["Baykan",38.1308,41.78],["Eruh",37.7385,42.0255],["Kurtalan",37.8959,41.6879],["Pervari",37.9297,42.4291],["Siirt (merkez)",37.8993,41.8673],["Tillo",37.9343,42.0551],["Şirvan",38.0073,42.2134]],
  57:[["Ayancık",41.9249,34.5886],["Boyabat",41.5439,34.79],["Dikmen",41.6206,35.3119],["Durağan",41.3726,35.3078],["Erfelek",41.9103,34.8576],["Gerze",41.7672,35.1543],["Saraydüzü",41.321,34.8216],["Sinop merkez",42.0128,35.1414],["Türkeli",41.9269,34.341]],
  58:[["Akıncılar",40.1012,38.4028],["Altınyayla",39.1689,36.7446],["Divriği",39.4052,38.0969],["Doğanşar",40.1734,37.5626],["Gemerek",39.1408,36.1008],["Gölova",40.0634,38.6545],["Gürün",38.8129,37.0121],["Hafik",39.9279,37.3659],["Kangal",39.0694,37.16],["Koyulhisar",40.3417,37.884],["Sivas merkez",39.7163,36.8162],["Suşehri",40.1772,38.13],["Ulaş",39.4401,37.1469],["Yıldızeli",39.7729,36.6295],["Zara",39.8092,37.7701],["İmranlı",39.6819,38.307],["Şarkışla",39.1852,36.4949]],
  59:[["Ergene",41.2546,27.7556],["Hayrabolu",41.2268,27.15],["Kapaklı",41.321,27.999],["Malkara",40.8848,26.9988],["Marmara Ereğlisi",41.0075,27.9021],["Muratlı",41.1737,27.421],["Saray",41.4906,27.9882],["Süleymanpaşa",40.9468,27.4741],["Çerkezköy",41.2929,28.0255],["Çorlu",41.1006,27.8589],["Şarköy",40.666,27.1526]],
  60:[["Almus",40.2869,37.1087],["Artova",40.1106,36.2528],["Başçiftlik",40.5655,37.2081],["Erbaa",40.7903,36.5579],["Niksar",40.5685,37.1159],["Pazar",40.275,36.2328],["Reşadiye",40.5387,37.3289],["Sulusaray",39.9726,36.0556],["Tokat merkez",40.2933,36.6118],["Turhal",40.4399,36.0934],["Yeşilyurt",40.0077,36.2395],["Zile",40.228,35.7737]],
  61:[["Akçaabat",41.0325,39.5307],["Araklı",40.8683,40.0143],["Arsin",40.9148,39.9384],["Beşikdüzü",41.0407,39.2089],["Dernekpazarı",40.7847,40.2599],["Düzköy",40.8504,39.3958],["Hayrat",40.7768,40.3775],["Maçka",40.7958,39.5899],["Of",40.9301,40.3083],["Ortahisar",40.985,39.7414],["Sürmene",40.8898,40.1377],["Tonya",40.8536,39.2838],["Vakfıkebir",41.0344,39.2923],["Yomra",40.9123,39.8531],["Çarşıbaşı",41.0765,39.3948],["Çaykara",40.6588,40.2972],["Şalpazarı",40.8617,39.1935]],
  62:[["Hozat",39.0998,39.1959],["Mazgirt",38.9349,39.7871],["Nazımiye",39.2003,39.8111],["Ovacık",39.3815,39.2632],["Pertek",38.9363,39.1985],["Pülümür",39.4927,40.0183],["Tunceli merkez",39.1537,39.644],["Çemişgezek",39.0315,38.9536]],
  63:[["Akçakale",36.7468,39.0297],["Birecik",36.9407,38.0973],["Bozova",37.3561,38.3529],["Ceylanpınar",36.9147,40.0111],["Eyyübiye",37.0633,38.9496],["Halfeti",37.2853,37.9692],["Haliliye",37.176,38.9685],["Harran",36.8526,39.2327],["Hilvan",37.5905,38.9639],["Karaköprü",37.275,38.7153],["Siverek",37.6113,39.3127],["Suruç",36.9413,38.3899],["Viranşehir",37.2409,39.8373]],
  64:[["Banaz",38.7541,29.7938],["Eşme",38.4569,28.97],["Karahallı",38.3453,29.5583],["Sivaslı",38.5092,29.6629],["Ulubey",38.3469,29.244],["Uşak merkez",38.6522,29.1471]],
  65:[["Bahçesaray",38.0905,42.8134],["Başkale",38.1012,44.3272],["Edremit",38.376,43.2691],["Erciş",38.9862,43.3265],["Gevaş",38.4029,42.917],["Gürpınar",38.2502,43.5059],["Muradiye",38.961,43.6454],["Saray",38.5587,44.2821],["Tuşba",38.7531,43.3312],["Çaldıran",39.1463,44.1295],["Çatak",38.0346,43.0573],["Özalp",38.7999,44.1813],["İpekyolu",38.5424,43.4759]],
  66:[["Akdağmadeni",39.8473,35.8703],["Aydıncık",40.1702,35.2563],["Boğazlıyan",39.0712,35.3467],["Kadışehri",39.9461,35.8618],["Saraykent",39.7918,35.575],["Sarıkaya",39.5165,35.4072],["Sorgun",39.8239,35.3055],["Yenifakılı",39.186,34.9922],["Yerköy",39.733,34.3206],["Yozgat merkez",39.8259,34.7542],["Çandır",39.192,35.5504],["Çayıralan",39.2607,35.69],["Çekerek",40.0419,35.4837],["Şefaatli",39.4483,34.7956]],
  67:[["Kilimli",41.5163,31.9049],["Kozlu",41.4086,31.7247],["Zonguldak merkez",41.4231,31.8211],["Çaycuma",41.528,32.074]],
  68:[["Aksaray merkez",38.4334,34.1228],["Ağaçören",38.7865,33.7844],["Eskil",38.2103,33.3874],["Gülağaç",38.4436,34.3578],["Güzelyurt",38.2805,34.3123],["Ortaköy",38.7782,34.1132],["Sarıyahşi",38.9707,33.7995],["Sultanhanı",38.2579,33.5406]],
  69:[["Aydıntepe",40.4524,40.1706],["Bayburt merkez",40.3274,40.3512],["Demirözü",40.096,39.8668]],
  70:[["Ayrancı",37.3787,33.8714],["Başyayla",36.7518,32.6778],["Ermenek",36.6103,32.9433],["Karaman merkez",37.0642,33.1523],["Kazımkarabekir",37.2658,32.9591],["Sarıveliler",36.6782,32.6058]],
  71:[["Bahşılı",39.7017,33.3443],["Balışeyh",39.9141,33.7563],["Delice",39.9221,34.0286],["Karakeçeli",39.5316,33.375],["Keskin",39.6325,33.7014],["Kırıkkale (merkez)",39.8679,33.5245],["Sulakyurt",40.2511,33.6995],["Yahşihan",39.9078,33.4072],["Çelebi",39.4941,33.4208]],
  72:[["Batman Merkez",37.8203,41.1805],["Beşiri",37.8437,41.5197],["Gercüş",37.6885,41.2788],["Hasankeyf",37.7229,41.4956],["Kozluk",38.1227,41.4186],["Sason",38.418,41.3121]],
  73:[["Beytüşşebap",37.5965,43.0937],["Cizre",37.2581,42.1225],["Güçlükonak",37.5278,41.8919],["Silopi",37.2479,42.6114],["Uludere",37.3516,43.0449],["İdil",37.3539,41.8176],["Şırnak merkez",37.5644,42.3987]],
  74:[["Amasra",41.7609,32.431],["Bartın merkez",41.641,32.258],["Kurucaşile",41.8284,32.6606],["Ulus",41.5311,32.6401]],
  75:[["Ardahan merkez",41.0552,42.7614],["Damal",41.3647,42.8392],["Göle",40.8376,42.4981],["Hanak",41.2229,42.9342],["Posof",41.5127,42.7755],["Çıldır",41.2336,43.1793]],
  76:[["Aralık",39.7486,44.6615],["Karakoyunlu",40.0003,44.2582],["Tuzluca",40.046,43.6115]],
  77:[["Altınova",40.6844,29.4947],["Armutlu",40.5151,28.8732],["Termal",40.5914,29.2069],["Yalova merkez",40.5846,29.2487],["Çiftlikköy",40.6582,29.3636],["Çınarcık",40.6306,29.0429]],
  78:[["Eflani",41.4704,32.9562],["Eskipazar",40.9859,32.6075],["Safranbolu",41.2565,32.7762]],
  79:[["Elbeyli",36.6971,37.4526],["Kilis (merkez)",36.7486,37.0014],["Musabeyli",36.8954,36.9718],["Polateli",36.8527,37.0634]],
  80:[["Bahçe",37.2089,36.5777],["Düziçi",37.3,36.4126],["Hasanbeyli",37.1231,36.5246],["Kadirli",37.4055,36.077],["Osmaniye (merkez)",37.1354,36.2654],["Sumbas",37.4984,36.0308],["Toprakkale",37.0602,36.1144]],
  81:[["Akçakoca",41.0615,31.0842],["Alaplı",41.1487,31.3919],["Cumayeri",40.9137,30.9263],["Devrek",41.2093,31.9517],["Düzce merkez",40.842,31.1834],["Ereğli",41.3015,31.4767],["Gökçebey",41.3163,32.1793],["Gölyaka",40.7583,30.9518],["Gümüşova",40.8475,30.9168],["Kaynaşlı",40.7448,31.3112],["Yığılca",40.9513,31.6022],["Çilimli",40.9034,31.0427]]
};


const CAR_FUELS = ["gas", "diesel", "lpg", "electric", "hybrid"];

function provByName(name) { return TR_PROVINCES.find((p) => p.name === name); }
function districtsFor(pName) { const p = provByName(pName); return (p && TR_DISTRICTS[p.plate]) || []; }
// Resolve a province+district selection to a routing point. District empty = province
// center (Merkez). Radar/checkpoint counts always come from the parent province.
function resolveLoc(pName, dName) {
  const prov = provByName(pName);
  if (!prov) return null;
  if (dName) {
    const d = (TR_DISTRICTS[prov.plate] || []).find((x) => x[0] === dName);
    if (d) return { label: dName + " / " + pName, lat: d[1], lng: d[2], prov };
  }
  return { label: pName, lat: prov.lat, lng: prov.lng, prov };
}
function haversineKm(a, b) {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function fmtDuration(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60), r = m % 60;
  if (h > 0) return state.lang === "tr" ? `${h} sa ${r} dk` : `${h} h ${r} min`;
  return state.lang === "tr" ? `${r} dk` : `${r} min`;
}
function fmtKm(km) { return locDec(Math.round(km)) + " km"; }
// The active car (used for route fuel cost). One unified "car" now = a vehicle with
// fuel specs + reminders + logged expenses. activeVehicle points at it; falls back to
// the first vehicle that has consumption + price set, else the first vehicle.
function activeVehicle() {
  const h = state.vehicleHub, vs = state.vehicles || [];
  return vs.find((v) => v.id === h.activeVehicle) || vs.find((v) => v.consumption && v.price) || vs[0] || null;
}
function fuelCost(km, veh) {
  if (!veh || !veh.consumption || !veh.price) return null;
  return (km / 100) * (veh.consumption || 0) * (veh.price || 0);
}

// ---- Build the province + district dropdowns + list bodies ----
function fillProvinceSelect(sel, val) {
  sel.innerHTML = `<option value="">${t("car_pick_province")}</option>` +
    TR_PROVINCES.map((p) => `<option value="${p.name}">${p.plate < 10 ? "0" + p.plate : p.plate} ${p.name}</option>`).join("");
  sel.value = val || "";
}
function fillDistrictSelect(sel, pName, val) {
  const ds = districtsFor(pName);
  sel.innerHTML = `<option value="">${t("car_center")}</option>` +
    ds.map((d) => `<option value="${d[0].replace(/"/g, "&quot;")}">${d[0]}</option>`).join("");
  sel.value = val || "";
  sel.disabled = !provByName(pName);
}
function buildCarHub() {
  const h = state.vehicleHub;
  if (!el.carFromP) return;
  fillProvinceSelect(el.carFromP, h.fromP);
  fillProvinceSelect(el.carToP, h.toP);
  fillDistrictSelect(el.carFromD, h.fromP, h.fromD);
  fillDistrictSelect(el.carToD, h.toP, h.toD);
  buildVehicles();
  refreshVehicles();
  renderCarRoute();
  buildCarHistory();
}

// ---- Route calculation ----
async function calcCarRoute() {
  const h = state.vehicleHub;
  const a = resolveLoc(h.fromP, h.fromD), b = resolveLoc(h.toP, h.toD);
  if (!a || !b) { h.lastRoute = null; renderCarRoute(); toastCar(t("car_need_provinces")); saveState(); return; }
  if (a.lat === b.lat && a.lng === b.lng) { h.lastRoute = null; renderCarRoute(); toastCar(t("car_same_province")); saveState(); return; }
  el.carCalc.disabled = true; el.carCalc.textContent = t("car_calculating");
  let km, mins, approx = false;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
    const r = await fetch(url);
    const j = await r.json();
    const route = j && j.routes && j.routes[0];
    if (route) { km = route.distance / 1000; mins = route.duration / 60; }
    else throw new Error("no route");
  } catch (e) {
    approx = true;
    km = haversineKm(a, b) * 1.3;
    mins = (km / 85) * 60;
  }
  el.carCalc.disabled = false; el.carCalc.textContent = t("car_calc");
  // Radar/checkpoint counts are province-level; sum both provinces (single count if
  // both endpoints are in the same province).
  const sameProv = a.prov.plate === b.prov.plate;
  h.lastRoute = {
    from: a.label, to: b.label, km, mins, approx,
    radar: sameProv ? a.prov.radar : a.prov.radar + b.prov.radar,
    corridor: sameProv ? a.prov.corridor : a.prov.corridor + b.prov.corridor,
    checkpoint: sameProv ? a.prov.checkpoint : a.prov.checkpoint + b.prov.checkpoint,
  };
  renderCarRoute();
  if (approx) toastCar(t("car_route_fail"));
  saveState();
}

function renderCarRoute() {
  const h = state.vehicleHub, r = h.lastRoute;
  if (!r) { el.carResults.hidden = true; el.carSaveTrip.hidden = true; el.carRouteMsg.hidden = true; return; }
  el.carResults.hidden = false; el.carSaveTrip.hidden = false;
  const veh = activeVehicle();
  const costOne = fuelCost(r.km, veh), costRound = costOne == null ? null : costOne * 2;
  const stat = (label, val) => `<div class="car-stat"><span class="car-stat-v">${val}</span><span class="car-stat-l">${label}</span></div>`;
  const cost = (label, val) => `<div class="car-cost"><span class="car-cost-l">${label}</span><span class="car-cost-v">${val == null ? "—" : formatMoney(val)}</span></div>`;
  el.carResults.innerHTML = `
    <div class="car-stats">
      ${stat(t("car_distance"), fmtKm(r.km))}
      ${stat(t("car_duration"), fmtDuration(r.mins))}
      ${stat(t("car_radar"), r.radar)}
      ${stat(t("car_corridor"), r.corridor)}
      ${stat(t("car_checkpoint"), r.checkpoint)}
    </div>
    <div class="car-costs">
      ${cost(t("car_cost_one"), costOne)}
      ${cost(t("car_cost_round"), costRound)}
    </div>
    ${costOne == null ? `<p class="car-hint">${t("car_no_profile")}</p>` : ""}`;
  el.carRouteMsg.hidden = true;
}

function saveCarTrip() {
  const h = state.vehicleHub, r = h.lastRoute;
  if (!r) return;
  const veh = activeVehicle();
  const costOne = fuelCost(r.km, veh);
  h.trips.unshift({
    id: "ct" + ++h.seq, date: new Date().toISOString().slice(0, 10),
    from: r.from, to: r.to, km: r.km, mins: r.mins,
    radar: r.radar, corridor: r.corridor, checkpoint: r.checkpoint,
    fuelOne: costOne, fuelRound: costOne == null ? null : costOne * 2,
    profile: veh ? (veh.plate || "") : "",
  });
  buildCarHistory();
  toastCar(t("car_trip_saved"));
  saveState();
}

// ---- Trip history (list + running fuel total) ----
function buildCarHistory() {
  const h = state.vehicleHub;
  el.carHistList.innerHTML = "";
  if (!h.trips.length) { el.carHistList.innerHTML = `<p class="car-empty">${t("car_history_empty")}</p>`; return; }
  h.trips.forEach((tr) => {
    const row = document.createElement("div");
    row.className = "car-trip";
    const round = tr.fuelRound == null ? "—" : formatMoney(tr.fuelRound);
    row.innerHTML = `
      <div class="car-trip-main">
        <div class="car-trip-route"><b>${tr.from} → ${tr.to}</b><span class="car-trip-date">${tr.date}</span></div>
        <div class="car-trip-meta">${fmtKm(tr.km)} · ${fmtDuration(tr.mins)} · ${t("car_radar")} ${tr.radar} · ${t("car_checkpoint")} ${tr.checkpoint}</div>
      </div>
      <div class="car-trip-right">
        <span class="car-trip-cost">${round}</span><small>${t("car_roundtrip_label")}</small>
        <button class="cat-remove" type="button" data-ct-del aria-label="remove">×</button>
      </div>`;
    row.querySelector("[data-ct-del]").addEventListener("click", () => {
      h.trips = h.trips.filter((x) => x.id !== tr.id);
      buildCarHistory(); saveState();
    });
    el.carHistList.appendChild(row);
  });
  const total = h.trips.reduce((a, tr) => a + (tr.fuelRound || 0), 0);
  if (total > 0) {
    const foot = document.createElement("div");
    foot.className = "car-hist-total";
    foot.innerHTML = `<span>${t("car_report_total")}</span><span>${formatMoney(total)}</span>`;
    el.carHistList.appendChild(foot);
  }
}

function toastCar(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg; toast.classList.add("show");
  clearTimeout(toastCar._t); toastCar._t = setTimeout(() => toast.classList.remove("show"), 2200);
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
  return { price, ccy: meta ? meta.currency : null, chg24: pct(price, prev), chg1mo: valid.length > 22 ? pct(price, valid[valid.length - 22]) : null, chg1y: valid.length ? pct(price, valid[0]) : null, spark: valid.slice(-8) };
}
// Full quote (price + 24h/1mo/1yr %) — serverless first, public proxy fallback.
async function fetchStockData(symbol) {
  try {
    const r = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}&range=1y`);
    if (r.ok) { const j = await r.json(); if (typeof j.price === "number") return { price: j.price, ccy: j.currency, chg24: j.chg24, chg1mo: j.chg1mo, chg1y: j.chg1y, spark: j.spark || null }; }
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
  const pool = [
    { type: "gold", key: "gold", name: t("asset_gold"), sym: "XAU", tag: t("asset_gold") },
    { type: "goldoz", key: "goldoz", name: t("asset_gold_oz"), sym: "XAU", tag: t("asset_gold") },
  ];
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
// Tiny 7-day trend line from a price series (crypto: hourly, stocks: daily closes).
function sparklineSvg(series) {
  const pts = (Array.isArray(series) ? series : []).filter((p) => typeof p === "number" && isFinite(p));
  if (pts.length < 2) return "";
  let arr = pts;
  if (arr.length > 32) { arr = []; const step = pts.length / 32; for (let i = 0; i < 32; i++) arr.push(pts[Math.floor(i * step)]); arr.push(pts[pts.length - 1]); }
  const min = Math.min(...arr), max = Math.max(...arr), range = max - min || 1;
  const W = 60, H = 22, pad = 2, n = arr.length;
  const coords = arr.map((v, i) => `${(pad + (i / (n - 1)) * (W - 2 * pad)).toFixed(1)},${(pad + (1 - (v - min) / range) * (H - 2 * pad)).toFixed(1)}`).join(" ");
  const up = arr[arr.length - 1] >= arr[0];
  return `<svg class="watch-spark ${up ? "up" : "down"}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${coords}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
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
  let suffix = "", value = d.price;
  if (w.type === "gold") { value = d.price * goldFactor(); suffix = "/" + goldUnit(); }
  else if (w.type === "goldoz") { value = d.price * GRAMS_PER_OZ; suffix = "/oz"; } // always per ounce
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
  if (w.type === "gold" || w.type === "goldoz") return "TVC:GOLD";
  if (w.type === "silver") return "TVC:SILVER";
  if (w.type === "index") return "TVC:" + sym; // TVC:SPX / TVC:NDX / TVC:DJI
  if (w.type === "crypto") return "CRYPTO:" + sym + "USD"; // TradingView's aggregated index — far broader than a single exchange's USDT pairs
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
          ${sparklineSvg(d.spark)}
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
  if (state.watchlist.some((w) => w.type === "gold" || w.type === "goldoz")) ids.push("pax-gold");
  if (ids.length) {
    try {
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs}&ids=${ids.join(",")}&price_change_percentage=24h,30d,1y&sparkline=true`);
      if (r.ok) {
        (await r.json()).forEach((c) => {
          const d = { price: c.current_price, chg24: c.price_change_percentage_24h_in_currency, chg1mo: c.price_change_percentage_30d_in_currency, chg1y: c.price_change_percentage_1y_in_currency, spark: (c.sparkline_in_7d && c.sparkline_in_7d.price) || null };
          if (c.id === "pax-gold") {
            const g = Object.assign({}, d, { price: c.current_price / GRAMS_PER_OZ }); // per-gram in active ccy
            watchData["gold"] = g; watchData["goldoz"] = g; // ounce row derives from the same data
          } else watchData[c.id] = d;
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
function trChgHtml(v) {
  return typeof v === "number" ? `<span class="tr-chg ${v >= 0 ? "up" : "down"}">${v >= 0 ? "+" : ""}${v.toFixed(2)}%</span>` : "";
}
function trRow(name, price, chg24) {
  return `<div class="tr-row"><span class="tr-name">${name}</span><span class="tr-vals"><span class="tr-price">${price}</span>${trChgHtml(chg24)}</span></div>`;
}
// One flat list (no headings): BIST 100, USD/TRY, EUR/TRY, gram / quarter / full gold.
function trListHtml(bist, usdtry, eurtry) {
  const gram = goldPriceGram; // TL per gram when on TL
  const fx = (d, isTry) => d && d.price != null ? (isTry ? "₺" : "$") + fmtPrice(d.price) : "…";
  const gold = (m) => gram > 0 ? formatMoney(gram * m) : "…";
  return [
    trRow("BIST 100", bist && bist.price != null ? fmtPrice(bist.price) : "…"),
    trRow("USD/TRY", fx(usdtry, true)),
    trRow("EUR/TRY", fx(eurtry, true)),
    trRow(t("gold_gram"), gold(GOLD_COIN_MULT.gram)),
    trRow(t("gold_quarter"), gold(GOLD_COIN_MULT.quarter)),
    trRow(t("gold_full"), gold(GOLD_COIN_MULT.full)),
  ].join("");
}
async function buildTrPanel() {
  const sec = document.getElementById("trPanel");
  if (!sec) return;
  if (state.currency !== "TL") { sec.hidden = true; return; }
  sec.hidden = false;
  const listEl = document.getElementById("trList");
  if (!listEl) return;
  // Gold is instant; index/forex fill in once fetched (show "…" placeholders meanwhile).
  listEl.innerHTML = trListHtml(null, null, null);
  const [bist, usdtry, eurtry] = await Promise.all([getFxQuote("XU100.IS"), getFxQuote("TRY=X"), getFxQuote("EURTRY=X")]);
  if (state.currency !== "TL") return; // currency changed mid-fetch
  listEl.innerHTML = trListHtml(bist, usdtry, eurtry);
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
  buildCarHub();
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
el.carCalc.addEventListener("click", calcCarRoute);
el.carSaveTrip.addEventListener("click", saveCarTrip);
el.carFromP.addEventListener("change", () => { const h = state.vehicleHub; h.fromP = el.carFromP.value; h.fromD = ""; fillDistrictSelect(el.carFromD, h.fromP, ""); saveState(); });
el.carFromD.addEventListener("change", () => { state.vehicleHub.fromD = el.carFromD.value; saveState(); });
el.carToP.addEventListener("change", () => { const h = state.vehicleHub; h.toP = el.carToP.value; h.toD = ""; fillDistrictSelect(el.carToD, h.toP, ""); saveState(); });
el.carToD.addEventListener("change", () => { state.vehicleHub.toD = el.carToD.value; saveState(); });
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
    document.getElementById("view-car").hidden = name !== "car";
    document.getElementById("view-settings").hidden = name !== "settings";
    document.getElementById("view-portfolio").hidden = name !== "portfolio";
    document.getElementById("view-income").hidden = name !== "income";
    document.getElementById("view-watch").hidden = name !== "watch";
    if (name === "savings") { rollExpenseMonth(); buildExpenses(); }
    if (name === "car") buildCarHub();
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
      vehicleHub: state.vehicleHub,
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
      id: v.id, plate: v.plate || "", fuel: v.fuel || "gas", consumption: v.consumption || 0, price: v.price || 0,
      sched: v.sched || [], oneoff: v.oneoff || [],
      schedSeq: v.schedSeq || (v.sched ? v.sched.length : 0), expSeq: v.expSeq || (v.oneoff ? v.oneoff.length : 0),
    }));
  }
  if (typeof s.vehSeq === "number") state.vehSeq = s.vehSeq;
  if (s.vehicleHub && typeof s.vehicleHub === "object") {
    const v = s.vehicleHub;
    state.vehicleHub = {
      activeVehicle: v.activeVehicle || "",
      trips: Array.isArray(v.trips) ? v.trips : [],
      fromP: v.fromP || v.from || "", fromD: v.fromD || "", toP: v.toP || v.to || "", toD: v.toD || "",
      lastRoute: v.lastRoute || null, seq: v.seq || 0,
    };
    // Migrate legacy separate car "profiles" onto vehicles (fuel specs merged into the car).
    if (Array.isArray(v.profiles) && v.profiles.length) {
      v.profiles.forEach((p, i) => {
        let veh = state.vehicles[i];
        if (!veh) { veh = { id: "v" + ++state.vehSeq, plate: "", fuel: "gas", consumption: 0, price: 0, sched: [], oneoff: [], schedSeq: 0, expSeq: 0 }; state.vehicles.push(veh); }
        if (!veh.plate && p.name) veh.plate = p.name;
        if (!veh.consumption && p.consumption) veh.consumption = p.consumption;
        if (!veh.price && p.price) veh.price = p.price;
        if (p.fuel) veh.fuel = p.fuel;
      });
    }
  }
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
