const express = require("express");
const router = express.Router();
const auth = require("../../middleware/tokenVerification");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { check, validationResult } = require("express-validator/check");

const config = require("config");
const Users = require("../../models/User");

// @route  GET api/auth
// @desc   fetch user data without password
// @access private
router.get("/", auth, async (req, res) => {
  try {
    user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ msg: "server error" });
  }
});

// @route  POST api/auth
// @desc   authenticate user
// @access public
router.post(
  "/",

  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter your password").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await Users.findOne({ email });

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;
