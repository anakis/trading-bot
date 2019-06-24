const consign = require('consign')

const app = {}

consign({ cwd: 'src' })
  .include('config/constants.js')
  .then('libs')
  .then('module/dataGateway.js')
  .then('module/analyser.js')
  .then('module/riskManager.js')
  .then('module/opportunitiesMonitor.js')
  .then('module/positionManager.js')
  .then('module/trader.js')
  .then('module/orchestrator.js')
  .into(app)

module.exports = () => app
