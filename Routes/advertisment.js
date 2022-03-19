const router = require("express").Router();
const multer = require("multer");
const sharp = require("sharp");

const Ad = require("../Models/advertisement");
const AdImage = require("../Models/adImages");
const PreviewImage = require("../Models/previewImage");
const auth = require("../Middlewares/auth");
const Report = require("../Models/report");

const fs = require("fs");

//Multer config
const uploads = multer({
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg|jfif)$/)) {
      return cb(new Error("Only supports png and jpeg file types"));
    }
    cb(undefined, true);
  },
});

//Create an Ad
router.post(
  "/ad/new",
  auth,
  uploads.array("images", 5),
  async (req, res) => {
    let {
      title,
      description,
      price,
      category,
      location,
      district,
      state,
      city,
      isPremium,
    } = req.body;
    if (!title) {
      return res.send("Title is required");
    }
    if (!description) {
      return res.send("Description is required");
    }
    if (!price) {
      return res.send("Price is required");
    }

    if (!category) {
      return res.send("Please select a category");
    }

    if (!state) {
      return res.send("Please select your state");
    }
    if (!district) {
      return res.send("Please select your district");
    }
    if (!city) {
      return res.send("Please add city");
    }
    if (req.files.length < 1) {
      return res.send("Please select atleast 1 image");
    }

    if (req.files.length > 5) {
      return res.send("You can only upload 5 images at once");
    }

    let imagesBuffer = [];

    for (let file of req.files) {
      let imageBuffer = await sharp(file.buffer)
        .resize(350, 350)
        .png()
        .toBuffer();
      imagesBuffer.push(imageBuffer);
    }

    let previewImageBuffer = await sharp(req.files[0].buffer)
      .resize(180, 180)
      .png()
      .toBuffer();

    const ad = new Ad({
      title,
      description,
      price,
      owner: req.user._id,
      category,
      state,
      district,
      city,
      isPremium,
      location,
      ownerName: req.user.firstName + " " + req.user.lastName,
    });

    const images = new AdImage({
      images: imagesBuffer,
      adId: ad._id,
      owner: req.user._id,
    });

    const previewImage = new PreviewImage({
      previewImage: previewImageBuffer,
      adId: ad._id,
      owner: req.user._id,
    });

    const imagesUrls = req.files.map((file, index) => {
      return `${process.env.DOMAIN}/ad/${ad._id}/image/${index + 1}`;
    });

    const previewImageUrl = `${process.env.DOMAIN}/ad/${ad._id}/preview/image`;

    ad.imagesUrls = imagesUrls;
    ad.previewImageUrl = previewImageUrl;

    await ad.save();
    await images.save();
    await previewImage.save();
    res.send("Ad has been created");
  },
  (error, req, res, next) => {
    res.send({ error: error });
  }
);

//Read all ads
router.get("/ads/all/:pageNum", async (req, res) => {
  let options;
  let categories = JSON.parse(req.query.categories);
  if (req.query.categories === undefined || categories.length < 1) {
    options = {
      isSold: false,
    };
  } else {
    options = {
      isSold: false,
      category: {
        $in: categories,
      },
    };
  }
  const ads = await Ad.find(options)
    .limit(10)
    .skip(parseInt(req.params.pageNum) * 10 - 10);

  res.send(ads);
});

//Read one ad
router.get("/ad/:id", async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.send("No result found");
    }
    res.send(ad);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read your ads
