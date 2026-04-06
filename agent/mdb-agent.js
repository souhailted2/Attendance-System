#!/usr/bin/env node
/**
 * ZKTeco MDB Agent - قارئ قاعدة بيانات برنامج ZKTeco
 * يقرأ بيانات الحضور من ملف att2000.mdb ويرسلها للموقع تلقائياً
 *
 * الاستخدام:
 *   node mdb-agent.js              - تشغيل مرة واحدة
 *   node mdb-agent.js --watch      - تشغيل دوري كل INTERVAL_MINUTES دقيقة
 */

const _mdbModule = require("mdb-reader");
const MDBReader = _mdbModule.default || _mdbModule.MDBReader || _mdbModule;
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

// ── ترميز Windows-1256 (مطلوب، غير اختياري) ────────────────────────────────
const iconv = (() => {
  try { return require("iconv-lite"); }
  catch (e) {
    console.error("❌ مكتبة iconv-lite غير موجودة. شغّل: npm install");
    process.exit(1);
  }
})();

// فك ترميز حقل نصي قادم من قاعدة MDB (Windows-1256 → Unicode)
// المسار الأساسي: Buffer مباشر أو Latin-1 → win1256
// الاستثناء: إذا كانت القيمة تحتوي على أحرف عربية Unicode بالفعل، تُعاد كما هي
function decodeMdbName(rawValue) {
  if (!rawValue && rawValue !== 0) return "";

  // مسار Buffer المباشر: إذا أعاد mdb-reader Buffer خام، نفكّه مباشرةً كـ win1256
  if (Buffer.isBuffer(rawValue)) {
    try {
      const decoded = iconv.decode(rawValue, "win1256");
      if (/[\u0600-\u06FF]/.test(decoded)) return decoded.trim();
    } catch {}
    return rawValue.toString("utf8").trim();
  }

  const str = String(rawValue);
  if (!str.trim()) return str;

  // مسار UTF-8: النص يحتوي فعلاً على أحرف عربية Unicode
  if (/[\u0600-\u06FF]/.test(str)) return str.trim();

  // نص ASCII خالص (أرقام/رموز فقط) — لا حاجة لإعادة الترميز
  if (/^[\x00-\x7F]*$/.test(str)) return str.trim();

  // المسار الأساسي (Latin-1 → win1256): نعامل القيمة كـ Latin-1 bytes ونفك ترميزها
  try {
    const buf = Buffer.from(str, "latin1");
    const decoded = iconv.decode(buf, "win1256");
    if (/[\u0600-\u06FF]/.test(decoded)) return decoded.trim();
  } catch {}

  // رجوع: إعادة القيمة الأصلية إذا فشل الفك
  return str.trim();
}

// ── اختبار الترميز عند بدء التشغيل ──────────────────────────────────────────
function selfTestEncoding() {
  // بايتات Windows-1256 لـ "محمد" = [0xE3, 0xCD, 0xE3, 0xCF]
  const garbledLatin1 = Buffer.from([0xE3, 0xCD, 0xE3, 0xCF]).toString("latin1");
  const result = decodeMdbName(garbledLatin1);
  if (!/[\u0600-\u06FF]/.test(result)) {
    console.warn("⚠️  تحذير: فك ترميز Windows-1256 لم ينجح على العينة التجريبية");
  }
  // نص عربي سليم — يجب أن يُعاد كما هو
  const alreadyArabic = "محمد علي";
  if (decodeMdbName(alreadyArabic) !== alreadyArabic) {
    console.warn("⚠️  تحذير: النص العربي السليم تغيّر بعد decodeMdbName");
  }
}

// ── تحميل إعدادات .env ─────────────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ ملف .env غير موجود. أنشئه أولاً أو حمّل الحزمة من الموقع.");
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, "utf-8")
  .split(/\r?\n/)
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  });

const SERVER_URL    = (env.SERVER_URL || "").replace(/\/$/, "");
const AGENT_API_KEY = env.AGENT_API_KEY || "";
const DB_PATH       = env.DB_PATH || "C:\\Program Files (x86)\\ZKTeco\\ZKTeco\\att2000.mdb";
const DAYS_BACK     = parseInt(env.DAYS_BACK || "30", 10);
const SYNC_EMPLOYEES = env.SYNC_EMPLOYEES !== "false";
const INTERVAL_MINUTES = parseInt(env.INTERVAL_MINUTES || "30", 10);
const POLL_MS_CFG      = parseInt(env.POLL_MS || "2000", 10);
const DEBOUNCE_MS_CFG  = parseInt(env.DEBOUNCE_MS || "2000", 10);
const LAST_SYNC_FILE = path.join(__dirname, "last-sync.json");

