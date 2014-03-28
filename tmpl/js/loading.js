(function() {
    var INTERVAL = 500;
    var UPDATE_TIME = '0';
    // cf. http://d.hatena.ne.jp/amachang/20061201/1164986067
    var currentScript
        = (function (e) {
            if (e.nodeName.toLowerCase() == 'script') {
                return e;
            }
            return arguments.callee(e.lastChild);
        })(document);
    if (currentScript.hasAttributes()) {
        for (var i in currentScript.attributes) {
            var attr = currentScript.attributes[i];
            if (attr.name === "interval") {
                INTERVAL = ~~Math.round(parseFloat(attr.value) * 1000);
            } else if (attr.name === "update_time") {
                UPDATE_TIME = attr.value;
            }
        }
    }
    var isFile = /^file:/.test(window.location.href);
    if (! isFile) {
        window.addEventListener(
            (window.onpageshow !== undefined) ? 'pageshow' : 'load',
            function() {
                var checkStatus = function() {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', window.location.href.replace(/[^\/]+$/, '') + '.loading' + '?' + Date.now(), true);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                var elm = document.getElementById('loading_icon');
                                var res = JSON.parse(xhr.responseText);
                                if (! res.is_in_conversion) {
                                    if (res.update_time != UPDATE_TIME) {
                                        setTimeout(
                                            function() {
                                                window.location.reload();
                                            },
                                            100);
                                    }
                                } else {
                                    if (elm != null) {
                                        elm.style.visibility = 'visible';
                                    }
                                }
                            }
                        }
                    };
                    xhr.setRequestHeader('Pragma', 'no-cache');
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                    xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
                    setTimeout(checkStatus, INTERVAL);
                    xhr.send('');
                };
                checkStatus();
            },
            false);
    }
}).call(this);
