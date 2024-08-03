const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        var addresses = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/addresses`,
                headers: {
                    authorization: req.cookies.token ? `Bearer ${req.cookies.token}` : undefined
                }
            })
        ).body.addresses;
        var cards = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/cards`,
                headers: {
                    authorization: req.cookies.token ? `Bearer ${req.cookies.token}` : undefined
                }
            })
        ).body.cards;
        return Utils.render({
            req,
            res,
            view: "checkout",
            parameters: {
                addresses,
                cards
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "checkout",
    router
};
