require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose");
const userRouter = require("./Routes/user");
const adRouter = require("./Routes/advertisment");
const reportRouter = require("./Routes/report");
const translateRouter = require("./Routes/translate");

mongoose.connect(process.env.DATABASE_CONNECTION_STRING);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(userRouter);
app.use(adRouter);
app.use(reportRouter);
app.use(translateRouter);

app.listen(PORT, () =>
  console.log(`Server is up on port: http://localhost:${PORT}/`)
);
