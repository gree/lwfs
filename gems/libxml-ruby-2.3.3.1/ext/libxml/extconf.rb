#!/usr/bin/env ruby

require 'rbconfig'
require 'mkmf'

# for OS X/Linux
$INCFLAGS << " -I/opt/local/include/libxml2 -I/usr/include/libxml2"
$LDFLAGS = '-L/opt/local/lib'

# For FreeBSD add /usr/local/include
$INCFLAGS << " -I/usr/local/include"

$CFLAGS << ' -DLIBXML_STATIC' << ' ' << $INCFLAGS

have_library('socket','socket')
have_library('nsl','gethostbyname')
have_library('z')
have_library('iconv')
have_library('xml2')

#$INSTALLFILES = [["libxml.rb", "$(RUBYLIBDIR)", "../xml"]]

create_header()
create_makefile('libxml_ruby')
