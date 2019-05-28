const env = require('dotenv').config()
const dotenvParseVariables = require('dotenv-parse-variables')

module.exports = () => dotenvParseVariables(env.parsed)
