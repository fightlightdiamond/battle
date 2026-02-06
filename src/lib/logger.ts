/**
 * Application logger utility
 * Only logs in development mode, silent in production
 */

const isDev = import.meta.env.DEV;

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
  prefix?: string;
}

function createLogger(options: LoggerOptions = {}) {
  const prefix = options.prefix ? `[${options.prefix}]` : "";

  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!isDev) return;

    const timestamp = new Date().toISOString().slice(11, 23);
    const formattedPrefix = prefix ? `${prefix} ` : "";

    switch (level) {
      case "debug":
        console.debug(`${timestamp} ${formattedPrefix}`, ...args);
        break;
      case "info":
        console.info(`${timestamp} ${formattedPrefix}`, ...args);
        break;
      case "warn":
        console.warn(`${timestamp} ${formattedPrefix}`, ...args);
        break;
      case "error":
        console.error(`${timestamp} ${formattedPrefix}`, ...args);
        break;
    }
  };

  return {
    debug: (...args: unknown[]) => log("debug", ...args),
    info: (...args: unknown[]) => log("info", ...args),
    warn: (...args: unknown[]) => log("warn", ...args),
    error: (...args: unknown[]) => log("error", ...args),
  };
}

// Pre-configured loggers for different modules
export const syncLogger = createLogger({ prefix: "SyncQueue" });
export const cardLogger = createLogger({ prefix: "Card" });
export const battleLogger = createLogger({ prefix: "Battle" });

// Generic logger
export const logger = createLogger();

export { createLogger };