router.get("/ads/mine/all", auth, async (req, res) => {
  try {
    const ads = await Ad.find({ owner: req.user._id.toString() });
    res.send(ads);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read image of an ad HD
router.get("/ad/:id/image/:index", async (req, res) => {
  try {
    const ad = await AdImage.findOne({ adId: req.params.id });
    if (!ad) {
      return res.send("No result found");
    }

    res.set("Content-Type", "image/png");
    res.send(ad.images[req.params.index - 1]);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read image of an ad (Preview)
router.get("/ad/:id/preview/image", async (req, res) => {
  try {
    const image = await PreviewImage.findOne({ adId: req.params.id });
    if (!image) {
      return res.send("No result found");
    }

    res.set("Content-Type", "image/png");
    res.send(image.previewImage);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Edit an ad
router.put("/ad/:id/edit", auth, async (req, res) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ad) {
      return res.send("No result found");
    }
    const availableUpdates = [
      "title",
      "description",
      "price",
      "category",
      "ownerName",
      "location",
      "state",
      "district",
      "city",
      "isPremium",
    ];

    const userUpdating = Object.keys(req.body);
    const isValidUpdate = userUpdating.every((update) =>
      availableUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.send("Invalid updates");
    }

    userUpdating.forEach((update) => {
      ad[update] = req.body[update];
    });

    await ad.save();
    res.send("Your advertisment has been edited");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Delete an ad
router.delete("/ad/:id/remove", auth, async (req, res) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id, owner: req.user._id });
    if (!ad) {
      return res.send("No result found");
    }
    await ad.remove();
    await Report.deleteMany({ adId: ad._id });
    res.send("Your advertisment has been removed");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Delete anyone's ad (Admin)
router.delete("/admin/ad/:id/remove", auth, async (req, res) => {
  try {
    const ad = await Ad.findOne({ _id: req.params.id });
    if (!req.user.isAdmin) {
      return res.send("You don't have this permission");
    }
    if (!ad) {
      return res.send("No result found");
    }
    await ad.remove();
    await Report.deleteMany({ adId: ad._id });
    res.send("Advertisment has been removed by admin");
  } catch (error) {
    res.status(500).send(error);
  }
});

//Search an ad
router.get("/ads/search/:pageNo", async (req, res) => {
  try {
    let ads = await Ad.find(
      {
        $or: [
          { title: { $regex: `${req.query.searchQuery}`, $options: "gi" } },
          {
            description: { $regex: `${req.query.searchQuery}`, $options: "gi" },
          },
          { category: { $regex: `${req.query.searchQuery}`, $options: "gi" } },
        ],
      },
      { title: 1, category: 1, price: 1 }
    )
      .limit(10)
      .skip(parseInt(req.params.pageNo) * 10 - 10)
      .sort({
        createdAt: "-1",
      });

    let uniqueAdsTitle = [];
    let uniqueAds = [];

    for (let i = 0; i < ads.length; i++) {
      if (uniqueAdsTitle.includes(ads[i].title)) {
        continue;
      } else {
        uniqueAdsTitle.push(ads[i].title);
        uniqueAds.push(ads[i]);
      }
    }

    res.send(uniqueAds);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Read search results
router.get("/searched/all/:pageNum", async (req, res) => {
  try {
    let searchedQuery = req.query.searchedQuery;
    let priceRange = JSON.parse(req.query.priceRange);
    let sortBy = req.query.sortBy;

    let options = {
      $and: [
        {
          $or: [
            { title: searchedQuery },
            { description: searchedQuery },
            { category: searchedQuery },
          ],
        },
        {
          price: {
            $gte: priceRange[0],
            $lte: priceRange[1],
          },
        },
      ],
    };

    const ads = await Ad.find(options)
      .limit(10)
      .skip(parseInt(req.params.pageNum) * 10 - 10)
      .sort({
        price: sortBy,
      });

    res.send(ads);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Product is sold
router.put("/ad/sold/:id/", auth, async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (ad.isSold) return res.status(400).send("Product has already been sold");
    const adImages = await AdImage.findOne({ adId: ad._id.toString() });
    if (!ad) return res.status(404).send("Ad not found");
    if (!req.user.isAdmin || ad.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send("You cannot manipulate someone else's Ad");
    }
    ad.isSold = true;
    await ad.save();
    await adImages.remove();
    res.status(200).send("Product has been sold");
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read saved ads
router.get("/ads/saved", async (req, res) => {
  try {
    const savedAds = await Ad.find({
      _id: {
        $in: JSON.parse(req.query.savedAdsIds),
      },
    });
    res.send(savedAds);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
