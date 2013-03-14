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
        bundle install

### Mac OS X (JRuby)

1. Install rvm (https://rvm.io/rvm/install/).
2. Follow the steps below:

        rvm install jruby
        rvm jruby
        bundle install

### Linux

1. Install gcc
2. Install rvm (https://rvm.io/rvm/install/).
3. Follow the steps below:

        rvm install 1.9.3
        rvm 1.9.3
        bundle install

### Windows

1. Install MinGW ruby-1.9.3 and DevKit (http://rubyinstaller.org/).
2. Install zlib, libpng, libjpeg, libiconv, libxml2 to the DevKit.
3. Follow the steps below:

        gem install bundler
        bundle install

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

Invoke the following if you use the remote server.

    env LWFS_REMOTE_SERVER=rsyncd-server-hostname rackup lwfs.ru

Invoke the following if you want to make LWFS copy resulting lwf and
image files to LWFS\_work\_output.

    env LWFS_USE_OUTPUT_FOLDER=1 rackup lwfs.ru

Invoke the following if you want to specify the BirdWatcher server.

    env LWFS_BIRD_WATCHER_SERVER=birdwacher-server-hostname:port rackup lwfs.ru

You can also specifiy multiple environment variables.

## Requirements

### Ruby

ruby-1.9.3 is required. jruby-1.7.0 is also okay.

### HTTP Client

httpclient-2.3.0.1.gem is utilized for posting file system events to
the LWFS http server.

### UUID Tools

uuidtools-2.1.3.gem is utilized for generating a UUID for each
PC. This UUID is necessary to keep multiple users' folders
simultaneously on the remote rsyncd server.

### File System Events

Depending on the operating system/ruby, several gems are utilized:

* rb-fsevent-0.9.2.gem
    * for Mac OS X.
* rb-inotify-0.8.8.gem
    * for Linux.
* rb-fchange-0.0.6.gem
    * for Windows.
    * internally utilizes ffi-1.1.5.gem.
* listen-0.4.7.gem
    * for JRuby, internally utilizes rb-fseven-0.9.1.gem or
      rb-fchange-0.0.5.gem.

### XML

gems/libxml-ruby-2.3.3.1/
(https://github.com/KojiNakamaru/libxml-ruby/tree/develop) is utilized
to accelerate parsing xml data. This is a variant of the original
libxml-ruby-2.3.3.gem to be built for both Windows MinGW ruby and Mac
OS X rvm ruby.

### Image

gems/rb-img-0.0.5/, a custom extension for saving image data in png/jpg,
is utilized. Although there are several gems for saving image data,
each of them may have following issues:

* Obsolete and cannot work with ruby-1.9.3.
* Difficult to be built on Windows, MinGW ruby. Perhaps there is no
  big issue if we target Cygwin ruby.
