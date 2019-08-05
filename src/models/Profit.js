const mongoose = require('mongoose')

module.exports = () => {
  const { Schema } = mongoose
  const profitSchema = new Schema(
    {
      symbol: String,
      value: Number,
    },
    { timestamps: { createdAt: 'created_at' } },
  )

  return mongoose.model('Profit', profitSchema)
}
