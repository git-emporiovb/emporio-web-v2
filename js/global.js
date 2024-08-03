function formatCurrency(number) {
    return number.toFixed(2);
}

function showLoading(selector) {
    $(selector).prepend('<div class="loading" style="display:flex"><div class="loader"></div></div>');
}
function hideLoading(selector) {
    $(selector).find(".loading").remove();
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

function zeroPad(n, width, z) {
    n = Number(n);
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

String.prototype.toProperCase = function () {
    var i, j, str;
    str = this.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    return str;
};

var CpfCnpjMaskBehavior = function (val) {
        return val.replace(/\D/g, "").length <= 11 ? "000.000.000-009" : "00.000.000/0000-00";
    },
    cpfCnpjpOptions = {
        onKeyPress: function (val, e, field, options) {
            field.mask(CpfCnpjMaskBehavior.apply({}, arguments), options);
        }
    };

function makeRequest({ method, path, data }) {
    return new Promise(async function (resolve, reject) {
        console.log(`${method} ${path}`, data);
        try {
            var params = method === "GET" ? data : undefined;
            var headers = {
                contentType: "application/json"
            };
            if (getCookie("token")) {
                headers.authorization = `Bearer ${getCookie("token")}`;
            }
            await axios({
                method,
                url: `https://emporio-server-v2-a37450f98aea.herokuapp.com${path}`,
                data,
                params,
                headers
            }).then(function (response) {
                console.log(`${method} ${path} response`, response.data);
                return resolve(response.data);
            });
        } catch (error) {
            console.error(`${method} ${path} error`, error.response);
            if (error.response?.status === 401) {
                window.localStorage.removeItem("token");
                window.location.href = "";
            }
            return reject(error);
        }
    });
}
