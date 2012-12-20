Ajax = {
    get: function(url) {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.send("");
    }
};
