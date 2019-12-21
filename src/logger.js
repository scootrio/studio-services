const chalk = require('chalk');

const program = 'studio-services';
const renderLevel = l => '[' + l + ']:';

const Level = {
  TRACE: 5,
  DEBUG: 4,
  INFO: 3,
  WARN: 2,
  ERROR: 1
};

function defaultLogLevel() {
  const level = process.env.STUDIO_SERVICES_LOG_LEVEL;
  if (level) {
    switch (level.toLowerCase()) {
      case 'trace':
        return Level.TRACE;
      case 'debug':
        return Level.DEBUG;
      case 'info':
        return Level.INFO;
      case 'warn':
        return Level.WARN;
      case 'error':
        return Level.ERROR;
      default:
        return Level.INFO;
    }
  } else {
    return Level.INFO;
  }
}

function defaultSilent() {
  let silent = process.env.STUDIO_SERVICES_LOG_SILENT;
  if (silent && silent.toLowerCase() !== 'no' && silent.toLowerCase() !== 'false') return true;
  return false;
}

const config = {
  level: defaultLogLevel(),
  silent: defaultSilent()
};

if (config.level <= Level.DEBUG) {
  debug('Logger configuration:', JSON.stringify(config));
}

function shouldLog(level) {
  !config.silent && config.level >= level;
}

function trace(...args) {
  shouldLog(Level.TRACE) && console.log(chalk.gray(program, renderLevel('trc'), ...args));
}

function debug(...args) {
  shouldLog(Level.DEBUG) && console.log(program, renderLevel(chalk.magenta('dbg')), ...args);
}

function info(...args) {
  shouldLog(Level.INFO) && console.log(program, renderLevel(chalk.bold.blue('inf')), ...args);
}

function warn(...args) {
  shouldLog(Level.WARN) && console.log(program, renderLevel(chalk.bold.yellow('wrn')), ...args);
}

function error(...args) {
  shouldLog(Level.ERROR) && console.error(program, renderLevel(chalk.bold.red('err')), ...args);
}

module.exports = {
  trace,
  debug,
  info,
  warn,
  error,
  config,
  Level
};
