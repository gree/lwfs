# -*- mode: makefile-gmake; -*-

RUBY=https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-2.7.1-1/rubyinstaller-devkit-2.7.1-1-x64.exe
LIBJPEG=http://www.ijg.org/files/jpegsrc.v9d.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.2.59.tar.gz
ZLIB=http://zlib.net/zlib-1.2.11.tar.gz
LIBICONV=http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.16.tar.gz
LIBXML2=http://xmlsoft.org/sources/libxml2-2.9.10.tar.gz

WGET=wget --no-check-certificate
SEVENZIP='/cygdrive/c/Program Files/7-zip/7z.exe'

default:
	@echo 'make [ all | download | ruby | libpng | libjpeg | libxml2 | gems | cleanall | clean | updateruby ]'
	@echo ''
	@echo 'NOTES:'
	@echo '  install bison/flex under bison-and-flex (for actioncompiler-*.gem).'
	@echo '  after installing ruby, open mingw64 terminal and proceed.'

all: cleanall download ruby libpng libjpeg libxml2 gems

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(RUBY)` ]; then $(WGET) $(RUBY); fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi
	cd dl; if [ ! -f `basename $(LIBICONV)` ]; then $(WGET) $(LIBICONV); fi
	cd dl; if [ ! -f `basename $(LIBXML2)` ]; then $(WGET) $(LIBXML2); fi

checkso:
	(ldd /c/Ruby27-x64/bin/ruby; find /c/Ruby27-x64 -name '*.so' | xargs ldd) | grep '	' | sort | uniq

ruby:
	chmod 755 dl/`basename ${RUBY}`
	cygstart -w dl/`basename ${RUBY}`
	echo "please perform 'make mingw64' after installing ruby."

mingw64:
	cygstart /c/Ruby27-x64/msys64/mingw64.exe

# zlib: checkmingw64
# 	tar xzf dl/zlib-*.tar.gz
# 	cd zlib-*; bash -c 'source ../_bashrc; make -fwin32/Makefile.gcc'
# 	cd zlib-*; cp zlib.h zconf.h /c/Ruby27-x64/msys64/mingw64/include
# 	cd zlib-*; cp libz.a /c/Ruby27-x64/msys64/mingw64/lib

libpng: checkmingw64
	tar xzf dl/libpng-*.tar.gz
	cd libpng-*; bash -c 'source ../_bashrc; ./configure --prefix=/c/Ruby27-x64/msys64/mingw64; make'
	cd libpng-*; cp png*.h /c/Ruby27-x64/msys64/mingw64/include
	cd libpng-*; cp .libs/libpng.a /c/Ruby27-x64/msys64/mingw64/lib

libjpeg: checkmingw64
	tar xzf dl/jpegsrc.*.tar.gz
	cd jpeg-*; bash -c 'source ../_bashrc; ./configure --prefix=/c/Ruby27-x64/msys64/mingw64; make'
	cd jpeg-*; cp jconfig.h jerror.h jmorecfg.h jpeglib.h /c/Ruby27-x64/msys64/mingw64/include
	cd jpeg-*; cp .libs/libjpeg.a /c/Ruby27-x64/msys64/mingw64/lib

# libiconv: checkmingw64
# 	tar xzf dl/libiconv-*.tar.gz
# 	cd libiconv-*; bash -c 'source ../_bashrc; ./configure --prefix=/c/Ruby27-x64/msys64/mingw64 --disable-shared; make'
# 	cp libiconv-*/lib/libcharset.h /c/Ruby27-x64/msys64/mingw64/include
# 	cp libiconv-*/lib/libcharset.a /c/Ruby27-x64/msys64/mingw64/lib
# 	cp libiconv-*/include/iconv.h /c/Ruby27-x64/msys64/mingw64/include
# 	cp libiconv-*/lib/.libs/libiconv.a /c/Ruby27-x64/msys64/mingw64/lib

libxml2: checkmingw64
	tar xzf dl/libxml2-*.tar.gz
	cd libxml2-*; bash -c 'source ../_bashrc; ./configure --prefix=/c/Ruby27-x64/msys64/mingw64  --disable-shared; make libxml2.la'
	cd libxml2-*; mkdir /c/Ruby27-x64/msys64/mingw64/include/libxml; cp include/libxml/*.h /c/Ruby27-x64/msys64/mingw64/include/libxml
	cd libxml2-*; cp .libs/libxml2.a /c/Ruby27-x64/msys64/mingw64/lib

gems: checkmingw64
	bash -c 'source _bashrc; gem install httpclient'
	bash -c 'source _bashrc; gem install wdm'
	bash -c 'source _bashrc; gem install sinatra'
	bash -c 'source _bashrc; gem install thin'
	bash -c 'source _bashrc; gem install uuidtools'
	bash -c 'source _bashrc; gem install ../../../vendor/cache/ruby-lzma-*[0-9].gem'
	bash -c 'source _bashrc; gem install ../../../vendor/cache/libxml-ruby-*[0-9].gem -- --with-cppflags=-DLIBXML_STATIC'
	bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/rb-img-*[0-9].gem'
	bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/actioncompiler-*[0-9].gem'

checkmingw64:
	if expr `uname` : '^MINGW64' > /dev/null; then exit 0; else exit 1; fi

cleanall: clean
	cygstart -w /c/Ruby27-x64/unins000.exe
	rm -rf /c/Ruby27-x64
	rm -rf dl

clean:
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*
	rm -rf libiconv-*
	rm -rf libxml2-*

updateruby:
	rm -f ../ruby27.zip
	rm -rf ruby27; mkdir ruby27
	(cd /c/Ruby27-x64; tar --exclude=msys64 -cf - .) | (cd ruby27; tar xf -)
	cp -r rsync-cw/* ruby27/bin
	chmod -R 755 ruby27
	find ruby27 -name '*.o' | xargs rm -f
	rm -rf ruby27/lib/ruby/gems/2.7.0/cache/*
	rm -rf ruby27/lib/ruby/gems/2.7.0/doc/*
	rm -rf ruby27/lib/libx64-msvcrt-ruby270.dll.a
	rm -rf ruby27/msys64
	zip -Xqr9 ../ruby27.zip ruby27
	rm -rf ruby27
