const express = require('express')
const User = require('../models/users.js')
// const multer = require('multer')
const Ads = require('../models/ads.js')

const router = express.Router()

const multer = require('multer')
const { cloudinary, adStorage } = require('../config/cloudinary')
const upload = multer({ storage: adStorage })

//get:index
router.get('/:userId/Ads', async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id)
    if (!currentUser) {
      return res.redirect('/login')
    }

    const searchQuery = (req.query.q || '').trim()

    const baseFilter = { owner: currentUser._id }

    let ads

    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i')

      ads = await Ads.find({
        ...baseFilter,
        $or: [{ title: regex }, { description: regex }, { category: regex }]
      })
    } else {
      ads = await Ads.find(baseFilter)
    }

    res.render('Ads/index.ejs', {
      ads,
      user: currentUser,
      searchQuery
    })
  } catch (err) {
    console.error(err)
    res.redirect('/')
  }
})

//:get:new
router.get('/:userId/new', async (req, res) => {
  const currentUser = await User.findById(req.params.userId)
  res.render('Ads/new.ejs', { user: currentUser })
})

//:get:Create
router.post('/:userId/Ads', upload.single('img'), async (req, res) => {
  const currentUser = await User.findById(req.session.user._id)

  const info = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    condition: req.body.condition,
    category: req.body.category,
    owner: req.session.user._id,

    imgUrl: req.file ? req.file.path : '',
    imgPublicId: req.file ? req.file.filename : ''
  }

  await Ads.create(info)
  res.redirect(`/Ads/${currentUser._id}/Ads`)
})

//get:edit
router.get('/:userId/Ads/:adId/edit', async (req, res) => {
  const selectedAd = await Ads.findById(req.params.adId)
  const currentUser = await User.findById(req.params.userId)
  res.render('Ads/edit.ejs', { Ad: selectedAd, user: currentUser })
})

// Update Ad
router.put('/:userId/Ads/:adId', upload.single('img'), async (req, res) => {
  try {
    const editedAd = await Ads.findById(req.params.adId)
    if (!editedAd) return res.redirect(`/Ads/${req.session.user._id}/Ads`)

    if (!editedAd.owner.equals(req.session.user._id)) {
      return res.send("You don't have permission to do that.")
    }

    const updateData = {
      title: req.body.title,
      price: req.body.price,
      description: req.body.description,
      condition: req.body.condition,
      category: req.body.category
    }

    if (req.file) {
      if (editedAd.imgPublicId) {
        await cloudinary.uploader.destroy(editedAd.imgPublicId)
      }
      updateData.imgUrl = req.file.path
      updateData.imgPublicId = req.file.filename
    }

    await Ads.findByIdAndUpdate(req.params.adId, updateData, { new: true })

    res.redirect(`/Ads/${req.session.user._id}/Ads`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// Delete Ad
router.delete('/:userId/Ads/:adId', async (req, res) => {
  try {
    const selectedAd = await Ads.findById(req.params.adId)
    if (!selectedAd) return res.redirect(`/Ads/${req.session.user._id}/Ads`)

    if (!selectedAd.owner.equals(req.session.user._id)) {
      return res.send("You don't have permission to do that.")
    }

    if (selectedAd.imgPublicId) {
      await cloudinary.uploader.destroy(selectedAd.imgPublicId)
    }

    await selectedAd.deleteOne()
    res.redirect(`/Ads/${req.session.user._id}/Ads`)
  } catch (error) {
    console.error(error)
    res.redirect('/')
  }
})

//category
router.get('/categories', async (req, res) => {
  const selectedCategory = req.query.category

  const allAds = await Ads.find({}).populate('owner')

  const filteredAds = allAds.filter((ad) => ad.category === selectedCategory)

  //.populate('owner')
  if (selectedCategory === 'phones') {
    res.render('categories/phone', { ads: filteredAds })
  } else if (selectedCategory === 'cars') {
    res.render('categories/car', { ads: filteredAds })
  } else if (selectedCategory === 'books') {
    res.render('categories/book', { ads: filteredAds })
  } else if (selectedCategory === 'laptop') {
    res.render('categories/laptop', { ads: filteredAds })
  } else if (selectedCategory === 'spare parts') {
    res.render('categories/spareParts', { ads: filteredAds })
  } else if (selectedCategory === 'random') {
    res.render('categories/other', { ads: filteredAds })
  }
})

module.exports = router
