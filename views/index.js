/*jshint esversion: 9 */
/*jslint node: true */
"use strict";

require("dotenv").config();
const express = require("express");
const router = express.Router();
const fs = require("fs");
const request = require("request");
const axios = require("axios");
const valid = require("card-validator");
const CepCoords = require("coordenadas-do-cep");

router.get("/", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    //res.redirect('/admin');
    try {
        var results = [];
        console.log(process.pid, "Getting items");
        var query_featured = new Parse.Query("Item");
        query_featured.greaterThan("stock", 0);
        query_featured.descending("demand");
        query_featured.notEqualTo("archived", true);
        query_featured.exists("image");
        query_featured.skip(0);
        query_featured.limit(20);
        query_featured.exists("category");
        query_featured.equalTo("featured", true);
        query_featured.include("category");
        query_featured.include("subcategory");
        var results_featured = await query_featured.find();
        console.log(process.pid, "Got " + results_featured.length + " imported");
        for (var i = 0; i < results_featured.length; i++) {
            results.push(results_featured[i]);
        }

        var query_imported = new Parse.Query("Item");
        query_imported.greaterThan("stock", 0);
        query_imported.descending("demand");
        query_imported.notEqualTo("archived", true);
        query_imported.notEqualTo("featured", true);
        query_imported.exists("image");
        query_imported.skip(0);
        query_imported.limit(20);
        query_imported.equalTo("primary_category", "MERCEARIA IMPORTADA");
        query_imported.include("category");
        query_imported.include("subcategory");
        var results_imported = await query_imported.find();
        console.log(process.pid, "Got " + results_imported.length + " imported");
        for (var i = 0; i < results_imported.length; i++) {
            results.push(results_imported[i]);
        }
        var query_wines = new Parse.Query("Item");
        query_wines.greaterThan("stock", 0);
        query_wines.descending("demand");
        query_wines.notEqualTo("archived", true);
        query_wines.notEqualTo("featured", true);
        query_wines.exists("image");
        query_wines.skip(0);
        query_wines.limit(20);
        query_wines.equalTo("primary_category", "VINHOS DECANTER");
        query_wines.include("category");
        query_wines.include("subcategory");
        var results_wines = await query_wines.find();
        console.log(process.pid, "Got " + results_wines.length + " wines");
        for (var j = 0; j < results_wines.length; j++) {
            results.push(results_wines[j]);
        }

        var featured = "";
        var imported = "";
        var wines = "";
        for (var l = 0; l < results.length; l++) {
            console.log(process.pid, "Got item " + results[l].id);
            var item = {
                id: results[l].id,
                name: results[l].get("name").toProperCase(),
                featured: results[l].get("featured"),
                primary_category: results[l].get("primary_category"),
                price: results[l].get("price"),
                discount: results[l].get("discount"),
                image: results[l].get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br"),
                category: results[l].get("category")?.get("name")?.toProperCase(),
                subcategory: results[l].get("subcategory")?.get("name")?.toProperCase()
            };
            var badge = "";
            var unit = "";
            if (item.unit === "KG") {
                unit = "<small>/kg</small>";
            }
            var price = '<span class="font-weight-bold text-muted">R$ ' + formatCurrency(item.price) + unit + "</span>";
            if (item.discount > 0) {
                price =
                    '<span class="font-size-xs text-gray-350 text-decoration-line-through mr-1">R$ ' +
                    formatCurrency(item.price) +
                    '</span><span class="text-primary">R$ ' +
                    formatCurrency(item.price - item.discount) +
                    unit +
                    "</span>";
                badge = '<div class="badge badge-primary card-badge card-badge-left text-uppercase">OFERTA</div>';
            }
            var row =
                '<div class="col-6 col-md-3 col-lg-24 col-xl-2"> <!-- Card --> <a class="card" href="items/' +
                item.id +
                '"> <!-- Badge --> ' +
                badge +
                ' <!-- Image --> <div class="card-img"> <!-- Image --> <a class="card-img-hover" href="items/' +
                item.id +
                '"> <img class="card-img-top card-img-back" src="' +
                item.image +
                '" alt="..."> <img class="card-img-top card-img-front" src="' +
                item.image +
                '" alt="..."> </a> <!-- Actions --> <div class="card-actions" style="display:none"> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="modal" data-target="#modalProduct"> <i class="fe fe-eye"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-shopping-cart"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-heart"></i> </button> </span> </div> </div> <!-- Body --> <div class="card-body px-0"> <!-- Category --> <div class="font-size-xs"> <div class="text-muted">' +
                (item.subcategory || item.category) +
                '</div> </div> <!-- Title --> <div class="font-weight-bold"> <a class="text-body" href="items/' +
                item.id +
                '" title="' +
                item.name +
                '">' +
                item.name +
                '</a> </div> <!-- Price --> <div class="font-weight-bold text-muted">' +
                price +
                "</div> </div> </a> </div>";
            if (item.featured) {
                featured += row;
            } else if (item.primary_category.toUpperCase().includes("VINHOS")) {
                wines += row;
            } else if (item.primary_category.toUpperCase().includes("IMPORTADA")) {
                imported += row;
            }
        }

        console.log(process.pid, "Getting categories");
        var query = new Parse.Query("Category");
        query.exists("image");
        query.notEqualTo("archived", true);
        var categories = await query.find();
        console.log(process.pid, "Got " + categories.length + " categories");
        var categories_cards = "";
        for (var m = 0; m < categories.length; m++) {
            console.log(process.pid, "Got category", categories[m]);
            categories_cards += `
              <div style="width:100px;padding: 0 15px">
                <div class="card d-flex justify-content-center align-items-center">
                  <!-- Image -->
                  <div class="image"><img src="${categories[m].get("image")?.url().replace("http://localhost", "https://emporiovillaborghese.com.br")}"></div>
                  <!-- Body -->
                  <div class="card-body py-0 px-0 text-center">
                    <!-- Heading -->
                    <a class="stretched-link nav-link px-0" href="/search?category=${categories[m].id}&sort=demand" style="font-size:15px">
                      ${categories[m].get("name").toProperCase()}
                    </a>
                  </div>
                </div>
              </div>`;
            //categories_cards += '<!-- Item --><div class="col" style="max-width: 200px;"><div class="card"><!-- Image --><img class="card-img-top" src="'+ categories[m].get('image').url() +'" alt="'+ categories[m].get('name') +'"><!-- Body --><div class="card-body py-4 px-0 text-center"><!-- Heading --><a class="stretched-link text-body" href="/search?primary_category='+ categories[m].get('name') +'"><h6>'+ categories[m].get('name') +'</h6></a></div></div></div>';
        }
        console.log(process.pid, "Getting banners");
        var queryBanners = new Parse.Query("Banner");
        queryBanners.notEqualTo("archived", true);
        queryBanners.exists("image_desktop");
        queryBanners.exists("image_mobile");
        queryBanners.exists("link");
        queryBanners.ascending("order");
        var banners = await queryBanners.find();
        console.log(process.pid, "Got " + banners.length + " banners");
        var slides = "";
        for (var i = 0; i < banners.length; i++) {
            var status = "";
            if (i === 0) {
                status = "active";
            }
            slides +=
                '<a href="' +
                banners[i].get("link") +
                '" class="slide ' +
                status +
                '"><img class="desktop" src="' +
                banners[i].get("image_desktop").url().replace("http://localhost", "https://emporiovillaborghese.com.br") +
                '"><img class="mobile" src="' +
                banners[i].get("image_mobile").url().replace("http://localhost", "https://emporiovillaborghese.com.br") +
                '"></a>';
        }
        res.status(200).render("index", {
            slides,
            featured,
            imported,
            wines,
            categories_cards,
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.get("/categories", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    //res.redirect('/admin');
    try {
        console.log(process.pid, "Getting categories");
        var query = new Parse.Query("Item");
        var categories = await query.distinct("primary_category");
        console.log(process.pid, "Got " + categories.length + " categories");
        var categories_cards = "";
        for (var m = 0; m < categories.length; m++) {
            console.log(process.pid, "Got category " + categories[m]);
            categories_cards +=
                '<!-- Item --><div class="col" style="max-width: 200px;"><div class="card"><!-- Image --><img class="card-img-top" src="' +
                categories[m] +
                '" alt="' +
                categories[m] +
                '"><!-- Body --><div class="card-body py-4 px-0 text-center"><!-- Heading --><a class="stretched-link text-body" href="/search?primary_category=' +
                categories[m] +
                '"><h6>' +
                categories[m].toProperCase() +
                "</h6></a></div></div></div>";
        }
        res.status(200).render("categories", {
            categories_cards: categories_cards,
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.get("/search", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        console.log(process.pid, "Getting items", req.query);
        var results_per_page = 20;
        if (req.query.results_per_page) {
            results_per_page = Number(req.query.results_per_page);
        }
        var page = 0;
        if (req.query.page) {
            page = Number(req.query.page - 1);
        }
        var total_pages = 0;
        var query = new Parse.Query("Item");
        if (req.query.search) {
            req.query.search = decodeURI(req.query.search)
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            var stringsQuery = [];
            console.log(process.pid, "Searching for " + req.body.search);
            var strings = req.query.search.split(" ");
            for (var j = 0; j < strings.length; j++) {
                var stringQuery = new Parse.Query("Item");
                stringQuery.matches("name", strings[j], "i");
                stringsQuery.push(stringQuery);
            }
            var nameQuery = Parse.Query.and(...stringsQuery);
            var skuQuery = new Parse.Query("Item");
            skuQuery.equalTo("sku", Number(req.query.search));
            var barcodeQuery = new Parse.Query("Item");
            barcodeQuery.equalTo("barcode", Number(req.query.search));
            query = Parse.Query.or(nameQuery, skuQuery, barcodeQuery);
        }
        if (req.query.offer) {
            console.log(process.pid, "Searching for offer", req.query.offer);
            query.equalTo("promotions", Number(req.query.offer));
        }
        if (req.query.promoted) {
            console.log(process.pid, "Searching for promoted");
            query.equalTo("promoted", true);
        }
        if (req.query.featured) {
            console.log(process.pid, "Searching for featured");
            query.equalTo("featured", true);
        }
        query.greaterThan("stock", 0);
        query.notEqualTo("archived", true);
        //query.notEqualTo('primary_category','ROTISSERIA');
        query.exists("image");
        /*if (req.query.search) {
      query.matches('name',decodeURI(req.query.search),'i');
    }*/
        var category;
        var subcategories_options = "";
        if (req.query.category) {
            var queryCategory = new Parse.Query("Category");
            category = await queryCategory.get(req.query.category);
            query.equalTo("category", category);

            var subcategories = await category.relation("subcategories").query().find();
            for (var k = 0; k < subcategories.length; k++) {
                subcategories_options += `<option value="${subcategories[k].id}">${subcategories[k].get("name")}</option>`;
            }
        }
        var subcategory;
        if (req.query.subcategory) {
            var querySubategory = new Parse.Query("Subcategory");
            subcategory = await querySubategory.get(req.query.subcategory);
            query.equalTo("subcategory", subcategory);
        }

        /*var primary_categories = await query.distinct("primary_category");
    var primary_categories_options = '';
    for (var j = 0; j < primary_categories.length; j++) {
      primary_categories_options += '<li class="list-styled-item"><a class="list-styled-link" href="javascript:;" onclick="primaryCategory(\''+ primary_categories[j] +'\')">'+  primary_categories[j].toProperCase() +'</a></li>';
    }
    console.log(primary_categories);
    if (req.query.primary_category) {
      query.equalTo('primary_category',decodeURI(req.query.primary_category));
      if (req.query.primary_category === 'MERCEARIA') {
        query.notEqualTo('secondary_category','LIQUIDA');
      }
    }
    var secondary_categories = await query.distinct("secondary_category");
    console.log(secondary_categories);
    var secondary_categories_options = '';
    for (var k = 0; k < secondary_categories.length; k++) {
      secondary_categories_options += '<li class="list-styled-item"><a class="list-styled-link" href="javascript:;" onclick="secondaryCategory(\''+ secondary_categories[k] +'\')">'+  secondary_categories[k].toProperCase() +'</a></li>';
    }
    if (req.query.secondary_category) {
      query.equalTo('secondary_category',decodeURI(req.query.secondary_category));
    }
    var tertiary_categories = await query.distinct("tertiary_category");
    console.log(tertiary_categories);
    var tertiary_categories_options = '';
    for (var l = 0; l < tertiary_categories.length; l++) {
      tertiary_categories_options += '<li class="list-styled-item"><a class="list-styled-link" href="javascript:;" onclick="tertiaryCategory(\''+ tertiary_categories[l] +'\')">'+  tertiary_categories[l].toProperCase() +'</a></li>';
    }
    if (req.query.tertiary_category) {
      query.equalTo('tertiary_category',decodeURI(req.query.tertiary_category));
    }*/
        if (req.query.sort === "discount") {
            query.greaterThan("discount", 0);
            query.descending("discount");
        } else if (req.query.sort === "demand") {
            query.descending("demand");
        } else if (req.query.sort === "expensive") {
            query.descending("price");
        } else if (req.query.sort === "cheap") {
            query.ascending("price");
        } else if (req.query.sort === "category") {
            query.ascending("primary_category");
            query.addAscending("secondary_category");
            query.addAscending("tertiary_category");
        } else if (req.query.sort === "subcategory") {
            query.ascending("secondary_category");
            query.addAscending("tertiary_category");
        } else {
            query.ascending("category");
            query.addAscending("subcategory");
        }
        query.exists("category");
        query.include("category");
        query.include("subcategory");
        var total_results = await query.count();
        console.log(process.pid, "There are " + total_results + " items");
        query.skip(Math.floor(page * results_per_page));
        query.limit(results_per_page);
        if (total_results > 0) {
            total_pages = Math.ceil(total_results / results_per_page);
        } else {
            total_pages = 0;
        }
        console.log(process.pid, "There are " + total_pages + " pages");
        var results = await query.find();
        var rows = "";
        for (var i = 0; i < results.length; i++) {
            console.log(process.pid, "Got item " + results[i].id);
            var item = {
                id: results[i].id,
                name: results[i].get("name").replace(" KG", "").toProperCase(),
                unit: results[i].get("unit"),
                weight: results[i].get("weight"),
                price: results[i].get("price"),
                discount: results[i].get("discount"),
                image: results[i].get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br")
            };
            if (results[i].get("category")) {
                item.category = results[i].get("category").get("name").toProperCase();
            }
            if (results[i].get("subcategory")) {
                item.subcategory = results[i].get("subcategory").get("name").toProperCase();
            }
            if (results[i].get("primary_category")) {
                item.primary_category = results[i].get("primary_category").toProperCase();
            }
            if (results[i].get("secondary_category")) {
                item.secondary_category = results[i].get("secondary_category").toProperCase();
            }
            if (results[i].get("tertiary_category")) {
                item.tertiary_category = results[i].get("tertiary_category").toProperCase();
            }
            var badge = "";
            var unit = "";
            if (item.unit === "KG") {
                unit = "<small>/kg</small>";
            }
            /*if (item.weight && item.unit === 'KG') {
        item.price = item.weight * item.price;
        if (item.discount > 0) {
          item.discount = item.weight * item.discount;
        }
      }*/
            var price = '<span class="font-weight-bold text-muted">R$ ' + formatCurrency(item.price) + "</span>";

            if (item.discount > 0) {
                price =
                    '<span class="font-size-xs text-gray-350 text-decoration-line-through mr-1">R$ ' +
                    formatCurrency(item.price) +
                    '</span><span class="text-primary">R$ ' +
                    formatCurrency(item.price - item.discount) +
                    "</span>";
                badge = '<div class="badge badge-primary card-badge card-badge-left text-uppercase">OFERTA</div>';
            }
            rows +=
                '<div class="col-6 col-md-3 col-lg-24 col-xl-2"> <!-- Card --> <a class="card" href="items/' +
                item.id +
                '"> <!-- Badge --> ' +
                badge +
                ' <!-- Image --> <div class="card-img"> <!-- Image --> <a class="card-img-hover" href="items/' +
                item.id +
                '"> <img class="card-img-top card-img-back" src="' +
                item.image +
                '" alt="..."> <img class="card-img-top card-img-front" src="' +
                item.image +
                '" alt="..."> </a> <!-- Actions --> <div class="card-actions" style="display:none"> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="modal" data-target="#modalProduct"> <i class="fe fe-eye"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-shopping-cart"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-heart"></i> </button> </span> </div> </div> <!-- Body --> <div class="card-body px-0"> <!-- Category --> <div class="font-size-xs"> <div class="text-muted">' +
                (item.subcategory || item.category) +
                '</div> </div> <!-- Title --> <div class="font-weight-bold"> <a class="text-body" href="items/' +
                item.id +
                '" title="' +
                item.name +
                '">' +
                item.name +
                '</a> </div> <!-- Price --> <div class="font-weight-bold text-muted">' +
                price +
                unit +
                "</div> </div> </a> </div>";
        }
        var pagination = "";
        if (total_pages > 1) {
            page = page + 1;
            if (page > 1) {
                pagination += '<li class="page-item"><a class="page-link page-link-arrow" onclick="goToPage(' + (page - 1) + ')"><i class="fa fa-caret-left"></i></a></li>';
            }
            if (page - 2 > 0) {
                pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page - 2) + ')">' + (page - 2) + "</a></li>";
            }
            if (page - 1 > 0) {
                pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page - 1) + ')">' + (page - 1) + "</a></li>";
            }
            pagination += '<li class="page-item active"><a class="page-link" onclick="goToPage(' + page + ')">' + page + "</a></li>";
            if (page + 1 <= total_pages) {
                pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page + 1) + ')">' + (page + 1) + "</a></li>";
            }
            if (page + 2 <= total_pages) {
                pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page + 2) + ')">' + (page + 2) + "</a></li>";
            }
            if (page < total_pages) {
                pagination += '<li class="page-item"><a class="page-link page-link-arrow" onclick="goToPage(' + (page + 1) + ')"><i class="fa fa-caret-right"></i></a></li>';
            }
        }
        var title = "Procurar";
        var breadcrumbs = "";
        var link = "/search?";
        if (req.query.category) {
            title = category.get("name").toProperCase();
            link += "category=" + req.query.category;
            breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="' + link + '">' + category.get("name").toProperCase() + "</a></li>";
        }
        if (req.query.secondary_category) {
            title = req.query.secondary_category;
            link += "&secondary_category=" + req.query.secondary_category;
            breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="' + link + '">' + req.query.secondary_category.toProperCase() + "</a></li>";
        }
        if (req.query.tertiary_category) {
            title = req.query.tertiary_category;
            link += "&tertiary_category=" + req.query.tertiary_category;
            breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="' + link + '">' + req.query.tertiary_category.toProperCase() + "</a></li>";
        }
        if (results.length === 0) {
            rows =
                '<div class="col-12"><div class="d-flex align-items-center justify-content-center" style="max-width:350px;min-height: 50vh;margin:auto"><div class="modal-body flex-grow-0 my-auto"><h6 class="mb-7 text-center">Sem resultados 😞</h6><a class="btn btn-block btn-outline-dark" href="/search">Voltar ao inicio</a></div></div></div>';
        }
        res.status(200).render("search", {
            items: rows,
            pagination: pagination,
            category: req.query.category,
            subcategory: req.query.subcategory,
            subcategories_options,
            breadcrumbs: breadcrumbs,
            title: title.toProperCase(),
            sort: req.query.sort || "demand",
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

async function getCategories() {
    console.log(process.pid, "Getting categories");
    var query = new Parse.Query("Category");
    query.notEqualTo("archived", true);
    query.exists("image");
    var categories = await query.find();
    console.log(process.pid, "Got " + categories.length + " categories");
    var categories_options = "";
    for (var m = 0; m < categories.length; m++) {
        console.log(process.pid, "Got category ", categories[m]);
        categories_options += '<li class="list-styled-item"><a class="list-styled-link" href="/search?category=' + categories[m].id + '">' + categories[m].get("name").toProperCase() + "</a></li>";
    }
    console.log(categories_options);
    return categories_options;
}

async function getPromo() {
    console.log(process.pid, "Getting promo");
    var config = await Parse.Config.get({ useMasterKey: true });
    return {
        text: await config.get("promo_text"),
        link: await config.get("promo_link")
    };
}

router.get("/items/*", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        console.log(process.pid, "Getting item");
        var query = new Parse.Query("Item");
        query.include("category");
        query.include("subcategory");
        var object = await query.get(req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
        console.log(process.pid, "Got item " + object.id);
        var item = {
            id: object.id,
            image: object.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br"),
            name: object.get("name").replace(" KG", "").toProperCase(),
            description: object.get("description"),
            sku: object.get("sku"),
            unit: object.get("unit"),
            fractionable: object.get("fractionable"),
            weight: object.get("weight"),
            stock: object.get("stock"),
            price: object.get("price"),
            discount: object.get("discount")
        };
        var price = "";
        if (item.discount > 0) {
            price =
                '<span class="font-size-lg font-weight-bold text-gray-350 text-decoration-line-through" id="discount">R$ ' +
                formatCurrency(item.price) +
                '</span><span class="ml-1 h5 font-weight-bolder text-primary" id="price">R$ ' +
                formatCurrency(item.price - item.discount) +
                "</span>";
        } else {
            price = '<span class="h5" id="price">R$ ' + item.price + "</span>";
        }
        var quantity = "";
        if (item.weight && item.unit === "KG") {
            item.stock = item.stock / item.weight;
        }
        for (var i = 1; i <= item.stock && i <= 30; i++) {
            if (item.weight && item.unit === "KG") {
                var weight = item.weight * i;
                if (weight >= 1) {
                    if (weight.toString().includes(".")) {
                        weight = weight.toFixed(1);
                    }
                    weight = weight + "kg";
                } else {
                    weight = (weight * 1000).toFixed(0) + "g";
                }
                quantity += '<option value="' + i + '">' + i + " - " + weight + "</option>";
            } else {
                quantity += '<option value="' + i + '">' + i + "</option>";
            }
        }
        var units = "";
        if (item.unit === "KG") {
            if (item.weight) {
                units += '<option value="UN">UN</option>';
            } else {
                units += '<option value="KG">KG</option>';
            }
        } else {
            units = '<option value="' + item.unit + '">' + item.unit + "</option>";
        }
        if (object.get("category")) {
            item.category = object.get("category")?.get("name").toProperCase();
        }
        if (object.get("subcategory")) {
            item.subcategory = object.get("subcategory")?.get("name").toProperCase();
        }
        var images = '<a href="' + item.image + '" data-fancybox><img src="' + item.image + '" alt="' + item.name + '" class="card-img-top"></a>';
        var results = [];
        console.log(process.pid, "Getting items");
        var query_related = new Parse.Query("Item");
        query_related.greaterThan("stock", 0);
        query_related.descending("demand");
        query_related.exists("image");
        query_related.skip(0);
        query_related.limit(20);
        query_related.include("category");
        query_related.include("subcategory");
        query_related.notEqualTo("objectId", item.id);
        if (object.get("subcategory")) {
            query_related.equalTo("subcategory", object.get("subcategory"));
        } else if (object.get("category")) {
            query_related.equalTo("category", object.get("category")[0]);
        }
        var results_related = await query_related.find();
        for (var i = 0; i < results_related.length; i++) {
            results.push(results_related[i]);
        }
        var related = "";
        for (var i = 0; i < results.length; i++) {
            console.log(process.pid, "Got item " + results[i].id);
            var related_item = {
                id: results[i].id,
                name: results[i].get("name").replace(" KG", "").toProperCase(),
                price: results[i].get("price"),
                unit: results[i].get("unit"),
                discount: results[i].get("discount"),
                image: results[i].get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br"),
                category: results[i].get("category")?.get("name").toProperCase(),
                subcategory: results[i].get("subcategory")?.get("name").toProperCase()
            };
            var badge = "";
            var unit = "";
            if (related_item.unit === "KG") {
                unit = "<small>/kg</small>";
            }
            var related_price = '<span class="font-weight-bold text-muted">R$ ' + formatCurrency(related_item.price) + "</span>";
            if (related_item.discount > 0) {
                related_price =
                    '<span class="font-size-xs text-gray-350 text-decoration-line-through mr-1">R$ ' +
                    formatCurrency(related_item.price) +
                    '</span><span class="text-primary">R$ ' +
                    formatCurrency(related_item.price - related_item.discount) +
                    "</span>";
                badge = '<div class="badge badge-primary card-badge card-badge-left text-uppercase">OFERTA</div>';
            }
            related +=
                '<div class="col-6 col-md-3 col-lg-24 col-xl-2"> <!-- Card --> <a class="card" href="items/' +
                related_item.id +
                '"> <!-- Badge --> ' +
                badge +
                ' <!-- Image --> <div class="card-img"> <!-- Image --> <a class="card-img-hover" href="items/' +
                related_item.id +
                '"> <img class="card-img-top card-img-back" src="' +
                related_item.image +
                '" alt="..."> <img class="card-img-top card-img-front" src="' +
                related_item.image +
                '" alt="..."> </a> <!-- Actions --> <div class="card-actions" style="display:none"> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="modal" data-target="#modalProduct"> <i class="fe fe-eye"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-shopping-cart"></i> </button> </span> <span class="card-action"> <button class="btn btn-xs btn-circle btn-white-primary" data-toggle="button"> <i class="fe fe-heart"></i> </button> </span> </div> </div> <!-- Body --> <div class="card-body px-0"> <!-- Category --> <div class="font-size-xs"> <div class="text-muted">' +
                (related_item.subcategory || related_item.category) +
                '</div> </div> <!-- Title --> <div class="font-weight-bold"> <a class="text-body" href="items/' +
                related_item.id +
                '" title="' +
                related_item.name +
                '">' +
                related_item.name +
                '</a> </div> <!-- Price --> <div class="font-weight-bold text-muted">' +
                related_price +
                unit +
                "</div> </div> </a> </div>";
        }
        var breadcrumbs = "";
        var link = "/search?";
        /*if (object.get('primary_category')) {
      link += 'primary_category='+object.get('primary_category');
      breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="'+ link +'">'+ object.get('primary_category').toProperCase() +'</a></li>';
    }
    if (object.get('secondary_category')) {
      link += '&secondary_category='+object.get('secondary_category');
      breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="'+ link +'">'+ object.get('secondary_category').toProperCase() +'</a></li>';
    }
    if (object.get('tertiary_category')) {
      link += '&tertiary_category='+object.get('tertiary_category');
      breadcrumbs += '<li class="breadcrumb-item"><a class="text-gray-400" href="'+ link +'">'+ object.get('tertiary_category').toProperCase() +'</a></li>';
    }*/
        res.render("item", {
            item: item,
            price: price,
            units: units,
            quantity: quantity,
            images: images,
            related: related,
            breadcrumbs: breadcrumbs,
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.get("/stores", async (req, res) => {
    res.render("stores", {
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.post("/validateCart", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        console.log(process.pid, "Validating cart items", req.body);
        var items = [];
        for (var i = 0; i < req.body.length; i++) {
            var query = new Parse.Query("Item");
            query.include("item");
            try {
                console.log(process.pid, "Getting item", req.body[i]);
                var item = await query.get(req.body[i].item.id);
                if (Number(req.body[i].quantity) <= item.get("stock")) {
                    console.log(process.pid, "Got item " + item.id);
                    items.push({
                        item: {
                            id: item.id,
                            sku: item.get("sku"),
                            name: item.get("name").replace(" KG", "").toProperCase(),
                            unit: item.get("unit"),
                            weight: item.get("weight"),
                            image: item.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br"),
                            primary_category: item.get("primary_category"),
                            secondary_category: item.get("secondary_category"),
                            quantity: Number(req.body[i].quantity),
                            price: item.get("price"),
                            discount: item.get("discount"),
                            stock: item.get("stock")
                        },
                        unit: req.body[i].unit,
                        quantity: req.body[i].quantity
                    });
                } else {
                    console.log(process.pid, "Item " + req.body[i].id + " is out of stock");
                }
            } catch (error) {
                console.error(error);
            }
        }
        res.status(200).send(items);
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.post("/validateWishlist", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        console.log(process.pid, "Validating wishlist items", req.body);
        var items = [];
        for (var i = 0; i < req.body.length; i++) {
            var query = new Parse.Query("Item");
            query.include("item");
            try {
                var item = await query.get(req.body[i].id);
                console.log(process.pid, "Got item " + req.body[i].id);
                items.push({
                    id: item.id,
                    sku: item.get("sku"),
                    name: item.get("name").replace(" KG", ""),
                    image: item.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br"),
                    primary_category: item.get("primary_category"),
                    secondary_category: item.get("secondary_category"),
                    quantity: Number(req.body[i].quantity),
                    price: item.get("price"),
                    discount: item.get("discount"),
                    stock: item.get("stock")
                });
            } catch (error) {
                console.error(error);
            }
        }
        res.status(200).send(items);
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.post("/obtainAddress", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        console.log(process.pid, "Obtaining address");
        request(
            {
                url: "https://viacep.com.br/ws/" + req.body.zip + "/json/",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Uptech (franco.altuna@uptech.com.ar)"
                }
            },
            function (error, response, body) {
                console.log(body);
                if (!error && body) {
                    body = JSON.parse(body);
                    if (body) {
                        console.log(process.pid, "Obtained address");
                        res.status(200).send(body);
                    }
                } else {
                    console.error(process.pid, "Failed to obtain address", error);
                    res.status(500).send({});
                }
            }
        );
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.post("/calculateShipping", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        var shipping = await calculateShipping(req.body.zip);
        res.status(200).send({
            price: shipping.price,
            same_day: shipping.same_day
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

function calculateShipping(zip) {
    return new Promise(async function (resolve, reject) {
        try {
            zip = zip.toString();
            console.log(process.pid, "Getting regions", zip.substr(0, 5));
            var query = new Parse.Query("Region");
            query.notEqualTo("archived", true);
            query.lessThanOrEqualTo("from", Number(zip.substr(0, 5)));
            query.greaterThanOrEqualTo("to", Number(zip.substr(0, 5)));
            var region = await query.first();
            console.log(region);
            if (region) {
                console.log(process.pid, "Got region", region);
            } else {
                return reject();
            }
            return resolve({
                name: region.get("name"),
                price: region.get("price"),
                same_day: region.get("same_day")
            });
        } catch (error) {
            console.error(process.pid, error);
            return reject();
        }
    });
}

router.get("/checkout", async (req, res) => {
    var session;
    var user;
    try {
        /*
  
  await capturePayment('11062108241241371978');
    await refundPayment('11062108241241371978');
    */
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }

    var query_addresses = new Parse.Query("Address");
    query_addresses.equalTo("user", user);
    query_addresses.notEqualTo("archived", true);
    var addresses = await query_addresses.find();
    var addresses_rows = "";
    for (var i = 0; i < addresses.length; i++) {
        addresses_rows +=
            '<!-- Card --> <div class="list-group-item" id="addressHeading' +
            i +
            '"> <!-- Radio --> <div class="custom-control custom-radio"> <input class="custom-control-input" id="address_' +
            addresses[i].id +
            '_option" value="' +
            addresses[i].id +
            '" zip="' +
            addresses[i].get("zip") +
            '" name="address" type="radio"> <label class="custom-control-label font-size-sm text-body text-nowrap d-flex justify-content-between" for="address_' +
            addresses[i].id +
            '_option" onclick="renderCart();$(\'#loading\').modal(\'show\');" href="javascript:;" role="button" data-toggle="collapse" data-target="#addressCollapse' +
            i +
            '" aria-expanded="false" aria-controls="addressCollapse' +
            i +
            '"> <span>' +
            addresses[i].get("street") +
            " " +
            addresses[i].get("number") +
            '</span> <span class="text-muted">' +
            addresses[i].get("neighbourhood") +
            '</span> </label> </div> </div> <div id="addressCollapse' +
            i +
            '" class="collapse" aria-labelledby="addressHeading' +
            i +
            '" data-parent="#addressAccordion"></div><!-- End Card -->';
    }
    var query_cards = new Parse.Query("Card");
    query_cards.equalTo("user", user);
    query_cards.notEqualTo("archived", true);
    var cards = await query_cards.find();
    var cards_rows = "";
    for (var j = 0; j < cards.length; j++) {
        cards_rows +=
            '<!-- Card --> <div class="list-group-item" id="paymentHeading' +
            j +
            '"> <!-- Radio --> <div class="custom-control custom-radio"> <input class="custom-control-input" id="payment_' +
            cards[j].id +
            '_option" value="' +
            cards[j].id +
            '" name="payment" type="radio"> <label class="custom-control-label font-size-sm text-body text-nowrap d-flex justify-content-between" for="payment_' +
            cards[j].id +
            '_option" onclick="renderCart();$(\'#payment_' +
            cards[j].id +
            '_option\').click();" href="javascript:;" role="button" data-toggle="collapse" data-target="#paymentCollapse' +
            j +
            '" aria-expanded="false" aria-controls="paymentCollapse' +
            j +
            '"> <span><img class="mr-1" src="' +
            cards[j].get("issuer") +
            '.svg" style="height:18px"> ' +
            cards[j].get("last_4") +
            '</span> <span class="text-muted">' +
            "Crédito" +
            '</span> </label> </div> </div> <div id="paymentCollapse' +
            j +
            '" class="collapse" aria-labelledby="paymentHeading' +
            j +
            '" data-parent="#paymentAccordion"></div> <!-- End Card -->';
    }
    if (user.get("member")) {
        cards_rows +=
            '<!-- Card --> <div class="list-group-item" id="paymentHeading' +
            (cards.length + 1) +
            '"> <!-- Radio --> <div class="custom-control custom-radio"> <input class="custom-control-input" id="payment_' +
            "member" +
            '_option" value="' +
            "member" +
            '" name="payment" type="radio"> <label class="custom-control-label font-size-sm text-body text-nowrap d-flex justify-content-between" for="payment_' +
            "member" +
            '_option" onclick="renderCart();$(\'#payment_' +
            "member" +
            '_option\').click();" href="javascript:;" role="button" data-toggle="collapse" data-target="#paymentCollapse' +
            (cards.length + 1) +
            '" aria-expanded="false" aria-controls="paymentCollapse' +
            (cards.length + 1) +
            '"> <span><img class="mr-1" src="logo.png" style="height:18px"> Cartão Villa</span> <span class="text-muted">' +
            "Convênio" +
            '</span> </label> </div> </div> <div id="paymentCollapse' +
            (cards.length + 1) +
            '" class="collapse" aria-labelledby="paymentHeading' +
            (cards.length + 1) +
            '" data-parent="#paymentAccordion"></div> <!-- End Card -->';
    }
    var today = new Date();
    today.setHours(today.getHours() - 3);
    var morning = "";
    var afternoon = "";
    var night = "";
    if (today.getHours() > 10) {
        morning = "disabled";
    }
    if (today.getHours() > 16) {
        afternoon = "disabled";
    }
    if (today.getHours() > 20) {
        night = "disabled";
    }
    var times =
        '<div class="d-block d-md-flex"><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1 ' +
        morning +
        '"><input type="radio" ' +
        morning +
        ' name="time" value="today_morning">' +
        today.getDate() +
        "/" +
        (today.getMonth() + 1) +
        ' de manhã<br><small style="font-weight: 400">8 até 12hs</small></label><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1 ' +
        afternoon +
        '"><input type="radio" ' +
        afternoon +
        ' name="time" value="today_afternoon">' +
        today.getDate() +
        "/" +
        (today.getMonth() + 1) +
        ' de tarde<br><small style="font-weight: 400">12 até 18hs</small></label><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1 ' +
        night +
        '"><input type="radio" ' +
        night +
        ' name="time" value="today_night">' +
        today.getDate() +
        "/" +
        (today.getMonth() + 1) +
        ' de noite<br><small style="font-weight: 400">18 até 22hs</small></label></div>';
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    times +=
        '<div class="d-block d-md-flex"><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1"><input type="radio" name="time" value="tomorrow_morning">' +
        tomorrow.getDate() +
        "/" +
        (tomorrow.getMonth() + 1) +
        ' de manhã<br><small style="font-weight: 400">8 até 12hs</small></label><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1"><input type="radio" name="time" value="tomorrow_afternoon">' +
        tomorrow.getDate() +
        "/" +
        (tomorrow.getMonth() + 1) +
        ' de tarde<br><small style="font-weight: 400">12 até 18hs</small></label><label class="btn btn-sm btn-outline-border w-100 h-100 mr-1"><input type="radio" name="time" value="tomorrow_night">' +
        tomorrow.getDate() +
        "/" +
        (tomorrow.getMonth() + 1) +
        ' de noite<br><small style="font-weight: 400">18 até 22hs</small></label></div>';
    res.render("checkout", {
        times: times,
        addresses: addresses_rows,
        cards: cards_rows,
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.post("/sendVerificationCode", async function (req, res) {
    try {
        console.log(process.pid, "SEND VERIFICATION CODE");
        if (!req.body.phone || req.body.phone.toString().length !== 11) {
            res.status(500).send({});
            return;
        }
        console.log(process.pid, "Creating verification code");
        var random_code = generateRandomNumber(4);
        console.log(process.pid, "Creating token", random_code);
        var Token = Parse.Object.extend("Token");
        var token = new Token();
        token.set("code", random_code);
        token.set("phone", req.body.phone);
        console.log(process.pid, "Saving token");
        token = await token.save();
        console.log(process.pid, "Sending verification code");
        request(
            {
                url:
                    "https://api.smsdev.com.br/v1/send?key=07JWJS1OUR5R1GFP98WPOGR8QT1379HTUIX1G4NHJTA6YT04LWXVOR6Q1K0Q2IHO93SHL27T26VM9RDCPYYV1NJV3YRIN46TW3NJW7XN2SIYJJ2RJZM350KC1KZ87EMY&type=9&number=" +
                    req.body.phone +
                    "&msg=" +
                    encodeURIComponent("Seu código de verificação do Emporio Villa Borghese é " + random_code),
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Uptech (franco.altuna@uptech.com.ar)"
                }
            },
            async function (error, response, body) {
                console.log(body);
                if (!error && body) {
                    body = JSON.parse(body);
                    if (body.situacao === "OK") {
                        console.log(process.pid, "Sent verification code");
                        console.log(process.pid, "Saving sms");
                        token.set("sms", body.id);
                        token = await token.save();
                        console.log(process.pid, "Saved sms");
                        res.status(200).send({
                            message: "Sent verification code"
                        });
                    } else {
                        console.error(process.pid, "Failed to send verification code", body);
                        res.status(500).send({});
                    }
                } else {
                    console.error(process.pid, "Failed to send verification code", error);
                    res.status(500).send({});
                }
            }
        );
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.post("/verifyCode", async function (req, res) {
    try {
        console.log(process.pid, "VERIFY CODE", req.body.phone);
        if (!req.body.phone || req.body.phone.toString().length !== 11) {
            return res.status(500).send({});
        }
        if (!req.body.code || req.body.code.length !== 4) {
            return res.status(500).send({});
        }
        console.log(process.pid, "Searching for token");
        var query_token = new Parse.Query("Token");
        query_token.equalTo("phone", req.body.phone);
        query_token.equalTo("code", req.body.code);
        var token = await query_token.first();
        if (token) {
            console.log(process.pid, "Found token");
        } else {
            console.log(process.pid, "Token not found");
            return res.status(500).send({});
        }
        console.log(process.pid, "Searching for user");
        var query_user = new Parse.Query("User");
        query_user.equalTo("phones", req.body.phone);
        var user = await query_user.first();
        if (user) {
            console.log(process.pid, "Found user", user);
        } else {
            return res.status(200).send({
                code: 201,
                message: "Code valid but no user found"
            });
        }
        console.log(process.pid, "Checking for existing session");
        var query = new Parse.Query("_Session");
        query.equalTo("user", user);
        query.descending("createdAt");
        var session = await query.first();
        if (!session) {
            var password = makeid(10);
            console.log(process.pid, "Setting temporary password", password);
            user.set("password", password);
            user = await user.save();
            console.log(process.pid, "Creating new session");
            user = await Parse.User.logIn(user.get("username"), password);
            console.log(process.pid, "Created session");
            console.log(process.pid, "Retrieving created session");
            var query = new Parse.Query("_Session");
            query.equalTo("user", user);
            query.descending("createdAt");
            var session = await query.first();
            console.log(process.pid, "Got session", session.id);
            session.set("device", req.device.type);
            console.log(process.pid, "Got device " + req.device.type);
            const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            session.set("ip", ip);
            console.log(process.pid, "Got ip " + ip);
            console.log(process.pid, "Saving session");
            await session.save();
        } else {
            console.log(process.pid, "Found session", session);
        }
        console.log(process.pid, "Consuming token");
        await token.destroy();
        console.log(process.pid, "Setting cookie");
        return res
            .cookie("session", session.id, { expires: new Date(Date.now() + 365 * 24 * 3600000) })
            .status(200)
            .send({
                code: 200,
                message: "Verified an logged user in",
                user: await parseUser(user)
            });
    } catch (error) {
        console.error(process.pid, error);
        return res.status(500).send({});
    }
});

router.post("/saveFirebaseToken", async (req, res) => {
    console.log(process.pid, "POST /saveFirebaseToken", req.body);
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    session.addUnique("tokens", req.body.token);
    console.log(process.pid, "Saving token");
    await session.save();
    res.status(200).send({
        code: 200,
        message: "Saved firebase token"
    });
});

router.get("/logout", async function (req, res) {
    try {
        console.log(process.pid, "GET /logout");
        res.clearCookie("session").redirect("/");
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.post("/register", async function (req, res) {
    try {
        console.log(process.pid, "POST /register", req.body);
        if (!req.body.name) {
            console.log(process.pid, "Invalid name");
            res.status(500).send({});
            return false;
        }
        if (req.body.vat && !validaCpfCnpj(req.body.vat)) {
            console.log(process.pid, "Invalid CPF");
            res.status(500).send({});
            return false;
        }
        if (!req.body.phone || req.body.phone.length !== 11) {
            console.log(process.pid, "Invalid phone");
            res.status(500).send({});
            return false;
        }
        if (req.body.email && !req.body.email.includes("@")) {
            console.log(process.pid, "Invalid email");
            res.status(500).send({});
            return false;
        }
        var user;
        if (req.body.phone) {
            console.log(process.pid, "Checking phone");
            var query_phone = new Parse.Query("User");
            query_phone.equalTo("phones", req.body.phone);
            var phone_result = await query_phone.first();
            if (phone_result) {
                /*console.log(process.pid,'Phone already exists');
        res.status(500).send({});
        return false;*/
                console.log(process.pid, "Apropiating PHONE");
                user = phone_result;
            }
        }
        if (!user && req.body.vat) {
            console.log(process.pid, "Checking VAT");
            var query_vat = new Parse.Query("User");
            query_vat.equalTo("vat", req.body.vat);
            var query_vat_2 = new Parse.Query("User");
            query_vat_2.equalTo("vat", "0" + req.body.vat);
            var query_vat_3 = new Parse.Query("User");
            query_vat_3.equalTo("vat", Number(req.body.vat).toString());
            var vat_result = await Parse.Query.or(query_vat, query_vat_2, query_vat_3).first();
            /*if (vat_result && vat_result.get('phone')) {
        console.log(process.pid,'VAT already exists');
        res.status(500).send({});
        return false;
      } else if (vat_result) {*/
            console.log(process.pid, "Apropiating VAT");
            user = vat_result;
            //}
        }
        console.log(user);
        if (!user) {
            console.log(process.pid, "Creating user");
            user = new Parse.User();
        }
        console.log(process.pid, "Setting parameters");
        user.set("username", req.body.phone.toString());
        var password = makeid(9);
        user.set("password", password);
        user.set("name", req.body.name);
        user.set("phone", req.body.phone);
        user.set("phones", [req.body.phone]);
        /*if (req.body.email) {
      user.set('email',req.body.email);
      user.set('emails',[req.body.email]);
    } else {
      user.unset('email');
    }*/
        if (req.body.vat) {
            user.set("vat", req.body.vat);
        } else {
            user.unset("vat");
        }
        console.log(process.pid, "Saving user");
        user = await user.save();
        console.log(process.pid, "Creating session");
        user = await Parse.User.logIn(user.get("username"), password);
        console.log(process.pid, "Created session");
        console.log(process.pid, "Retrieving session");
        var query = new Parse.Query("_Session");
        query.equalTo("user", user);
        query.descending("createdAt");
        var session = await query.first();
        console.log(process.pid, "Got session", session.id);
        session.set("device", req.device.type);
        console.log(process.pid, "Got device " + req.device.type);
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        session.set("ip", ip);
        console.log(process.pid, "Got ip " + ip);
        console.log(process.pid, "Saving session");
        await session.save();
        console.log(process.pid, "Setting cookie");
        res.cookie("session", session.id)
            .status(200)
            .send({
                code: 200,
                message: "Registered an logged user in",
                user: await parseUser(user)
            });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.get("/account", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    res.render("account", {
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.get("/profile", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    var user = await parseUser(user);
    var day = "";
    var month = "";
    var year = "";
    if (user.birthday) {
        day = user.birthday.getDate();
        month = user.birthday.getMonth() + 1;
        year = user.birthday.getFullYear();
    }
    res.render("profile", {
        user: user,
        day: day,
        month: month,
        year: year,
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.post("/profile", async function (req, res) {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        console.log(process.pid, "POST /profile", req.body);
        if (!req.body.name) {
            console.log(process.pid, "Invalid name");
            res.status(500).send({});
            return false;
        }
        if (req.body.vat && !validaCpfCnpj(req.body.vat)) {
            console.log(process.pid, "Invalid CPF");
            res.status(500).send({});
            return false;
        }
        if (!req.body.phone || (req.body.phone.length !== 10 && req.body.phone.length !== 11)) {
            console.log(process.pid, "Invalid phone");
            res.status(500).send({});
            return false;
        }
        if (req.body.email && !req.body.email.includes("@")) {
            console.log(process.pid, "Invalid email");
            res.status(500).send({});
            return false;
        }
        if (req.body.vat) {
            console.log(process.pid, "Checking VAT");
            var query_vat = new Parse.Query("User");
            query_vat.equalTo("vat", req.body.vat);
            var vat_result = await query_vat.first();
            if (vat_result && vat_result.id !== user.id) {
                console.log(process.pid, "VAT already exists");
                res.status(500).send({});
                return false;
            }
        }
        if (req.body.phone) {
            console.log(process.pid, "Checking phone");
            var query_phone = new Parse.Query("User");
            query_phone.equalTo("phone", req.body.phone);
            var phone_result = await query_vat.first();
            if (phone_result && phone_result.id !== user.id) {
                console.log(process.pid, "Phone already exists");
                res.status(500).send({});
                return false;
            }
        }
        /*if (req.body.email) {
      console.log(process.pid,'Checking email');
      var query_email = new Parse.Query('User');
      query_email.equalTo('email',req.body.email);
      var email_result = await query_vat.first();
      if (email_result && email_result.id !== user.id) {
        console.log(process.pid,'Email already exists');
        res.status(500).send({});
        return false;
      }
    }*/
        if (req.body.image && !req.body.image.includes(".")) {
            console.log(process.pid, "Setting image");
            user.set("image", new Parse.File("image.jpg", { base64: req.body.image }));
        }
        console.log(process.pid, "Setting parameters");
        user.set("name", req.body.name);
        user.set("phone", req.body.phone);
        if (req.body.birthday) {
            user.set("birthday", new Date(req.body.birthday));
        } else {
            user.unset("birthday");
        }
        if (req.body.email) {
            user.addUnique("emails", req.body.email);
        }
        if (req.body.vat) {
            user.set("vat", req.body.vat);
        } else {
            user.unset("vat");
        }
        console.log(process.pid, "Saving client");
        user = await user.save();
        res.status(200).send({
            code: 200,
            message: "Saved profile"
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.get("/orders", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    console.log(process.pid, "Getting orders");
    var results_per_page = 4;
    if (req.query.results_per_page) {
        results_per_page = Number(req.query.results_per_page);
    }
    var page = 0;
    if (req.query.page) {
        page = Number(req.query.page - 1);
    }
    var total_pages = 0;
    var query = new Parse.Query("Order");
    query.equalTo("client", user);
    if (req.query.search) {
        query.matches("name", decodeURI(req.query.search), "i");
    }
    query.descending("createdAt");
    var total_results = await query.count();
    console.log(process.pid, "There are " + total_results + " orders");
    query.skip(Math.floor(page * results_per_page));
    query.limit(results_per_page);
    if (total_results > 0) {
        total_pages = Math.ceil(total_results / results_per_page);
    } else {
        total_pages = 0;
    }
    console.log(process.pid, "There are " + total_pages + " pages");
    var results = await query.find();
    var rows = "";
    for (var i = 0; i < results.length; i++) {
        console.log(process.pid, "Got order " + results[i].id);
        var order = {
            id: results[i].id,
            number: results[i].get("number"),
            date: results[i].get("createdAt"),
            status: results[i].get("status"),
            total: results[i].get("total"),
            total_items: results[i].get("total_items"),
            items: await results[i].relation("items").query().include("item").limit(3).find()
        };
        if (order.status === "cancelled") {
            order.status = "Cancelado";
        }
        if (order.status === "payment_failed") {
            order.status = "Pagamento rejeitado";
        }
        if (order.status === "delivered") {
            order.status = "Entregue";
        }
        if (order.status === "delivering") {
            order.status = "Em entrega";
        }
        if (order.status === "planning") {
            order.status = "Planejando entrega";
        }
        if (order.status === "pickup") {
            order.status = "Aguardando retiro";
        }
        if (order.status === "cashing") {
            order.status = "Confirendo";
        }
        if (order.status === "picking") {
            order.status = "Separando";
        }
        if (order.status === "pending") {
            order.status = "Recebido";
        }
        var images = "";
        for (var j = 0; j < order.items.length; j++) {
            console.log(process.pid, "Got item " + order.items[j].get("item").get("name"));
            if (order.items[j].get("item").get("image")) {
                images +=
                    '<div class="col-3"><div class="embed-responsive embed-responsive-1by1 bg-cover" style="background-image: url(' +
                    order.items[j].get("item").get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br") +
                    ');background-size: contain !important;"></div></div>';
            }
        }
        var more = "";
        if (order.total_items > 3) {
            more =
                '<div class="col-3"><!-- Image --><div class="embed-responsive embed-responsive-1by1 bg-light"><a class="embed-responsive-item embed-responsive-item-text text-reset" href="/orders/' +
                order.id +
                '"><div class="font-size-xxs font-weight-bold">+' +
                (order.total_items - 3) +
                " <br> mais</div></a></div></div>";
        }
        rows +=
            '<!-- Order --> <div class="card card-lg mb-5 border"> <div class="card-body pb-0"> <!-- Info --> <div class="card card-sm"> <div class="card-body bg-light"> <div class="row"> <div class="col-6 col-lg-3"> <!-- Heading --> <h6 class="heading-xxxs text-muted">Pedido:</h6> <!-- Text --> <p class="mb-lg-0 font-size-sm font-weight-bold"> ' +
            order.number +
            ' </p> </div> <div class="col-6 col-lg-3"> <!-- Heading --> <h6 class="heading-xxxs text-muted">Data:</h6> <!-- Text --> <p class="mb-lg-0 font-size-sm font-weight-bold"> <time datetime="order.date"> ' +
            formatDate(order.date) +
            ' </time> </p> </div> <div class="col-6 col-lg-3"> <!-- Heading --> <h6 class="heading-xxxs text-muted">Estado:</h6> <!-- Text --> <p class="mb-0 font-size-sm font-weight-bold"> ' +
            order.status +
            ' </p> </div> <div class="col-6 col-lg-3"> <!-- Heading --> <h6 class="heading-xxxs text-muted">Total:</h6> <!-- Text --> <p class="mb-0 font-size-sm font-weight-bold"> R$ ' +
            formatCurrency(order.total) +
            '</p> </div> </div> </div> </div> </div> <div class="card-footer"> <div class="row align-items-center"> <div class="col-12 col-lg-6"> <div class="form-row mb-4 mb-lg-0"> ' +
            images +
            more +
            ' </div> </div> <div class="col-12 col-lg-6"> <div class="form-row"> <div class="col-12 col-md-6 ml-auto"> <!-- Button --> <a class="btn btn-sm btn-block btn-outline-dark" href="/orders/' +
            order.id +
            '"> Ver </a> </div> </div> </div> </div> </div> </div>';
    }
    var pagination = "";
    if (total_pages > 1) {
        page = page + 1;
        if (page > 1) {
            pagination += '<li class="page-item"><a class="page-link page-link-arrow" onclick="goToPage(' + (page - 1) + ')"><i class="fa fa-caret-left"></i></a></li>';
        }
        if (page - 2 > 0) {
            pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page - 2) + ')">' + (page - 2) + "</a></li>";
        }
        if (page - 1 > 0) {
            pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page - 1) + ')">' + (page - 1) + "</a></li>";
        }
        pagination += '<li class="page-item active"><a class="page-link" onclick="goToPage(' + page + ')">' + page + "</a></li>";
        if (page + 1 <= total_pages) {
            pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page + 1) + ')">' + (page + 1) + "</a></li>";
        }
        if (page + 2 <= total_pages) {
            pagination += '<li class="page-item"><a class="page-link" onclick="goToPage(' + (page + 2) + ')">' + (page + 2) + "</a></li>";
        }
        if (page < total_pages) {
            pagination += '<li class="page-item"><a class="page-link page-link-arrow" onclick="goToPage(' + (page + 1) + ')"><i class="fa fa-caret-right"></i></a></li>';
        }
    }
    if (rows === "") {
        rows =
            '<div class="p-5 flex-grow-0 my-auto d-flex justify-content-center" style="flex-direction:column"><!-- Heading --><h6 class="mb-7 text-center">Ainda nao tem pedidos 😞</h6><!-- Button --><a class="btn btn-block mx-auto w-auto btn-outline-dark" href="/">Continuar comprando</a></div>';
    }
    res.render("user-orders", {
        orders: rows,
        pagination: pagination,
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.get("/orders/*", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        console.log(process.pid, "Getting order");
        var query = new Parse.Query("Order");
        query.include("address");
        query.include("payment_method");
        query.include("picked_by");
        query.include("cashed_by");
        query.include("delivered_by");
        query.include("store");
        var object = await query.get(req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
        console.log(process.pid, "Got order " + object.id);
        var order = {
            id: object.id,
            number: object.get("number"),
            subtotal: object.get("subtotal"),
            discount: object.get("discount"),
            shipping: object.get("shipping"),
            total: formatCurrency(object.get("total")),
            payment_method: object.get("payment_method"),
            status: object.get("status"),
            date: formatDate(object.get("createdAt")),
            items: await object.relation("items").query().include("item").include("replacement").find()
        };
        var address = "Nao";
        if (object.get("address")) {
            address = "";
            address += object.get("address").get("street") + " " + object.get("address").get("number") + ", ";
            if (object.get("address").get("apartment")) {
                address += object.get("address").get("apartment") + ", ";
            }
            address += object.get("address").get("neighbourhood") + ", " + object.get("address").get("city") + "<br>";
            address += object.get("address").get("state") + " " + object.get("address").get("zip");
        }
        var payment_method = "Nehum";
        if (object.get("payment_method")) {
            payment_method = object.get("payment_method").get("name").toProperCase();
            if (object.get("card_issuer")) {
                payment_method += ' <img src="' + object.get("card_issuer") + '.svg" style="height: 20px;">';
            }
        }
        var vat = "Não";
        if (object.get("vat")) {
            vat = object.get("vat");
        }
        var rows = "";
        for (var i = 0; i < order.items.length; i++) {
            var price = '<span class="font-weight-bold text-muted">R$ ' + formatCurrency(order.items[i].get("price")) + "</span>";
            if (order.items[i].get("discount") > 0) {
                price =
                    '<span class="font-size-xs text-gray-350 text-decoration-line-through mr-1">R$ ' +
                    formatCurrency(order.items[i].get("price")) +
                    '</span><span class="text-primary">R$ ' +
                    formatCurrency(order.items[i].get("price") - order.items[i].get("discount")) +
                    "</span>";
            }
            var item = order.items[i].get("item");
            if (order.items[i].get("replacement")) {
                item = order.items[i].get("replacement");
            }
            rows +=
                '<li class="list-group-item" id="' +
                order.items[i].get("item").id +
                '" quantity="' +
                order.items[i].get("quantity") +
                '" unit="' +
                order.items[i].get("unit") +
                '"> <div class="row align-items-center"> <div class="col-4 col-md-3 col-xl-2"> <!-- Image --> <a class="product-image" href="/items/' +
                item.id +
                '"><img src="' +
                item.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br") +
                '" alt="' +
                item.get("name").toProperCase() +
                '" class="img-fluid"></a> </div> <div class="col"> <!-- Title --> <p class="mb-4 font-size-sm font-weight-bold"> <a class="text-body" href="/items/' +
                item.id +
                '">' +
                item.get("name").toProperCase() +
                '</a> <br> <span class="text-muted">' +
                price +
                '</span> </p> <!-- Text --> <div class="font-size-sm text-muted"> Quantidade: ' +
                order.items[i].get("quantity") +
                order.items[i].get("unit").toLowerCase() +
                " </div> </div> </div> </li>";
        }
        var charges = "";
        if (order.subtotal) {
            charges += '<li class="list-group-item d-flex"><span>Subtotal</span><span class="ml-auto">' + formatCurrency(order.subtotal) + "</span></li>";
        }
        if (order.shipping) {
            charges += '<li class="list-group-item d-flex"><span>Envio</span><span class="ml-auto">' + formatCurrency(order.shipping) + "</span></li>";
        }
        if (order.discount) {
            charges += '<li class="list-group-item d-flex"><span>Desconto</span><span class="ml-auto">- ' + formatCurrency(order.discount) + "</span></li>";
        }
        if (order.total) {
            charges += '<li class="list-group-item d-flex font-size-lg font-weight-bold"><span>Total</span><span class="ml-auto">R$ ' + order.total + "</span></li>";
        }
        var steps = "";
        if (object.get("status") === "delivered") {
            steps += '<li class="list-group-item d-flex"><strong class="mr-3">' + getTime(object.get("delivering_end")) + "</strong><div>Seu pedido foi entregue</div></li>";
        }
        if (object.get("delivering_start")) {
            steps +=
                '<li class="list-group-item d-flex"><strong class="mr-3">' +
                getTime(object.get("delivering_start")) +
                "</strong><div>Seu pedido saiu da loja e será entregue por <strong>" +
                object.get("delivered_by").get("name").split(" ")[0] +
                "</strong></div></li>";
        }
        if (object.get("planning_start")) {
            steps += '<li class="list-group-item d-flex"><strong class="mr-3">' + getTime(object.get("planning_start")) + "</strong><div>Seu pedido está aguardando para ser enviado</div></li>";
        }
        if (object.get("cashing_start") && object.get("cashed_by")) {
            steps +=
                '<li class="list-group-item d-flex"><strong class="mr-3">' +
                getTime(object.get("cashing_start")) +
                "</strong><div>Seu pedido está sendo conferido por <strong>" +
                object.get("cashed_by").get("name").split(" ")[0] +
                "</strong></div></li>";
        }
        if (object.get("picking_start")) {
            steps +=
                '<li class="list-group-item d-flex"><strong class="mr-3">' +
                getTime(object.get("picking_start")) +
                "</strong><div>Seu pedido está sendo separado por <strong>" +
                object.get("picked_by").get("name").split(" ")[0] +
                "</strong></div></li>";
        }
        var date = "";
        var today = new Date();
        var time;
        var dueDate = new Date(object.get("due_date"));
        dueDate.setHours(dueDate.getHours() - 3);
        if (object.get("due_date").getHours() <= 12) {
            time = "de manhã";
        } else if (object.get("due_date").getHours() <= 18) {
            time = "de tarde";
        } else {
            time = "de noite";
        }
        var createdAt = new Date(object.get("createdAt"));
        createdAt.setHours(createdAt.getHours() - 3);
        if (createdAt.getDate() === dueDate.getDate()) {
            date = "hoje " + time;
        } else {
            date = "amanhã " + time;
        }
        steps += '<li class="list-group-item d-flex"><strong class="mr-3">' + getTime(object.get("createdAt")) + "</strong><div>Seu pedido foi recebido e será entregue " + date + "</div></li>";
        if (order.status === "cancelled") {
            order.status = "Cancelado";
        }
        if (order.status === "payment_failed") {
            order.status = "Pagamento rejeitado";
        }
        if (order.status === "delivered") {
            order.status = "Entregue";
        }
        if (order.status === "delivering") {
            order.status = "Em entrega";
        }
        if (order.status === "planning") {
            order.status = "Planejando entrega";
        }
        if (order.status === "pickup") {
            order.status = "Aguardando retiro";
        }
        if (order.status === "cashing") {
            order.status = "Confirendo";
        }
        if (order.status === "picking") {
            order.status = "Separando";
        }
        if (order.status === "pending") {
            order.status = "Recebido";
        }
        res.render("user-order", {
            order: order,
            items: rows,
            address: address,
            payment_method: payment_method,
            vat: vat,
            steps: steps,
            charges: charges,
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.get("/addresses", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    console.log(process.pid, "Getting orders");
    var results_per_page = 4;
    if (req.query.results_per_page) {
        results_per_page = Number(req.query.results_per_page);
    }
    var page = 0;
    if (req.query.page) {
        page = Number(req.query.page - 1);
    }
    var query = new Parse.Query("Address");
    query.equalTo("user", user);
    query.descending("createdAt");
    var results = await query.find();
    var rows = "";
    for (var i = 0; i < results.length; i++) {
        console.log(process.pid, "Got address " + results[i].id);
        var address = results[i].get("street") + " " + results[i].get("number") + "<br>";
        if (results[i].get("apartment")) {
            address += results[i].get("apartment") + "<br>";
        }
        address += results[i].get("neighbourhood") + "<br>" + results[i].get("city") + "<br>";
        address += results[i].get("state") + " " + results[i].get("zip");
        rows +=
            '<div class="col-12 col-lg-6"><!-- Card --> <div class="card card-lg bg-light mb-8"> <div class="card-body"> <!-- Heading --> <h6 class="mb-6 d-none"> Shipping Address </h6> <!-- Text --> <p class="text-muted mb-0"> ' +
            address +
            ' </p> <!-- Action --> <div class="card-action card-action-right"> <!-- Button --> <a class="btn btn-xs btn-circle btn-white-primary" href="/addresses/' +
            results[i].id +
            '"> <i class="fe fe-edit-2"></i> </a> </div> </div> </div> </div>';
    }
    res.render("addresses", {
        addresses: rows,
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.get("/addresses/*", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        var address = {
            street: "",
            number: "",
            apartment: "",
            neighbourhood: "",
            city: "",
            state: ""
        };
        if (req.url.split("/")[req.url.split("/").length - 1].substr(0, 10) !== "new") {
            console.log(process.pid, "Getting address");
            var query = new Parse.Query("Address");
            var object = await query.get(req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
            console.log(process.pid, "Got address " + object.id);
            address = {
                id: object.id,
                zip: object.get("zip"),
                street: object.get("street"),
                number: object.get("number"),
                apartment: object.get("apartment"),
                neighbourhood: object.get("neighbourhood"),
                city: object.get("city"),
                state: object.get("state")
            };
        }
        res.render("address", {
            address: address,
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.post("/addresses/*", async function (req, res) {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        var address;
        if (req.url.split("/")[req.url.split("/").length - 1].substr(0, 10) === "new") {
            console.log(process.pid, "Creating new address");
            var Address = Parse.Object.extend("Address");
            address = new Address();
            address.set("archived", false);
            address.set("user", user);
        } else {
            console.log(process.pid, "Getting address");
            var query = new Parse.Query("Address");
            address = await query.get(req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
            console.log(process.pid, "Got address " + address.id);
        }
        console.log(process.pid, "Setting parameters");
        address.set("zip", req.body.zip);
        address.set("street", req.body.street);
        address.set("number", req.body.number);
        address.set("apartment", req.body.apartment);
        address.set("neighbourhood", req.body.neighbourhood);
        address.set("city", req.body.city);
        address.set("state", req.body.state);
        address = await address.save();
        console.log(process.pid, "Saved address");
        res.status(200).send({
            code: 200,
            message: "Saved address",
            address: {
                id: address.id,
                zip: address.get("zip"),
                street: address.get("street"),
                number: address.get("number"),
                apartment: address.get("apartment"),
                neighbourhood: address.get("neighbourhood"),
                city: address.get("city"),
                state: address.get("state")
            }
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.get("/cards", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    console.log(process.pid, "Getting cards");
    var results_per_page = 4;
    if (req.query.results_per_page) {
        results_per_page = Number(req.query.results_per_page);
    }
    var page = 0;
    if (req.query.page) {
        page = Number(req.query.page - 1);
    }
    var query = new Parse.Query("Card");
    query.equalTo("user", user);
    query.notEqualTo("archived", true);
    query.descending("createdAt");
    var results = await query.find();
    var rows = "";
    for (var i = 0; i < results.length; i++) {
        console.log(process.pid, "Got card " + results[i].id);
        rows +=
            '<div class="col-12 col-lg-6"> <!-- Card --> <div class="card card-lg bg-light mb-8"> <div class="card-body"> <!-- Heading --> <h6 class="mb-6 sr-only"> Debit / Credit Card </h6> <!-- Text --> <p class="mb-5"> <strong>Número do cartão:</strong> <br> <span class="text-muted"><img src="' +
            results[i].get("issuer") +
            '.svg" style="height:18px"> ' +
            results[i].get("last_4") +
            '</span> </p> <!-- Text --> <p class="mb-5"> <strong>Validade:</strong> <br> <span class="text-muted">' +
            results[i].get("month") +
            "/" +
            results[i].get("year") +
            '</span> </p> <!-- Text --> <p class="mb-0"> <strong>Nome:</strong> <br> <span class="text-muted">' +
            results[i].get("name").toProperCase() +
            '</span> </p> <!-- Action --> <div class="card-action card-action-right"> <!-- Button --> <!-- Button --><button class="btn btn-xs btn-circle btn-white-primary" onclick="deleteCard(\'' +
            results[i].id +
            '\');"><i class="fe fe-x"></i></button> </div> </div> </div> </div>';
    }
    res.render("cards", {
        cards: rows,
        categories_options: await getCategories(),
        promo: await getPromo()
    });
});

router.get("/cards/*", async (req, res) => {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        res.render("card", {
            categories_options: await getCategories(),
            promo: await getPromo()
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.post("/cards/*", async function (req, res) {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        console.log(process.pid, "Validating card");
        if (!valid.number(req.body.number).isValid) {
            console.log(process.pid, "Invalid number");
            res.status(500).send({});
            return false;
        }
        if (req.body.cvv.length < 3 || req.body.cvv.length > 4) {
            console.log(process.pid, "Invalid CVV");
            res.status(500).send({});
            return false;
        }
        console.log(process.pid, "Creating new card");
        var Card = Parse.Object.extend("Card");
        var card = new Card();
        console.log(process.pid, "Setting parameters");
        card.set("archived", false);
        card.set("user", user);
        card.set("name", req.body.name);
        card.set("number", req.body.number.toString());
        card.set("last_4", req.body.number.toString().substr(req.body.number.toString().length - 4, 4));
        card.set("month", Number(req.body.month));
        card.set("year", Number(req.body.year));
        card.set("cvv", req.body.cvv);
        card.set("issuer", req.body.issuer);
        card = await card.save();
        console.log(process.pid, "Saved card");
        res.status(200).send({
            code: 200,
            message: "Saved card"
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.delete("/cards/*", async function (req, res) {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        console.log(process.pid, "Getting card", req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
        var query = new Parse.Query("Card");
        var card = await query.get(req.url.split("/")[req.url.split("/").length - 1].substr(0, 10));
        console.log(process.pid, "Archiving card");
        card.set("archived", true);
        card = await card.save();
        console.log(process.pid, "Deleted card");
        res.status(200).send({
            code: 200,
            message: "Deleted card"
        });
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).render("error");
    }
});

router.post("/stores", async function (req, res) {
    //var session_cookie = handleSession(req,res);
    try {
        res.status(200).send(getStoresETA(11055110));
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.post("/placeOrder", async function (req, res) {
    var session;
    var user;
    try {
        if (req.cookies && req.cookies.token) {
            session = await retrieveSession(req.cookies.token);
            user = session.get("user");
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error(process.pid, error);
        res.clearCookie("token");
        res.redirect("/");
        return false;
    }
    try {
        console.log(process.pid, "POST /placeOrder", req.body);
        var subtotal = 0;
        var discount = 0;
        var shipping = 0;
        var total = 0;
        var logs;
        console.log(process.pid, "Creating order");
        var Order = Parse.Object.extend("Order");
        var order = new Order();
        order.set("archived", false);
        order.set("created_by", user);
        order.set("client", user);
        order.set("status", "awaiting_payment");
        var last_query = new Parse.Query("Order");
        last_query.descending("number");
        order.set("pending_start", new Date());
        var logs = order.relation("logs");
        logs.add(await log(user, "Placed the order"));
        var address;

        if (req.body.type === "delivery") {
            console.log(process.pid, "Setting delivery");
            order.set("type", "delivery");
            if (req.body.address && req.body.address.id && req.body.address.id !== "new") {
                console.log(process.pid, "Getting address");
                var query_address = new Parse.Query("Address");
                address = await query_address.get(req.body.address.id);
            } else {
                console.log(process.pid, "Creating address");
                if (!req.body.address.zip) {
                    return res.status(200).send({
                        code: 301,
                        message: "Invalid zip"
                    });
                }
                if (!req.body.address.street) {
                    return res.status(200).send({
                        code: 302,
                        message: "Invalid street"
                    });
                }
                if (!req.body.address.number) {
                    return res.status(200).send({
                        code: 303,
                        message: "Invalid number"
                    });
                }
                if (!req.body.address.neighbourhood) {
                    return res.status(200).send({
                        code: 304,
                        message: "Invalid neighbourhood"
                    });
                }
                if (!req.body.address.city) {
                    return res.status(200).send({
                        code: 305,
                        message: "Invalid city"
                    });
                }
                if (!req.body.address.state) {
                    return res.status(200).send({
                        code: 306,
                        message: "Invalid state"
                    });
                }
                console.log(process.pid, "Checking address");
                var query_address = user.relation("addresses").query();
                query_address.equalTo("user", user);
                query_address.equalTo("zip", Number(req.body.address.zip));
                query_address.equalTo("number", req.body.address.number);
                address = await query_address.first();
                if (!address) {
                    console.log(process.pid, "Creating new address");
                    var Address = Parse.Object.extend("Address");
                    address = new Address();
                    address.set("archived", false);
                    address.set("user", user);
                }
                console.log(process.pid, "Setting parameters");
                address.set("zip", req.body.address.zip);
                address.set("street", req.body.address.street);
                address.set("number", req.body.address.number);
                address.set("apartment", req.body.address.apartment);
                address.set("neighbourhood", req.body.address.neighbourhood);
                address.set("city", req.body.address.city);
                address.set("state", req.body.address.state);
                console.log(process.pid, "Saving address");
                address = await address.save();
                console.log(process.pid, "Adding address to user");
                user.relation("addresses").add(address);
                console.log(process.pid, "Saving user");
                await user.save();
                console.log(process.pid, "Saved user");
            }
            shipping = (await calculateShipping(address.get("zip"))).price;
            order.set("address", address);
            console.log(process.pid, "Setting delivery store");
        } else {
            console.log(process.pid, "Setting pickup store");
        }

        var today = new Date();
        today.setHours(today.getHours() - 3);
        var tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        var date = new Date();
        date.setHours(date.getHours() - 3);
        if (req.body.time === "today_morning") {
            order.set("comment", "Entregar HOJE DE MANHA (ATE AS 12HS)");
            date.setHours(12);
            order.set("due_date", date);
        } else if (req.body.time === "today_afternoon") {
            order.set("comment", "Entregar HOJE DE TARDE (ATE AS 18HS)");
            date.setHours(18);
            order.set("due_date", date);
        } else if (req.body.time === "today_night") {
            order.set("comment", "Entregar HOJE DE NOITE (ATE AS 22HS)");
            date.setHours(22);
            order.set("due_date", date);
        } else if (req.body.time === "tomorrow_morning") {
            order.set("comment", "Entregar " + tomorrow.getDate() + "/" + (tomorrow.getMonth() + 1) + " DE MANHA");
            date.setDate(date.getDate() + 1);
            date.setHours(12);
            order.set("due_date", date);
        } else if (req.body.time === "tomorrow_afternoon") {
            order.set("comment", "Entregar " + tomorrow.getDate() + "/" + (tomorrow.getMonth() + 1) + " DE TARDE");
            date.setDate(date.getDate() + 1);
            date.setHours(18);
            order.set("due_date", date);
        } else if (req.body.time === "tomorrow_night") {
            order.set("comment", "Entregar " + tomorrow.getDate() + "/" + (tomorrow.getMonth() + 1) + " DE NOITE");
            date.setDate(date.getDate() + 1);
            date.setHours(22);
            order.set("due_date", date);
        }
        var stores = (await getStoresETA(/*address.get('zip'),req.body.items.length*/)).stores;
        var store;
        for (var i = 0; i < stores.length; i++) {
            if (date.getDay() === 0 && stores[i].pointer.get("sunday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 1 && stores[i].pointer.get("monday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 2 && stores[i].pointer.get("tuesday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 3 && stores[i].pointer.get("wednesday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 4 && stores[i].pointer.get("thursday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 5 && stores[i].pointer.get("friday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            } else if (date.getDay() === 6 && stores[i].pointer.get("saturday") >= date.getHours()) {
                store = stores[i].pointer;
                break;
            }
        }
        if (!store) {
            store = stores[0].pointer;
        }
        order.set("store", store);
        var card;
        if (req.body.card) {
            console.log(process.pid, "Setting payment method to Credit Card");
            var query_payment_method = new Parse.Query("PaymentMethod");
            var payment_method = await query_payment_method.get("zWHK6D346D");
            order.set("payment_method", payment_method);
            console.log(process.pid, "Setting card");
            if (req.body.card && req.body.card.id && req.body.card.id !== "new") {
                console.log(process.pid, "Getting card");
                var query_card = new Parse.Query("Card");
                card = await query_card.get(req.body.card.id);
            } else {
                console.log(process.pid, "Creating card");
                if (!valid.number(req.body.card.number).isValid) {
                    return res.status(200).send({
                        code: 307,
                        message: "Invalid number"
                    });
                }
                if (!req.body.card.month) {
                    return res.status(200).send({
                        code: 308,
                        message: "Invalid month"
                    });
                }
                if (!req.body.card.year) {
                    return res.status(200).send({
                        code: 309,
                        message: "Invalid year"
                    });
                }
                if (!req.body.card.cvv || req.body.card.cvv.length < 3 || req.body.card.cvv.length > 4) {
                    return res.status(200).send({
                        code: 310,
                        message: "Invalid CVV"
                    });
                }
                console.log(process.pid, "Checking cards");
                var query_cards = user.relation("addresses").query();
                query_cards.equalTo("user", user);
                query_cards.equalTo("last_4", req.body.card.number.toString().substr(req.body.card.number.toString().length - 4, 4));
                query_cards.equalTo("issuer", req.body.card.issuer);
                card = await query_cards.first();
                if (!card) {
                    console.log(process.pid, "Creating new card");
                    var Card = Parse.Object.extend("Card");
                    card = new Card();
                    card.set("archived", false);
                    card.set("user", user);
                }
                console.log(process.pid, "Setting parameters");
                card.set("issuer", req.body.card.issuer);
                card.set("number", req.body.card.number);
                card.set("last_4", req.body.card.number.toString().substr(req.body.card.number.toString().length - 4, 4));
                card.set("month", req.body.card.month);
                card.set("year", req.body.card.year);
                card.set("cvv", req.body.card.cvv);
                card.set("name", req.body.card.name);
                console.log(process.pid, "Saving card");
                card = await card.save();
                console.log(process.pid, "Adding card to user");
                user.relation("cards").add(card);
                console.log(process.pid, "Saving user");
                await user.save();
                console.log(process.pid, "Saved user");
            }
            order.set("card", card);
            order.set("card_issuer", card.get("issuer"));
        } else if (user.get("member")) {
            console.log(process.pid, "Setting payment method to Membership");
            var query_payment_method = new Parse.Query("PaymentMethod");
            var payment_method = await query_payment_method.get("UAs0uYzln1");
            order.set("payment_method", payment_method);
            //order.set('comment','CONVENIO ' + user.get('code') + '.');
        } else {
            return res.status(200).send({
                code: 311,
                message: "Invalid payment method"
            });
        }
        if (req.body.vat) {
            if (validaCpfCnpj(req.body.vat)) {
                console.log(process.pid, "Setting vat");
                order.set("vat", req.body.vat);
            } else {
                return res.status(200).send({
                    code: 312,
                    message: "Invalid vat"
                });
            }
        }
        console.log(process.pid, "Processing items");
        var order_items = order.relation("items");
        var OrderItem = Parse.Object.extend("OrderItem");
        for (var i = 0; i < req.body.items.length; i++) {
            console.log(process.pid, "Getting item");
            var query_item = new Parse.Query("Item");
            var item = await query_item.get(req.body.items[i].item.id);
            console.log(process.pid, "Creating order item");
            var order_item = new OrderItem();
            order_item.set("item", item);
            order_item.set("picked", false);
            order_item.set("cashed", false);
            order_item.set("picked_unit", req.body.items[i].unit);
            order_item.set("picked_quantity", req.body.items[i].quantity);
            order_item.set("unit", req.body.items[i].unit);
            order_item.set("quantity", req.body.items[i].quantity);
            if (item.get("unit") === "KG" && req.body.items[i].unit === "UN") {
                req.body.items[i].price = req.body.items[i].item.price * item.get("weight");
                req.body.items[i].discount = req.body.items[i].item.discount * item.get("weight");
            } else {
                req.body.items[i].price = req.body.items[i].item.price;
                req.body.items[i].discount = req.body.items[i].item.discount;
            }
            subtotal += req.body.items[i].price * req.body.items[i].quantity;
            discount += req.body.items[i].discount * req.body.items[i].quantity;
            order_item.set("price", req.body.items[i].price);
            order_item.set("discount", req.body.items[i].discount);
            order_item.set("total", (req.body.items[i].price - req.body.items[i].discount) * req.body.items[i].quantity);
            console.log(process.pid, "Saving order item");
            order_item = await order_item.save();
            console.log(process.pid, "Saved order item");
            order_items.add(order_item);
        }
        total = Number(subtotal - discount + shipping);
        order.set("picked_items", 0);
        order.set("total_items", req.body.items.length);
        order.set("subtotal", subtotal);
        order.set("discount", discount);
        order.set("shipping", shipping);
        order.set("online", true);
        order.set("total", total);
        console.log(process.pid, "Getting last order");
        var last_order = await last_query.first();
        if (last_order) {
            order.set("number", last_order.get("number") + 1);
        } else {
            order.set("number", 1);
        }
        console.log(process.pid, "Saving order", last_order.get("number") + 1);
        order = await order.save();
        logs = order.relation("logs");
        try {
            /*console.log(process.pid,'Processing payment');
      if (card) {
        console.log(process.pid,'Authorizing payment');
        order.set('authorization',await authorizePayment(card,total,order.get('number').toString()));
        console.log(process.pid,'Payment succesfull');
        logs.add(await log(user,'Online payment was pre-authorized'));
      }*/
            console.log(process.pid, "Setting order status to pending");
            order.set("status", "pending");
            console.log(process.pid, "Saving order");
            order = await order.save();
            console.log(process.pid, "Saved order");
            res.status(200).send({
                code: 200,
                message: "Placed order",
                order: {
                    id: order.id,
                    number: order.get("number"),
                    subtotal: order.get("subtotal"),
                    discount: order.get("discount"),
                    shipping: order.get("shipping"),
                    total: order.get("total")
                }
            });
        } catch (error) {
            console.log(process.pid, "Payment failed", error);
            logs.add(await log(user, "Payment failed"));
            console.log(process.pid, "Setting order status to cancelled");
            order.set("status", "payment_failed");
            console.log(process.pid, "Saving order");
            order = await order.save();
            res.status(200).send({
                code: 400,
                message: "Payment failed"
            });
        }
    } catch (error) {
        console.error(process.pid, error);
        res.status(500).send({});
    }
});

router.get("/terms", async function (req, res) {
    res.status(200).render("terms", {
        promo: await getPromo()
    });
});

router.get("/about", async function (req, res) {
    res.status(200).render("about", {
        promo: await getPromo()
    });
});

router.get("/shipping", async function (req, res) {
    res.status(200).render("shipping", {
        promo: await getPromo()
    });
});

router.get("/error", async function (req, res) {
    res.status(500).render("error", {
        promo: await getPromo()
    });
});

router.get("*", async function (req, res) {
    return res.status(404).render("404");
});

module.exports = router;

async function retrieveSession(session_id) {
    try {
        console.log(process.pid, "Retrieving session " + session_id);
        var query = new Parse.Query("_Session");
        query.include("user");
        var session = await query.get(session_id);
        console.log(process.pid, "Retrieved session");
        return session;
    } catch (error) {
        console.error(error);
        return error;
    }
}

function authorizePayment(card, total, id) {
    return new Promise(async function (success, error) {
        console.log(process.pid, "Making payment with eRede");

        var eRede = require("../erede/lib/erede");
        var Transaction = require("../erede/lib/transaction");
        var Store = require("../erede/lib/store");
        var Environment = require("../erede/lib/environment");

        var store;
        try {
            console.log(process.pid, "Setting up PRODUCTION store");
            store = new Store("d9814d62398e4771945b7b163f8a7338", "84700610", Environment.production());
        } catch (err) {
            console.error(process.pid, "Failed to set up store", err);
            return error(err);
        }
        var transaction;
        try {
            console.log(process.pid, "Setting up transaction", {
                total: Number((total * 100).toFixed(0)),
                id: id,
                number: card.get("number").replace(/ /g, ""),
                cvv: card.get("cvv").toString(),
                month: zeroPad(card.get("month"), 2),
                year: card.get("year").toString(),
                name: card.get("name")
            });
            transaction = new Transaction(Number((total * 100).toFixed(0)), id + "A")
                .creditCard(card.get("number").replace(/ /g, ""), card.get("cvv").toString(), zeroPad(card.get("month"), 2), card.get("year").toString(), card.get("name"))
                .autoCapture(false);
        } catch (err) {
            console.error(process.pid, "Failed to set up transaction", err);
            return error(err);
        }
        try {
            console.log(process.pid, "Creating payment " + id);
            var response = await new eRede(store).create(transaction);
            console.log(response);
            if (response.returnCode === "00") {
                console.log(process.pid, "Created transaction");
                return success(response);
            } else {
                console.error(process.pid, "Failed to create transaction", response);
                return error(response);
            }
        } catch (err) {
            console.error("Failed to create payment", err);
            return error(err);
        }
    });
}

async function getStoresETA(zip, quantity) {
    var today = new Date();
    today.setHours(today.getHours() - 3 - 2);
    try {
        console.log(process.pid, "getStoresETA", zip, quantity);
        var query = new Parse.Query("Store");
        query.equalTo("archived", false);
        /*if (today.getDay() === 0) {
      query.greaterThanOrEqualTo('sunday',today.getHours() - 3);
    } else if (today.getDay() === 1) {
      query.greaterThanOrEqualTo('monday',today.getHours() - 3);
    } else if (today.getDay() === 2) {
      query.greaterThanOrEqualTo('tuesday',today.getHours() - 3);
    } else if (today.getDay() === 3) {
      query.greaterThanOrEqualTo('wednesday',today.getHours() - 3);
    } else if (today.getDay() === 4) {
      query.greaterThanOrEqualTo('thursday',today.getHours() - 3);
    } else if (today.getDay() === 5) {
      query.greaterThanOrEqualTo('friday',today.getHours() - 3);
    } else if (today.getDay() === 6) {
      query.greaterThanOrEqualTo('saturday',today.getHours() - 3);
    }*/
        console.log(process.pid, "Getting stores");
        var stores = await query.find();
        console.log(process.pid, "Got " + stores.length + " stores");
        for (var i = 0; i < stores.length; i++) {
            stores[i] = {
                pointer: stores[i],
                id: stores[i].id,
                name: stores[i].get("name"),
                zip: stores[i].get("zip"),
                average_pending_time: stores[i].get("average_pending_time"),
                average_picking_time: stores[i].get("average_picking_time"),
                average_picking_items_time: stores[i].get("average_picking_items_time"),
                average_cashing_time: stores[i].get("average_cashing_time"),
                average_cashing_items_time: stores[i].get("average_cashing_items_time"),
                average_planning_time: stores[i].get("average_planning_time"),
                average_delivering_time: stores[i].get("average_delivering_time"),
                orders: 0,
                processing_time: 0
            };
            if (zip) {
                console.log(process.pid, "Calculating distance from " + zip + " to " + stores[i].zip);
                //stores[i].distance = await CepCoords.getDistEntreCeps(zip.toString(),stores[i].zip.toString());
                stores[i].distance = 1;
                console.log(process.pid, "Got distance to store", stores[i].distance);
            }
        }
        for (var j = 0; j < stores.length; j++) {
            console.log(process.pid, "Counting orders for " + stores[j].name);
            var query = new Parse.Query("Order");
            query.equalTo("store", stores[j].pointer);
            query.containedIn("status", ["pending", "picking", "cashing", "deliveing"]);
            stores[j].orders = await query.count();
            console.log(process.pid, "Store " + stores[j].name + " has " + stores[j].orders + " open orders");
            if (stores[j].average_pending_time > 20 * 60000) {
                stores[j].average_pending_time = 20 * 60000;
            }
            stores[j].processing_time += stores[j].average_pending_time;
            if (quantity) {
                stores[j].processing_time += stores[j].average_picking_items_time * quantity;
                stores[j].processing_time += stores[j].average_cashing_items_time * quantity;
            } else {
                stores[j].processing_time += stores[j].average_picking_time;
                stores[j].processing_time += stores[j].average_cashing_time;
            }
            if (zip) {
                stores[j].processing_time += stores[j].average_planning_time;
                stores[j].processing_time += stores[j].average_delivering_time;
            }
            if (stores[j].processing_time > 14400000) {
                stores[j].processing_time = 14400000;
            }
            stores[j].eta = new Date(Number(new Date()) + stores[j].processing_time);
            if (stores[j].eta.getHours() - 3 >= 21) {
                stores[j].eta.setDate(stores[j].eta.getDate() + 1);
                stores[j].eta.setHours(8 + 3);
                stores[j].eta.setMinutes(0);
                stores[j].eta.setSeconds(0);
                stores[j].eta = new Date(Number(stores[j].eta) + stores[j].processing_time);
            } else if (stores[j].eta.getHours() - 3 < 8) {
                stores[j].eta.setHours(8 + 3);
                stores[j].eta.setMinutes(0);
                stores[j].eta.setSeconds(0);
                stores[j].eta = new Date(Number(stores[j].eta) + stores[j].processing_time);
            }
            stores[j].weighted_processing_time = stores[j].processing_time * stores[j].orders;
        }
        var preferred;
        console.log(stores);
        if (zip && sortArrayByKey(stores, "distance", "ascending")[0].distance < 0.1) {
            preferred = sortArrayByKey(stores, "distance", "ascending")[0];
        } else {
            preferred = sortArrayByKey(stores, "weighted_processing_time", "ascending")[0];
        }
        console.log({
            stores: sortArrayByKey(stores, "weighted_processing_time", "ascending"),
            closest: sortArrayByKey(stores, "distance", "ascending")[0],
            quickest: sortArrayByKey(stores, "weighted_processing_time", "ascending")[0],
            preferred: preferred
        });
        return {
            stores: sortArrayByKey(stores, "weighted_processing_time", "ascending"),
            closest: sortArrayByKey(stores, "distance", "ascending")[0],
            quickest: sortArrayByKey(stores, "weighted_processing_time", "ascending")[0],
            preferred: preferred
        };
    } catch (err) {
        console.error(process.pid, err);
        return err;
    }
}

async function parseUser(pointer) {
    var user = {
        id: pointer.id
    };
    if (pointer.get("image")) {
        user.image = pointer.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br").replace("http://localhost", "https://emporiovillaborghese.com.br");
    } else {
        user.image = "/placeholder.jpg";
    }
    if (pointer.get("name")) {
        user.name = pointer.get("name");
    }
    if (pointer.get("username")) {
        user.username = pointer.get("username");
    }
    if (pointer.get("emails") && pointer.get("emails").length) {
        user.email = pointer.get("emails")[0];
    }
    if (pointer.get("phone") && pointer.get("phone").length) {
        user.phone = pointer.get("phones")[0];
    }
    if (pointer.get("vat")) {
        user.vat = pointer.get("vat");
    }
    if (pointer.get("image")) {
        user.image = pointer.get("image").url().replace("http://localhost", "https://emporiovillaborghese.com.br").replace("http://localhost", "https://emporiovillaborghese.com.br");
    }
    if (pointer.get("birthday")) {
        user.birthday = pointer.get("birthday");
    }
    console.log(user);
    return user;
}

function log(user, message) {
    return new Promise(async function (success, error) {
        try {
            console.log(process.pid, "LOG");
            var Log = Parse.Object.extend("Log");
            var log = new Log();
            log.set("user", user);
            log.set("message", message);
            log = await log.save();
            success(log);
        } catch (err) {
            console.error(process.pid, err);
            error(error);
        }
    });
}

function makeid(length) {
    var result = [];
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join("");
}

function chunk(arr, len) {
    var chunks = [];
    var i = 0;
    var n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, (i += len)));
    }
    return chunks;
}

function validaCpfCnpj(val) {
    val = val.toString().replace(/\D+/g, "");
    if (val.length === 11) {
        /*var cpf = val.toString().replace(/\D+/g, '');
        if ( !cpf || cpf.length != 11
          || cpf == "00000000000"
          || cpf == "11111111111"
          || cpf == "22222222222" 
          || cpf == "33333333333" 
          || cpf == "44444444444" 
          || cpf == "55555555555" 
          || cpf == "66666666666"
          || cpf == "77777777777"
          || cpf == "88888888888" 
          || cpf == "99999999999" )
        return false
      var soma = 0
        var resto
      for (var i = 1; i <= 9; i++) 
        soma = soma + parseInt(cpf.substring(i-1, i)) * (11 - i)
      resto = (soma * 10) % 11
        if ((resto == 10) || (resto == 11))  resto = 0
        if (resto != parseInt(cpf.substring(9, 10)) ) return false
      soma = 0
        for (var i = 1; i <= 10; i++) 
          soma = soma + parseInt(cpf.substring(i-1, i)) * (12 - i)
        resto = (soma * 10) % 11
        if ((resto == 10) || (resto == 11))  resto = 0
        if (resto != parseInt(cpf.substring(10, 11) ) ) return false*/
        return true;
    } else {
        /*var cnpj = val.toString().replace(/\D+/g, '');
        if ( !cnpj || cnpj.length != 14
            || cnpj == "00000000000000" 
            || cnpj == "11111111111111" 
            || cnpj == "22222222222222" 
            || cnpj == "33333333333333" 
            || cnpj == "44444444444444" 
            || cnpj == "55555555555555" 
            || cnpj == "66666666666666" 
            || cnpj == "77777777777777" 
            || cnpj == "88888888888888" 
            || cnpj == "99999999999999")
            return false
        var tamanho = cnpj.length - 2
        var numeros = cnpj.substring(0,tamanho)
        var digitos = cnpj.substring(tamanho)
        var soma = 0
        var pos = tamanho - 7
        for (var i = tamanho; i >= 1; i--) {
          soma += numeros.charAt(tamanho - i) * pos--
          if (pos < 2) pos = 9
        }
        var resultado = soma % 11 < 2 ? 0 : 11 - soma % 11
        if (resultado != digitos.charAt(0)) return false;
        tamanho = tamanho + 1
        numeros = cnpj.substring(0,tamanho)
        soma = 0
        pos = tamanho - 7
        for (var i = tamanho; i >= 1; i--) {
          soma += numeros.charAt(tamanho - i) * pos--
          if (pos < 2) pos = 9
        }
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11
        if (resultado != digitos.charAt(1)) return false*/
        return true;
    }
}

async function base64Encode(file) {
    var body = await fs.readFileSync(file);
    return body.toString("base64");
}

function valueExistsInArray(value, array) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true;
        }
    }
    return false;
}

function getImage(keyword) {
    return new Promise(async function (success, error) {
        try {
            request(
                {
                    url: "https://api.bing.microsoft.com/v7.0/images/search?q=" + encodeURI(keyword) + "&count=1&market=pt-BR",
                    headers: {
                        "Content-Type": "application/json",
                        "User-Agent": "Uptech (franco.altuna@uptech.com.ar)",
                        "Ocp-Apim-Subscription-Key": "34c8fc29941541db98436448cdf3ad7c"
                    }
                },
                async function (err, response, body) {
                    try {
                        body = JSON.parse(body);
                        success(body.value[0].thumbnailUrl);
                    } catch (err) {
                        console.error(process.pid, err);
                        error(err);
                    }
                }
            );
        } catch (err) {
            console.error(process.pid, err);
            error(err);
        }
    });
}

function zeroPad(n, width, z) {
    n = Number(n);
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function handleSession(req, res) {
    var session_cookie;
    if (req.cookies && req.cookies.token) {
        session_cookie = req.cookies.token;
        console.log(process.pid, "Retrieved session cookie " + session_cookie);
    } else {
        session_cookie = makeid(9);
        console.log(process.pid, "Setting session cookie to " + session_cookie);
        res.cookie("session", session_cookie);
    }
    return session_cookie;
}

module.exports = router;

async function retrieveSession(session_id) {
    try {
        console.log(process.pid, "Retrieving session " + session_id);
        var query = new Parse.Query("_Session");
        query.include("user");
        query.include("account");
        query.include("account.country");
        query.include("account.currency");
        query.include("account.language");
        var session = await query.get(session_id);
        console.log(process.pid, "Retrieved VALID session");
        return session;
    } catch (error) {
        console.error(error);
        return error;
    }
}

function formatDate(date, time, spell) {
    var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    var dt = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    if (time) {
        dt += " " + zeroPad(date.getHours(), 2) + ":" + zeroPad(date.getMinutes(), 2);
    }
    if (spell) {
        dt = date.getDate() + " de " + months[date.getMonth()] + " " + date.getFullYear();
    }
    return dt;
}

function zeroPad(number, places) {
    var zero = places - number.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + number;
}

function timeBeweenDates(date_1, date_2) {
    var string = "";
    var delta = Math.abs(date_1 - date_2) / 1000;
    var days = Math.floor(delta / 86400);
    if (days > 0) {
        string = days + " days ";
        return string;
    }
    delta -= days * 86400;
    var hours = Math.floor(delta / 3600) % 24;
    if (days > 0 || hours > 0) {
        string += hours + " hours ";
        return string;
    }
    delta -= hours * 3600;
    var minutes = Math.floor(delta / 60) % 60;
    if (days > 0 || minutes > 0) {
        string += minutes + " minutes ";
        return string;
    }
    delta -= minutes * 60;
    var seconds = Math.ceil(delta % 60);
    if (days > 0 || seconds > 0) {
        string += seconds + " seconds";
        return string;
    }
}

function makeid(length) {
    var result = [];
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join("");
}

function formatCurrency(number) {
    number = number.toFixed(2);
    var whole = Number(number.split(".")[0]).toLocaleString("en").replace(/,/g, ".");
    var decimals = number.split(".")[1];
    if (!decimals) {
        decimals = "00";
    } else if (decimals.length === 1) {
        decimals += 0;
    }
    return whole + "," + decimals;
}

function formatDate(date, time) {
    var dt = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    if (time) {
        dt += " " + zeroPad(date.getHours(), 2) + ":" + zeroPad(date.getMinutes(), 2);
    }
    return dt;
}

String.prototype.toProperCase = function () {
    var i, j, str;
    str = this.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    return str;
};

function sortArray(array, order) {
    if (!order || order === "ascending") {
        return array.sort(function (a, b) {
            console.log(a, b);
            if (a.includes(" ")) {
                a = Number(a.split(" ")[0]);
            } else {
                a = Number(a);
            }
            if (b.includes(" ")) {
                b = Number(b.split(" ")[0]);
            } else {
                b = Number(b);
            }
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        });
    } else {
        return array.sort(function (a, b) {
            if (a.includes(" ")) {
                a = a.split(" ")[0];
            } else {
                a = Number(a);
            }
            if (b.includes(" ")) {
                b = b.split(" ")[0];
            } else {
                b = Number(b);
            }
            if (a > b) return -1;
            if (a < b) return 1;
            return 0;
        });
    }
}

function sortArrayByKey(array, key, order) {
    if (!order || order === "ascending") {
        return array.sort(function (a, b) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        });
    } else {
        return array.sort(function (a, b) {
            if (a[key] > b[key]) return -1;
            if (a[key] < b[key]) return 1;
            return 0;
        });
    }
}

function replaceCategory(category) {
    var replacements = [
        {
            original: "HIGIENE PESSOAL E PERFUMARIA",
            replacement: "HIGIENE PESSOAL"
        },
        {
            original: "LE CREUSET/TAÇAS/ACESSORIOS",
            replacement: "ACESSORIOS"
        },
        {
            original: "PADARIA/CONFEITARIA",
            replacement: "PADARIA"
        },
        {
            original: "MERCEARIA IMPORTADA",
            replacement: "IMPORTADOS"
        },
        {
            original: "PANIFICAÇÃO INDUSTRIALIZADA",
            replacement: "PANIFICAÇÃO"
        },
        {
            original: "VINHOS DECANTER",
            replacement: "VINHOS"
        },
        {
            original: "VINHOS/DESTILADOS/CERV. IMP.",
            replacement: "BEBIDAS"
        }
    ];
    for (var i = 0; i < replacements.length; i++) {
        if (category === replacements[i].original) {
            category = replacements[i].replacement;
            break;
        }
    }
    return category.replace("PRODUTOS ", "");
}

function generateRandomNumber(n) {
    var add = 1,
        max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

    if (n > max) {
        return generate(max) + generate(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return ("" + number).substring(add);
}

function formatDate(date, time, spellMonth) {
    var dt = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
    if (time) {
        dt += " " + zeroPad(date.getHours(), 2) + ":" + zeroPad(date.getMinutes(), 2);
    }
    if (spellMonth) {
        dt = date.getDate() + " " + translate(months[date.getMonth()]) + " " + date.getFullYear();
    }
    return dt;
}
function getTime(date) {
    date.setHours(date.getHours() - 3);
    return zeroPad(date.getHours(), 2) + ":" + zeroPad(date.getMinutes(), 2);
}
