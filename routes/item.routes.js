const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/:id", async function (req, res) {
    try {
        console.log(req.params.id);
        var item = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items/${req.params.id}`
            })
        ).body;
        var related = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items`,
                data: {
                    category: item.category.id || undefined,
                    sort: req.query.sort || undefined,
                    page: Number(req.query.page || 1),
                    limit: Number(req.query.limit || 20),
                    stock: true,
                    image: true
                }
            })
        ).body.items;
        return Utils.render({
            req,
            res,
            view: "item",
            parameters: {
                item,
                related
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "items",
    router
};
