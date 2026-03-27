import chalk from "chalk";

/**
 * Minimal logger (no winston) — matches patterns used by Google Drive / upload code.
 */
const logger = {
  info: (msg, ...args) => console.log(chalk.blue("[INFO]"), msg, ...args),
  warn: (msg, ...args) => console.warn(chalk.yellow("[WARN]"), msg, ...args),
  error: (msg, ...args) => console.error(chalk.red("[ERROR]"), msg, ...args),
};

export default logger;
