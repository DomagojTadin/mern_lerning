const express = require("express");
const router = express.Router();
const auth = require("../../middleware/tokenVerification");

const User = require("../../models/User");

// @route  api/auth
// @desc   fetch user information
// @access public
router.get("/", auth, async (req, res) => {
  try {
    user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ msg: "server error" });
  }
});

module.exports = router;
