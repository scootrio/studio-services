const chalk = require('chalk');

const program = 'studio-services';
const renderLevel = l => '[' + l + ']:';

module.exports = {
  trace(...args) {
    console.log(chalk.gray(program, renderLevel('trc'), ...args));
  },

  debug(...args) {
    console.log(program, renderLevel(chalk.magenta('dbg')), ...args);
  },

  info(...args) {
    console.log(program, renderLevel(chalk.bold.blue('inf')), ...args);
  },

  warn(...args) {
    console.log(program, renderLevel(chalk.bold.yellow('wrn')), ...args);
  },

  error(...args) {
    console.error(program, renderLevel(chalk.bold.red('err')), ...args);
  }
};
