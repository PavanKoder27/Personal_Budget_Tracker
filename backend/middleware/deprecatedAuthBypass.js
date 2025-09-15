// Simple passthrough middleware retained after removing legacy third-party auth.
// Can be safely deleted once confirmed no references remain.
module.exports = function deprecatedAuthBypass(_req, _res, next) { return next(); };