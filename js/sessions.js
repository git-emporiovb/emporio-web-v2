$("#register_phone").mask("(00) 00000 0000");
$("#register_code").mask("0000");

$(function () {
    $("#register_vat").mask(CpfCnpjMaskBehavior, cpfCnpjpOptions);
});

async function sendVerificationCode() {
    if ($("#register_phone").val().length === 15) {
        $("#register_phone").removeClass("is-invalid");
        showLoading("#phoneTab");
        try {
            await makeRequest({
                method: "GET",
                path: `/phones/verify`,
                data: {
                    phone: Number($("#register_phone").val().replace(/\D+/g, "")).toString()
                }
            });
            hideLoading("#phoneTab");
            $('a[href="#codeTab"]').tab("show");
            $("#codeTab a").hide();
            $("#register_code").val("");
        } catch (error) {
            hideLoading("#phoneTab");
            $("#register_phone").addClass("is-invalid");
        }
    } else {
        $("#register_phone").addClass("is-invalid");
    }
}

async function verifyPhone() {
    if ($("#register_code").val().length === 4) {
        $("#register_code").removeClass("is-invalid");
        showLoading("#codeTab");
        try {
            var response = await makeRequest({
                method: "POST",
                path: `/phones/verify`,
                data: {
                    phone: Number($("#register_phone").val().replace(/\D+/g, "")).toString(),
                    code: $("#register_code").val()
                }
            });
            hideLoading("#codeTab");
            if (response.user) {
                setCookie("token", response.session);
                var name = response.user.name;
                if (name.includes(" ")) {
                    name = response.user.name.split(" ")[0];
                }
                $("#welcomeTab h4").html("Olá " + name);
                $('a[href="#welcomeTab"]').tab("show");
                setTimeout(function () {
                    $("#loginModal").modal("hide");
                    if (after_login_action) {
                        eval(after_login_action);
                    } else {
                        window.location.reload();
                    }
                }, 3000);
            } else {
                $('a[href="#registerTab"]').tab("show");
            }
        } catch (error) {
            hideLoading("#codeTab");
            $("#register_code").addClass("is-invalid");
        }
    } else {
        $("#register_code").addClass("is-invalid");
    }
}

async function register() {
    var valid = true;
    if ($("#register_name").val().length < 3) {
        $("#register_name").addClass("is-invalid");
        valid = false;
    }
    if ($("#register_vat").val().length !== 14 && $("#register_vat").val().length !== 15 && $("#register_vat").val().length !== 18) {
        $("#register_vat").addClass("is-invalid");
        valid = false;
    }
    if (!$("#register_terms").prop("checked")) {
        $("#register_terms").addClass("is-invalid");
        valid = false;
    }
    if (valid) {
        showLoading("#registerTab");
        var response = await makeRequest({
            method: "POST",
            path: `/clients`,
            data: {
                name: $("#register_name").val(),
                phones: [$("#register_phone").val().replace(/\D+/g, "")],
                vat: $("#register_vat").val().replace(/\D+/g, "")
            }
        });
        setCookie("token", response.session);
        var name = $("#register_name").val();
        if (name.includes(" ")) {
            name = name.split(" ")[0];
        }
        $("#welcomeTab h4").html("Olá " + name);
        $('a[href="#welcomeTab"]').tab("show");
        setTimeout(function () {
            $("#loginModal").modal("hide");
            if (after_login_action) {
                eval(after_login_action);
            } else {
                window.location.reload();
            }
        }, 3000);
    }
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function clearCookie(name) {
    document.cookie = name + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}
