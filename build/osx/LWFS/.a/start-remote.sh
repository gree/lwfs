#!/bin/bash

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ruby environment
case $(arch) in
arm64)
    RBH="$BASE/ruby27-arm64"
    RBARCH="arm64-darwin25"
    ;;
x86_64)
    RBH="$BASE/ruby27-x86_64"
    RBARCH="x86_64-darwin15"
    ;;
*)
    exit 1
    ;;
esac
export PATH="$RBH/bin:/usr/bin:/bin:/usr/sbin:/sbin"
if [ -n "$DYLD_LIBRARY_PATH" ]; then
  export DYLD_LIBRARY_PATH="$RBH/lib:$DYLD_LIBRARY_PATH"
else
  export DYLD_LIBRARY_PATH="$RBH/lib"
fi
export RUBYOPT='-Ku'
export RUBYLIB="$RBH/lib/ruby/2.7.0:$RBH/lib/ruby/2.7.0/$RBARCH"
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
export LWFS_USE_REMOTE_SERVER=1
export LWFS_LOG_FILE='../../lwfs.log'

if [ "$LWFS_DATA_FOLDER" = "." ]; then
  export LWFS_DATA_FOLDER='../../..'
fi

# app
cd "$BASE/lwfs"
#ruby lwfs.rb
ruby "$RBH/bin/rackup" -p 10084 lwfs.ru
