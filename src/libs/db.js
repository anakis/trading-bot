const mongoose = require('mongoose')

module.exports = app => {
  const {
    DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_AUTH_SOURCE,
  } = app.config.constants
  try {
    const urlString = `mongodb://${
      DB_USER && DB_PASS ? `${DB_USER}:${DB_PASS}@` : ''
    }${DB_HOST}:${DB_PORT}/${DB_NAME}${DB_AUTH_SOURCE ? `?authSource=${DB_AUTH_SOURCE}` : ''}`
    mongoose.connect(urlString, { useNewUrlParser: true })
  } catch (e) {
    console.log(e)
  }
}
