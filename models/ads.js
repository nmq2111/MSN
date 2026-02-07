const mongoose = require('mongoose')

const AdsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    condition: { type: String, enum: ['new', 'used'], required: true },
    category: {
      type: String,
      enum: ['books', 'phones', 'cars', 'spare parts', 'laptop', 'random']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId, // LINKING THIS FIELD TO ANOTHER MODEL
      ref: 'User'
    },
    imgUrl: { type: String, default: '' },
    imgPublicId: { type: String, default: '' }
  },
  {
    timestamps: true
  }
)

const Ads = mongoose.model('Ads', AdsSchema)

module.exports = Ads
