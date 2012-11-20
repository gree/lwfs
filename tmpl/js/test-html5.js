(function() {
     var isFinishing = false;
     var clamp, createStage, playLWF, inPlay, fps, fps0, debug;

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
                  t0 = t1;
                  var d = vsync - ((duration > vsync) ? duration % vsync : duration);
                  var id = window.setTimeout(function() {callback(t1 + d);}, d);
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

     playLWF = function(lwf) {
         if (lwf == null) {
             var err = this.error;
             if (err == null) {
                 err = {
                     reason: 'N/A',
                     url: 'N/A'
                 };
             }
             var elm = document.createElement('div');
             elm.style.fontFamily = 'monospace';
             elm.style.fontSize = 'medium';
             elm.innerHTML
                 = '<p>ERROR: failed to load the lwf.</p>'
                 + '<p>reason: ' + err.reason + '</p>'
                 + '<p>url: ' + err.url + '</p>';
             var lpart = document.getElementById('lpart');
             if (lpart != null) {
                 lpart.appendChild(elm);
             } else {
                 document.body.appendChild(elm);
             }
             return;
         }
         var t0 = window.performance.now();
         var t0_tapped = 0;
         var t1_tapped = window.performance.now();
         var destroy, onexec, onmove, onpress, onrelease, ongestureend, stage;
         var updateInfo1, updateInfo2, updateInfo3;
         var stage_scale0 = 0;
         var stage_scale = 1;
         var stage_w = 0;
         var stage_h = 0;
         inPlay = true;
         fps0 = lwf.frameRate;
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
                 stage_scale = 1;
                 if (window['testlwf_mobile']) {
                     var iw = window.innerWidth;
                     stage_scale = iw / lwf.width;
                 } else {
                     var iw = window.innerWidth - 36;
                     if (iw < 0) {
                         iw = 0;
                     }
                     if (iw < lwf.width) {
                         stage_scale = iw / lwf.width;
                     }
                 }
                 stage_w = ~~(lwf.width * stage_scale);
                 stage_h = ~~(lwf.height * stage_scale);
                 stage.style.width = stage_w + 'px';
                 stage.style.height = stage_h + 'px';
                 stage.width = lwf.width;
                 stage.height = lwf.height;
                 if (window['testlwf_html5target'] == 'webkitcss' && stage_scale != stage_scale0) {
                     lwf.property.clear();
                     lwf.fitForWidth(stage_w, stage_h);
                 }
                 stage_scale0 = stage_scale;
             }
             if (! window['testlwf_mobile']) {
                 updateInfo1();
                 updateInfo2();
                 updateInfo3();
             }
             lwf.setFrameRate(fps);
             if (inPlay) {
                 var t1 = window.performance.now();
                 lwf.exec((t1 - t0) / 1000);
                 lwf.render();
                 t0 = t1;
                 requestAnimationFrame(onexec);
             } else {
                 var dt = ~~((lwf.time + lwf.tick * 1.001) / lwf.tick) * lwf.tick - lwf.time;
                 if (dt == 0) {
                     dt = lwf.tick * 1.001;
                 }
                 lwf.exec(dt);
                 lwf.render();
             }
         };
         onmove = function(e) {
             if (! lwf) {
                 return;
             }
             var x, y;
             if (window['testlwf_mobile']) {
                 var t = e.touches[0];
                 x = t.pageX;
                 y = t.pageY;
             } else {
                 x = e.clientX;
                 y = e.clientY;
             }
             x += document.body.scrollLeft + document.documentElement.scrollLeft - stage.offsetLeft;
             y += document.body.scrollTop + document.documentElement.scrollTop - stage.offsetTop;
             if (window['testlwf_html5target'] != 'webkitcss') {
                 x /= stage_scale;
                 y /= stage_scale;
             }
             lwf.inputPoint(x, y);
             if (window['testlwf_mobile']) {
                 e.preventDefault();
             }
         };
         onpress = function(e) {
             if (! lwf) {
                 return;
             }
             var x, y;
             if (window['testlwf_mobile']) {
                 var t = e.touches[0];
                 x = t.pageX;
                 y = t.pageY;
             } else {
                 x = e.clientX;
                 y = e.clientY;
             }
             x += document.body.scrollLeft + document.documentElement.scrollLeft - stage.offsetLeft;
             y += document.body.scrollTop + document.documentElement.scrollTop - stage.offsetTop;
             if (window['testlwf_html5target'] != 'webkitcss') {
                 x /= stage_scale;
                 y /= stage_scale;
             }
             lwf.inputPoint(x, y);
             lwf.inputPress();
             if (window['testlwf_mobile']) {
                 e.preventDefault();
             }
         };
         onrelease = function(e) {
             if (! lwf) {
                 return;
             }
             lwf.inputRelease();
             if (window['testlwf_mobile']) {
                 e.preventDefault();
             }
             var t2_tapped = window.performance.now();
             if (t2_tapped - t1_tapped < 300 && t1_tapped - t0_tapped < 300) {
                 ongestureend();
             }
             t0_tapped = t1_tapped;
             t1_tapped = t2_tapped;
         };
         ongestureend = function(e) {
             if (! lwf) {
                 return;
             }
             lwf.init();
             lwf.rootMovie.gotoAndPlay(1);
         };
         updateInfo1 = function() {
             var info = '';
             var elm = document.getElementById('info1');
             info = '(x' + (~~(stage_scale * 1000) / 1000) + ', ' + stage_w + 'x' + stage_h + ', ' + fps + 'fps)';
             if (debug) {
                 stats = {
                     max_depth: 0,
                     elements: {}
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
         updateInfo2 = function() {
             var elm = document.getElementById('info2');
             var warning = '';
             if (window['testlwf_commandline'].match(/ -p /)) {
                 warning = 'WARNING: using images extracted from the swf.';
             }
             elm.innerHTML = '<span>(' + window['testlwf_commandline'] + ') </span><span style="background-color:yellow">' + warning + '</span>';
         };
         updateInfo3 = function() {
         };
         var stats;
         var inspector = function(obj, hierarchy, depth, rIndex) {
             stats.elements[obj.constructor.name] = (stats.elements[obj.constructor.name] | 0) + 1;
             stats.max_depth = (depth > stats.max_depth) ? depth : stats.max_depth;
         };
         stage = this['stage'];
         stage.lwf = lwf;
         fps = lwf.frameRate;
         {
             var bgColor = lwf.backgroundColor;
             var r = (bgColor >> 16) & 0xff;
             var g = (bgColor >> 8) & 0xff;
             var b = (bgColor >> 0) & 0xff;
             stage.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
         }
         document.onkeydown = function(e) {
             if (! lwf) {
                 return;
             }
             if (isFinishing) {
                 return;
             }
             if (! fps) {
                 return;
             }
             if (e != null) {
                 // if (e.modifiers || e.ctrlKey || e.shiftKey) {
                 //     return;
                 // }
                 var isHandled = false;
                 var key = String.fromCharCode(e.which).toUpperCase();
                 if (key == '0') {
                     fps = fps0;
                     if (! window['testlwf_mobile']) {
                         updateInfo1();
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
                         lwf.rootMovie.gotoAndPlay(1);
                         isHandled = true;
                         break;
                     case 38:  // up
                         fps = clamp(fps + 1, 1, 60);
                         if (! window['testlwf_mobile']) {
                             updateInfo1();
                         }
                         isHandled = true;
                         break;
                     case 40:  // down
                         fps = clamp(fps - 1, 1, 60);
                         if (! window['testlwf_mobile']) {
                             updateInfo1();
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
         requestAnimationFrame(onexec);
         if (window['testlwf_mobile']) {
             stage.addEventListener('gestureend', ongestureend, false);
             stage.addEventListener('touchmove', onmove, false);
             stage.addEventListener('touchstart', onpress, false);
             stage.addEventListener('touchend', onrelease, false);
         } else {
             stage.addEventListener('mousemove', onmove, false);
             stage.addEventListener('mousedown', onpress, false);
             stage.addEventListener('mouseup', onrelease, false);
         }
     };

     window.onload = function() {
         var ua = navigator.userAgent;
         var stage;
         if (/iPhone/.test(ua) || /iPad/.test(ua) || /Android/.test(ua)) {
             window['testlwf_mobile'] = true;
             stage = createStage();
             stage.style.position = 'fixed';
             stage.style.left = '0px';
             stage.style.top = '0px';
             stage.style.right = '0px';
             stage.style.bottom = '0px';
             document.body.appendChild(stage);
         } else {
             window['testlwf_mobile'] = false;
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
                 lpart.appendChild(div);
             }
             {
                 var div = document.createElement('div');
                 div.className = 'info';
                 div.id = 'info2';
                 lpart.appendChild(div);
             }
             {
                 var div = document.createElement('div');
                 div.className = 'info';
                 div.id = 'info3';
                 debug = (window.location.pathname.match(/-debug\.html$/)) ? 1 : 0;
                 var href = window.location.href;
                 if (debug) {
                     href = href.replace(/-debug\.html$/, '.html');
                 } else {
                     href = href.replace(/\.html$/, '-debug.html');
                 }
                 div.innerHTML
                     = '<div id="info3sub">'
                     + 'SPACE: rewind, S: pause/resume, F: step, UP: increase fps, DOWN: decrease fps, 0: reset fps, ESC: destroy.'
                     + '</div>'
                     + '<div>'
                     + '<a href="' + href + '">' + ((debug) ? '/js_debug/' : '/js/') + window['testlwf_lwfjs'] + '</a> is in use.'
                     + '</div>';
                 lpart.appendChild(div);
             }
             header.appendChild(lpart);
             header.appendChild(rpart);
             wrapper.appendChild(header);
             stage = createStage();
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
         window['testlwf_lwf'].match(/(.*\/)([^\/]+)/);
         return cache.loadLWF({
                                  'prefix': RegExp.$1,
                                  'lwf': RegExp.$2,
                                  'stage': stage,
                                  'onload': playLWF,
                                  'useBackgroundColor': true,
                                  'fitForWidth': true
                              });
     };
 }).call(this);
