const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", async function (req, res) {
    try {
        console.log(req.query);
        var category;
        var subcategory;
        var subcategories;
        var sort;
        if (req.query.category) {
            var category = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/categories/${req.query.category}`
                })
            ).body;
            var subcategories = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/categories/${req.query.category}/subcategories`
                })
            ).body.subcategories;
            if (req.query.subcategory) {
                subcategory = (
                    await Utils.axiosRequest({
                        method: "GET",
                        url: `${process.env.SERVER_URL}/categories/${req.query.category}/subcategories/${req.query.subcategory}`
                    })
                ).body;
            }
        }
        var results = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items`,
                data: {
                    category: req.query.category || undefined,
                    subcategory: req.query.subcategory || undefined,
                    search: req.query.search || undefined,
                    sort: req.query.sort || undefined,
                    page: Number(req.query.page || 1),
                    limit: Number(req.query.limit || 20),
                    featured: req.query.featured ? true : undefined,
                    list: req.query.list || undefined,
                    image: true,
                    stock: true
                }
            })
        ).body;
        return Utils.render({
            req,
            res,
            view: "search",
            parameters: {
                title: Utils.toProperCase(category?.name || "PRODUTOS"),
                keyword: req.query.search || "",
                sort: req.query.sort || "",
                category,
                subcategory,
                subcategories,
                results: results.items,
                pagination: results.pagination
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "search",
    router
};