if (!SERVER_URL) { console.error("❌ SERVER_URL غير محدد في .env"); process.exit(1); }

// ── دوال مساعدة ────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toLocaleString("ar-SA");
  console.log(`[${ts}] ${msg}`);
}

function padZ(n) { return String(n).padStart(2, "0"); }

function formatDate(d) {
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
}

function formatTime(d) {
  return `${padZ(d.getHours())}:${padZ(d.getMinutes())}`;
}

function loadLastSync() {
  try {
    if (fs.existsSync(LAST_SYNC_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_SYNC_FILE, "utf-8"));
      return data.lastSync ? new Date(data.lastSync) : null;
    }
  } catch {}
  return null;
}

function saveLastSync(date) {
  try {
    // نطرح دقيقتين كهامش أمان لتفادي فقدان الحركات الحدية (race condition)
    const OVERLAP_MS = 2 * 60 * 1000;
    const safeDate = new Date(date.getTime() - OVERLAP_MS);
    fs.writeFileSync(LAST_SYNC_FILE, JSON.stringify({ lastSync: safeDate.toISOString() }));
  } catch (e) {
    log(`⚠️  تعذّر حفظ وقت آخر مزامنة: ${e.message}`);
  }
}

function postJson(url, body, apiKey) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Authorization: `Bearer ${apiKey}`,
      },
    };
    const req = lib.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    req.write(data);
    req.end();
  });
}

// ── قراءة ملف MDB ───────────────────────────────────────────────────────────

