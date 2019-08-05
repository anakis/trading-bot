const app = require('./config/app')()

const init = async () => {
  const { run } = await app.module.orchestrator

  run()
}

init()
