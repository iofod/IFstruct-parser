const fs = require('fs-extra')
const path = require('path')
const inquirer = require('inquirer')
const { error, msg } = require('./FN')

let temps = ['web', 'pcweb', 'mp', 'flutter']
let res
let callback = n => n

// Copy project templates according to user configuration.
async function main(conf) {
  let { temp, dir } = conf
  if (temp) {
		if (!temps.includes(temp)) {
			return error(`${temp} invalid`)
    }
    res = temp
	} else {
    let input = await inquirer.prompt([
      {
        type: 'list',
        name: 'temp',
        message: 'Please choose a template',
        default: temps[0],
        choices: temps.map(k => {
          return {
            name: k,
            value: k
          }
        })
      }
    ])
    
    res = input.temp
  }

  if (!dir) {
    let output = await inquirer.prompt([{
      type: 'input',
      message: 'Project name?',
      name: 'name',
      default: 'gen-' + res,
      validate: function(val) {
        if (!/^[\w\-. ]+$/.test(val)) return 'Invalid project name'

        return true
      }
    }])

    dir = output.name
  }
  // pcweb is a branch of the web template, copy the web template first, then overwrite it with the pcweb file.
  if (res == 'pcweb') {
    res = 'web'

    callback = () => {
      fs.copySync(path.resolve(__dirname, `../temps/pcweb`), `./${dir}`, { overwrite: true })
    }
  }

  fs.copySync(path.resolve(__dirname, `../temps/${res}`), `./${dir}`, { overwrite: true })

  callback()

  return msg(`Done!`)
}

exports.create = main