function readMDB() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      `ملف قاعدة البيانات غير موجود في المسار:\n  ${DB_PATH}\n` +
      `تأكد أن برنامج ZKTeco مثبّت وأن المسار صحيح في ملف .env`
    );
  }

  // نسخ الملف إلى مؤقت لتجنّب قفل الملف من برنامج ZKTeco
  const tmpFile = path.join(os.tmpdir(), `att2000_${Date.now()}.mdb`);
  try {
    fs.copyFileSync(DB_PATH, tmpFile);
    const buffer = fs.readFileSync(tmpFile);
    const reader = new MDBReader(buffer);

    const tableNames = reader.getTableNames();

    function findTable(name) {
      const found = tableNames.find((t) => t.toLowerCase() === name.toLowerCase());
      if (!found) {
        throw new Error(
          `جدول '${name}' غير موجود في قاعدة البيانات.\n` +
          `الجداول المتاحة: ${tableNames.join(", ")}`
        );
      }
      return reader.getTable(found).getData();
    }

    const users   = findTable("USERINFO");
    const checkins = findTable("CHECKINOUT");
    return { users, checkins };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

// ── المزامنة الرئيسية ────────────────────────────────────────────────────────

async function runSync() {
  log("═══════════════════════════════════════════════");
  log("🚀 بدء مزامنة ZKTeco MDB");
  log(`📂 المسار: ${DB_PATH}`);
  log("═══════════════════════════════════════════════");

  // قراءة القاعدة
  let users, checkins;
  try {
    log("📖 جارٍ قراءة قاعدة البيانات...");
    ({ users, checkins } = readMDB());
    log(`✅ تم القراءة: ${users.length} موظف، ${checkins.length} سجل حضور`);
  } catch (err) {
    log(`❌ خطأ في قراءة القاعدة:\n   ${err.message}`);
    return;
  }

  // بناء خريطة USERID → رقم الشارة (BADGENUMBER)
  const userMap = {};
  const employeesToSync = [];

  for (const user of users) {
    const uid      = String(user.USERID      || user.UserID      || "").trim();
    const badge    = String(user.BADGENUMBER  || user.BadgeNumber  || user.PIN    || uid).trim();
    const rawName  = user.NAME || user.Name || `موظف ${badge}`;
    const name     = decodeMdbName(rawName);
    const cardNo   = String(user.CARDNO       || user.CardNo       || user.CARD_NO || "").trim();
    // إذا كان CARDNO فارغاً واختلف BADGENUMBER عن USERID → استخدم BADGENUMBER كرقم بطاقة
    const effectiveCardNo = cardNo || (badge !== uid ? badge : null);
    if (uid && badge) {
      userMap[uid] = badge;
      employeesToSync.push({ code: badge, name, cardNumber: effectiveCardNo || null });
    }
  }

  log(`👥 ${employeesToSync.length} موظف في جهاز البصمة`);

  // ── مزامنة الموظفين ──
  if (SYNC_EMPLOYEES && employeesToSync.length > 0) {
    log("👤 إرسال بيانات الموظفين للموقع...");
    try {
      const resp = await postJson(
        `${SERVER_URL}/api/agent/push-employees`,
        { employees: employeesToSync },
        AGENT_API_KEY
      );
      if (resp.status === 200 || resp.status === 201) {
        const d = resp.data;
        log(`✅ الموظفون: أُنشئ ${d.created}، حُدِّث ${d.updated || 0}، بدون تغيير ${d.skipped}`);
      } else if (resp.status === 401) {
        log("❌ مفتاح API خاطئ — تحقق من AGENT_API_KEY في .env");
        return;
      } else {
        log(`⚠️  تحذير عند إرسال الموظفين (${resp.status}): ${JSON.stringify(resp.data)}`);
      }
    } catch (err) {
      log(`⚠️  تعذّر إرسال الموظفين: ${err.message}`);
    }
  }

  // ── تحديد نطاق التواريخ ──
  const lastSync = loadLastSync();
  const fromDate = lastSync || (() => {
    const d = new Date();
    d.setDate(d.getDate() - DAYS_BACK);
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  log(`📅 مزامنة سجلات من: ${formatDate(fromDate)} حتى اليوم`);

  // ── تجميع سجلات الحضور بالموظف واليوم ──
  const grouped = {};
  let skippedOld = 0;
  let skippedUnknown = 0;

  for (const entry of checkins) {
    // CHECKTIME قد يكون Date أو string حسب نسخة مكتبة mdb-reader
    let ts;
    const raw = entry.CHECKTIME || entry.CheckTime;
    if (raw instanceof Date) {
      ts = raw;
    } else if (raw) {
      ts = new Date(raw);
    } else {
      continue;
    }
    if (isNaN(ts.getTime())) continue;
    if (ts < fromDate) { skippedOld++; continue; }

    const userId = String(entry.USERID || entry.UserId || "").trim();
    const badge  = userMap[userId] || userId;
    if (!badge) { skippedUnknown++; continue; }

    const date = formatDate(ts);
    const time = formatTime(ts);
    const key  = `${badge}__${date}`;

    if (!grouped[key]) grouped[key] = { uid: badge, date, times: [] };
    grouped[key].times.push(time);
  }

  // ترتيب الأوقات لكل سجل
  for (const rec of Object.values(grouped)) {
    rec.times.sort();
  }

  const logsToSend = Object.values(grouped);
  log(`📦 ${logsToSend.length} سجل جديد | تخطي ${skippedOld} قديم | ${skippedUnknown} غير معروف`);

  if (logsToSend.length === 0) {
    log("ℹ️  لا توجد سجلات جديدة للإرسال");
    saveLastSync(new Date());
    log("═══════════════════════════════════════════════");
    log("✅ انتهت المزامنة");
    log("═══════════════════════════════════════════════");
    return;
  }

  // ── إرسال الحضور للموقع (على دُفعات) ──
  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(logsToSend.length / BATCH_SIZE);
  log(`📤 إرسال ${logsToSend.length} سجل على ${totalBatches} دُفعة...`);

  let totalImported = 0, totalDuplicates = 0, totalSkipped = 0;
  let allErrors = [];
  let syncFailed = false;

  for (let i = 0; i < logsToSend.length; i += BATCH_SIZE) {
    const batch = logsToSend.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    if (totalBatches > 1) log(`   📦 دُفعة ${batchNum}/${totalBatches} (${batch.length} سجل)...`);

    try {
      const resp = await postJson(
        `${SERVER_URL}/api/agent/push-attendance`,
        { deviceName: "ZKTeco MDB", logs: batch },
        AGENT_API_KEY
      );

      if (resp.status === 200 || resp.status === 201) {
        totalImported   += resp.data.imported   || 0;
        totalDuplicates += resp.data.duplicates || 0;
        totalSkipped    += resp.data.skipped    || 0;
        if (resp.data.errors) allErrors.push(...resp.data.errors);
      } else {
        log(`❌ خطأ من السيرفر (${resp.status}): ${JSON.stringify(resp.data)}`);
        syncFailed = true;
        break;
      }
    } catch (err) {
      if (err.message.includes("timeout")) {
        log("❌ انتهت مهلة الاتصال بالسيرفر — تأكد من الإنترنت");
      } else if (err.message.includes("ECONNREFUSED")) {
        log("❌ تعذّر الاتصال بالسيرفر");
      } else {
        log(`❌ ${err.message}`);
      }
      syncFailed = true;
      break;
    }
  }

  if (!syncFailed) {
    log(`✅ مستورد ${totalImported}، مكرر ${totalDuplicates}، متخطى ${totalSkipped}`);
    if (allErrors.length > 0) {
      allErrors.slice(0, 5).forEach((e) => log(`   ⚠️  ${e}`));
      if (allErrors.length > 5) log(`   ... و ${allErrors.length - 5} أخطاء أخرى`);
    }
    saveLastSync(new Date());
  }

  log("═══════════════════════════════════════════════");
  log("✅ انتهت المزامنة");
  log("═══════════════════════════════════════════════");
}

// ── نقطة الدخول ─────────────────────────────────────────────────────────────

selfTestEncoding();

const watchMode = process.argv.includes("--watch");
const autoMode  = process.argv.includes("--auto");

if (autoMode) {
  // ── وضع المراقبة التلقائية: مزامنة فورية عند كل تغيير في الملف ──
  if (!fs.existsSync(DB_PATH)) {
    log(`❌ ملف قاعدة البيانات غير موجود في المسار:\n   ${DB_PATH}`);
    process.exit(1);
  }

  log("════════════════════════════════════════════════");
  log("👁️  وضع المراقبة التلقائية للملف");
  log(`📂 يراقب: ${DB_PATH}`);
  log("🔄 سيتم المزامنة فوراً عند أي تغيير في الملف");
  log("⏹️  اضغط Ctrl+C لإيقاف المراقبة");
  log("════════════════════════════════════════════════");

  // مزامنة أولية عند التشغيل
  runSync();

  let debounceTimer = null;
  let isSyncing     = false;

  // احتفظ بآخر حجم ووقت تعديل لاكتشاف التغييرات الحقيقية
  let lastMtime = 0;
  let lastSize  = 0;
  try {
    const stat = fs.statSync(DB_PATH);
    lastMtime = stat.mtimeMs;
    lastSize  = stat.size;
  } catch {}

  // استطلاع الملف (أكثر موثوقية على Windows من fs.watch)
  const POLL_MS = POLL_MS_CFG;
  log(`⚙️  فترة الاستطلاع: ${POLL_MS}ms | debounce: ${DEBOUNCE_MS_CFG}ms`);
  setInterval(() => {
    try {
      const stat = fs.statSync(DB_PATH);
      const changed = stat.mtimeMs !== lastMtime || stat.size !== lastSize;
      if (!changed) return;

      lastMtime = stat.mtimeMs;
      lastSize  = stat.size;

      log("📡 تم اكتشاف تغيير في الملف — جارٍ التحضير للمزامنة...");

      // debounce: انتظر قبل التنفيذ لتجميع التغييرات المتتالية
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (isSyncing) {
          log("⏳ مزامنة جارية بالفعل — سيتم الانتظار...");
          return;
        }
        isSyncing = true;
        try {
          await runSync();
        } finally {
          isSyncing = false;
        }
      }, DEBOUNCE_MS_CFG);
    } catch {}
  }, POLL_MS);

} else if (watchMode) {
  // ── وضع التوقيت: مزامنة دورية كل N دقيقة ──
  log(`⏱️  وضع المراقبة: مزامنة كل ${INTERVAL_MINUTES} دقيقة`);
  runSync();
  setInterval(runSync, INTERVAL_MINUTES * 60 * 1000);

} else {
  // ── تشغيل مرة واحدة ──
  runSync()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
