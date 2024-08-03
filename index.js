"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "css")));
app.use(express.static(path.join(__dirname, "svg")));
app.use(express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, "img")));
app.use(express.static(path.join(__dirname, "fonts")));
app.use(express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
fs.readdir("./routes", function (error, files) {
    files.forEach(function (file) {
        app.use(`/${require("./routes/" + file).path}`, require("./routes/" + file).router);
    });
});

var server = require("http").createServer(app);
server.timeout = Number(process.env.REQUEST_TIMEOUT) * 1000;
server.listen(process.env.PORT, async function () {
    console.log("Server started at http://localhost:" + process.env.PORT);
});
