/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk'
const log = console.log

const error = (...v: any[]) => log(chalk.red(`${v}`))
const msg = (...v: any[]) => log(chalk.cyan(`${v}`))

export { error, msg, log }
