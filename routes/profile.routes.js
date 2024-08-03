const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        return Utils.render({
            req,
            res,
            view: "profile",
            parameters: {
                user: req.user
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "profile",
    router
};
