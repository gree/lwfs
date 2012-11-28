#!/bin/bash

BASE=`dirname $0`

# ruby environment
RBH=$BASE/ruby19
export PATH=$RBH/bin:$RBH/lib/ruby/gems/1.9/bin:/usr/bin:/bin:/usr/sbin:/sbin
if [ -n "$DYLD_LIBRARY_PATH" ]; then
  export DYLD_LIBRARY_PATH=$RBH/lib:$DYLD_LIBRARY_PATH
else
  export DYLD_LIBRARY_PATH=$RBH/lib
fi
export RUBYOPT='-Ku'
export RUBYLIB=$RBH/lib/ruby/1.9.1:$RBH/lib/ruby/1.9.1/x86_64-darwin11.4.2
export GEM_HOME=$RBH/lib/ruby/gems/1.9.1
export JRUBY_OPTS='--server -J-Djruby.jit.threshold=30'
if [ -f $BASE/../.lwfsrc ]; then
  sed 's/set /export /' < $BASE/../.lwfsrc > $BASE/tmp.rc
  source $BASE/tmp.rc
fi
unset TZ
export LWFS_REMOTE_SERVER

# app
cd $BASE/lwfs
chmod a+rwx htdocs/lwfs
ruby lwfs.rb
