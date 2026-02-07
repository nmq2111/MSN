const express = require('express')
require('dotenv').config()
const path = require('path')

const mongoose = require('mongoose')
const methodOverride = require('method-override')
const morgan = require('morgan')
const expressSession = require('express-session')
const MongoStore = require('connect-mongo')

const passUserToView = require('./middleware/pass-user-to-view')
const isSignedIn = require('./middleware/is-signed-in')
const isStrongPassword = require('./middleware/isStrongPassword')

// Controllers
const userController = require('./controllers/user')
const adsController = require('./controllers/Ads')

const app = express()
const PORT = process.env.PORT || 3000

// View Engine Setup
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB: ${mongoose.connection.name}`)
})

// Middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(methodOverride('_method'))
app.use(morgan('dev'))

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
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

// routes
app.use('/user', userController)
app.use('/Ads', adsController)

app.use(isSignedIn)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
