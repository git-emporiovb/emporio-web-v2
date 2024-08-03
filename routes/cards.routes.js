const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        var response = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/cards`,
                headers: {
                    authorization: `Bearer ${req.cookies.token}`
                }
            })
        ).body;
        return Utils.render({
            req,
            res,
            view: "cards",
            parameters: {
                cards: response.cards
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

router.get("/:id", AuthMiddleware, async function (req, res) {
    try {
        var card = {};
        if (req.params.id !== "new") {
            card = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/cards/${req.params.id}`,
                    headers: {
                        authorization: `Bearer ${req.cookies.token}`
                    }
                })
            ).body;
        }
        return Utils.render({
            req,
            res,
            view: "card",
            parameters: {
                card
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "cards",
    router
};
