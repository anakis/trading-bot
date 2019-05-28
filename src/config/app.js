const consign = require('consign')

const app = {}

consign({ cwd: 'src' })
  .include('config/constants.js')
  .then('libs')
  .then('module/dataReceiver.js')
  .then('module/analyser.js')
  .then('module')
  .into(app)

module.exports = () => app
