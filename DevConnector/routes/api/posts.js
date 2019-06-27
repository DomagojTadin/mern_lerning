const express = require("express");
const router = express.Router();

// @route  api/posts
// @desc   fetch user information
// @access public
router.get("/", (req, res) => res.send("post route"));

module.exports = router;
