function $$(selector) {
    return document.querySelector(selector);
}

function randomString(length) {
    var result = [];
    var charSet = '0123456789';
    while (length--) {
        result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
    }
    return result.join('');
}

function trace(msg) {
    console.log(msg);
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function(item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}