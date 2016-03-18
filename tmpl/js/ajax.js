Ajax = {
    get: function(url) {
        var req = new XMLHttpRequest();
        req.open('GET', encodeURI(url), true);
        req.send('');
    },
    post: function(url, data) {
        var req = new XMLHttpRequest();
        req.open('POST', url, true);
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        var arg = '';
        if (data) {
            var params = [];
            for (var name in data) {
                var value = data[name];
                var param
                    = encodeURIComponent(name).replace(/%20/g, '+')
                    + '='
                    + encodeURIComponent(value).replace(/%20/g, '+');
                params.push(param);
            }
            arg = params.join('&');
        }
        req.send(arg);
    }
};
