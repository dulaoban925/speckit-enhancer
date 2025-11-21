import chalk from 'chalk'

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private level: LogLevel = LogLevel.INFO

  setLevel(level: LogLevel): void {
    this.level = level
  }

  debug(...args: unknown[]): void {
    if (this.level === LogLevel.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), ...args)
    }
  }

  info(...args: unknown[]): void {
    console.log(chalk.blue('[INFO]'), ...args)
  }

  success(...args: unknown[]): void {
    console.log(chalk.green('✓'), ...args)
  }

  warn(...args: unknown[]): void {
    console.log(chalk.yellow('[WARN]'), ...args)
  }

  error(...args: unknown[]): void {
    console.error(chalk.red('[ERROR]'), ...args)
  }
}

export const logger = new Logger()
