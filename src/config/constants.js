const env = require('dotenv').config()
const dotenvParseVariables = require('dotenv-parse-variables')

module.exports = () => {
  const myenv = process.env.NODE_ENV !== 'production' ? env.parsed : { ...process.env }
  return dotenvParseVariables(myenv)
}
