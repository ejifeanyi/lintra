const express = require("express");
const cors = require("cors");

const app = express();
const router = require("./routes/route");

app.use(express.json());
app.use(cors());
app.use(router);

module.exports = app;