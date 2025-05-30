import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_LOG_AGE_DAYS = 14;

const logDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getLogFilePath(type: "app" | "error") {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(logDir, `${type}-${date}.log`);
}

function writeLogToFile(filePath: string, message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(filePath, `[${timestamp}] ${message}\n`, "utf8");
}

const originalLog = console.log;
console.log = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
  writeLogToFile(getLogFilePath("app"), message);
  originalLog(...args);
};

const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
  writeLogToFile(getLogFilePath("error"), message);
  originalError(...args);
};

// 🧹 Xóa log cũ hơn 14 ngày
async function deleteOldLogs() {
  const now = Date.now();
  const maxAgeMs = MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.promises.readdir(logDir);
    for (const file of files) {
      const filePath = path.join(logDir, file);
      try {
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile()) {
          const fileAge = now - stat.mtime.getTime();
          if (fileAge > maxAgeMs) {
            await fs.promises.unlink(filePath);
            console.log(`🗑️ Deleted old log: ${file}`);
          }
        }
      } catch (err) {
        console.error(
          `⚠️ Failed to process file ${file}: ${(err as Error).message}`,
        );
      }
    }
  } catch (err) {
    console.error(`❌ Failed to read log directory: ${(err as Error).message}`);
  }
}

// Gọi hàm xóa log ngay khi khởi động / server start song song
deleteOldLogs().catch((err) => {
  console.error(`❌ Failed to clean logs: ${err.message}`);
});
