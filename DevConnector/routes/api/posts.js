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

// @route  PUT api/posts/:postid/like
// @desc   add a like to a post
// @access private
router.put("/:postid/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postid);

    //check if post has been already liked by the user
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      // set to remove the like or return a message that says post has already been liked
      return res.status(400).json({ msg: "post already liked" });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// @route  PUT api/posts/:postid/unlike
// @desc   remove a like from a post
// @access private
router.put("/:postid/unlike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postid);
    if (!post) {
      return res.status(404).json({ msg: "post not found" });
    }

    //check if post has been already liked by the user
    if (
      (post.likes.filter(
        like => like.user.toString() === req.user.id
      ).length = 0)
    ) {
      // set to remove the like or return a message that says post has already been liked
      return res.status(400).json({ msg: "post not liked yet" });
    }

    //Get remove index
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);

    if (removeIndex === -1)
      return res.status(400).json({
        msg: "Invalid request: that user's like does not exist"
      });
    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// @route  POST api/posts/:postid/comment
// @desc   create a comment on a post
// @access private
router.post(
  "/:postid/comment",
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
      const post = await Post.findById(req.params.postid);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
        date: req.body.date
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.log(err);
      res.status(500).send("Server error");
    }
  }
);

// @route  Delete api/posts/:postid/comment/:commentid
// @desc   delete a comment by commentid
// @access private
router.delete("/:postid/comment/:commentid", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postid);
    if (!post) {
      return res.status(404).json({ msg: "no post exists" });
    }

    const comment = post.comments.find(
      comment => comment.id.toString() === req.params.commentid
    );

    if (!comment) {
      return res.status(404).json({ msg: "that comment does not exist" });
    }

    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "user not authorized" });
    }

    const removeIndex = post.comments
      .map(comment => comment.id.toString())
      .indexOf(req.params.commentid);

    if (removeIndex === -1)
      return res.status(400).json({
        msg: "Invalid request: that user's comment does not exist"
      });
    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.log(err);
    if (err.kind == "ObjectId") {
      return res.status(404).json({ msg: "no post exists" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
