module.exports = (req, res, next) => {
  try {
    const pw = req.body?.password

    // If it's not a request with a password (GET, other routes), just continue
    if (!pw) return next()

    const ok =
      pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /[0-9]/.test(pw)

    if (!ok) {
      return res
        .status(400)
        .send('Password must be 8+ chars with upper/lowercase and a number.')
    }

    return next()
  } catch (err) {
    console.log(err)
    return res.status(500).send('Server error.')
  }
}
