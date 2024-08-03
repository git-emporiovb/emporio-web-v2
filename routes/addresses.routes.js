const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        var response = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/addresses`,
                headers: {
                    authorization: `Bearer ${req.cookies.token}`
                }
            })
        ).body;
        return Utils.render({
            req,
            res,
            view: "addresses",
            parameters: {
                addresses: response.addresses
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

router.get("/:id", AuthMiddleware, async function (req, res) {
    try {
        var address = {};
        if (req.params.id !== "new") {
            address = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/addresses/${req.params.id}`,
                    headers: {
                        authorization: `Bearer ${req.cookies.token}`
                    }
                })
            ).body;
        }
        return Utils.render({
            req,
            res,
            view: "address",
            parameters: {
                address
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "addresses",
    router
};
