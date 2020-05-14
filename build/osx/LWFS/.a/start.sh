#!/bin/bash

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ruby environment
RBH=$(echo "$BASE"/ruby*)
export PATH="$RBH/bin:/usr/bin:/bin:/usr/sbin:/sbin"
if [ -n "$DYLD_LIBRARY_PATH" ]; then
  export DYLD_LIBRARY_PATH="$RBH/lib:$DYLD_LIBRARY_PATH"
else
  export DYLD_LIBRARY_PATH="$RBH/lib"
fi
export RUBYOPT='-Ku'
export RUBYLIB="$RBH/lib/ruby/2.7.0:$RBH/lib/ruby/2.7.0/x86_64-darwin15"
export GEM_HOME="$RBH/lib/ruby/gems/2.7.0"
export GEM_PATH="$RBH/lib/ruby/gems/2.7.0:$RBH/lib/ruby/2.7.0"
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
ruby "$RBH/bin/rackup" lwfs.ru
