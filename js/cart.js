var search;
var input = $('[name="zip"]');
input.off("keyup");
input.off("keydown");
input.on("keyup", function () {
    clearTimeout(search);
    search = setTimeout(function () {
        if ($('[name="zip"]').val().length === 9) {
            obtainAddress();
        }
    }, 100);
});
input.on("keydown", function () {
    clearTimeout(search);
});
input.keyup();

async function obtainAddress() {
    $("#loading").modal("show");
    let address = await makeRequest({
        method: "GET",
        path: `/addresses/zip`,
        data: {
            zip: $('[name="zip"]').val()
        }
    });
    $('[name="zip"]').val(address.zip);
    $('[name="street"]').val(address.street);
    $('[name="neighbourhood"]').val(address.neighbourhood);
    $('[name="city"]').val(address.city);
    $('[name="state"]').val(address.state);
    viewCart();
}

function calculateShipping() {
    return new Promise(async function (resolve, reject) {
        var zip;
        if ($("input[name=address]:checked") && $("input[name=address]:checked").val() !== "new") {
            zip = $("input[name=address]:checked").attr("zip");
        } else {
            zip = $('[name="zip"]').val();
        }
        if (zip) {
            try {
                let region = await makeRequest({
                    method: "GET",
                    path: `/regions/zip`,
                    data: {
                        zip
                    }
                });
                return resolve(region.shipping_cost);
            } catch (error) {
                $("#missingModal p span").html("Infelizmente no momento não atendemos a sua região.");
                $("#missingModal").modal("show");
            }
        } else {
            resolve(0);
        }
    });
}

