async function viewWishlist() {
    if (!getCookie("token")) {
        after_login_action = "viewWishlist();";
        return $("#loginModal").modal("show");
    }
    showLoading("#modalWishlist .modal-content");
    $("#modalWishlist").modal("show");
    var wishlist = (
        await makeRequest({
            method: "GET",
            path: `/wishlist`
        })
    ).items;
    showLoading("#modalWishlist .modal-content");
    if (wishlist.length > 0) {
        $('#modalWishlist [name="items"]').empty();
        for (var i = 0; i < wishlist.length; i++) {
            var price = '<span class="text-muted">R$ ' + wishlist[i].price + "</span>";
            if (wishlist[i].discount) {
                price =
                    '<span class="font-weight-bold text-gray-350 text-decoration-line-through">R$ ' +
                    formatCurrency(wishlist[i].price) +
                    '</span><span class="ml-1 font-weight-bolder text-primary">R$ ' +
                    formatCurrency(wishlist[i].price - wishlist[i].discount) +
                    "</span>";
            }
            $('#modalWishlist [name="items"]').append(`
                    <li class="list-group-item"> 
                        <div class="row align-items-center"> 
                            <div class="col-4"> 
                                <a class="product-image" href="/items/${wishlist[i].id}"> 
                                    <img class="img-fluid" src="${wishlist[i].image}" alt="${wishlist[i].name}"> 
                                </a> 
                            </div> 
                            <div class="col-8"> 
                                <p class="font-size-sm font-weight-bold mb-0"> 
                                    <a class="text-body" href="/items/${wishlist[i].id}">${wishlist[i].name}</a>
                                    <br>
                                    ${price}
                                </p>
                                <div class="d-flex align-items-center"> 
                                    <a class="font-size-xs text-gray-400 mr-auto" onclick="removeFromWishlist(this);" itemId="${wishlist[i].id}"> 
                                        <i class="far fa-times"></i> 
                                    </a> 
                                </div> 
                            </div> 
                        </div> 
                    </li>
                `);
        }
        $('#modalWishlist [name="total_items"]').html(wishlist.length);
        $('#modalWishlist [name="filled"]').show();
        $('#modalWishlist [name="empty"]').hide();
    } else {
        $('#modalWishlist [name="filled"]').hide();
        $('#modalWishlist [name="empty"]').show();
    }
    hideLoading("#modalWishlist .modal-content");
}

async function addToWishlist(id) {
    try {
        await makeRequest({
            method: "POST",
            path: `/wishlist/${id}`
        });
    } catch (error) {
        $("#error").modal("show");
    }
    viewWishlist();
}

async function removeFromWishlist(button) {
    var id = $(button).attr("itemId");
    try {
        await makeRequest({
            method: "DELETE",
            path: `/wishlist/${id}`
        });
    } catch (error) {
        $("#error").modal("show");
    }
    viewWishlist();
}
