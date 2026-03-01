type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "HTTP";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
};

const levelConfig: Record<LogLevel, { color: string }> = {
  INFO: { color: colors.blue },
  WARN: { color: colors.yellow },
  ERROR: { color: colors.red },
  DEBUG: { color: colors.gray },
  HTTP: { color: colors.green },
};

const getTimestamp = () => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string) => {
  const { color } = levelConfig[level];
  const timestamp = `${colors.gray}[${getTimestamp()}]${colors.reset}`;
  const levelLabel = `${color}${level.padEnd(5)}${colors.reset}`;

  return `${timestamp} ${levelLabel} ${message}`;
};

export const logger = {
  info: (message: string) => {
    console.log(formatMessage("INFO", message));
  },

  warn: (message: string) => {
    console.warn(formatMessage("WARN", message));
  },

  error: (message: string) => {
    console.error(formatMessage("ERROR", message));
  },

  debug: (message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log(formatMessage("DEBUG", message));
    }
  },

  http: (message: string) => {
    console.log(formatMessage("HTTP", message));
  },
};
