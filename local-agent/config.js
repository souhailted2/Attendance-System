/**
 * إعدادات الوكيل المحلي — عدّل هذه القيم فقط
 */
module.exports = {
  // ── إعدادات الجهاز وملف البيانات ─────────────────────
  device: {
    name: "uFace800 Plus",
    serialNumber: "CKPG231760261",
    // مسار ملف قاعدة بيانات ZKTeco على هذا الكمبيوتر
    mdbPath: "C:\\Program Files (x86)\\ZKTeco\\ZKTeco\\att2000.mdb",
  },

  // ── إعدادات السيرفر ───────────────────────────────────
  server: {
    url: "http://allal.alllal.com/api/sync/local-agent",
    apiKey: "",
  },

  // ── إعدادات المزامنة ──────────────────────────────────
  sync: {
    // كل كم دقيقة يتم سحب البيانات الجديدة
    intervalMinutes: 5,
  },
};
