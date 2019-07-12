const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/tokenVerification");

const Post = require("../../models/Post");
const User = require("../../models/User");
const Profile = require("../../models/Profile");

// @route  POST api/posts
// @desc   create a post
// @access private
router.post(
  "/",
  [
    auth,
    [
      check("text", "Text is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select("-password");
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.log(err);
      res.status(500).send("Server error");
    }
  }
);

// @route  GET api/posts
// @desc   Fetch all existing posts sorted by most recent
// @access private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// @route  GET api/posts/:userid
// @desc   Fetch a post by post id
// @access private
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "no post exists" });
    }
    res.json(post);
  } catch (err) {
    console.log(err);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "no post exists" });
    }
    res.status(500).send("Server error");
  }
});

// @route  Delete api/posts/:id
// @desc   delete a post by id
// @access private
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "no post exists" });
    }
    //check the user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    await post.remove();

    res.json({ msg: "post successfully removed" });
  } catch (err) {
    console.log(err);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "no post exists" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
