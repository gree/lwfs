(function() {
    var isFile = /^file:/.test(window.location.href);
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
    var isPreventDefaultEnabled = isIOS || (isAndroid && /^[34]\./.test(osVersion));
    var isTouchEventEnabled = isMobile;
    var isFinishing = false;
    var isRewinding = false;
    var clamp, i2a, createStage, createFPSDisplay, playLWF, onProgress, inPlay;
    var fr, fr0;
    var fs = 1;
    var ds = 1.0;
    var config = null;
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
    var progressBar = null;
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

    i2a = function(i, n) {
        var s = Array(n + 1).join(' ') + i;
        return s.substr(s.length - n, n);
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
        canvas.id = 'fps_canvas';
        canvas.width = fps.graph.width;
        canvas.height = fps.graph.height;
        canvas.style.width = '' + fps.graph.width + 'px';
        canvas.style.height = '' + fps.graph.height + 'px';
        fps.graph.ctx = canvas.getContext('2d');
        fps.graph.ctx.fillStyle = "rgb(240,240,240)";
        fps.graph.ctx.fillRect(0, 0, fps.graph.width, fps.graph.height);
        div.appendChild(canvas);
        fps.txt = document.createElement('span');
        fps.txt.style.width = '' + (320 - fps.graph.width) + 'px';
        fps.txt.style.height = '' + fps.graph.height + 'px';
        div.appendChild(fps.txt);
        return div;
    };

    playLWF = function(lwf) {
        if (progressBar) {
            progressBar.parentNode.removeChild(progressBar);
            progressBar = null;
        }
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
            elm.className = 'error'
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
        if (! isMobile && window['testlwf_html5target'] == 'webkitcss') {
            stage.style.position = 'static';
        }
        var frame_dt = 0;
        var frame_count = 0;
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
        lwf.rootMovie.moveTo(config.rootoffset.x, config.rootoffset.y);
        destroy = function() {
            if (! lwf) {
                return;
            }
            lwf.destroy();
            lwf = null;
            stage.lwf = null;
            var elm = document.getElementById('usage');
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
            if (isRewinding) {
                isRewinding = false;
                lwf.init();
                lwf.rootMovie.moveTo(config.rootoffset.x, config.rootoffset.y);
                lwf.rootMovie.gotoAndPlay(1);
                iw0 = 0;
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
                    // iw = window.innerWidth - 36;
                    // if (iw < 0) {
                    //     iw = 0;
                    // }
                    // if (iw > lwf.width) {
                    //     iw = lwf.width;
                    // }
                    iw = lwf.width;
                }
                iw *= ((config.ds) ? config.ds : ds);
                if (iw0 != iw) {
                    stage_w = Math.round(iw);
                    stage_h = Math.round(iw * lwf.height / lwf.width);
                    stage.style.width = stage_w + 'px';
                    stage.style.height = stage_h + 'px';
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
                frame_dt += dt;
                if (frame_count % fs == 0) {
                    lwf.exec(frame_dt / 1000);
                    lwf.render();
                    frame_dt = 0;
                }
                frame_count++;
                requestAnimationFrame(onexec);
            } else {
                frame_dt = ~~((lwf.time + lwf.tick * 1.001) / lwf.tick) * lwf.tick - lwf.time;
                if (frame_dt == 0) {
                    frame_dt = lwf.tick * 1.001;
                }
                frame_dt += lwf.tick * (fs - 1);
                frame_dt *= 1000;
                {
                    lwf.exec(frame_dt / 1000);
                    lwf.render();
                    frame_dt = 0;
                }
                frame_count += fs;
            }
            if (! isMobile || mode == 'debug') {
                fps.num01 = Math.round(1000.0 / dt);
                if (++exec_count % 60 == 0) {
                    fps.num60 = Math.round(60000.0 / (t1 - t0_60));
                    t0_60 = t1;
                    exec_count = 0;
                }
                if (fps.txt != null) {
                    var info = '';
                    if (! isMobile && mode == 'debug') {
                        var stats = {
                            max_depth: 0,
                            elements: {}
                        };
                        var inspector = function(obj, hierarchy, depth, rIndex) {
                            stats.elements[obj.constructor.name] = (stats.elements[obj.constructor.name] | 0) + 1;
                            stats.max_depth = (depth > stats.max_depth) ? depth : stats.max_depth;
                        };
                        lwf.inspect(inspector);
                        info += ', #max_depth:' + stats.max_depth;
                        var names = Object.keys(stats.elements);
                        names.sort();
                        for (var i in names) {
                            var n = names[i];
                            info += ', #' + n + ':' + stats.elements[n];
                        }
                    }
                    fps.txt.textContent = i2a(fps.num60, 3) + 'fps(avg)' + info;
                }
                if (fps.graph.ctx != null) {
                    var x = fps.graph.index;
                    var y = (1 - fps.num01 / 60) * (fps.graph.height - 1);
                    y = clamp(y, 0, fps.graph.height - 1);
                    fps.graph.ctx.fillStyle = "rgb(240,240,240)";
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
            if (isTouchEventEnabled) {
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
            if (isTouchEventEnabled) {
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
            isRewinding = true;
        };
        updateInfo = function() {
            var info = '';
            var elm = document.getElementById('info1');
            info = '(x' + ds.toFixed(2) + ', ' + stage_w + 'x' + stage_h + ', ' + fr + 'fps, ' + fs + 'fs)';
            elm.textContent = info;
        };
        stage.lwf = lwf;
        fr = (config.fr) ? config.fr : lwf.frameRate;
        fs = (config.fs) ? config.fs : 1;
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
                        frame_dt = 0;
                        frame_count = 0;
                        t0 = window.performance.now();
                        requestAnimationFrame(onexec);
                    }
                    isHandled = true;
                } else if (key == 'F') {
                    if (! inPlay) {
                        t0 = window.performance.now() - 1000 / 60 * fs;
                        requestAnimationFrame(onexec);
                    }
                    isHandled = true;
                } else if (key == 'D') {
                    if (! config.ds) {
                        if (ds < 1.0) {
                            ds += 0.25;
                        } else {
                            ds = 0.25;
                        }
                        isRewinding = true;
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
                        isRewinding = true;
                        isHandled = true;
                        break;
                    case 37:  // left
                        if (! config.fs) {
                            fs = clamp(fs - 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
                        }
                        break;
                    case 39:  // right
                        if (! config.fs) {
                            fs = clamp(fs + 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
                        }
                        break;
                    case 38:  // up
                        if (! config.fr) {
                            fr = clamp(fr + 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
                        }
                        isHandled = true;
                        break;
                    case 40:  // down
                        if (! config.fr) {
                            fr = clamp(fr - 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
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
        if (isTouchEventEnabled) {
            if (isIOS) {
                stageEventReceiver.addEventListener('gestureend', ongestureend, false);
            }
            stageEventReceiver.addEventListener('touchstart', onpress, false);
            stageEventReceiver.addEventListener('touchmove', onmove, false);
            stageEventReceiver.addEventListener('touchend', onrelease, false);
        } else {
            stageEventReceiver.addEventListener('mousedown', onpress, false);
            stageEventReceiver.addEventListener('mousemove', onmove, false);
            stageEventReceiver.addEventListener('mouseup', onrelease, false);
        }
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
        config = {
            'fr': window['testlwf_config']['fr'],
            'ds': window['testlwf_config']['ds'],
            'rootoffset': window['testlwf_config']['rootoffset']
        };
        if (/fr=([0-9]+)/.test(window.location.search)) {
            config.fr = parseInt(RegExp.$1, 10);
        }
        if (/fs=([0-9]+)/.test(window.location.search)) {
            config.fs = parseInt(RegExp.$1, 10);
        }
        if (/ds=([0-9.]+)/.test(window.location.search)) {
            config.ds = parseFloat(RegExp.$1);
        }
        mode = 'release';
        if (/-debug\.html$/.test(window.location.pathname)) {
            mode = 'debug';
        } else if (/-birdwatcher\.html$/.test(window.location.pathname)) {
            mode = 'birdwatcher';
        }
        if (isMobile) {
            stage = createStage();
            stage.style.position = 'absolute';
            stage.style.left = '0px';
            stage.style.top = '0px';
            stage.style.right = '0px';
            stage.style.bottom = '0px';
            stage.style.zIndex = 0;
            document.body.appendChild(stage);
            progressBar = document.createElement('div')
            progressBar.className = 'info';
            progressBar.style.position = 'absolute';
            progressBar.style.left = '0px';
            progressBar.style.top = '0px';
            progressBar.style.zindex = 5;
            progressBar.textContent = 'loading:   0%';
            document.body.appendChild(progressBar);
            stageEventReceiver = document.createElement('div');
            stageEventReceiver.style.position = 'absolute';
            stageEventReceiver.style.left = '0px';
            stageEventReceiver.style.top = '0px';
            stageEventReceiver.style.right = '0px';
            stageEventReceiver.style.bottom = '0px';
            stageEventReceiver.style.zindex = 10;
            document.body.appendChild(stageEventReceiver);
            if (mode == 'debug') {
                var fps_display = createFPSDisplay();
                fps_display.id = 'fps';
                fps_display.style.position = 'absolute';
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
            var footer = document.createElement('div');
            footer.id = 'footer';
            {
                var qr = document.createElement('span');
                qr.id = 'qr';
                var q = qrcode(8, 'M');
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
                {
                    var span = document.createElement('span');
                    span.id = 'info1';
                    span.textContent = '(x1)';
                    div.appendChild(span);
                }
                if (! config.fr || ! config.ds) {
                    var a = document.createElement('a');
                    a.textContent = '(open with current settings)';
                    a.href = 'javascript:void(0)';
                    a.onclick = function() {
                        window.open(
                            window.location.origin + window.location.pathname
                                + '?fr=' + fr
                                + '?fs=' + fs
                                + '&ds=' + ds,
                            '_blank');
                        return false;
                    };
                    div.appendChild(a);
                }
                lpart.appendChild(div);
            }
            {
                var div = document.createElement('div');
                div.className = 'info';
                var href = decodeURI(window.location.href);
                if (mode == 'release') {
                    href = href.replace(/\.html(|\?.*)$/, '-debug.html$1');
                } else if (mode == 'debug') {
                    href = href.replace(/-debug\.html(|\?.*)$/, '-birdwatcher.html$1');
                } else {
                    href = href.replace(/-birdwatcher\.html(|\?.*)$/, '.html$1');
                }
                var bw = '';
                if (window['testlwf_birdwatcher']) {
                    var birdwatcher = window['testlwf_birdwatcher'];
                    bw
                        = ' see <a href="'
                        + encodeURI(birdwatcher.reportUrl + '#' + birdwatcher.reportId)
                        + '" target="_blank">graphs/logs</a>.';
                }
                div.innerHTML
                    = '<div>current mode: <a href="' + href + '">' + mode + '</a>.' + bw + '</div>';
                lpart.appendChild(div);
            }
            {
                var div = document.createElement('div');
                div.className = 'info';
                var warnings = '';
                if (/ -p /.test(window['testlwf_commandline'])) {
                    warnings = 'images are extracted from the swf.';
                }
                if (window['testlwf_warn']) {
                    if (warnings != '') {
                        warnings += ' ';
                    }
                    warnings += '(<a href="index-warn.html" target="_blank">swf2lwf warnings</a>)';
                }
                div.innerHTML
                    = (warnings != '')
                    ? '<span style="background-color:yellow">warning: ' + warnings + '</span>'
                    : '<span>warning: none.</span>';
                lpart.appendChild(div);
            }
            {
                progressBar = document.createElement('div')
                progressBar.className = 'info';
                progressBar.textContent = 'loading:   0%';
                footer.appendChild(progressBar);
            }
            {
                var div = document.createElement('div');
                div.className = 'info_wrapped';
                div.textContent
                    = 'SPACE: rewind, S: pause/resume, F: step, '
                    + ((config.fr) ? '' : 'DOWN/UP/0: frame rate, ')
                    + ((config.fs) ? '' : 'LEFT/RIGHT: frame step, ')
                    + ((config.ds) ? '' : 'D: scale, ')
                    + 'ESC: destroy.';
                footer.appendChild(div);
            }
            {
                var div = document.createElement('div');
                div.className = 'info_wrapped';
                div.textContent = '(' + window['testlwf_commandline'] + ')';
                footer.appendChild(div);
            }
            {
                var fps_display = createFPSDisplay();
                fps_display.id = 'fps';
                lpart.appendChild(fps_display);
            }
            header.appendChild(lpart);
            header.appendChild(rpart);
            {
                var div = document.createElement('div');
                div.style.clear = 'both';
                div.style.width = '100%';
                header.appendChild(div);
            }
            wrapper.appendChild(header);
            stageEventReceiver = stage = createStage();
            wrapper.appendChild(stage);
            wrapper.appendChild(footer);
            document.body.appendChild(wrapper);
        }
        var LWF = window['LWF'];
        /(.*\/)([^\/]+)/.test(window['testlwf_lwf']);
        var params = {
            'prefix': RegExp.$1,
            'lwf': RegExp.$2 + ((isFile) ? '.js' : ''),
            'stage': stage,
            'onload': playLWF,
            'useBackgroundColor': true,
            'fitForWidth': true,
            'onprogress': onProgress
        };
        if (isAndroid && /^(4\.0|[32]\.)/.test(osVersion)) {
            params['use3D'] = false;
        }
        if (! (isAndroid && /^4\.0/.test(osVersion)) && ! isFile) {
            params['worker'] = true;
        } else {
            params['worker'] = false;
            var defs = [
                'WebkitCSSResourceCache',
                'CanvasResourceCache',
                'WebGLResourceCache'
            ];
            for (var i in defs) {
                var c = LWF[defs[i]];
                if (c) {
                    var loadLWF = c.prototype.loadLWF;
                    c.prototype.loadLWF = function(settings) {
                        settings['worker'] = false;
                        if (isFile) {
                            settings['lwf'] = settings['lwf'].replace(/\.lwf$/, '.lwf.js');
                        }
                        loadLWF.call(this, settings);
                    };
                }
            }
        }
        if (window['testlwf_settings'] != null) {
            var settings = window['testlwf_settings'];
            for (var i in settings) {
                params[i] = settings[i];
            }
        }
        if (window['testlwf_html5target'] == 'webkitcss') {
            LWF.useWebkitCSSRenderer();
        } else if (window['testlwf_html5target'] == 'canvas') {
            LWF.useCanvasRenderer();
        } else if (window['testlwf_html5target'] == 'webgl') {
            LWF.useWebGLRenderer();
        }
        return LWF.ResourceCache.get().loadLWF(params);
    };
}).call(this);
