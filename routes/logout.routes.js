const express = require("express");
const AuthMiddleware = require("../middlewares/auth");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        await Utils.axiosRequest({
            method: "GET",
            url: `${process.env.SERVER_URL}/users/logout`,
            headers: {
                authorization: `Bearer ${req.cookies.token}`
            }
        });
    } catch (error) {
        console.error(error);
    }
    return res.clearCookie("token").status(200).redirect("/");
});

module.exports = {
    path: "logout",
    router
};
