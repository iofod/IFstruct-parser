const chalk = require('chalk')
const log = console.log

const error = (...v) => log(chalk.red(`${v}`))
const msg = (...v) => log(chalk.cyan(`${v}`))

exports.error = error
exports.msg = msg
exports.log = log
