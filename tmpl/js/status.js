(function() {
     INTERVAL = 500;
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
             }
         }
     }
     var checkStatus = function() {
         var xhr = new XMLHttpRequest();
         xhr.open('GET', location.href + '.status', true);
         xhr.onreadystatechange = function() {
             if(xhr.readyState === 4){
                 if (xhr.status === 200) {
                     var res = JSON.parse(xhr.responseText);
                     var elm = document.getElementById('loading');
                     if (elm != null) {
                         elm.style.visibility = (res.is_in_conversion) ? 'visible' : 'hidden';
                     }
                 }
             }
         };
         xhr.send('');
         setTimeout(checkStatus, INTERVAL);
     };
     // use large duration initially for avoiding jittered loading display on reload.
     setTimeout(checkStatus, 2000);
}).call(this);
