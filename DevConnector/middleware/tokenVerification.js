const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function(req, res, next) {
  // 1. get token from header
  const token = req.header("x-auth-token");

  // 2. check for the token
  if (!token) {
    return res.status(401).json({ msg: "Auth error" });
  }

  // 3. verify token
  try {
    //there is no step to verify if the token is a valid token from the same session
    //this could be a security issue, because we are setting the token's user to the request user without validation
    //i could potentially hack an account this way, maybe?
    //maybe this middleware is not such a good idea, and a third party library should be used

    const decoded = jwt.verify(token, config.get("jwtSecret"));

    //get user data from the decoded token
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Auth error" });
  }
};
