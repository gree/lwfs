/**
 * AutoReloader.js
 * auto reload browser if files were modified.
 * @see https://github.com/tanabe/AutoReloader-js
 * @author Hideaki Tanabe <tanablog@gmail.com>
 * @usage
 * include this file on page bottom
 */
(function() {
  var TARGET_FILES = [
    {path: location.href, lastModified: null}
  ];

  var INTERVAL = 1000;
  var WATCH_MAX_TIME = 1000 * 60 * 3;//watching 3 minutes
  var counter = 0;
  var isBusy = false;
  var now = new Date();
  var intervalId;

  /**
   * create XMLHTTPRequest object
   * @name createXMLHTTPRequest
   * @function
   * @return XMLHttpRequest object
   */
  var createXMLHTTPRequest = function() {
    //this code borrowed from
    //https://github.com/hirokidaichi/namespace-js/blob/master/src/namespace.js
    var xhr;
    try {xhr = new XMLHttpRequest();} catch(e) {
      try {xhr = new ActiveXObject("Msxml2.XMLHTTP.6.0");} catch(e) {
        try {xhr = new ActiveXObject("Msxml2.XMLHTTP.3.0");} catch(e) {
          try {xhr = new ActiveXObject("Msxml2.XMLHTTP");} catch(e) {
            try {xhr = new ActiveXObject("Microsoft.XMLHTTP");} catch(e) {
              throw new Error("This browser does not support XMLHttpRequest.");
            }
          }
        }
      }
    }
    return xhr;
  };

  /**
   * reload browser
   * @name reload
   * @function
   */
  var reload = function() {
    location.reload();
  };

  /**
   * polling
   * @name polling
   * @function
   */
  var polling = function() {
    intervalId = setInterval(function() {
      // var timesAfter = (new Date().getTime()) - now.getTime();
      // if (timesAfter > WATCH_MAX_TIME) {
      //   stopPolling();
      // }
      //console.log(timesAfter);
      if (!isBusy) {
        checkUpdate(counter);
        if (counter < TARGET_FILES.length - 1) {
          counter++;
        } else {
          counter = 0;
        }
      }
    }, INTERVAL);
  };

  /**
   * stop polling
   * @name stopPolling
   * @function
   */
  var stopPolling = function() {
    clearInterval(intervalId);
  };

  /**
   * check initialized
   * @name isInitialied
   * @function
   * @return initialized then true
   */
  var isInitialied = function() {
    for (var i = 0; i < TARGET_FILES.length; i++) {
      if (TARGET_FILES[i].lastModified === null) {
        return false;
      }
    }
    return true;
  };

  var formatDate = function(d) {
    var year = d.getUTCFullYear();
    var month = d.getUTCMonth() + 1;
    var date = d.getUTCDate();
    var hours = d.getUTCHours();
    var minutes = d.getUTCMinutes();
    var seconds = d.getUTCSeconds();
    month = (month < 10) ? '0' + month : '' + month;
    date = (date < 10) ? '0' + date : '' + date;
    hours = (hours < 10) ? '0' + hours : '' + hours;
    minutes = (minutes < 10) ? '0' + minutes : '' + minutes;
    seconds = (seconds < 10) ? '0' + seconds : '' + seconds;
    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds + ' +0000';
  };

  /**
   * check update
   * @name checkUpdate
   * @function
   * @param index 
   */
  var checkUpdate = function(index) {
    isBusy = true;
    var fileName = TARGET_FILES[index].path;
    var lastModified = TARGET_FILES[index].lastModified;
    var xhr = createXMLHTTPRequest();
    //thanks for your advice @oogatta
    xhr.open("HEAD", fileName, true);
    if (lastModified) {
      xhr.setRequestHeader("If-Modified-Since", lastModified + " ");
    }

    //event handler
    xhr.onreadystatechange = function() {
      if(xhr.readyState === 4){
        var fileLastModified = xhr.getResponseHeader("Last-Modified");
        if (xhr.status === 200) {
          if (isInitialied()) {
            if (Date.parse(lastModified) < Date.parse(fileLastModified)) {
              TARGET_FILES[index].lastModified = fileLastModified;
              reload();
            }
          } else {
            TARGET_FILES[index].lastModified = formatDate(now);
          }
        }
      }
      isBusy = false;
    };
    xhr.send("");
  };

  var isAdded = function(path) {
    for (var i = 0; i < TARGET_FILES.length; i++) {
      if (TARGET_FILES[i].path === path) {
        return true;
      }
    }
    return false;
  };

  //define interface
  window.AutoReloader = {
    /**
     * add watch target file
     * @name add
     * @function
     */
    add: function() {
      for (var i = 0; i < arguments.length; i++) {
        var path = arguments[i];
        if (!isAdded(path)) {
          TARGET_FILES.push({path: path, lastModified: null});
        }
      }
    },

    /**
     * watch all css
     * @name watchCSS
     * @function
     */
    watchCSS: function() {
      var scriptTags = document.getElementsByTagName("link");
      var stylesheets = [];
      for (var i = 0; i < scriptTags.length; i++) {
        if (scriptTags[i].type === "text/css" && scriptTags[i].href) {
          this.add(scriptTags[i].href);
        }
      }
    },

    /**
     * watch all JavaScript
     * @name watchJS
     * @function
     */
    watchJS: function() {
      var scriptTags = document.getElementsByTagName("script");
      var stylesheets = [];
      for (var i = 0; i < scriptTags.length; i++) {
        if (scriptTags[i].type === "text/javascript" && scriptTags[i].src) {
          this.add(scriptTags[i].src);
        }
      }

    }
  };

  //begin polling
  polling();
})();
