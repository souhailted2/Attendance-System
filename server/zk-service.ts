import ZKLib from "node-zklib";

const CONNECTION_TIMEOUT = 10000;

interface ZKDeviceInfo {
  userCounts: number;
  logCounts: number;
  firmwareVersion?: string;
}

interface ZKAttendanceLog {
  odtimestamp: Date;
  oduid: string;
  odstate: number;
}

export async function testConnection(ip: string, port: number): Promise<{ success: boolean; message: string; info?: ZKDeviceInfo }> {
  const zk = new ZKLib(ip, port, CONNECTION_TIMEOUT, 4000);

  try {
    await zk.createSocket();

    const users = await zk.getUsers();
    const logs = await zk.getAttendances();

    let firmwareVersion: string | undefined;
    try {
      firmwareVersion = await zk.getFirmware();
    } catch {
      firmwareVersion = undefined;
    }

    await zk.disconnect();

    return {
      success: true,
      message: "تم الاتصال بالجهاز بنجاح",
      info: {
        userCounts: users?.data?.length || 0,
        logCounts: logs?.data?.length || 0,
        firmwareVersion: firmwareVersion || undefined,
      },
    };
  } catch (error: any) {
    try { await zk.disconnect(); } catch {}

    let message = "فشل الاتصال بالجهاز";
    if (error.message?.includes("ETIMEDOUT") || error.message?.includes("timeout")) {
      message = "انتهت مهلة الاتصال - تأكد من عنوان IP والمنفذ";
    } else if (error.message?.includes("ECONNREFUSED")) {
      message = "تم رفض الاتصال - تأكد أن الجهاز يعمل ومتصل بالشبكة";
    } else if (error.message?.includes("EHOSTUNREACH") || error.message?.includes("ENETUNREACH")) {
      message = "لا يمكن الوصول للجهاز - تأكد من إعدادات الشبكة";
    }

    return {
      success: false,
      message: `${message}: ${error.message}`,
    };
  }
}

export async function syncAttendanceLogs(ip: string, port: number): Promise<{ success: boolean; message: string; logs: ZKAttendanceLog[] }> {
  const zk = new ZKLib(ip, port, CONNECTION_TIMEOUT, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getAttendances();
    const logs: ZKAttendanceLog[] = (result?.data || []).map((log: any) => ({
      odtimestamp: log.recordTime ? new Date(log.recordTime) : new Date(),
      oduid: log.deviceUserId ? String(log.deviceUserId) : "0",
      odstate: log.ip || 0,
    }));

    await zk.disconnect();

    return {
      success: true,
      message: `تم جلب ${logs.length} سجل من الجهاز`,
      logs,
    };
  } catch (error: any) {
    try { await zk.disconnect(); } catch {}

    let message = "فشل في جلب السجلات من الجهاز";
    if (error.message?.includes("ETIMEDOUT") || error.message?.includes("timeout")) {
      message = "انتهت مهلة الاتصال أثناء جلب السجلات";
    } else if (error.message?.includes("ECONNREFUSED")) {
      message = "تم رفض الاتصال بالجهاز";
    }

    return {
      success: false,
      message: `${message}: ${error.message}`,
      logs: [],
    };
  }
}

export async function clearDeviceLogs(ip: string, port: number): Promise<{ success: boolean; message: string }> {
  const zk = new ZKLib(ip, port, CONNECTION_TIMEOUT, 4000);

  try {
    await zk.createSocket();
    await zk.clearAttendanceLog();
    await zk.disconnect();

    return {
      success: true,
      message: "تم مسح سجلات الجهاز بنجاح",
    };
  } catch (error: any) {
    try { await zk.disconnect(); } catch {}

    return {
      success: false,
      message: `فشل في مسح سجلات الجهاز: ${error.message}`,
    };
  }
}
