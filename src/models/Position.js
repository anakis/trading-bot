const mongoose = require('mongoose')

module.exports = () => {
  const { Schema } = mongoose
  const positionSchema = new Schema(
    {
      symbol: String,
      amount: Number,
      price: Number,
      stopLoss: Number,
      type: {
        type: String,
        enum: ['LONG', 'SHORT'],
      },
      status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open',
      },
    },
    { timestamps: { createdAt: 'created_at' } },
  )

  return mongoose.model('Position', positionSchema)
}
