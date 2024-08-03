var after_login_action = "";
function viewProfile() {
    if (getCookie("token")) {
        window.location.href = "/profile";
    } else {
        after_login_action = "window.location.href = '/profile';";
        $("#loginModal").modal("show");
    }
}
function viewAccount() {
    if (getCookie("token")) {
        window.location.href = "/account";
    } else {
        after_login_action = "window.location.href = '/account';";
        $("#loginModal").modal("show");
    }
}
function viewCheckout() {
    if (getCookie("token")) {
        window.location.href = "/checkout";
    } else {
        after_login_action = "window.location.href = '/checkout';";
        $("#loginModal").modal("show");
    }
}
function viewOrders() {
    if (getCookie("token")) {
        window.location.href = "/orders";
    } else {
        after_login_action = "window.location.href = '/orders';";
        $("#loginModal").modal("show");
    }
}
function viewAddresses() {
    if (getCookie("token")) {
        window.location.href = "/addresses";
    } else {
        after_login_action = "window.location.href = '/addresses';";
        $("#loginModal").modal("show");
    }
}
function viewCards() {
    if (getCookie("token")) {
        window.location.href = "/cards";
    } else {
        after_login_action = "window.location.href = '/cards';";
        $("#loginModal").modal("show");
    }
}

function checkout() {
    if (getCookie("token")) {
        showLoading("#modalShoppingCart div.body");
        window.location.href = "/checkout";
    } else {
        after_login_action = "window.location.href = '/checkout';";
        $("#loginModal").modal("show");
    }
}
