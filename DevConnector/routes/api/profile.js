const express = require("express");
const router = express.Router();
const auth = require("../../middleware/tokenVerification");
const { check, validationResult } = require("express-validator/check");
const request = require("request");
const config = require("config");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route  GET api/profile/me
// @desc   fetch current user's profile
// @access private
router.get("/me", auth, async (req, res) => {
  try {
    // 1. find a single user via the foreign key 'user' in the Profile model
    //    user id must be in the request
    //    populate() sets the const profile with that specific user's data
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    // 2. check to see if there is a profile
    if (!profile) {
      return res.status(400).json({ msg: "profile does not exist" });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  POST api/profile
// @desc   Create or update user profile
// @access private
router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required")
        .not()
        .isEmpty(),
      check("skills", "Skills is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    //Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;
    if (facebook) profileFields.social.facebook = facebook;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        //update database entry
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }

      //if profile is not found, create profile - maybe this should be its own endpoint
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route  GET api/profiles
// @desc   fetch all user profile metadata
// @access public
router.get("/profiles", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route  GET api/profile/:userId
// @desc   fetch a user profile by userId
// @access public
router.get("/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) return res.status(400).json("Profile not found");

    return res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json("Profile not found");
    }
    res.status(500).send("Server error");
  }
});

// @route  Delete api/profile/:userId
// @desc   delete a user, profile and posts
// @access private
router.delete("/:userId", auth, async (req, res) => {
  try {
    //@todo: add code to delete all posts based on userId

    //this block deletes the profile (if the posts are deleted successfully)
    await Profile.findOneAndRemove({ user: req.params.userId });

    //does the AWAIT keywork make the next two steps unnecessary?
    let profile = await Profile.findOne({ user: req.params.userId });
    if (profile)
      return res
        .status(400)
        .json({ msg: "Delete unsuccessful: profile cannot be deleted" });

    //if the posts and profile deletion was successful, go ahead and delete the user
    await User.findOneAndRemove({ _id: req.params.userId });
    let user = await User.findOne({ _id: req.params.userId });
    if (user)
      return res
        .status(400)
        .json({ msg: "Delete unsuccessful: user cannot be deleted" });

    //return success message if all deletes are successful
    res.status(200).json({ msg: "User successfully deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route  PUT api/profile/:userId/experience
// @desc   add experience to a specific user's profile
// @access private
router.put(
  "/:userId/experience",
  [
    auth,
    [
      check("title", "Title is required")
        .not()
        .isEmpty(),
      check("company", "Company is required")
        .not()
        .isEmpty(),
      check("from", "Start Date is required")
        .not()
        .isEmpty(),
      check("from", "Start Date is required")
        .not()
        .isISO8601(),
      check("current", "Current is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    //Build experience array
    const experienceFields = {};
    experienceFields.company = company;
    experienceFields.title = title;
    experienceFields.from = from;
    experienceFields.current = current;
    if (location) experienceFields.location = location;
    if (to) experienceFields.to = to;
    if (description) experienceFields.description = description;

    try {
      let profile = await Profile.findOne({ user: req.params.userId });
      if (profile) {
        //update database entry
        profile.experience.unshift(experienceFields);

        await profile.save();

        return res.json(profile);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route  Delete api/profile/:userId/experience/:experienceId
// @desc   delete a block of experience based on the id
// @access private
router.delete("/:userId/experience/:experienceId", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.params.userId });

    if (!profile)
      return res
        .status(400)
        .json({ msg: "Invalid request: no profile exists" });

    if (!profile.experience.length)
      return res
        .status(400)
        .json({ msg: "Invalid request: no profile experience exists" });

    let experienceArrayIndex = profile.experience
      // the map function creates a new array of all of the OBJECTIDS from the experience array
      .map(item => item.id)
      // the index of function finds the index of the new array
      // Question: could this be dangerous doing it this way since documentes in mongo are json collections?
      .indexOf(req.params.experienceId);
    console.log(experienceArrayIndex);

    //remove the experience entry using .splice()
    if (experienceArrayIndex === -1)
      return res.status(400).json({
        msg: "Invalid request: that profile experience does not exist"
      });
    profile.experience.splice(experienceArrayIndex, 1);

    await profile.save();

    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route  PUT api/profile/:userId/education
// @desc   add education to a specific user's profile
// @access private
router.put(
  "/:userId/education",
  [
    auth,
    [
      check("school", "School is required")
        .not()
        .isEmpty(),
      check("degree", "Degree is required")
        .not()
        .isEmpty(),
      check("fieldofstudy", "Field of study is required")
        .not()
        .isEmpty(),
      check("from", "Start Date is required")
        .not()
        .isISO8601(),
      check("current", "Current is required")
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    //Build experience array
    const educationFields = {};
    educationFields.school = school;
    educationFields.degree = degree;
    educationFields.fieldofstudy = fieldofstudy;
    educationFields.from = from;
    educationFields.current = current;
    if (to) educationFields.to = to;
    if (description) educationFields.description = description;

    try {
      let profile = await Profile.findOne({ user: req.params.userId });
      if (profile) {
        //update database entry
        profile.education.unshift(educationFields);

        await profile.save();

        return res.json(profile);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route  Delete api/profile/:userId/education/:educationId
// @desc   delete a block of education based on the id
// @access private
router.delete("/:userId/education/:educationId", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.params.userId });

    if (!profile)
      return res
        .status(400)
        .json({ msg: "Invalid request: no profile exists" });

    if (!profile.education.length)
      return res
        .status(400)
        .json({ msg: "Invalid request: no profile experience exists" });

    let educationArrayIndex = profile.education
      // the map function creates a new array of all of the OBJECTIDS from the experience array
      .map(item => item.id)
      // the index of function finds the index of the new array
      // Question: could this be dangerous doing it this way since documentes in mongo are json collections?
      .indexOf(req.params.educationId);
    console.log(educationArrayIndex);

    //remove the experience entry using .splice()
    if (educationArrayIndex === -1)
      return res.status(400).json({
        msg: "Invalid request: that profile education does not exist"
      });
    profile.education.splice(educationArrayIndex, 1);

    await profile.save();

    res.status(200).json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route  GET api/profile/:userId/github/:username
// @desc   Get user's github repositories
// @access public
router.get("/:userId/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    request(options, async (error, response, body) => {
      if (error) {
        console.error(error);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No github profile found" });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
