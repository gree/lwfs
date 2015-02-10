(function() {
    var isFile = /^file:/.test(window.location.href);
    var ua = navigator.userAgent;
    var isIOS = /(iPhone|iPad|iPod touch)/.test(ua);
    var isAndroid = /Android/.test(ua);
    var isChrome = /Chrome/.test(ua);
    var isBuggyClearRect = (isAndroid && / (SC-0|Galaxy Nexus|SH-0|SCL21)/.test(ua));
    var isBuggyWebGL = (isAndroid && ! isChrome && window['testlwf_html5target'] == 'webgl');
    var isBuggyTouchEvent = (isAndroid && (isChrome || / SC-0/.test(ua)));
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
    var clamp, i2a, createStage, playLWF, onProgress, inPlay;
    var fr0;
    var fr = 0;
    var fs = 1;
    var ds = 1.0;
    var ss = {
        w: 0,
        h: 0
    };
    var ac = false;
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
    var stage = null;
    var stageEventReceiver = null;
    var stageWrapper = null;
    var progressBar = null;
    var stage_scale = 1;
    var stage_w = 0;
    var stage_h = 0;

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
        return stage;
    };

    var Stats = (function() {
        var MARGIN_SCALE = 1.2;
        function Stats(w, h, m) {
            this.w = w;
            this.h = h;
            this.m = m;
            this.i = 0;
            this.data = [];
            if (m) {
                this.max = m * MARGIN_SCALE;
            } else {
                this.max = 60 * MARGIN_SCALE;
            }
            this.div = document.createElement('div');
            this.div.className = 'info';
            this.div.style.backgroundColor = '#ffffff';
            this.div.style.opacity = '1';
            if (! isMobile || window['testlwf_statsdisplay']['graph']) {
                this.canvas = document.createElement('canvas');
                this.canvas.className = 'graph';
                //this.canvas.width = Math.round(w * window.devicePixelRatio);
                this.canvas.width = w;
                //this.canvas.height = Math.round(h * window.devicePixelRatio);
                this.canvas.height = h;
                this.canvas.style.width = w + 'px';
                this.canvas.style.height = h + 'px';
                this.ctx = this.canvas.getContext('2d');
                this.ctx.lineWidth = 1;
                this.ctx.fillStyle = 'rgb(240,240,240)';
                this.ctx.fillRect(0, 0, w, h);
                this.div.appendChild(this.canvas);
            }
            if (! isMobile || window['testlwf_statsdisplay']['text']) {
                this.txt = document.createElement('span');
                this.txt.style.width = (320 - w) + 'px';
                this.txt.style.height = h + 'px';
                this.div.appendChild(this.txt);
            }
        }
        Stats.prototype.update = function(v, t) {
            if (this.canvas) {
                this.data[this.i] = v;
                if (this.i == 0) {
                    this.i++;
                    return;
                }
                var i0 = this.i - 1;
                var i1 = this.i;
                this.i++;
                if (! this.m) {
                    var max = Math.max(v * MARGIN_SCALE, this.max);
                    if (this.max != max) {
                        this.max = max;
                        i0 = 0;
                    }
                }
                var x0 = i0 * 2;
                var y0 = (1 - this.data[i0] / this.max) * (this.h - 1);
                var x1 = 0;
                var y1 = 0;
                this.ctx.fillStyle = 'rgb(240,240,240)';
                this.ctx.fillRect(x0, 0, (i1 - i0) * 2, this.h);
                this.ctx.fillStyle = 'rgb(0,0,0)';
                this.ctx.beginPath();
                this.ctx.moveTo(x0, y0);
                for (var i = i0 + 1; i <= i1; i++) {
                    x1 = i * 2;
                    y1 = (1 - this.data[i] / this.max) * (this.h - 1);
                    this.ctx.lineTo(x1, y1);
                }
                if (x1 < this.w) {
                    this.ctx.moveTo(x1 + 2, 0);
                    this.ctx.lineTo(x1 + 2, this.h - 1);
                }
                this.ctx.stroke();
                if (x1 >= this.w) {
                    this.i = 0;
                }
            }
            if (this.txt) {
                this.txt.textContent = t;
            }
        };
        return Stats;
    })();

    playLWF = function(lwf) {
        if (progressBar) {
            progressBar.parentNode.removeChild(progressBar);
            progressBar = null;
        }
        if (stageWrapper) {
            stageWrapper.style.visibility = 'visible';
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
            elm.className = 'error';
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
        var frame_dt = 0;
        var frame_count = 0;
        var exec_count = 0;
        var t0 = window.performance.now();
        var t0_60 = t0;
        var destroy, onexec, onmove, onpress, onrelease, ongestureend;
        var updateInfo;
        var iw0 = 0;
        var ih0 = 0;
        inPlay = true;
        fr0 = lwf.frameRate;
        lwf.rootMovie.moveTo(config.rootoffset.x, config.rootoffset.y);

        // initialize the lwf-loader instance for the latter usage
        if (!lwf.privateData) {
          lwf.privateData = {};
        }
        lwf.privateData.lwfLoader = new window.LwfLoader();

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
                ih0 = 0;
            }
            {
                var dpr = window.devicePixelRatio;
                if (window['testlwf_html5target'] == 'webkitcss') {
                    dpr = 1;
                }
                var iw, ih;
                if (ss.w && ss.h) {
                    iw = ss.w;
                    ih = ss.h;
                } else if (isMobile) {
                    iw = window.innerWidth;
                    ih = window.innerHeight + ((isAndroid) ? 1 : 0);
                } else {
                    iw = lwf.width;
                    ih = iw * lwf.height / lwf.width;
                }
                iw *= ds;
                ih *= ds;
                var mx = 0;
                var my = 0;
                if (iw0 != iw || ih0 != ih) {
                    iw0 = iw;
                    ih0 = ih;
                    if (! isBuggyWebGL) {
                        iw = Math.round(iw);
                        ih = Math.round(ih);
                        if (stageWrapper) {
                            stageWrapper.style.width = iw + 'px';
                            stageWrapper.style.height = ih + 'px';
                        }
                        var s = Math.min(iw / lwf.width, ih / lwf.height);
                        stage_w = Math.round(lwf.width * s);
                        stage_h = Math.round(lwf.height * s);
                        var ox = 0;
                        if (config.stage.halign == -1) {
                            ox = 0;
                        } else if (config.stage.halign == 1) {
                            ox = Math.round(iw - stage_w);
                        } else {
                            ox = Math.round((iw - stage_w) / 2);
                        }
                        var oy = 0;
                        if (config.stage.valign == -1) {
                            oy = 0;
                        } else if (config.stage.valign == 1) {
                            oy = Math.round(ih - stage_h);
                        } else {
                            oy = Math.round((ih - stage_h) / 2);
                        }
                        if (config.stage.elastic) {
                            stage_w = iw;
                            stage_h = ih;
                            mx = ox;
                            my = oy;
                            ox = 0;
                            oy = 0;
                        }
                        stage.style.left = ox + 'px';
                        stage.style.top = oy + 'px';
                        stage.style.width = stage_w + 'px';
                        stage.style.height = stage_h + 'px';
                        stageEventReceiver.style.left = ox + 'px';
                        stageEventReceiver.style.top = oy + 'px';
                        stageEventReceiver.style.width = stage_w + 'px';
                        stageEventReceiver.style.height = stage_h + 'px';
                        stage.width = Math.round(stage_w * dpr);
                        stage.height = Math.round(stage_h * dpr);
                        stage_scale = stage_w / stage.width;
                        if (ac) {
                            lwf.rootMovie.moveTo(stage.width / 2, stage.height / 2);
                        }
                    }
                    lwf.property.clear();
                    if (stage_h / stage_w >= lwf.height / lwf.width) {
                        lwf.fitForWidth(stage.width, stage.height);
                    } else {
                        lwf.fitForHeight(stage.width, stage.height);
                    }
                    if (config.stage.elastic) {
                        lwf.property.moveTo(mx, my);
                    }
                    if (window['testlwf_html5target'] == 'webkitcss') {
                        lwf.setTextScale(window.devicePixelRatio);
                    }
                    if (isMobile && window['testlwf_html5target'] != 'native') {
                        if (isIOS) {
                            window.scrollTo(0, 0);
                        } else if (isAndroid) {
                            window.scrollTo(0, 1);
                        }
                    }
                }
            }
            if (! isMobile) {
                updateInfo();
            }
            if (fr) {
                lwf.setFrameRate(fr);
            }
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
                if (dps.stats) {
                    dps.num01 = lwf.rendererFactory.drawCalls;
                    dps.numi += dps.num01;
                }
                if (++exec_count % 60 == 0) {
                    fps.num60 = Math.round(60000.0 / (t1 - t0_60));
                    if (dps.stats) {
                        dps.num60 = Math.round(dps.numi / 60);
                        dps.numi = 0;
                    }
                    t0_60 = t1;
                    exec_count = 0;
                }
                if (fps.stats) {
                    var info = '';
                    if (! isMobile && mode == 'debug') {
                        var stats = {
                            max_depth: 0,
                            elements: {}
                        };
                        var activeHierarchy = -1;
                        var inspector = function(obj, hierarchy, depth, rIndex) {
                            if (obj.constructor.name == 'Movie') {
                                if (! obj.active) {
                                    if (activeHierarchy == -1) {
                                        activeHierarchy = hierarchy;
                                    }
                                } else {
                                    if (hierarchy <= activeHierarchy) {
                                        activeHierarchy = -1;
                                    }
                                }
                            }
                            stats.elements[obj.constructor.name]
                                = (stats.elements[obj.constructor.name] | 0)
                                + ((activeHierarchy == -1) ? 1 : 0);
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
                    fps.stats.update(fps.num01, i2a(fps.num60, 3) + 'fps(avg)' + info);
                }
                if (dps.stats) {
                    dps.stats.update(dps.num01, i2a(dps.num60, 3) + ' drawCalls(avg)');
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
            var r = stage.getBoundingClientRect();
            x -= r.left;
            y -= r.top;
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
            var r = stage.getBoundingClientRect();
            x -= r.left;
            y -= r.top;
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
            var lwfstats = window['testlwf_lwfstats'];
            var info = '';
            var elm = document.getElementById('info1');
            var fps = (lwf) ? lwf.frameRate : 0;
            info = '(format: ' + lwfstats['format_version'] + ')' + '(x' + ds.toFixed(2) + ', ' + stage_w + 'x' + stage_h + ', ' + fps + 'fps, ' + fs + 'fs, ' + 'centering: ' + ((ac) ? 'on' : 'off') + ')';
            elm.textContent = info;
        };
        stage.lwf = lwf;
        if (window['testlwf_html5target'] == 'webgl') {
            stage.style.backgroundColor = 'black';
        } else {
            var bgColor = lwf.backgroundColor;
            var a = (bgColor >> 24) & 0xff;
            var r = (bgColor >> 16) & 0xff;
            var g = (bgColor >> 8) & 0xff;
            var b = (bgColor >> 0) & 0xff;
            // stage.style.backgroundColor = 'rgba(' + r + ',' + g + ',' + b + ',' + (a / 255) + ')';
            stage.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
            if (stageWrapper) {
                stageWrapper.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
            }
        }
        document.onkeydown = function(e) {
            if (! lwf) {
                return;
            }
            if (isFinishing) {
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
                    if (isConfigurable) {
                        if (ds < 2.0) {
                            ds += 0.25;
                        } else {
                            ds = 0.25;
                        }
                        isRewinding = true;
                    }
                    isHandled = true;
                } else if (key == 'O') {
                    if (isConfigurable) {
                        ac = ! ac;
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
                        if (isConfigurable) {
                            fs = clamp(fs - 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
                        }
                        break;
                    case 39:  // right
                        if (isConfigurable) {
                            fs = clamp(fs + 1, 1, 60);
                            if (! isMobile) {
                                updateInfo();
                            }
                        }
                        break;
                    case 38:  // up
                        if (isConfigurable) {
                            if (! fr) {
                                fr = lwf.frameRate;
                            }
                            fr = clamp(fr + 1, 1, 60);
                            if (! isMobile) {
                                lwf.setFrameRate(fr);
                                updateInfo();
                            }
                        }
                        isHandled = true;
                        break;
                    case 40:  // down
                        if (isConfigurable) {
                            if (! fr) {
                                fr = lwf.frameRate;
                            }
                            fr = clamp(fr - 1, 1, 60);
                            if (! isMobile) {
                                lwf.setFrameRate(fr);
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
            if (isBuggyTouchEvent) {
                // cf. http://stackoverflow.com/questions/16703157/android-4-chrome-hit-testing-issue-on-touch-events-after-css-transform
                document.body.addEventListener('touchstart', function() {});
            }
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

    var onpagehide = function() {
        if (stage != null) {
            if (stage.lwf != null) {
                stage.lwf.destroy();
            }
        }
        var names = ['fps', ((isMobile) ? 'stage' : 'wrapper'), 'strut'];
        for (var i in names) {
            var elm = document.getElementById(names[i]);
            if (elm != null) {
                elm.parentNode.removeChild(elm);
                elm = null;
            }
        }
    };
    var onpageshow = function() {
        if (/[?&]fr=([0-9]+)/.test(window.location.search)) {
            config.fr = parseInt(RegExp.$1, 10);
            isConfigurable = false;
        }
        if (/[?&]fs=([0-9]+)/.test(window.location.search)) {
            config.fs = parseInt(RegExp.$1, 10);
            isConfigurable = false;
        }
        if (/[?&]ds=([0-9.]+)/.test(window.location.search)) {
            config.ds = parseFloat(RegExp.$1);
            isConfigurable = false;
        }
        if (/[?&]ac=(true|false)/.test(window.location.search)) {
            config.ac = (RegExp.$1 == 'true');
            isConfigurable = false;
        }
        if (/[?&]ss=([0-9.]+)x([0-9.]+)/.test(window.location.search)) {
            config.ss.w = parseInt(RegExp.$1);
            config.ss.h = parseInt(RegExp.$2);
            isConfigurable = false;
        }
        fr = (config.fr) ? config.fr : 0;
        fs = (config.fs) ? config.fs : 1;
        ds = (config.ds) ? config.ds : 1;
        ac = (config.ac) ? true : false;
        if (config.ss.w && config.ss.h) {
            ss.w = config.ss.w;
            ss.h = config.ss.h;
        }
        mode = 'release';
        if (/-debug\.html$/.test(window.location.pathname)) {
            mode = 'debug';
        } else if (/-birdwatcher\.html$/.test(window.location.pathname)) {
            mode = 'birdwatcher';
        }
        if (/^\.\/lwf/.test(window['testlwf_lwfjs'])) {
            mode = 'user-specified lwf*.js';
        } else if (/^http/.test((window['testlwf_lwfjs']))) {
            mode += ' (root-overridden: ' + window['testlwf_root_override'] + ')';
        }
        if (isMobile) {
            var lwfstats = window['testlwf_lwfstats'];
            var dpr = window.devicePixelRatio;
            if (window['testlwf_html5target'] == 'webkitcss') {
                dpr = 1;
            }
            stage_w = Math.round(window.innerWidth * ds);
            stage_h = Math.round(window.innerWidth * lwfstats.h / lwfstats.w * ds);
            stage = createStage();
            stage.style.position = 'absolute';
            stage.style.left = '0px';
            stage.style.top = '0px';
            stage.style.width = stage_w + 'px';
            stage.style.height = stage_h + 'px';
            stage.style.zIndex = 0;
            stage.width = Math.round(stage_w * dpr);
            stage.height = Math.round(stage_h * dpr);
            stage_scale = stage_w / stage.width;
            document.body.appendChild(stage);
            // if (isBuggyWebGL) {
            //     // ugly patch for buggy webgl
            //     var viewport = WebGLRenderingContext.prototype.viewport;
            //     WebGLRenderingContext.prototype.viewport = function(x, y, w, h) {
            //         // the default canva dimension (300x150) may cause the issue.
            //         // cf. http://stackoverflow.com/questions/7792788/canvas-default-size
            //         viewport.call(this, x, y, w, h * 2);
            //     };
            // }
            progressBar = document.createElement('div');
            progressBar.className = 'info';
            progressBar.style.position = 'absolute';
            progressBar.style.left = '0px';
            progressBar.style.top = '32px';
            progressBar.style.zIndex = 5;
            progressBar.textContent = 'loading:   0%';
            document.body.appendChild(progressBar);
            stageEventReceiver = document.createElement('div');
            stageEventReceiver.id = 'stageEventReceiver';
            stageEventReceiver.style.position = 'absolute';
            stageEventReceiver.style.left = '0px';
            stageEventReceiver.style.top = '0px';
            stageEventReceiver.style.width = stage_w + 'px';
            stageEventReceiver.style.height = stage_h + 'px';
            stageEventReceiver.style.zIndex = 10;
            document.body.appendChild(stageEventReceiver);
            if (mode == 'debug') {
                fps.stats = new Stats(220, 24, 60);
                document.body.appendChild(fps.stats.div);
                fps.stats.div.style.position = 'absolute';
                fps.stats.div.style.left = '0px';
                fps.stats.div.style.top = '32px';
                fps.stats.div.style.zIndex = 10000;
                document.body.appendChild(fps.stats.div);
                if (window['testlwf_html5target'] == 'webgl') {
                    dps.stats = new Stats(220, 24, 0);
                    dps.stats.div.style.position = 'absolute';
                    dps.stats.div.style.left = '0px';
                    dps.stats.div.style.top = '60px';
                    dps.stats.div.style.zIndex = 10000;
                    document.body.appendChild(dps.stats.div);
                }
            }
            {
                var strut = document.createElement('div');
                strut.id = 'strut';
                strut.style.position = 'absolute';
                strut.style.left = '0px';
                strut.style.top = '0px';
                strut.style.width = '1px';
                strut.style.height = '4096px';
                strut.style.zIndex = 1;
                document.body.appendChild(strut);
                if (isIOS) {
                    window.scrollTo(0, 0);
                } else if (isAndroid) {
                    setTimeout(function() {window.scrollTo(0, 1);}, 100);
                }
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
                var q = qrcode(10, 'M');
                q.addData(window.location.href);
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
                div.className = 'info';
                div.innerHTML = "<a href=\"javascript:void(0)\" onClick=\"Ajax.post('http://localhost:10080/update/', {'arg': '" + window['testlwf_name'] + "', 'force': true}); return false;\">force to update</a>";
                lpart.appendChild(div);
            }
            {
                var div = document.createElement('div');
                div.className = 'info_wrapped';
                {
                    var span = document.createElement('span');
                    span.id = 'info1';
                    span.textContent = '(x1)';
                    div.appendChild(span);
                }
                if (isConfigurable) {
                    var a = document.createElement('a');
                    a.textContent = '(open with current settings)';
                    a.href = 'javascript:void(0)';
                    a.onclick = function() {
                        window.open(
                            window.location.origin + window.location.pathname
                                + '?fr=' + fr
                                + '&fs=' + fs
                                + '&ds=' + ds
                                + '&ac=' + ac
                                + '&ss=' + ss.w + 'x' + ss.h,
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
                if (mode == 'release' || mode == 'user-specified lwf*.js') {
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
                    if (/\.swf\/index-.*\.html/.test(window.location.href)) {
                        warnings = 'images are extracted from the swf (note: for a swf file directly under LWFS_work/ images are always extracted -- please put a swf file and corresponding image files into a sub folder under LWFS_work/).';
                    } else {
                        warnings = 'images are extracted from the swf.';
                    }
                }
                if (window['testlwf_warn']) {
                    if (warnings != '') {
                        warnings += ' ';
                    }
                    warnings += '(<a href="index-warn.html" target="_blank">swf2lwf warnings</a>)';
                }
                div.innerHTML
                    = (warnings != '')
                    ? '<p style="background-color:yellow;white-space:pre-wrap;">warning: ' + warnings + '</p>'
                    : '<p>warning: none.</p>';
                lpart.appendChild(div);
            }
            {
                var sizes = [
                    'default',
                    '480x800',
                    //'480x854',
                    '540x960',
                    '640x960',
                    '640x1136',
                    '768x1024',
                    '|',
                    '800x480',
                    //'854x480',
                    '960x540',
                    '960x640',
                    '1136x640',
                    '1024x768'
                ];
                var resize = function(event) {
                    if (/([0-9]+)x([0-9]+)/.test(event.target.textContent)) {
                        ss.w = parseInt(RegExp.$1) / 2;
                        ss.h = parseInt(RegExp.$2) / 2;
                    } else {
                        ss.w = config.ss.w;
                        ss.h = config.ss.h;
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
                progressBar = document.createElement('div');
                progressBar.className = 'info';
                progressBar.textContent = 'loading:   0%';
                footer.appendChild(progressBar);
            }
            {
                var div = document.createElement('div');
                div.className = 'info_wrapped';
                div.id = 'usage';
                div.textContent
                    = 'SPACE: rewind, S: pause/resume, F: step, '
                    + ((! isConfigurable) ? '' : 'DOWN/UP/0: frame rate, ')
                    + ((! isConfigurable) ? '' : 'LEFT/RIGHT: frame step, ')
                    + ((! isConfigurable) ? '' : 'D: scale, ')
                    + ((! isConfigurable) ? '' : 'O: toggle centering, ')
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
                fps.stats = new Stats(220, 24, 60);
                lpart.appendChild(fps.stats.div);
            }
            if (mode == 'debug' && window['testlwf_html5target'] == 'webgl') {
                dps.stats = new Stats(220, 24, 0);
                lpart.appendChild(dps.stats.div);
            }
            header.appendChild(lpart);
            header.appendChild(rpart);
            wrapper.appendChild(header);
            {
                var div = document.createElement('div');
                div.style.clear = 'both';
                div.style.width = '100%';
                wrapper.appendChild(div);
            }
            stageEventReceiver = stage = createStage();
            stage.style.position = 'relative';
            stageWrapper = document.createElement('div');
            stageWrapper.id = 'stageWrapper';
            stageWrapper.style.visibility = 'hidden';
            stageWrapper.appendChild(stage);
            wrapper.appendChild(stageWrapper);
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
        if (isAndroid && /^2\.1/.test(osVersion)) {
            // cf. https://code.google.com/p/android/issues/detail?id=5141#c6
            var factor = 1 / window.devicePixelRatio;
            var drawImage = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage
                = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
                    for (var i = 1; i < arguments.length; i++) {
                        arguments[i] = (arguments[i] * factor);
                    }
                    drawImage.apply(this, arguments);
                };
        }
        if (isAndroid) {
            params['use3D'] = false;
        }
        if (isAndroid && /^(4\.0|[321]\.)/.test(osVersion)) {
            params['worker'] = false;
        }
        if (isFile) {
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
        if (isBuggyClearRect) {
            params['quirkyClearRect'] = true;
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
    if (! config.use_page_show_hide_events || (isAndroid && /^(2\.1|1\.6)/.test(osVersion))) {
        window.addEventListener('unload', onpagehide, false);
        window.addEventListener('load', onpageshow, false);
    } else {
        window.addEventListener('pagehide', onpagehide, false);
        window.addEventListener('pageshow', onpageshow, false);
    }
}).call(this);
