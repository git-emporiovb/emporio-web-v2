const AuthMiddleware = require("../middlewares/auth");
const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", AuthMiddleware, async function (req, res) {
    try {
        var response = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/sales`,
                headers: {
                    authorization: req.cookies.token ? `Bearer ${req.cookies.token}` : undefined
                },
                data: {
                    client: req.user.id
                }
            })
        ).body;
        return Utils.render({
            req,
            res,
            view: "orders",
            parameters: {
                sales: response.sales,
                pagination: response.pagination
            }
        });
    } catch (error) {
        console.error(error);
        return res.render("500");
    }
});

router.get("/:id", AuthMiddleware, async function (req, res) {
    try {
        var order = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/orders/${req.params.id}`,
                headers: {
                    authorization: req.cookies.token ? `Bearer ${req.cookies.token}` : undefined
                }
            })
        ).body;
        return Utils.render({
            req,
            res,
            view: "order",
            parameters: {
                order
            }
        });
    } catch (error) {
        console.error(error);
        return res.render("500");
    }
});

module.exports = {
    path: "orders",
    router
};
