/**
 * ZKTeco Local Agent
 * يقرأ ملف att2000.mdb ويرسل الحضور الجديد للسيرفر تلقائياً
 *
 * التشغيل:
 *   node agent.js          (مرة واحدة)
 *   node agent.js --loop   (يعمل باستمرار كل X دقيقة)
 */

const ADODB  = require("node-adodb");
const https  = require("https");
const http   = require("http");
const fs     = require("fs");
const path   = require("path");
const config = require("./config");

const STATE_FILE = path.join(__dirname, ".last_sync");

// ─── قراءة آخر وقت مزامنة ────────────────────────────────────────────────────
function getLastSync() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8").trim();
    return new Date(raw);
  } catch {
    // أول تشغيل: ابدأ من اليوم
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}

function saveLastSync(date) {
  fs.writeFileSync(STATE_FILE, date.toISOString(), "utf8");
}

// ─── الاتصال بقاعدة بيانات Access ────────────────────────────────────────────
function openDB() {
  const connStr =
    `Provider=Microsoft.Jet.OLEDB.4.0;` +
    `Data Source=${config.device.mdbPath};` +
    `Persist Security Info=False;`;
  return ADODB.open(connStr);
}

// ─── سحب سجلات الحضور من جدول CHECKINOUT ─────────────────────────────────────
async function fetchAttendance(since) {
  const db = openDB();
  const sinceStr = since.toISOString().replace("T", " ").substring(0, 19);
  const sql = `
    SELECT c.USERID, c.CHECKTIME, c.CHECKTYPE, u.Badgenumber, u.Name
    FROM CHECKINOUT AS c
    LEFT JOIN USERINFO AS u ON c.USERID = u.USERID
    WHERE c.CHECKTIME > #${sinceStr}#
    ORDER BY c.CHECKTIME ASC
  `;
  return await db.query(sql);
}

// ─── تحويل السجلات لصيغة السيرفر ─────────────────────────────────────────────
function formatLogs(rows) {
  return rows.map(row => ({
    uid: String(row.Badgenumber || row.USERID),
    timestamp: new Date(row.CHECKTIME).toISOString(),
    status: row.CHECKTYPE === 0 ? "check_in" : "check_out",
    name: row.Name || "",
  }));
}

// ─── إرسال البيانات للسيرفر ───────────────────────────────────────────────────
function postToServer(logs) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      serialNumber: config.device.serialNumber,
      deviceName:   config.device.name,
      logs,
    });

    const url    = new URL(config.server.url);
    const lib    = url.protocol === "https:" ? https : http;
    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === "https:" ? 443 : 80),
      path:     url.pathname,
      method:   "POST",
      headers:  {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(config.server.apiKey ? { "X-Agent-Key": config.server.apiKey } : {}),
      },
    };

    const req = lib.request(options, res => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });

    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(body);
    req.end();
  });
}

// ─── الدالة الرئيسية ──────────────────────────────────────────────────────────
async function run() {
  const now     = new Date();
  const since   = getLastSync();
  const sinceStr = since.toISOString().replace("T", " ").substring(0, 16);

  console.log(`[${timestamp()}] بدء المزامنة — منذ: ${sinceStr}`);
  console.log(`[${timestamp()}] الجهاز: ${config.device.mdbPath}`);

  let rows;
  try {
    rows = await fetchAttendance(since);
  } catch (err) {
    console.error(`[${timestamp()}] ✗ خطأ في قراءة قاعدة البيانات:`, err.message);
    console.error("  تأكد من مسار الملف في config.js وأن البرنامج ليس مفتوحاً بشكل حصري");
    return;
  }

  if (!rows || rows.length === 0) {
    console.log(`[${timestamp()}] ✓ لا توجد سجلات جديدة`);
    return;
  }

  const logs = formatLogs(rows);
  console.log(`[${timestamp()}] وُجد ${logs.length} سجل جديد — إرسال للسيرفر...`);

  try {
    const result = await postToServer(logs);
    if (result.status === 200) {
      const res = JSON.parse(result.body);
      console.log(`[${timestamp()}] ✓ نجح الإرسال — مستورد: ${res.imported}, مكرر: ${res.duplicates}`);
      saveLastSync(now);
    } else {
      console.error(`[${timestamp()}] ✗ السيرفر أرجع خطأ ${result.status}: ${result.body}`);
    }
  } catch (err) {
    console.error(`[${timestamp()}] ✗ خطأ في الاتصال بالسيرفر:`, err.message);
  }
}

function timestamp() {
  return new Date().toLocaleTimeString("ar-SA");
}

// ─── تشغيل مرة أو حلقة مستمرة ────────────────────────────────────────────────
const loopMode = process.argv.includes("--loop");

if (loopMode) {
  const intervalMs = config.sync.intervalMinutes * 60 * 1000;
  console.log(`تشغيل تلقائي كل ${config.sync.intervalMinutes} دقيقة`);
  run();
  setInterval(run, intervalMs);
} else {
  run().catch(console.error);
}
