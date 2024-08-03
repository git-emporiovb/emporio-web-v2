const express = require("express");
const Utils = require("../utils");
const router = express.Router();

router.get("/", async function (req, res) {
    try {
        var banners = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/banners`,
                data: {
                    active: true
                }
            })
        ).body.banners;
        var featured = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items`,
                data: {
                    featured: true,
                    page: 1,
                    limit: 20,
                    image: true,
                    stock: true
                }
            })
        ).body.items;
        var wines = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items`,
                data: {
                    category: "C519ajCdPI",
                    page: 1,
                    limit: 20,
                    image: true,
                    stock: true
                }
            })
        ).body.items;
        var imported = (
            await Utils.axiosRequest({
                method: "GET",
                url: `${process.env.SERVER_URL}/items`,
                data: {
                    category: "AIEm83FWG8",
                    page: 1,
                    limit: 20,
                    image: true,
                    stock: true
                }
            })
        ).body.items;
        return Utils.render({
            req,
            res,
            view: "index",
            parameters: {
                banners,
                featured,
                imported,
                wines
            }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).render("500");
    }
});

module.exports = {
    path: "",
    router
};
