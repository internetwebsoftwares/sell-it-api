const router = require("express").Router();
const Report = require("../Models/report");
const Ad = require("../Models/advertisement");
const auth = require("../Middlewares/auth");

//Report an Ad
router.post("/report/:id/post", auth, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    const reportSubject = req.body.reportSubject;
    const comment = req.body.comment;
    const report = new Report({
      adId: ad._id,
      addTitle: ad.title,
      addLink: `${process.env.DOMAIN}/ad/${ad._id}/`,
      reportedByUserId: req.user._id,
      reportSubject,
      comment,
    });

    await report.save();
    res.send("Your report has been submitted");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read all reports
router.get("/reports/all/:pageNum", async (req, res) => {
  const reports = await Report.find({})
    .limit(10)
    .skip(parseInt(req.params.pageNum) * 10 - 10);
  res.send(reports);
});

module.exports = router;
