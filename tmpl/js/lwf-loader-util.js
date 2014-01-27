(function() {
  window['lwfs_loader_mode'] = true;

  var isAndroid = /Android/.test(navigator.userAgent);
  var isiOS = /(iPhone|iPad|iPod)/.test(navigator.userAgent);
  var isMobile = isiOS || isAndroid;

  var onpageshow = function() {
    var header = document.getElementById('header');
    var lpart = document.createElement('div');
    lpart.id = 'lpart';
    var rpart = document.createElement('div');
    rpart.id = 'rpart';
    var myStage = {};

    if (!isMobile) {
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
        var div_commandline = document.createElement('div');
        div_commandline.className = 'info_wrapped';
        div_commandline.textContent = '(' + window['testlwf_commandline'] + ')';
        lpart.appendChild(div_commandline);
      }

      {
        var div_renderer = document.createElement('div');
        div_renderer.className = 'info_wrapped';
        div_renderer.id = 'renderer_in_use';

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

        div_renderer.innerHTML
          = '<br>Currently Running on: ' + renderer;

        lpart.appendChild(div_renderer);
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
          var myStage = document.getElementById('lwfs-sample');
          if (/([0-9]+)x([0-9]+)/.test(event.target.textContent)) {
            var inputWidth = parseInt(RegExp.$1);
            var inputHeight = parseInt(RegExp.$2);
            var stageWidth = window.lwfWidth;
            var stageHeight = window.lwfHeight;

            var screenRatio = inputWidth / inputHeight;
            var imageRatio = stageWidth / stageHeight;

            if (screenRatio > imageRatio) {
              stageWidth *= (inputHeight / stageHeight);
              stageHeight = inputHeight;
            } else {
              stageHeight *= (inputWidth / stageWidth);
              stageWidth = inputWidth;
            }

            myStage.style.width = inputWidth + 'px';
            myStage.style.height = inputHeight + 'px';

            window.lwfLoader.stageWidth = stageWidth;
            window.lwfLoader.stageHeight = stageHeight;
            window.lwfLoader.screenWidth = inputWidth;
            window.lwfLoader.screenHeight = inputHeight;
            window.lwfLoader.resizeMode = 'fitToScreen';
            window.lwfLoader.stageHAlign = 0;
            window.lwfLoader.stageVAlign = -1;
          } else {
            myStage.style.width = 0;
            myStage.style.height = 0;
            window.lwfLoader.stageWidth = 0;
            window.lwfLoader.stageHeight = 0;
            window.lwfLoader.screenWidth = 0;
            window.lwfLoader.screenHeight = 0;
            window.lwfLoader.stageHAlign = -1;
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

      {
        var div_fps = document.createElement('div');
        div_fps.className = 'info_wrapped';
        div_fps.id = 'current_fps';

        div_fps.innerHTML
          = 'Current FPS(avg): ' + window.lwfLoader.getCurrentFPS() + 'fps';

        lpart.appendChild(div_fps);
      }

      myStage = document.getElementById('lwfs-sample');
      myStage.style.marginLeft = '10px';
      myStage.style.marginTop = '10px';

      header.appendChild(lpart);
      header.appendChild(rpart);

    } else {  // case viewing with mobile devices
      var inputWidth = window.innerWidth;
      var inputHeight = window.innerHeight;
      var stageWidth = window.lwfWidth;
      var stageHeight = window.lwfHeight;

      if (isAndroid) {
        if (window.innerWidth > window.screen.width) {
          inputWidth = window.screen.width;
        }
        if (window.innerHeight > window.screen.height) {
          inputHeight = window.screen.height;
        }
      }

      var screenRatio = inputWidth / inputHeight;
      var imageRatio = stageWidth / stageHeight;

      if (screenRatio > imageRatio) {
        stageWidth *= (inputHeight / stageHeight);
        stageHeight = inputHeight;
      } else {
        stageHeight *= (inputWidth / stageWidth);
        stageWidth = inputWidth;
      }

      window.lwfLoader.debug = false;
      myStage = document.getElementById('lwfs-sample');
      myStage.style.width = inputWidth + 'px';
      myStage.style.height = inputHeight + 'px';
      window.lwfLoader.stageWidth = stageWidth;
      window.lwfLoader.stageHeight = stageHeight;
      window.lwfLoader.screenWidth = inputWidth;
      window.lwfLoader.screenHeight = inputHeight;
      window.lwfLoader.resizeMode = 'fitToScreen';
      window.lwfLoader.stageHAlign = 0;
      window.lwfLoader.stageVAlign = -1;

      var headerElement = document.getElementById('header');
      headerElement.style.display = 'none';
    }
  };

  if (!isMobile) {
    setInterval(function(){
      document.getElementById('current_fps').innerHTML = 'Current FPS(avg): ' + window.lwfLoader.getCurrentFPS() + 'fps';
    },1000);
  }

  window.addEventListener('pageshow', onpageshow, false);
}).call(this);