// Shared password check for the /block admin endpoints. The password lives
// only in the ADMIN_PASSWORD Vercel env var — never hardcoded, never logged.
var crypto = require('crypto');

function checkPassword(req) {
  var expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  var provided = req.headers['x-admin-password'];
  if (typeof provided !== 'string' || !provided) return false;
  try {
    var a = Buffer.from(provided);
    var b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) { return false; }
}

module.exports = { checkPassword: checkPassword };
