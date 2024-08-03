"use strict";

const Utils = require("../../utils");

const AuthMiddleware = async function (req, res, next) {
    try {
        req.user = await retrieveSessionUser(req.cookies.token);
        return next();
    } catch (error) {
        console.error(error);
        return res.clearCookie("token").status(401).redirect("/");
    }
};

async function retrieveSessionUser(session_id) {
    return (
        await Utils.axiosRequest({
            method: "GET",
            url: `${process.env.SERVER_URL}/users/profile`,
            headers: {
                authorization: `Bearer ${session_id}`
            }
        })
    ).body;
}

module.exports = AuthMiddleware;
