import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_LOG_AGE_DAYS = 14;

// Detect serverless environment (Vercel, AWS Lambda...)
const isReadOnlyFS = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const baseLogDir = isReadOnlyFS ? "/tmp" : path.join(__dirname, "../../");
const logDir = path.join(baseLogDir, "logs");

// Ensure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.warn(`⚠️ Cannot create log directory: ${(err as Error).message}`);
}

function getLogFilePath(type: "app" | "error") {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(logDir, `${type}-${date}.log`);
}

function writeLogToFile(filePath: string, message: string) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(filePath, `[${timestamp}] ${message}\n`, "utf8");
  } catch (err) {
    console.warn(`⚠️ Cannot write log: ${(err as Error).message}`);
  }
}

// Override console.log
const originalLog = console.log;
console.log = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
  writeLogToFile(getLogFilePath("app"), message);
  originalLog(...args);
};

// Override console.error
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
  writeLogToFile(getLogFilePath("error"), message);
  originalError(...args);
};

// Delete old logs (only in environments with write access)
async function deleteOldLogs() {
  if (isReadOnlyFS) return; // skip cleanup on serverless

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

deleteOldLogs().catch((err) => {
  console.error(`❌ Failed to clean logs: ${err.message}`);
});
