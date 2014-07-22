#!/bin/bash

BASE=`dirname "$0"`

# ruby environment
RBH="$BASE/ruby19"
export PATH="$RBH/bin:$RBH/lib/ruby/gems/1.9.1/bin:/usr/bin:/bin:/usr/sbin:/sbin"
if [ -n "$DYLD_LIBRARY_PATH" ]; then
  export DYLD_LIBRARY_PATH="$RBH/lib:$DYLD_LIBRARY_PATH"
else
  export DYLD_LIBRARY_PATH="$RBH/lib"
fi
export RUBYOPT='-Ku'
export RUBYLIB="$RBH/lib/ruby/1.9.1:$RBH/lib/ruby/1.9.1/i386-darwin10.8.0"
export GEM_HOME="$RBH/gems"
export GEM_PATH="$RBH/gems:$RBH/lib/ruby/1.9.1"
unset IRBRC
unset MAGLEV_HOME
unset RBXOPT
export JRUBY_OPTS='--server -J-Djruby.jit.threshold=30'
if [ -f "$BASE/../.lwfsrc" ]; then
  sed 's/set /export /' < "$BASE/../.lwfsrc" > "$BASE/tmp.rc"
  source "$BASE/tmp.rc"
fi
unset TZ
export LWFS_USE_REMOTE_SERVER=0
export LWFS_LOG_FILE='../../lwfs.log'

if [ "$LWFS_DATA_FOLDER" = "." ]; then
  export LWFS_DATA_FOLDER='../../..'
fi

# app
cd "$BASE/lwfs"
#ruby lwfs.rb
ruby "$RBH/gems/bin/rackup" lwfs.ru
