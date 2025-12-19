const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Users folder storage
const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'msn/users',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
})

// Ads folder storage
const adStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'msn/ads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
})

module.exports = { cloudinary, userStorage, adStorage }
