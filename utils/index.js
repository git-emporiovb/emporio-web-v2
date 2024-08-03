"use strict";

const fs = require("fs");
const axios = require("axios");

const Utils = {
    render: async function ({ req, res, view, parameters }) {
        try {
            if (!parameters) {
                parameters = {};
            }
            var categories = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/categories`,
                    data: {
                        archived: false,
                        featured: true,
                        page: 1,
                        limit: 24
                    }
                })
            ).body.categories;
            var promotional_banner = (
                await Utils.axiosRequest({
                    method: "GET",
                    url: `${process.env.SERVER_URL}/banners/promotional`
                })
            ).body;
            return res.status(200).render(view, {
                promo: {
                    text: promotional_banner.text || "Emporio Villa Borghese",
                    link: promotional_banner.link || "https://emporio-web-v2-765b2736bf11.herokuapp.com"
                },
                user: req.user,
                categories,
                Utils,
                ...parameters
            });
        } catch (error) {
            return res.status(500).render("500");
        }
    },
    toProperCase: function (string) {
        string = string.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        return string;
    },
    zeroPad: function (n, width, z) {
        n = Number(n);
        z = z || "0";
        n = n + "";
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },
    formatCurrency: function (number) {
        return number.toFixed(2);
    },
    formatDate: function (date, time) {
        if (typeof date === "string") {
            date = new Date(date);
        }
        var string = `${Utils.zeroPad(date.getDate(), 2)}/${Utils.zeroPad(date.getMonth() + 1, 2)}/${date.getFullYear()}`;
        if (time) {
            string += ` ${Utils.zeroPad(date.getHours(), 2)}:${Utils.zeroPad(date.getMinutes(), 2)}`;
        }
        return string;
    },
    axiosRequest(parameters) {
        return new Promise(async function (resolve, reject) {
            try {
                console.log(`Making ${parameters.method} request`, parameters);
                var response = await axios({
                    method: parameters.method,
                    url: parameters.url,
                    data: parameters.method === "POST" ? parameters.data : undefined,
                    params: parameters.method === "GET" ? parameters.data : undefined,
                    auth: parameters.auth,
                    headers: parameters.headers
                });
                if (response.data.error) {
                    console.log(`${parameters.method} request failed`, {
                        status: response.status,
                        error: response.data.error
                    });
                    return reject({
                        status: response.status,
                        error: response.data.error
                    });
                } else {
                    console.log(`${parameters.method} request response`, {
                        status: response.status,
                        body: response.data
                    });
                    return resolve({
                        status: response.status,
                        body: response.data
                    });
                }
            } catch (error) {
                console.error(`${parameters.method} request failed`, {
                    data: error.response?.data
                });
                return reject();
            }
        });
    },
    saveJSON: async function (filename, data) {
        return new Promise(async function (resolve, reject) {
            fs.writeFile(`./outputs/${filename}.json`, JSON.stringify(data), (error) => {
                if (error) {
                    return reject(error);
                }
                return resolve();
            });
        });
    },
    readJSON: async function (filename) {
        return new Promise(async function (resolve, reject) {
            fs.readFile(`./outputs/${filename}.json`, (error, data) => {
                if (error) {
                    return reject(error);
                }
                return resolve(JSON.parse(data));
            });
        });
    }
};

function hasUppercaseLetter(string) {
    return /w*[A-Z]/g.test(string);
}

function hasLowercaseLetter(string) {
    return /[a-z]/g.test(string);
}

function hasNumber(string) {
    return /[1-9]/g.test(string);
}

function getClassSchema(name) {
    return new Promise(function (resolve, reject) {
        var query = new Parse.Schema(name);
        query
            .get()
            .then(function (schema) {
                return resolve(schema);
            })
            .catch((error) => {
                console.error(error);
                return reject(error);
            });
    });
}

function removeParsePointers(object) {
    if (typeof object === "object" && !Array.isArray(object)) {
        for (var key in object) {
            if (key === "pointer") {
                object[key] = undefined;
                continue;
            }
            if (typeof object[key] === "object") {
                object[key] = removeParsePointers(object[key]);
            }
        }
    } else if (Array.isArray(object)) {
        for (var i = 0; i < object.length; i++) {
            if (object[i] === "pointer") {
                object[i] = undefined;
                continue;
            }
            if (typeof object[i] === "object") {
                object[i] = removeParsePointers(object[i]);
            }
        }
    }
    return object;
}

module.exports = Utils;
