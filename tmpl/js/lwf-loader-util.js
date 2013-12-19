(function() {

    var isIOS = /(iPhone|iPad)/.test(navigator.userAgent);
    var isAndroid = /Android/.test(navigator.userAgent);
    var isMobile = isIOS || isAndroid;
    var stageWrapper = null;
    var isConfigurable = true;
    var config = window['testlwf_config'];
    var mode = 'release';
    var fps = {
        num01: 0,
        num60: 0,
        stats: null
    };
    var dps = {
        num01: 0,
        num60: 0,
        numi: 0,
        stats: null
    };


    onProgress = function(loaded_count, total) {
        if (progressBar) {
            if (loaded_count < total) {
                progressBar.textContent = 'loading: ' + i2a(Math.round(100 * loaded_count / total), 3) + '%';
            } else {
                if (progressBar) {
                    progressBar.parentNode.removeChild(progressBar);
                    progressBar = null;
                }
            }
        }
    };

    var onpagehide = function() {
    };

    var onpageshow = function() {

      var header = document.getElementById('header');

      var lpart = document.createElement('div');
      lpart.id = 'lpart';
      var rpart = document.createElement('div');
      rpart.id = 'rpart';

      {
          var qr = document.createElement('span');
          qr.id = 'qr';
          var q = qrcode(10, 'M');
          q.addData(
              (window['testlwf_html5target'] != 'native')
                  ? window.location.href
                  : window.location.href.replace(/^http:/, "lwfh5gl:"));
          q.make();
          qr.innerHTML = q.createImgTag();
          rpart.appendChild(qr);
      }

      {
          var h1 = document.createElement('h1');
          h1.innerHTML = document.title + '<span id="loading_icon"></span>';
          lpart.appendChild(h1);
      }

      {
        var div = document.createElement('div');
        div.className = 'info_wrapped';
        div.textContent = '(' + window['testlwf_commandline'] + ')';
        lpart.appendChild(div);
      }

      {
        var div = document.createElement('div');
        div.className = 'info_wrapped';
        div.id = 'renderer_in_use';

        var renderer = window.lwfLoader.getRenderer();

        if (renderer === 'useCanvasRenderer') {
          renderer = 'Canvas Renderer';
        } else if (renderer === 'useWebkitCSSRenderer') {
          renderer = 'WebkitCSS Renderer';
        } else if (renderer === 'useWebglRenderer') {
          renderer = 'WebGL Renderer';
        } else if (renderer === 'useNativeRenderer') {
          renderer = 'Native Renderer';
        }


        div.innerHTML
          = '<br>Currently Running on: ' + renderer;

        lpart.appendChild(div);
      }

      {
        var sizes = [
          'default',
          '480x800',
          //'480x854',
          '540x960',
          '640x960',
          '768x1024',
          '|',
          '800x480',
          //'854x480',
          '960x540',
          '960x640',
          '1024x768'
        ];

        var resize = function(event) {
          var myStage = document.getElementById("lwfs-sample");
          console.log("Stage Width: " + myStage.style.width);
          console.log("Stage Height: " + myStage.style.height);

          if (/([0-9]+)x([0-9]+)/.test(event.target.textContent)) {
            var inputWidth = parseInt(RegExp.$1);
            var inputHeight = parseInt(RegExp.$2);

            myStage.style.width = inputWidth + 'px';
            myStage.style.height = inputHeight + 'px';
            window.lwfLoader.stageWidth = inputWidth;
            window.lwfLoader.stageHeight = inputHeight;
          } else {
            myStage.style.width = 0;
            myStage.style.height = 0;
            window.lwfLoader.stageWidth = 0;
            window.lwfLoader.stageHeight = 0;
          }
          return false;
        };

        var div = document.createElement('div');
        div.className = 'info_wrapped';
        {
          var span = document.createElement('span');
          span.className = 'info';
          span.textContent = 'screen size:';
          div.appendChild(span);
        }

        for (var i in sizes) {
          div.appendChild(document.createTextNode(' '));
          if (sizes[i] == 'default' || /([0-9]+)x([0-9]+)/.test(sizes[i])) {
            var a = document.createElement('a');
            a.textContent = sizes[i];
            a.href = 'javascript:void(0)';
            a.onclick = resize;
            div.appendChild(a);
          } else {
            div.appendChild(document.createTextNode(sizes[i]));
          }
        }
        lpart.appendChild(div);
      }

      header.appendChild(lpart);
      header.appendChild(rpart);

    };

    window.addEventListener('pagehide', onpagehide, false);
    window.addEventListener('pageshow', onpageshow, false);
}).call(this);