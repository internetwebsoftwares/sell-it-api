const User = require("../Models/user");
const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    const token = req.header("Authorization");
    const decoded = jwt.verify(token, process.env.JWT_AUTH_TOKEN);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send("Please authenticate");
  }
}

module.exports = auth;
