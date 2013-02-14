(function() {
     var ua = navigator.userAgent;
     var isIOS = /(iPhone|iPad)/.test(ua);
     var isAndroid = /Android/.test(ua);
     var osVersion = 'unknown';
     if (isIOS) {
         var i = ua.indexOf('OS ');
         if (i > -1) {
             osVersion = ua.substr(i + 3, 3).replace( '_', '.' );
         }
     } else if (isAndroid) {
         var i = ua.indexOf('Android ');
         if (i > -1) {
             osVersion = ua.substr(i + 8, 3);
         }
     }
     var isMobile = isIOS || isAndroid;
     var isPreventDefaultEnabled = isIOS || (isAndroid && /^[43]\.0/.test(osVersion));
     var isFinishing = false;
     var clamp, createStage, createFPSDisplay, playLWF, inPlay, fr, fr0;
     var mode = 'release';
     var fps = {
         num01: 0,
         num60: 0,
         txt: null,
         graph: {
             ctx: null,
             index: 0,
             x: 0,
             y: 0,
             width: 220,
             height: 24
         }
     };
     var stage = null;
     var stageEventReceiver = null;

     window.performance = window.performance || {};
     window.performance.now
         = window.performance.now
         || window.performance.webkitNow
         || window.performance.mozNow
         || window.performance.oNow
         || window.performance.msNow
         || Date.now;

     window.requestAnimationFrame
         = window.requestAnimationFrame
         || window.webkitRequestAnimationFrame
         || window.mozRequestAnimationFrame
         || window.oRequestAnimationFrame
         || window.msRequestAnimationFrame;
     if (window.requestAnimationFrame == null) {
         (function() {
              var vsync = 1000 / 60;
              var t0 = window.performance.now();
              window.requestAnimationFrame = function(callback, element) {
                  var t1 = window.performance.now();
                  var duration = t1 - t0;
                  var d = vsync - ((duration > vsync) ? duration % vsync : duration);
                  var id = window.setTimeout(function() {t0 = window.performance.now(); callback(t1 + d);}, d);
                  return id;
              };
          })();
     }

     clamp = function(x, a, b) {
         if (x < a) {
             return a;
         } else if (x > b) {
             return b;
         } else {
             return x;
         }
     };

     createStage = function() {
         var stage;
         if (window['testlwf_html5target'] == 'webkitcss') {
             stage = document.createElement('div');
         } else if (window['testlwf_html5target'] == 'canvas') {
             stage = document.createElement('canvas');
         } else if (window['testlwf_html5target'] == 'webgl') {
             stage = document.createElement('canvas');
         }
         stage.id = 'stage';
         stage.width = stage.height = 0;
         return stage;
     };

     createFPSDisplay = function() {
         var div = document.createElement('div');
         div.className = 'info';
         div.style.backgroundColor = '#ffffff';
         div.style.opacity = '1';
         var canvas = document.createElement('canvas');
         canvas.width = fps.graph.width;
         canvas.height = fps.graph.height;
         canvas.style.width = '' + fps.graph.width + 'px';
         canvas.style.height = '' + fps.graph.height + 'px';
         fps.graph.ctx = canvas.getContext('2d');
         div.appendChild(canvas);
         fps.txt = document.createElement('span');
         fps.txt.style.width = '' + (320 - fps.graph.width) + 'px';
         fps.txt.style.height = '' + fps.graph.height + 'px';
         div.appendChild(fps.txt);
         return div;
     };

     playLWF = function(lwf) {
         if (lwf == null) {
             var err = this.error;
             if (err == null) {
                 err = [
                     {
                         reason: 'N/A',
                         url: 'N/A'
                     }
                 ];
             }
             var elm = document.createElement('div');
             elm.style.color = 'red';
             elm.style.fontFamily = 'monospace';
             elm.style.fontSize = 'medium';
             var msg = '<p>ERROR: failed to load the lwf.</p>';
             for (var i in err) {
                 var e = err[i];
                 msg += '<p>reason: ' + e.reason + ' (' + e.url + ')</p>';
             }
             elm.innerHTML = msg;
             var lpart = document.getElementById('lpart');
             if (lpart != null) {
                 lpart.appendChild(elm);
             } else {
                 document.body.appendChild(elm);
             }
             return;
         }
         var exec_count = 0;
         var t0 = window.performance.now();
         var t0_60 = t0;
         var destroy, onexec, onmove, onpress, onrelease, ongestureend;
         var updateInfo;
         var iw0 = 0;
         var stage_scale = 1;
         var stage_w = 0;
         var stage_h = 0;
         inPlay = true;
         fr0 = lwf.frameRate;
         lwf.rootMovie.moveTo(window['testlwf_rootoffset']['x'], window['testlwf_rootoffset']['y']);
         destroy = function() {
             if (! lwf) {
                 return;
             }
             lwf.destroy();
             lwf = null;
             stage.lwf = null;
             var elm = document.getElementById('info3sub');
             elm.innerHTML = '<span style="background-color:yellow">The LWF instance is destroyed. Please reload if you want to play it again.</span>';
         };
         onexec = function() {
             if (! lwf) {
                 return;
             }
             if (isFinishing) {
                 destroy();
                 return;
             }
             {
                 var dpr = window.devicePixelRatio;
                 if (window['testlwf_html5target'] == 'webkitcss') {
                     dpr = 1;
                 }
                 var iw;
                 if (isMobile) {
                     iw = window.innerWidth;
                 } else {
                     iw = window.innerWidth - 36;
                     if (iw < 0) {
                         iw = 0;
                     }
                     if (iw > lwf.width) {
                         iw = lwf.width;
                     }
                 }
                 if (iw0 != iw) {
                     stage_w = Math.round(iw);
                     stage_h = Math.round(iw * lwf.height / lwf.width);
                     stage.style.width = stage_w + 'px';
                     stage.style.height = stage_h + 'px';
                     if (isMobile) {
                         stageEventReceiver.style.width = stage_w + 'px';
                         stageEventReceiver.style.height = stage_h + 'px';
                     }
                     stage.width = Math.round(stage_w * dpr);
                     stage.height = Math.round(stage_h * dpr);
                     stage_scale = stage_w / stage.width;
                     lwf.property.clear();
                     lwf.fitForWidth(stage.width, stage.height);
                     iw0 = iw;
                 }
             }
             if (! isMobile) {
                 updateInfo();
             }
             lwf.setFrameRate(fr);
             var t1 = window.performance.now();
             var dt = t1 - t0;
             t0 = t1;
             if (inPlay) {
                 var lwf_dt = dt;
                 lwf.exec(lwf_dt / 1000);
                 lwf.render();
                 requestAnimationFrame(onexec);
             } else {
                 var lwf_dt = ~~((lwf.time + lwf.tick * 1.001) / lwf.tick) * lwf.tick - lwf.time;
                 if (lwf_dt == 0) {
                     lwf_dt = lwf.tick * 1.001;
                 }
                 lwf.exec(lwf_dt);
                 lwf.render();
             }
             if (! isMobile || mode == 'debug') {
                 fps.num01 = Math.round(1000.0 / dt);
                 if (++exec_count % 60 == 0) {
                     fps.num60 = Math.round(60000.0 / (t1 - t0_60));
                     t0_60 = t1;
                     exec_count = 0;
                 }
                 if (fps.txt != null) {
                     fps.txt.textContent = '' + fps.num60 + 'fps(avg) ';
                 }
                 if (fps.graph.ctx != null) {
                     var x = fps.graph.index;
                     var y = (1 - fps.num01 / 60) * (fps.graph.height - 1);
                     y = clamp(y, 0, fps.graph.height - 1);
                     fps.graph.ctx.fillStyle = "rgb(255,255,255)";
                     fps.graph.ctx.fillRect(fps.graph.x, 0, 2, fps.graph.height);
                     fps.graph.ctx.fillStyle = "rgb(0,0,0)";
                     fps.graph.ctx.beginPath();
                     fps.graph.ctx.moveTo(fps.graph.x, fps.graph.y);
                     fps.graph.ctx.lineTo(x, y);
                     fps.graph.ctx.stroke();
                     fps.graph.x = x;
                     fps.graph.y = y;
                     fps.graph.index += 2;
                     if (fps.graph.index > fps.graph.width) {
                         fps.graph.index = 0;
                         fps.graph.x = 0;
                     }
                 }
             }
         };
         onmove = function(e) {
             if (isPreventDefaultEnabled) {
                 e.preventDefault();
             }
             if (! lwf) {
                 return;
             }
             var x, y;
             if (isMobile) {
                 var t = e.touches[0];
                 x = t.pageX;
                 y = t.pageY;
             } else {
                 x = e.clientX;
                 y = e.clientY;
             }
             x += document.body.scrollLeft + document.documentElement.scrollLeft - stage.offsetLeft;
             y += document.body.scrollTop + document.documentElement.scrollTop - stage.offsetTop;
             x /= stage_scale;
             y /= stage_scale;
             lwf.inputPoint(x, y);
         };
         onpress = function(e) {
             if (isPreventDefaultEnabled) {
                 e.preventDefault();
             }
             if (! lwf) {
                 return;
             }
             var x, y;
             if (isMobile) {
                 var t = e.touches[0];
                 x = t.pageX;
                 y = t.pageY;
             } else {
                 x = e.clientX;
                 y = e.clientY;
             }
             x += document.body.scrollLeft + document.documentElement.scrollLeft - stage.offsetLeft;
             y += document.body.scrollTop + document.documentElement.scrollTop - stage.offsetTop;
             x /= stage_scale;
             y /= stage_scale;
             lwf.inputPoint(x, y);
             lwf.inputPress();
         };
         onrelease = function(e) {
             if (isPreventDefaultEnabled) {
                 e.preventDefault();
             }
             if (! lwf) {
                 return;
             }
             lwf.inputRelease();
         };
         ongestureend = function(e) {
             if (! lwf) {
                 return;
             }
             lwf.init();
             lwf.rootMovie.moveTo(window['testlwf_rootoffset']['x'], window['testlwf_rootoffset']['y']);
             lwf.rootMovie.gotoAndPlay(1);
         };
         updateInfo = function() {
             var info = '';
             var elm = document.getElementById('info1');
             info = '(x' + (~~(stage_scale * 1000) / 1000) + ', ' + stage_w + 'x' + stage_h + ', ' + fr + 'fps)';
             if (mode == 'debug') {
                 var stats = {
                     max_depth: 0,
                     elements: {}
                 };
                 var inspector = function(obj, hierarchy, depth, rIndex) {
                     stats.elements[obj.constructor.name] = (stats.elements[obj.constructor.name] | 0) + 1;
                     stats.max_depth = (depth > stats.max_depth) ? depth : stats.max_depth;
                 };
                 lwf.inspect(inspector);
                 info += '  #max_depth:' + stats.max_depth;
                 var names = Object.keys(stats.elements);
                 names.sort();
                 for (var i in names) {
                     var n = names[i];
                     info += ', #' + n + ':' + stats.elements[n];
                 }
             }
             elm.textContent = info;
         };
         stage.lwf = lwf;
         fr = lwf.frameRate;
         {
             var bgColor = lwf.backgroundColor;
             var r = (bgColor >> 16) & 0xff;
             var g = (bgColor >> 8) & 0xff;
             var b = (bgColor >> 0) & 0xff;
             stage.style.backgroundColor = 'rgba(' + r + ',' + g + ',' + b + ',1)';
         }
         document.onkeydown = function(e) {
             if (! lwf) {
                 return;
             }
             if (isFinishing) {
                 return;
             }
             if (! fr) {
                 return;
             }
             if (e != null) {
                 // if (e.modifiers || e.ctrlKey || e.shiftKey) {
                 //     return;
                 // }
                 var isHandled = false;
                 var key = String.fromCharCode(e.which).toUpperCase();
                 if (key == '0') {
                     fr = fr0;
                     if (! isMobile) {
                         updateInfo();
                     }
                     isHandled = true;
                 } else if (key == 'S') {
                     inPlay = ! inPlay;
                     if (inPlay) {
                         t0 = window.performance.now();
                         requestAnimationFrame(onexec);
                     }
                     isHandled = true;
                 } else if (key == 'F') {
                     if (! inPlay) {
                         t0 = window.performance.now() - 1000 / 60;
                         requestAnimationFrame(onexec);
                     }
                     isHandled = true;
                 } else {
                     switch (e.which) {
                     case 27:  // escape
                         isFinishing = true;
                         if (! inPlay) {
                             destroy();
                         }
                         break;
                     case 32:  // space
                         lwf.init();
                         lwf.rootMovie.moveTo(window['testlwf_rootoffset']['x'], window['testlwf_rootoffset']['y']);
                         lwf.rootMovie.gotoAndPlay(1);
                         isHandled = true;
                         break;
                     case 38:  // up
                         fr = clamp(fr + 1, 1, 60);
                         if (! isMobile) {
                             updateInfo();
                         }
                         isHandled = true;
                         break;
                     case 40:  // down
                         fr = clamp(fr - 1, 1, 60);
                         if (! isMobile) {
                             updateInfo();
                         }
                         isHandled = true;
                         break;
                     }
                 }
                 if (isHandled) {
                     e.preventDefault();
                     e.stopPropagation();
                 }
             }
         };
         if (window['testlwf_birdwatcher']) {
             var birdwatcher = window['testlwf_birdwatcher'];
             if (birdwatcher['iid']) {
                 clearInterval(birdwatcher['iid']);
                 birdwatcher['iid'] = null;
             }
             if (birdwatcher['instance']) {
                 birdwatcher['instance'].stop();
                 birdwatcher['instance'] = null;
             }
             if (lwf.functions) {
                 window['functions'] = lwf.functions;
             }
             birdwatcher['instance'] = new BirdWatcher([['LWF'], ['functions']]);
             var bw = birdwatcher['instance'];
             bw.reportUrl = birdwatcher['reportUrl'];
             bw.reportId = birdwatcher['reportId'];
             bw.stop();
             bw.enableRemoteLog();
             bw.maxDepth = 8;
             bw.start();
             birdwatcher['iid'] = setInterval(function() {bw.reportRemote();}, 1000);
         };
         requestAnimationFrame(onexec);
         if (isMobile) {
             if (isIOS) {
                 stageEventReceiver.addEventListener('gestureend', ongestureend, false);
             }
             stageEventReceiver.addEventListener('touchmove', onmove, false);
             stageEventReceiver.addEventListener('touchstart', onpress, false);
             stageEventReceiver.addEventListener('touchend', onrelease, false);
         } else {
             stageEventReceiver.addEventListener('mousemove', onmove, false);
             stageEventReceiver.addEventListener('mousedown', onpress, false);
             stageEventReceiver.addEventListener('mouseup', onrelease, false);
         }
     };

     window.onpagehide = function() {
         if (stage != null) {
             if (stage.lwf != null) {
                 stage.lwf.destroy();
             }
         }
         var names = ['fps', ((isMobile) ? 'stage' : 'wrapper')];
         for (var i in names) {
             var elm = document.getElementById(names[i]);
             if (elm != null) {
                 elm.parentNode.removeChild(elm);
                 elm = null;
             }
         }
     };
     window.onpageshow = function() {
         mode = 'release';
         if (/-debug\.html$/.test(window.location.pathname)) {
             mode = 'debug';
         } else if (/-birdwatcher\.html$/.test(window.location.pathname)) {
             mode = 'birdwatcher';
         }
         if (isMobile) {
             stage = createStage();
             stage.style.position = 'fixed';
             stage.style.left = '0px';
             stage.style.top = '0px';
             stage.style.right = '0px';
             stage.style.bottom = '0px';
             stage.style.zIndex = 0;
             document.body.appendChild(stage);
             stageEventReceiver = document.createElement('div');
             stageEventReceiver.style.position = 'fixed';
             stageEventReceiver.style.left = '0px';
             stageEventReceiver.style.top = '0px';
             stageEventReceiver.style.right = '0px';
             stageEventReceiver.style.bottom = '0px';
             stageEventReceiver.style.zIndex = 10;
             document.body.appendChild(stageEventReceiver);
             if (mode == 'debug') {
                 var fps_display = createFPSDisplay();
                 fps_display.id = 'fps';
                 fps_display.style.position = 'fixed';
                 fps_display.style.left = '0px';
                 fps_display.style.top = '32px';
                 fps_display.style.zIndex = 10000;
                 document.body.appendChild(fps_display);
             }
         } else {
             var wrapper = document.createElement('div');
             wrapper.id = 'wrapper';
             var header = document.createElement('div');
             header.id = 'header';
             var lpart = document.createElement('div');
             lpart.id = 'lpart';
             var rpart = document.createElement('div');
             rpart.id = 'rpart';
             {
                 var qr = document.createElement('span');
                 qr.id = 'qr';
                 var q = qrcode(7, 'L');
                 q.addData(window.location.href);
                 q.make();
                 qr.innerHTML = q.createImgTag();
                 rpart.appendChild(qr);
             }
             {
                 var h1 = document.createElement('h1');
                 h1.textContent = document.title;
                 lpart.appendChild(h1);
             }
             {
                 var div = document.createElement('div');
                 div.className = 'info';
                 div.id = 'info1';
                 div.textContent = '(x1)';
                 lpart.appendChild(div);
             }
             {
                 var div = document.createElement('div');
                 div.className = 'info';
                 div.id = 'info2';
                 var warning = '';
                 if (/ -p /.test(window['testlwf_commandline'])) {
                     warning = 'WARNING: using images extracted from the swf.';
                 }
                 if (window['testlwf_warn']) {
                     if (warning != '') {
                         warning += ' ';
                     }
                     warning += '(<a href="index-warn.html" target="_blank">swf2lwf warnings</a>)';
                 }
                 div.innerHTML = '<span>(' + window['testlwf_commandline'] + ') </span><span style="background-color:yellow">' + warning + '</span>';
                 lpart.appendChild(div);
             }
             {
                 var div = document.createElement('div');
                 div.className = 'info';
                 div.id = 'info3';
                 var href = decodeURI(window.location.href);
                 if (mode == 'release') {
                     href = href.replace(/\.html$/, '-debug.html');
                 } else if (mode == 'debug') {
                     href = href.replace(/-debug\.html$/, '-birdwatcher.html');
                 } else {
                     href = href.replace(/-birdwatcher\.html$/, '.html');
                 }
                 var bw = '';
                 if (window['testlwf_birdwatcher']) {
                     var birdwatcher = window['testlwf_birdwatcher'];
                     bw
                         = ' see <a href="'
                         + encodeURI(birdwatcher.reportUrl + '#' + birdwatcher.reportId)
                         + '" target="_blank">graphs/logs</a>.';
                 } else {
                     bw
                         = '';
                 }
                 div.innerHTML
                     = '<div id="info3sub">'
                     + 'SPACE: rewind, S: pause/resume, F: step, UP: increase fps, DOWN: decrease fps, 0: reset fps, ESC: destroy.'
                     + '</div>'
                     + '<div>'
                     + '<div>current mode: <a href="' + href + '">' + mode + '</a>.'
                     + bw
                     + '</div>';
                 lpart.appendChild(div);
             }
             header.appendChild(lpart);
             header.appendChild(rpart);
             wrapper.appendChild(header);
             var fps_display = createFPSDisplay();
             wrapper.appendChild(fps_display);
             stageEventReceiver = stage = createStage();
             wrapper.appendChild(stage);
             document.body.appendChild(wrapper);
         }
         var LWF, cache;
         LWF = window['LWF'];
         if (window['testlwf_html5target'] == 'webkitcss') {
             LWF.useWebkitCSSRenderer();
         } else if (window['testlwf_html5target'] == 'canvas') {
             LWF.useCanvasRenderer();
         } else if (window['testlwf_html5target'] == 'webgl') {
             LWF.useWebGLRenderer();
         }
         cache = LWF.ResourceCache.get();
         /(.*\/)([^\/]+)/.test(window['testlwf_lwf']);
         var params = {
             'prefix': RegExp.$1,
             'lwf': RegExp.$2,
             'stage': stage,
             'onload': playLWF,
             'useBackgroundColor': true,
             'fitForWidth': true,
             'worker': ! (isAndroid && /^4\.0/.test(osVersion))
         };
         if (window['testlwf_settings'] != null) {
             var settings = window['testlwf_settings'];
             for (var i in settings) {
                 params[i] = settings[i];
             }
         }
         return cache.loadLWF(params);
     };
 }).call(this);