async function viewCart() {
    if (!getCookie("token")) {
        after_login_action = "viewCart();";
        return $("#loginModal").modal("show");
    }
    showLoading("#modalShoppingCart .modal-content");
    var cart = await makeRequest({
        method: "GET",
        path: `/cart`,
        data: {
            address: $("input[name=address]:checked").val() || undefined
        }
    });
    $("#shipping_blocks").empty();
    for (let i = 0; i < cart.shipping_blocks.length; i++) {
        var date = new Date(cart.shipping_blocks[i]);
        var time = "";
        var description = "";
        if (date.getHours() <= 12) {
            time = "de manhã";
            description = "8 ate 12hs";
        } else if (date.getHours() <= 18) {
            time = "de tarde";
            description = "12 ate 18hs";
        }
        $("#shipping_blocks").append(`
            <div class="col-12 col-md-4 p-1">
                <label class="btn btn-sm btn-outline-border w-100 h-100 ${i === 0 ? "active" : ""}">
                    ${cart.shipping_blocks[i].split("T")[0].split("-")[2]}/${Number(cart.shipping_blocks[i].split("T")[0].split("-")[1])} 
                    ${time}
                    <br />
                    <input class="d-none" type="radio" name="time" value="${cart.shipping_blocks[i]}" / >
                    <small style="font-weight: 400">${description}</small>
                </label>
            </div>
        `);
    }
    $("#shipping_blocks input").first().click();
    if (!window.location.href.includes("checkout")) {
        $("#modalShoppingCart").modal("show");
    }
    showLoading("#checkoutCart");
    showLoading("#modalShoppingCart .modal-content");
    if (cart.items.length > 0) {
        //$("#cartCount").attr("data-cart-items", cart.items.length);
        $('[name="items"]').empty();
        for (var i = 0; i < cart.items.length; i++) {
            var selected = "";
            if (cart.items[i].item.unit === cart.items[i].unit) {
                selected = "selected";
            }
            var units;
            if (cart.items[i].item.unit === "UN" || (cart.items[i].item.unit === "KG" && cart.items[i].item.weight)) {
                units = '<option value="UN">UN</option>';
            } else {
                units = '<option value="KG">KG</option>';
            }
            var options = "";
            for (var j = 1; j <= 20; j++) {
                var selected = "";
                if (cart.items[i].item.unit === "UN") {
                    if (cart.items[i].quantity === j) {
                        selected = "selected";
                    }
                    options += '<option value="' + j + '" ' + selected + ">" + j + "</option>";
                } else if (cart.items[i].item.unit === "KG" && cart.items[i].item.weight) {
                    var weight = cart.items[i].item.weight * j;
                    if (weight >= 1) {
                        if (weight.toString().includes(".")) {
                            weight = weight.toFixed(1);
                        }
                        weight = weight + "kg";
                    } else {
                        weight = (weight * 1000).toFixed(0) + "g";
                    }
                    if (cart.items[i].quantity === j) {
                        selected = "selected";
                    }
                    options += '<option value="' + j + '" ' + selected + ">" + j + " - " + weight + "</option>";
                } else {
                    var option;
                    if (j * 0.1 >= 1) {
                        option = (j * 0.1).toFixed(2) + "kg";
                    } else {
                        option = (j * 0.1 * 1000).toFixed(0) + "g";
                    }
                    if (cart.items[i].quantity === j * 0.1) {
                        selected = "selected";
                    }
                    options += `<option value="${j * 0.1}" ${selected}>${option}</option>`;
                }
            }
            var price;
            if (cart.items[i].subtotal !== cart.items[i].total) {
                price =
                    '<span class="font-weight-bold text-gray-350 text-decoration-line-through">R$ ' +
                    formatCurrency(cart.items[i].subtotal) +
                    '</span><span class="ml-1 font-weight-bolder text-primary">R$ ' +
                    formatCurrency(cart.items[i].total) +
                    "</span>";
            } else {
                price = '<span class="text-muted">R$ ' + formatCurrency(cart.items[i].total) + "</span>";
            }
            $('[name="items"]').append(`
                        <li class="list-group-item px-0" id="${cart.items[i].item.id}">
                            <div class="d-flex align-items-center">
                                <div class="mr-4" style="width: 125px; flex-basis: 125px">
                                    <a class="product-image" href="/items/${cart.items[i].item.id}">
                                        <img class="img-fluid" src="${cart.items[i].item.image}" alt="${cart.items[i].item.name}" />
                                    </a>
                                </div>
                                <div style="width: calc(100% - 125px)">
                                    <p class="font-size-sm font-weight-bold mb-6">
                                        <a class="text-body" href="/items/${cart.items[i].item.id}">${cart.items[i].item.name}</a> <br /><span class="text-muted">${price}</span>
                                    </p>
                                    <div class="d-flex align-items-center">
                                        <select unit class="custom-select custom-select-xxs w-auto mr-2" onchange="updateUnit(this);" value="${cart.items[i].unit}">
                                            ${units}
                                        </select>
                                        <select quantity class="custom-select custom-select-xxs w-auto" onchange="updateQuantity(this);">
                                            ${options}
                                        </select>
                                        <a class="font-size-xs text-gray-400 ml-auto mr-4" onclick="removeFromCart(this);"> <i class="far fa-times"></i></a>
                                    </div>
                                </div>
                            </div>
                        </li>
            `);
        }
        $('[name="subtotal"]').html("R$ " + formatCurrency(cart.subtotal));
        $('[name="discount"]').html("R$ " + formatCurrency(cart.discount));
        $('[name="shipping"]').html("R$ " + formatCurrency(cart.shipping));
        $('[name="total"]').html("R$ " + formatCurrency(cart.total));
        $('[name="total_items"]').html(cart.length);
        $('[name="filled"]').show();
        $('[name="empty"]').hide();
    } else {
        //$("#cartCount").removeAttr("data-cart-items");
        $('[name="filled"]').hide();
        $('[name="empty"]').show();
    }
    $("#loading").modal("hide");
    hideLoading("#checkoutCart");
    hideLoading("#modalShoppingCart .modal-content");
}

async function addToCart(id, quantity, unit) {
    try {
        await makeRequest({
            method: "POST",
            path: `/cart/${id}`,
            data: {
                unit: unit,
                quantity: Number(quantity)
            }
        });
    } catch (error) {
        $("#error").modal("show");
    }
    viewCart();
}

async function removeFromCart(button) {
    var id = $(button).parents("li").attr("id");
    try {
        await makeRequest({
            method: "DELETE",
            path: `/cart/${id}`
        });
    } catch (error) {
        $("#error").modal("show");
    }
    viewCart();
}

function updateQuantity(button) {
    var id = $(button).parents("li").attr("id");
    var unit = $(button).parents("li").find("[unit]").val();
    var quantity = $(button).parents("li").find("[quantity]").val();
    addToCart(id, quantity, unit);
}

function updateUnit(button) {
    var id = $(button).parents("li").attr("id");
    var unit = $(button).parents("li").find("[unit]").val();
    var quantity = $(button).parents("li").find("[quantity]").val();
    addToCart(id, quantity, unit);
}
