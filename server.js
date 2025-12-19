const express = require('express')
const bcrypt = require('bcrypt')
const dotenv = require('dotenv').config()
const ejs = require('ejs')

const app = express()
const PORT = process.env.PORT || 3000
const path = require('path')

const mongoose = require('mongoose')
const methodOverride = require('method-override')
const morgan = require('morgan')
const expressSession = require('express-session')
const cloudinary = require('./config/cloudinary')

const MongoStore = require('connect-mongo')

const passUserToView = require('./middleware/pass-user-to-view')
const isSignedIn = require('./middleware/is-signed-in')
const upload = require('./middleware/upload')

// Controllers
const userController = require('./controllers/user')
const adsController = require('./controllers/Ads')

// View Engine Setup
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser: true,
  //useUnifiedTopology: true,
})
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`)
})

// Middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(methodOverride('_method'))
app.use(morgan('dev'))
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI
    })
  })
)
app.use(passUserToView)

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect(`/user/${req.session.user._id}/user`)
  } else {
    res.render('index', { user: req.user })
  }
})

app.use('/user', userController)
app.use('/Ads', adsController)
app.use(isSignedIn)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
