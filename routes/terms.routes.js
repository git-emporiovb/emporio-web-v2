const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", async function (req, res) {
    try {
        return Utils.render({
            req,
            res,
            view: "terms"
        });
    } catch (error) {
        console.error(error);
        return res.render("500");
    }
});

module.exports = {
    path: "terms",
    router
};
