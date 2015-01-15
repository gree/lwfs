# Installation

## Preparation

NOTE: Release materials for end-users are built by utilizing pre-build
runtimes. Please check build/{osx,win} for details. Runtimes
themselves are built under build/{osx,win}/runtime.

### Mac OS X

1. Install gcc (https://github.com/kennethreitz/osx-gcc-installer/) if
   you don't have any (such as those come with Xcode).
2. Install rvm (https://rvm.io/rvm/install/).
3. Follow the steps below:

        rvm install 1.9.3
        rvm 1.9.3
        bundle install --no-cache

### Mac OS X (JRuby)

1. Install rvm (https://rvm.io/rvm/install/).
2. Follow the steps below:

        rvm install jruby
        rvm jruby
        bundle install --no-cache

### Linux

1. Install gcc
2. Install rvm (https://rvm.io/rvm/install/).
3. Follow the steps below:

        rvm install 1.9.3
        rvm 1.9.3
        bundle install --no-cache

### Windows

1. Install MinGW ruby-1.9.3 and DevKit (http://rubyinstaller.org/).
2. Install zlib, libpng, libjpeg, libiconv, libxml2 to the DevKit.
3. Follow the steps below:

        gem install bundler
        bundle install --no-cache

### Remote Server

LWFS normally works as a web server running on your PC. If you want to
check your contents on mobile devices, you need to have a WiFi access
point through which they can access to your PC. In order to avoid this
requirement, you can prepare a rsync/web server on some remote (Linux)
host and make LWFS to synchronize converted contents onto the remote
host. Please check remote/ for further details.

### BirdWatcher Server

BirdWatcher (https://github.com/imaya/birdwatcher.js/) is a JavaScript
profiler purely written in JavaScript. It is easy to use even on
mobile devices and can send stats to its node.js server on which a
user can check various graphs/console logs.

By default, LWFS shows a page for each data with the release version
of lwf.js. A user can then switch to the page with the debug version
of lwf.js and/or the page with the debug version of lwf.js and
birdwatcher.js. For the last case, you need to have a BirdWatcher
server running on node.js. Please check the following steps.

    npm install socket.io
    git clone git://github.com/imaya/birdwatcher.js.git
    cd birdwatcher.js/server
    vi config.js  # if you need to change the port number.
    node server.js

## How To Start

Invoke the following.

    rackup lwfs.ru

## Configuration

You may configure LWFS on its start-up with ~/Desktop/LWFS_work/lwfs.conf:

    // -*- mode: javascript; tab-width: 4; -*-
    {
        // global/static settings
        "REMOTE_SERVER": "remote-server-name",
        "BIRD_WATCHER_SERVER": "birdwatcher-server-name:3000",
        "IGNORED_PATTERN": "[,#].*|.*\.sw[op]|.*~",
        "ALLOWED_PREFIX_PATTERN": "",
        "TARGETS":
        [
            "webkitcss",
            "canvas",
            "webgl",
            "native"
            //"cocos2d",
            //"unity"
        ],
        "USE_OUTPUT_FOLDER": true,
        "ROOT_OVERRIDES":
        [
            //["PROJECT/PREFIX/", "http://remote-server-name/lwfrevs/20130702_083513_m0700/"]
        ],
        // local/dynamic settings
        "USE_PAGE_SHOW_HIDE_EVENTS": false,
        "FRAME_RATE": 0,
        "FRAME_STEP": 0,
        "DISPLAY_SCALE": 0,
        "AUTO_CENTERING": false,
        "SCREEN_SIZE": "0x0",
        "STAGE":
        {
            "ELASTIC": false,
            "HALIGN": 0,  // -1, 0, 1
            "VALIGN": -1,  // -1, 0, 1
        },
        "STATS_DISPLAY":
        {
            "GRAPH": false,
            "TEXT": true
        },
        "LWF_FORMAT_VERSION": null,
        "SWF2LWF_EXTRA_OPTIONS":
        [
            //"-s"
        ]
    }

You may also put multiple lwfs.conf under any subfolder of
~/Desktop/LWFS_work/ to control "local/dynamic" settings for the
folder and descendant folders of the folder.

### Global/Static Settings

These settings are global/static settings reflected on LWFS start-up.

* REMOTE\_SERVER
  * Remote server.
* BIRD\_WATCHER\_SERVER
  * BirdWatcher server.
* IGNORED\_PATTERN
  * Patterns for untracked files.
* ALLOWED\_PREFIX\_PATTERN
  * Patterns for allowed prefixes. Any files/folders are allowed if "" is specified.
* TARGETS
  * Targets for which LWFS will perform conversions.
* USE\_OUTPUT\_FOLDER
  * True if LWFS copies converted results to ~/Desktop/LWFS\_work\_output.
* ROOT\_OVERRIDES
  * lwf\*.js can be specified in this array for any "PROJECT/PREFIX/" in ~/Desktop/LWFS\_work/.

### Local/Dynamic Settings

These settings are local/dynamic settings reflected when any content
is converted.

* USE\_PAGE\_SHOW\_HIDE\_EVENTS
  * True if a lwf is initialized/finalized on pageshow/pagehide.
* FRAME\_RATE
  * Fixed frame rate to be used (0 means not fixed).
* FRAME\_STEP
  * Fixed frame step to be used (0 means not fixed).
* DISPLAY\_SCALE
  * Fixed display scale to be used (0 means not fixed).
* AUTO\_CENTERING
  * True if rootMovie is centered.
* SCREEN\_SIZE
  * Fixed screen size to be used ("0x0" means not fixed).
* STAGE
  * ELASTIC
    * True if the stage will always fullfil its wrapper.
  * HALIGN
    * -1 if align to left.
    * 0 if align to center.
    * 1 if align to right.
  * VALIGN
    * -1 if align to top.
    * 0 if align to middle.
    * 1 if align to bottom.
* STATS\_DISPLAY
  * GRAPH
    * True if graphs for fps/draw calls are shown on mobile.
  * TEXT
    * True if texts for fps/draw calls are shown on mobile.
* LWF\_FORMAT\_VERSION
  * LWF file format version
    * "0x121010", "0x131211", "0x141211", or null (null means the newest format).
* SWF2LWF\_EXTRA\_OPTIONS
  * Extra options for swf2lwf.rb
    * "-s", for example, enables to parse special symbols as in former swf2lwf.rb.

## Requirements

### Ruby

ruby-1.9.3 is required. jruby-1.7.0 is also okay.

### HTTP Server

shinatra-\*.gem and thin-\*.gem (and their dependencies including
rack-*.gem, etc) are utilized.

### HTTP Client

httpclient-\*.gem is utilized for posting file system events to
the LWFS http server.

### UUID Tools

uuidtools-\*.gem is utilized for generating a UUID for each
PC. This UUID is necessary to keep multiple users' folders
simultaneously on the remote rsyncd server.

### File System Events

listen-\*.gem are utilized and it depends on some of gems
(rb-fseven-\*.gem, rb-inotify-\*.gem, rb-fchange-\*.gem, or
wdm-\*.gem).

### LZMA

vendor/cache/ruby-lzma-\*.gem
(https://github.com/KojiNakamaru/ruby-lzma/tree/develop), a variant to
work with ruby-1.9.3, is utilized.

### XML

vendor/cache/libxml-ruby-\*.gem
(https://github.com/KojiNakamaru/libxml-ruby/tree/develop) is utilized
to accelerate parsing xml data. This is a variant of the original
libxml-ruby-\*.gem to be built for both Windows MinGW ruby and Mac
OS X rvm ruby.

### ActionCompiler

lib/swf2lwf/gems/actioncompiler-\*.gem
(https://github.com/gree/lwf/tree/master/tools/swf2lwf/gems) for
parsing actions.

### Image

lib/swf2lwf/gems/rb-img-\*.gem (gems/rb-img-\*/), a custom extension for
saving image data in png/jpg, is utilized. Although there are several
gems for saving image data, each of them may have following issues:

* Obsolete and cannot work with ruby-1.9.3.
* Difficult to be built on Windows, MinGW ruby. Perhaps there is no
  big issue if we target Cygwin ruby.
