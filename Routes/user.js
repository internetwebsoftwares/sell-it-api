const router = require("express").Router();
const isEmail = require("validator/lib/isEmail");
const User = require("../Models/user");
const Ads = require("../Models/advertisement");
const AdImages = require("../Models/adImages");
const PreviewImage = require("../Models/previewImage");
const bcrypt = require("bcryptjs");
const auth = require("../Middlewares/auth");
const Report = require("../Models/report");

//Register
router.post("/register", async (req, res) => {
  let { firstName, lastName, phoneNumber, email, password } = req.body;
  try {
    if (!firstName) {
      return res.send("First name is required");
    }
    if (firstName.length < 3) {
      return res.send("First name must have atleast 3 characters");
    }
    if (!lastName) {
      return res.send("Last name is required");
    }
    if (lastName.length < 3) {
      return res.send("Last name must have atleast 3 characters");
    }
    if (!phoneNumber) {
      return res.send("Phone number is required");
    }
    if (phoneNumber.length < 10) {
      return res.send("Invalid phone number");
    }

    const isPhoneNumAvailable = await User.findOne({ phoneNumber });

    if (isPhoneNumAvailable) {
      return res.send("There is already an account with this phone number");
    }

    if (!email) {
      return res.send("Email is required");
    }
    if (!isEmail(email)) {
      return res.send("Invalid email address");
    }

    const isEmailAvailable = await User.findOne({ email });

    if (isEmailAvailable) {
      return res.send("There is already an account with this email address");
    }

    if (!password) {
      return res.send("Password is required");
    }
    if (password.length < 7) {
      return res.send("Password must be of atleast 7 characters");
    }

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });

    const token = await user.generateAuthToken();
    await user.save();
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Login
router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  try {
    if (!email) {
      return res.send("Please enter email address or phone number");
    }
    if (!password) {
      return res.send("Please enter password");
    }

    const user = await User.findOne({
      $or: [{ email }, { phoneNumber: email }],
    });
    if (!user) {
      return res.send("No user found with this email or phone no");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.send("Incorrect password");
    }
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(500).send(error);
  }
});

//Logout
router.post("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send("Logged out successfully");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Update profile
router.put("/user/profile/update", auth, async (req, res) => {
  try {
    const user = req.user;
    let availableUpdates = ["firstName", "lastName", "phoneNumber"];

    const userUpdating = Object.keys(req.body);
    const isValidOperation = userUpdating.every((update) =>
      availableUpdates.includes(update)
    );
    if (!isValidOperation) {
      return res.send("Invalid updates");
    }
    userUpdating.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await user.save();
    res.send("Profile updated");
  } catch (error) {
    if (error.keyPattern.phoneNumber || error.keyValue.phoneNumber) {
      return res.send("There is already an account with this phone number");
    }
    res.status(500).send(error);
  }
});

//Change password
router.put("/user/password/change", auth, async (req, res) => {
  let { currPass, newPass } = req.body;
  try {
    if (!currPass) {
      return res.send("Please enter current password");
    }

    if (!newPass) {
      return res.send("Please enter new password");
    }

    if (currPass === newPass) {
      return res.send(
        "New password must be different from the current password"
      );
    }
    const isPasswordCorrect = await bcrypt.compare(currPass, req.user.password);

    if (!isPasswordCorrect) {
      return res.send("Incorrect current password");
    }

    if (newPass.length < 7) {
      return res.send("New password must be of atleast 7 characters long");
    }

    req.user.password = newPass;
    await req.user.save();
    res.send("Password has changed.");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Delete account
router.delete("/user/account/delete", auth, async (req, res) => {
  let { password } = req.body;
  try {
    if (!password) {
      return res.send("Please enter password");
    }
    const user = req.user;
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.send("Incorrect password");
    }
    await Ads.deleteMany({ owner: user._id });
    await AdImages.deleteMany({ ad: user._id });
    await PreviewImage.deleteMany({ owner: user._id });
    await Report.deleteMany({ reportedByUserId: user._id });
    await user.remove();
    res.send("Your account has been deleted");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Delete anyones account (Admin)
router.delete("/admin/user/:id/account/delete", auth, async (req, res) => {
  try {
    const user = req.user;
    if (!user.isAdmin) {
      return res.send("You do not have this permission");
    }
    const accountAboutToDelete = await User.findById(req.params.id);
    await Ads.deleteMany({ owner: accountAboutToDelete._id });
    await AdImages.deleteMany({ owner: accountAboutToDelete._id });
    await PreviewImage.deleteMany({ owner: accountAboutToDelete._id });
    await Report.deleteMany({ reportedByUserId: accountAboutToDelete._id });
    await accountAboutToDelete.remove();
    res.send("Account has been deleted by admin");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read all users (Admin)
router.get("/admin/users/all/:pageNo", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(400).send("You dont have this permission");
    const users = await User.find({})
      .limit(10)
      .skip(parseInt(req.params.pageNo) * 10 - 10);
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
