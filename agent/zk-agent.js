#!/usr/bin/env node
/**
 * ZK Agent - سكريبت مزامنة أجهزة البصمة ZKTeco
 * يُشغَّل على كمبيوتر داخل المصنع، يسحب بيانات البصمة ويرسلها للسيرفر
 *
 * الاستخدام:
 *   node zk-agent.js              - تشغيل مرة واحدة
 *   node zk-agent.js --watch      - تشغيل دوري كل INTERVAL_MINUTES دقيقة
 */

const ZKLib = require("node-zklib");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ── تحميل إعدادات .env ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error("❌ ملف .env غير موجود. أنشئه أولاً (راجع README.ar.md)");
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, "utf-8")
  .split(/\r?\n/)
  .forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = val;
  });

const SERVER_URL = (env.SERVER_URL || "").replace(/\/$/, "");
const AGENT_API_KEY = env.AGENT_API_KEY || "";
const RAW_DEVICES = env.DEVICES || "";
const TIMEOUT_MS = parseInt(env.TIMEOUT_MS || "10000", 10);
const INTERVAL_MINUTES = parseInt(env.INTERVAL_MINUTES || "30", 10);

if (!SERVER_URL) {
  console.error("❌ SERVER_URL غير محدد في ملف .env");
  process.exit(1);
}
if (!AGENT_API_KEY) {
  console.error("❌ AGENT_API_KEY غير محدد في ملف .env");
  process.exit(1);
}
if (!RAW_DEVICES) {
  console.error("❌ DEVICES غير محدد في ملف .env");
  process.exit(1);
}

// ── تحليل قائمة الأجهزة ──────────────────────────────────────────────────────
// الصيغة: IP:PORT:اسم-الجهاز:workshopId
// مثال: 192.168.1.100:4370:ورشة-الخياطة:uuid-هنا
//        192.168.1.101:4370:ورشة-التشطيب
const devices = RAW_DEVICES.split(",")
  .map(d => d.trim())
  .filter(Boolean)
  .map(d => {
    const parts = d.split(":");
    return {
      ip: parts[0] || "",
      port: parseInt(parts[1] || "4370", 10),
      name: parts[2] || parts[0] || "جهاز",
      workshopId: parts[3] || null,
    };
  })
  .filter(d => d.ip);

if (devices.length === 0) {
  console.error("❌ لا توجد أجهزة صالحة في DEVICES");
  process.exit(1);
}

// ── دوال مساعدة ──────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toLocaleString("ar-SA");
  console.log(`[${ts}] ${msg}`);
}

function padZ(n) {
  return String(n).padStart(2, "0");
}

function formatDate(d) {
  return `${d.getFullYear()}-${padZ(d.getMonth() + 1)}-${padZ(d.getDate())}`;
}

function formatTime(d) {
  return `${padZ(d.getHours())}:${padZ(d.getMinutes())}`;
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
      res.on("data", chunk => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

// ── منطق مزامنة جهاز واحد ────────────────────────────────────────────────────

async function syncDevice(device) {
  log(`⏳ الاتصال بـ ${device.name} (${device.ip}:${device.port}) ...`);

  const zk = new ZKLib(device.ip, device.port, TIMEOUT_MS, 4000);

  try {
    await zk.createSocket();
    log(`✅ تم الاتصال بـ ${device.name}`);

    const result = await zk.getAttendances();
    const raw = result?.data || [];
    log(`📥 جُلب ${raw.length} سجل خام من ${device.name}`);

    await zk.disconnect();

    if (raw.length === 0) {
      log(`ℹ️  لا توجد سجلات في ${device.name}`);
      return;
    }

    // تجميع السجلات حسب المستخدم واليوم
    const grouped = {};
    for (const entry of raw) {
      const uid = String(entry.deviceUserId || "0");
      const ts = entry.recordTime ? new Date(entry.recordTime) : null;
      if (!ts) continue;

      const date = formatDate(ts);
      const time = formatTime(ts);
      const key = `${uid}__${date}`;

      if (!grouped[key]) grouped[key] = { uid, date, times: [] };
      grouped[key].times.push(time);
    }

    const logs = Object.values(grouped);
    log(`📦 ${logs.length} سجل مجمّع (موظف+يوم) سيُرسل للسيرفر`);

    // إرسال للسيرفر
    const response = await postJson(
      `${SERVER_URL}/api/agent/push-attendance`,
      {
        deviceName: device.name,
        workshopId: device.workshopId || null,
        logs,
      },
      AGENT_API_KEY
    );

    if (response.status === 200 || response.status === 201) {
      const d = response.data;
      log(`✅ ${device.name}: مستورد ${d.imported}، مكرر ${d.duplicates}، متخطى ${d.skipped}`);
      if (d.errors && d.errors.length > 0) {
        d.errors.slice(0, 5).forEach(e => log(`   ⚠️  ${e}`));
        if (d.errors.length > 5) log(`   ... و ${d.errors.length - 5} أخطاء أخرى`);
      }
    } else if (response.status === 401) {
      log(`❌ ${device.name}: مفتاح API خاطئ - تحقق من AGENT_API_KEY في .env`);
    } else {
      log(`❌ ${device.name}: خطأ من السيرفر (${response.status}): ${JSON.stringify(response.data)}`);
    }
  } catch (err) {
    try { await zk.disconnect(); } catch {}
    if (err.message?.includes("ETIMEDOUT") || err.message?.includes("timeout")) {
      log(`❌ ${device.name}: انتهت مهلة الاتصال - تأكد من الشبكة وعنوان IP`);
    } else if (err.message?.includes("ECONNREFUSED")) {
      log(`❌ ${device.name}: تم رفض الاتصال - تأكد أن الجهاز يعمل`);
    } else {
      log(`❌ ${device.name}: ${err.message}`);
    }
  }
}

// ── الدالة الرئيسية ───────────────────────────────────────────────────────────

async function runSync() {
  log("═══════════════════════════════════════════");
  log(`🚀 بدء مزامنة ${devices.length} جهاز`);
  log("═══════════════════════════════════════════");

  for (const device of devices) {
    await syncDevice(device);
    log("");
  }

  log("═══════════════════════════════════════════");
  log("✅ انتهت المزامنة");
  log("═══════════════════════════════════════════");
}

// ── نقطة الدخول ──────────────────────────────────────────────────────────────

const watchMode = process.argv.includes("--watch");

if (watchMode) {
  log(`⏱️  وضع المراقبة: مزامنة كل ${INTERVAL_MINUTES} دقيقة`);
  runSync();
  setInterval(runSync, INTERVAL_MINUTES * 60 * 1000);
} else {
  runSync().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
