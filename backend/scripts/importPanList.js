const db = require('../src/config/db');

const panList = [
  { name: 'Agraj Import Export', pan: '608671808' },
  { name: 'Alfa Emporium Pvt. Ltd', pan: '609555701' },
  { name: 'Ali Enterprises', pan: '608027588' },
  { name: 'Arati Trading Suppliers', pan: '609434323' },
  { name: 'B S Furnishing And Decore', pan: '612981265' },
  { name: 'B.K Trade Link', pan: '605828168' },
  { name: 'B.S Inteernational Pvt. Ltd.', pan: '606002732' },
  { name: 'Baba Bishwokarma Traders', pan: '300979091' },
  { name: 'Beauty Box Nepal Pvt. Ltd.', pan: '604354286' },
  { name: 'Bhagbati General Store', pan: '600419547' },
  { name: 'Bhairab Clothing Store', pan: '616556599' },
  { name: 'Bhairab Readymade And Clothing Store', pan: '603986974' },
  { name: 'Bhairabi Thread Udhyog', pan: '500219760' },
  { name: 'Bhoto Store Pvt. Ltd.', pan: '606870403' },
  { name: 'Bidhya Suppliers', pan: '300535249' },
  { name: 'Bikash Knitting and Sales Pvt. Ltd.', pan: '609889518' },
  { name: 'Bishnu Joshi International Business Pvt. Ltd.', pan: '609891575' },
  { name: 'BS Trade Enterprises', pan: '600427454' },
  { name: 'Byte Care Technology', pan: '609755839' },
  { name: 'C S Traders', pan: '605243798' },
  { name: 'Capital Fashion', pan: '302000388' },
  { name: 'Chandeswori Fashion Industries Pvt. Ltd.', pan: '606625931' },
  { name: 'Chandra Binayak Look Shop', pan: '600995081' },
  { name: 'Chaudhary Traders Pvt. Ltd.', pan: '609759198' },
  { name: 'Cimraj Processors Pvt. Ltd.', pan: '601621934' },
  { name: 'City Maxx Suppliers', pan: '303009597' },
  { name: 'CP Max Suppliers', pan: '603009597' },
  { name: 'Cube Group Pvt. Ltd', pan: '609994236' },
  { name: 'D N D Dry Cleaner Pvt. Ltd.', pan: '609725827' },
  { name: 'D Square Enterprises', pan: '619852511' },
  { name: 'Dantakali International', pan: '604198943' },
  { name: 'Dev Bahadur Pun', pan: null },
  { name: 'Dezire Gents Wear', pan: '600234629' },
  { name: 'Dish Media Network Ltd', pan: '303974352' },
  { name: 'Divya Enterprises', pan: '304493829' },
  { name: 'Ejesn Suppliers', pan: '304762916' },
  { name: 'Enaya Impex Jhapa', pan: '618849622' },
  { name: 'Fancy Manakamana Readymade Center', pan: '610718678' },
  { name: 'Fashion Frenzy Traders Pvt. Ltd.', pan: '619871093' },
  { name: 'Garment Sewa', pan: '611255862' },
  { name: 'Glam Up Business Pvt. Ltd.', pan: '605958157' },
  { name: 'Global Tyre & Accssories', pan: '600542979' },
  { name: 'Gulmeli Fancy Collection', pan: '6165453000' },
  { name: 'Hars Order Suppliers', pan: '616799123' },
  { name: 'Hilton Trading & Suppliers Pvt. Ltd.', pan: '609581708' },
  { name: 'Him Electronics Pvt. Ltd.', pan: '300044627' },
  { name: 'Himalayan Accessories Pvt. Ltd.', pan: '602405191' },
  { name: 'Hira Textile', pan: '304132665' },
  { name: 'Iftekhar Enterprises', pan: '3035226774' },
  { name: 'I-Max Traders Pvt. Ltd.', pan: '609548675' },
  { name: 'Jay Maa Bishnu Devi Import Pvt. Ltd.', pan: '610025211' },
  { name: 'Jay Shree Gin Bhawani Impex', pan: '600571274' },
  { name: 'Jyoti Traders & Suppliers', pan: '600436782' },
  { name: 'K And K Enterprises Ithari', pan: '604022099' },
  { name: 'K.S Electrics & Electronics', pan: '30887650' },
  { name: 'Kasmi Silai Udhyog', pan: '608571461' },
  { name: 'Khanal Readymade Pashal', pan: '302086560' },
  { name: 'Lakhan Traders', pan: '618915013' },
  { name: 'Lot House Readymade Center', pan: '612352676' },
  { name: 'Lotse Attires Pvt. Ltd', pan: '610201891' },
  { name: 'M & M Motercycle Shoppie', pan: '302417580' },
  { name: 'Mahadev Impex Pvt. Ltd.', pan: '609925508' },
  { name: 'Manisha Tradelink Nepalgunj', pan: '603713428' },
  { name: 'Maruti Textiles', pan: '302083354' },
  { name: 'Millennials Choice Clothing', pan: '133298950' },
  { name: 'Mouse The Fashion Guide', pan: '303372998' },
  { name: 'Muskan Traders', pan: '600805142' },
  { name: 'Nabi New Garnments', pan: '620858650' },
  { name: 'Nabin Dhakal', pan: '134028178' },
  { name: 'Neha International Company Pvt. Ltd.', pan: '606006914' },
  { name: 'Nepal Youth Foundation Nepal', pan: '601130254' },
  { name: 'New Bhupendra Generals Stores', pan: '605210488' },
  { name: 'New Lalita Emporium', pan: '603143252' },
  { name: 'New Pashupati Readymade Ithari', pan: '0' },
  { name: 'New Simran Enterprises', pan: '301122991' },
  { name: 'New Suresh Enterprises', pan: '300155954' },
  { name: 'Niranjan Kapada Tatha Katran Sankalan Pvt. Ltd.', pan: '619780463' },
  { name: 'O D K P International Trading Pvt. Ltd.', pan: '610305269' },
  { name: 'O S T Denim Pvt. Ltd.', pan: '610252156' },
  { name: 'Om Shanti Traders Ithari', pan: '601072468' },
  { name: 'Om Trade And Suppliers', pan: '600378314' },
  { name: 'Om Wears', pan: '601064355' },
  { name: 'Omega International Secondary School Pvt. Ltd.', pan: '302540060' },
  { name: 'Prithivi Sale Center', pan: '605415810' },
  { name: 'R S & M Trade Suppliers', pan: '600303141' },
  { name: 'Raj And Gautam Suppliers', pan: '603772124' },
  { name: 'Ready Fit Fashion House', pan: '610021000' },
  { name: 'Riddhi Siddhi Emporium Pvt. Ltd.', pan: '610314957' },
  { name: 'Royal Fabric Enterprises', pan: '608294946' },
  { name: 'Sajilo Marmat Sewa Pvt. Ltd.', pan: '605935136' },
  { name: 'Satish Kapadha Tatha Materials Store', pan: '601393080' },
  { name: 'Shikha Trade International Pvt. Ltd.', pan: '602495130' },
  { name: 'Shree Airlines Ltd', pan: '500044520' },
  { name: 'Shree Krishna Secondary School', pan: '201332643' },
  { name: 'Shree Nil Barahi Enterprises', pan: '601398696' },
  { name: 'Shuva Parthiva Enterprises', pan: '300167210' },
  { name: 'Sierra Attires Pvt. Ltd', pan: '619762614' },
  { name: 'Sishu Enterprises', pan: '601398027' },
  { name: 'Softshine Business', pan: '609875645' },
  { name: 'Sumeru Hospital', pan: '302984275' },
  { name: 'Sunapati Emporium', pan: '600371760' },
  { name: 'Sudraniya Impex', pan: '300144453' },
  { name: 'Trend Town', pan: '128613900' },
  { name: 'U I N Collection', pan: '612317293' },
  { name: 'U I N Suppliers', pan: '612886267' },
  { name: 'Unique Ideal Automobiles Pvt Ltd', pan: '305081445' },
  { name: 'Unite Winery Pvt Ltd', pan: '610151417' },
  { name: 'Worldlink Communication Ltd', pan: '300073250' },
  { name: 'Pathibhara Devi Readymade Center', pan: '617362179' },
  { name: 'Lagankhel Electronics Center', pan: '608445580' },
  { name: 'Safeway Trade and Suppliers Pvt. Ltd.', pan: '609617335' },
  { name: 'Hitech Print and Paper Concern', pan: '300303078' },
  { name: 'Hukut Store Pvt. Ltd.', pan: '610066528' },
  { name: 'S.R.J Fabric', pan: '603801541' },
  { name: 'Breeze Trade Concern Pvt. Ltd', pan: '606602338' },
  { name: 'Khumaltar Youth Club', pan: '303433426' },
  { name: 'Young Forever', pan: '601113154' },
  { name: 'Tanju International Pvt. Ltd', pan: '300705777' },
  { name: 'New R.S.K Enterprises', pan: '303733856' },
  { name: 'Swati Impex', pan: '301809087' },
  { name: 'Focus Jeans Center', pan: '616737222' },
  { name: 'Shree Balodaya Basic School', pan: '201352469' },
  { name: 'Samana Multi Skill Institute Pra.Li', pan: '603935677' },
  { name: 'Janaki Polychem Pvt. Ltd.', pan: '610167331' },
  { name: 'Roy Group of Company Pvt. Ltd', pan: '606619062' },
  { name: 'Gecko Gears', pan: '1128915010' },
  { name: 'Sewing Solution Nepal', pan: '134932350' },
  { name: 'Guru Kripa fabric', pan: '605587360' },
  { name: 'New TNF', pan: '618430903' },
  { name: 'Ashmita Readymade Store', pan: '301396411' },
  { name: 'Amit Fanshy Store', pan: '605160969' },
  { name: 'New Dhawalagiri Basu Store', pan: '302971585' },
  { name: 'Rastriya Maato Bigyan Anushandhan Kendra Lalitpur', pan: null },
  { name: 'Jun Tara Cloth', pan: '122835099' },
  { name: 'Electra World Corporation Pvt Ltd', pan: '609595880' },
  { name: 'RSR Enterprises', pan: '603976270' },
  { name: 'APF Nepal No. 12 BIN HQ Bara', pan: null },
  { name: 'APF Nepal No. 13 BIN HQ Parsa', pan: null },
  { name: 'Hari Bahadur Ghale', pan: null },
  { name: 'Attire Zone', pan: '109622000' },
  { name: 'Bhanja Brothers', pan: '603073692' },
  { name: 'Pranisha Trade Link', pan: '606348593' },
  { name: 'Outfit Fashion', pan: '610583199' },
  { name: 'Mun Denium Pvt. Ltd', pan: '623522756' },
  { name: 'NKF Traders', pan: '129655390' },
  { name: 'Yuwaz Fashion Wear', pan: '615393281' },
  { name: 'New Shreya Impex', pan: '601174351' },
  { name: 'Kali Devi Export and Import Pvt. Ltd.', pan: '600238470' },
  { name: 'Kalki Traders', pan: '300021796' },
  { name: 'Shristi International', pan: '601391312' },
  { name: 'Standard Import Traders', pan: '618742387' },
  { name: 'Nabin Alisha Enterprises', pan: '605578087' },
  { name: 'Arbin and subin enterprises', pan: '60274161' },
  { name: 'B N CO Enterprises', pan: '106779396' },
  { name: 'Sampada Suppliers', pan: '600480406' },
  { name: 'PK Hub', pan: '620901406' },
  { name: 'World Enterprises', pan: '609281291' },
  { name: 'Vesraj And Nobel Suppliers Pvt.Ltd.', pan: '609929214' },
  { name: 'ISHAN ENTERPRISES & TRADERS', pan: '304924260' },
  { name: 'Thanapati Suppliers and Trades', pan: '601611931' },
  { name: 'B. S.S. Traders', pan: '603978906' },
  { name: 'R G Trade link', pan: '600105659' },
  { name: 'Divyanshu International', pan: '623030028' },
  { name: 'MAS Fabric Pvt Ltd', pan: '622504393' },
];

const normalizePan = (panValue) => {
  if (!panValue) return null;
  const cleaned = String(panValue).trim();
  if (!cleaned || cleaned === '-' || cleaned === '0') return null;
  return cleaned;
};

const importCustomers = async () => {
  let inserted = 0;
  let updated = 0;

  for (const { name, pan } of panList) {
    const panNumber = normalizePan(pan);
    const [rows] = await db.query('SELECT id FROM customers WHERE pan_number = ?', [panNumber]);

    if (rows.length > 0) {
      await db.run(
        'UPDATE customers SET customer_name = ?, company_name = ?, pan_number = ? WHERE id = ?',
        [name, name, panNumber, rows[0].id]
      );
      updated += 1;
    } else {
      await db.run(
        'INSERT INTO customers (customer_name, company_name, pan_number) VALUES (?, ?, ?)',
        [name, name, panNumber]
      );
      inserted += 1;
    }
  }

  console.log(`Import completed: ${inserted} inserted, ${updated} updated.`);
  process.exit(0);
};

importCustomers().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
