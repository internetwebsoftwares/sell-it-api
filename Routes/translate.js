const router = require("express").Router();
const { translate } = require("bing-translate-api");

// Get translation
router.post("/api/translate/", async (req, res) => {
  try {
    const text = req.body.text;
    const from = req.body.from;
    const to = req.body.to;
    if (!text) return res.send("Please enter something");
    if (!from) from = "auto-detect";
    if (!to) to = "en";
    const response = await translate(text, from, to, true);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
