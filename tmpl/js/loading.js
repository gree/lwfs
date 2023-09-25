(function() {
    var INTERVAL = 500;
    var UPDATE_TIME = '0';
    // cf. https://stackoverflow.com/questions/403967/how-may-i-reference-the-script-tag-that-loaded-the-currently-executing-script
    var currentScript = document.currentScript;
    if (currentScript.hasAttributes()) {
        for (var i in currentScript.attributes) {
            var attr = currentScript.attributes[i];
            if (attr.name === "interval") {
                INTERVAL = ~~Math.round(parseFloat(attr.value) * 1000);
            } else if (attr.name === "update_time") {
                UPDATE_TIME = parseFloat(attr.value);
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
                                        var ut = res.update_time;
                                        setTimeout(
                                            function() {
                                                // window.location.reload(true);
                                                // window.location.href = href;
                                                var href = window.location.href;
                                                var search = window.location.search;
                                                if (/[?&]\.=[.\d]+/.test(href)) {
                                                    href = href.replace(/([?&]\.=)[.\d]+/, '$1' + ut);
                                                } else {
                                                    href = href.replace(/$/, ((search == '') ? '?' : '&') + '.=' + ut);
                                                }
                                                window.location.replace(href);
                                            },
                                            50);
                                    }
                                } else {
                                    if (elm != null) {
                                        elm.style.visibility = 'visible';
                                    }
                                }
                            }
                            setTimeout(checkStatus, INTERVAL);
                        }
                    };
                    xhr.setRequestHeader('Pragma', 'no-cache');
                    xhr.setRequestHeader('Cache-Control', 'no-cache');
                    xhr.setRequestHeader('If-Modified-Since', 'Thu, 01 Jun 1970 00:00:00 GMT');
                    xhr.send();
                };
                checkStatus();
            },
            false);
    }
}).call(this);
