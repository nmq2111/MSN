// routes/user.js
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const multer = require('multer')

const User = require('../models/users')
const Ads = require('../models/ads')

const { cloudinary, userStorage } = require('../config/cloudinary')

const isStrongPassword = require('../middleware/isStrongPassword')

const upload = multer({ storage: userStorage })

const rateLimit = require('express-rate-limit')
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // 10 attempts per 10 min
  message: 'Too many login attempts. Try again later.'
})

// ======================= AUTH =======================

// SIGN UP PAGE
router.get('/signUp', (req, res) => {
  res.render('user/signUp.ejs')
})

// SIGN UP ROUTE
router.post('/signUp', isStrongPassword, async (req, res) => {
  try {
    const SALT_ROUNDS = 12

    const userExists = await User.findOne({ username: req.body.username })
    if (userExists) return res.send('Username already taken')

    if (req.body.password !== req.body.confirmPassword) {
      return res.send('Passwords do not match')
    }

    // phone must come from hidden input
    if (!req.body.contactNo) {
      return res.status(400).send('Please enter a valid phone number.')
    }

    const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS)

    const newUser = {
      username: req.body.username,
      password: hashedPassword,
      contactNo: req.body.contactNo, // e.g. +97333003300
      email: req.body.email,
      profile: 'Logo.png',
      profilePublicId: null
    }

    const user = await User.create(newUser)

    req.session.user = { username: user.username, _id: user._id }
    req.session.save(() => res.redirect('/'))
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// SIGN IN PAGE
router.get('/signIn', (req, res) => {
  res.render('user/signIn.ejs')
})

// SIGN IN ROUTE
router.post('/signIn', loginLimiter, async (req, res) => {
  try {
    const userInDatabase = await User.findOne({ username: req.body.username })
    if (!userInDatabase) {
      return res.send("User doesn't exist. Please try again.")
    }

    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    )
    if (!validPassword) return res.send('Wrong Password. Please try again.')

    req.session.user = {
      username: userInDatabase.username,
      _id: userInDatabase._id
    }

    req.session.save(() => res.redirect('/'))
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// SIGN OUT
router.get('/signOut', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/aboutUs', (req, res) => {
  res.render('aboutUs.ejs')
})

// ======================= AFTER SIGN IN =======================

// GET /:USERID/USER DASHBOARD (your old route)
router.get('/:userId/user', async (req, res) => {
  try {
    // ✅ fix: use _id not the session object
    const currentUser = await User.findById(req.session.user._id)
    res.render('index.ejs', { user: currentUser })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// GET /:USERID/EDIT (Edit Profile page)
router.get('/:userId/edit', async (req, res) => {
  const checkVar = 0
  try {
    const currentUser = await User.findById(req.session.user._id)
    res.render('user/edit.ejs', { user: currentUser, checkVar })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// PUT /:USERID/USER (Update profile OR change password based on submit)
router.put('/:userId/user', async (req, res) => {
  const submit = req.body.submit
  try {
    const currentUser = await User.findById(req.session.user._id)

    if (submit === 'Update Profile') {
      currentUser.contactNo = req.body.contactNo
      currentUser.email = req.body.email

      await currentUser.save()
      return res.redirect(`/user/${currentUser._id}/user`)
    }

    if (submit === 'Change Password') {
      const validPassword = bcrypt.compareSync(
        req.body.currentPassword,
        currentUser.password
      )

      if (!validPassword) return res.redirect('/')

      if (req.body.newPassword !== req.body.confirmPassword) {
        return res.redirect('/')
      }

      currentUser.password = bcrypt.hashSync(req.body.newPassword, 10)
      await currentUser.save()
      return res.redirect(`/user/signOut`)
    }

    res.redirect(`/user/${currentUser._id}/dashboard`)
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// GET /:USERID/CHANGEPASSWORD (Edit Password page)
router.get('/:userId/changePassword', async (req, res) => {
  const checkVar = 1
  try {
    const currentUser = await User.findById(req.session.user._id)

    // ✅ fix: must pass user (your ejs uses user.profile, user.username, etc.)
    res.render('user/edit.ejs', { user: currentUser, checkVar })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// GET /:USERID/CHANGEPIC (Upload profile pic page)
router.get('/:userId/changePic', async (req, res) => {
  const checkVar = 2
  try {
    const currentUser = await User.findById(req.session.user._id)
    res.render('user/edit.ejs', { user: currentUser, checkVar })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

// ✅ POST /:USERID/CHANGEPIC (Upload to Cloudinary + save URL)
router.post(
  '/:userId/changePic',
  upload.single('profile'),
  async (req, res) => {
    try {
      const currentUser = await User.findById(req.session.user._id)

      // delete old cloudinary image if it exists
      if (currentUser.profilePublicId) {
        await cloudinary.uploader.destroy(currentUser.profilePublicId)
      }

      // save new cloudinary image
      currentUser.profile = req.file.path // Cloudinary URL
      currentUser.profilePublicId = req.file.filename // Cloudinary public_id

      await currentUser.save()

      res.redirect(`/user/${currentUser._id}/dashboard`)
    } catch (error) {
      console.log(error)
      res.redirect('/')
    }
  }
)

// DASHBOARD
router.get('/:userID/dashboard', async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id)

    // My Ads (latest first)
    const myAds = await Ads.find({ owner: user._id }).sort({ createdAt: -1 })

    // Summary cards
    const totalAds = myAds.length
    const totalValue = myAds.reduce(
      (sum, ad) => sum + (Number(ad.price) || 0),
      0
    )

    // Category stats
    const categoryCounts = myAds.reduce((acc, ad) => {
      const c = ad.category || 'other'
      acc[c] = (acc[c] || 0) + 1
      return acc
    }, {})

    // Admin stats + users list (only if Admin)
    let adminStats = null
    let all = []
    if (user.category === 'Admin') {
      adminStats = {
        totalUsers: await User.countDocuments(),
        totalAdsAll: await Ads.countDocuments()
      }
      all = await User.find({})
    }

    res.render('user/index.ejs', {
      user,
      myAds,
      totalAds,
      totalValue,
      categoryCounts,
      adminStats,
      all
    })
  } catch (error) {
    console.log(error)
    res.redirect('/')
  }
})

module.exports = router
