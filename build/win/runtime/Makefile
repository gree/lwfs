# -*- mode: makefile-gmake; -*-

RUBY=http://dl.bintray.com/oneclick/rubyinstaller/ruby-1.9.3-p545-i386-mingw32.7z
DEVKIT=https://github.com/downloads/oneclick/rubyinstaller/DevKit-tdm-32-4.5.2-20111229-1559-sfx.exe
LIBJPEG=http://www.ijg.org/files/jpegsrc.v9a.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.2.51.tar.gz
ZLIB=http://zlib.net/zlib-1.2.8.tar.gz
LIBICONV=http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz
LIBXML2=http://xmlsoft.org/sources/libxml2-2.9.1.tar.gz

WGET=wget --no-check-certificate
SEVENZIP='/cygdrive/c/Program Files/7-zip/7z.exe'

default:
	@echo 'make [ all | download | ruby | devkit | zlib | libpng | libjpeg | libiconv | libxml2 | gems | cleanall | clean | updateruby ]'

all: cleanall download ruby devkit zlib libpng libjpeg libiconv libxml2 gems

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(RUBY)` ]; then $(WGET) $(RUBY); fi
	cd dl; if [ ! -f `basename $(DEVKIT)` ]; then $(WGET) $(DEVKIT); fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi
	cd dl; if [ ! -f `basename $(LIBICONV)` ]; then $(WGET) $(LIBICONV); fi
	cd dl; if [ ! -f `basename $(LIBXML2)` ]; then $(WGET) $(LIBXML2); fi

checkso:
	(ldd `which ruby`; find /home/ruby19 -name '*.so' | grep -vi tcltk | xargs ldd) | grep '	' | sort | uniq

ruby:
	cp dl/ruby-*.7z /home
	cd /home; $(SEVENZIP) x ruby-*.7z > /dev/null
	cd /home; rm ruby-*.7z; mv ruby-*-mingw32 ruby19; chmod -R 755 ruby19

devkit:
	mkdir /home/devkit; cp dl/DevKit*.exe /home/devkit
	cd /home/devkit; $(SEVENZIP) x DevKit*.exe > /dev/null
	cd /home/devkit; rm DevKit*.exe; chmod -R 755 .
	cd /home/devkit; env LANG= PATH=/home/ruby19/bin:/usr/bin ruby dk.rb init
	cd /home/devkit; echo ' - C:/home/ruby19' >> config.yml
	cd /home/devkit; env LANG= PATH=/home/ruby19/bin:/usr/bin ruby dk.rb install

zlib:
	tar xzf dl/zlib-*.tar.gz
	cd zlib-*; export PATH=/home/devkit/mingw/bin:/home/devkit/mingw/bin:/usr/bin; make -fwin32/Makefile.gcc
	cd zlib-*; cp zlib.h zconf.h /home/devkit/mingw/include
	cd zlib-*; cp libz.a /home/devkit/mingw/lib

libpng:
	tar xzf dl/libpng-*.tar.gz
	cd libpng-*; export PATH=/home/devkit/mingw/bin:/home/devkit/mingw/bin:/usr/bin; ./configure --target=mingw32 --prefix=/home/devkit/mingw; make
	cd libpng-*; cp png*.h /home/devkit/mingw/include
	cd libpng-*; cp .libs/libpng.a /home/devkit/mingw/lib

libjpeg:
	tar xzf dl/jpegsrc.*.tar.gz
	cd jpeg-*; export PATH=/home/devkit/mingw/bin:/home/devkit/mingw/bin:/usr/bin; ./configure --target=mingw32 --prefix=/home/devkit/mingw; make
	cd jpeg-*; cp jconfig.h jerror.h jmorecfg.h jpeglib.h /home/devkit/mingw/include
	cd jpeg-*; cp .libs/libjpeg.a /home/devkit/mingw/lib

libiconv:
	tar xzf dl/libiconv-*.tar.gz
	cd libiconv-1.14; export PATH=/home/devkit/mingw/bin:/home/devkit/mingw/bin:/usr/bin; ./configure --target=mingw32 --prefix=/home/devkit/mingw --disable-shared; make
	cp libiconv-*/lib/libcharset.h /home/devkit/mingw/include
	cp libiconv-*/lib/libcharset.a /home/devkit/mingw/lib
	cp libiconv-*/include/iconv.h /home/devkit/mingw/include
	cp libiconv-*/lib/.libs/libiconv.a /home/devkit/mingw/lib

libxml2:
	tar xzf dl/libxml2-*.tar.gz
	cd libxml2-*; export PATH=/home/devkit/mingw/bin:/home/devkit/mingw/bin:/usr/bin; ./configure --target=mingw32 --prefix=/home/devkit/mingw --disable-shared; make libxml2.la
	cd libxml2-*; mkdir /home/devkit/mingw/include/libxml; cp include/libxml/*.h /home/devkit/mingw/include/libxml
	cd libxml2-*; cp .libs/libxml2.a /home/devkit/mingw/lib

gems:
	bash -c 'source _bashrc; gem install httpclient'
	bash -c 'source _bashrc; gem install ../../../vendor/cache/listen-*[0-9].gem'
	bash -c 'source _bashrc; gem install wdm'
	bash -c 'source _bashrc; gem install sinatra'
	bash -c 'source _bashrc; gem install thin'
	bash -c 'source _bashrc; gem install uuidtools'
	bash -c 'source _bashrc; gem install ../../../vendor/cache/ruby-lzma-*[0-9].gem'
	bash -c 'source _bashrc; gem install ../../../vendor/cache/libxml-ruby-*[0-9].gem'
	bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/rb-img-*[0-9].gem'
	bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/actioncompiler-*[0-9].gem'

cleanall: clean
	rm -rf dl
	rm -rf /home/ruby19
	rm -rf /home/devkit

clean:
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*
	rm -rf libiconv-*
	rm -rf libxml2-*

updateruby:
	rm -f ../ruby19.zip
	cp -r /home/ruby19 .
	cp -r rsync-cw/* ruby19/bin
	chmod -R 755 ruby19
	find ruby19 -name '*.o' | xargs rm -f
	rm -rf ruby19/lib/ruby/gems/1.9.1/cache/*
	rm -rf ruby19/lib/ruby/gems/1.9.1/doc/*
	rm -rf ruby19/lib/libmsvcrt-ruby191.dll.a
	rm -rf ruby19/lib/libmsvcrt-ruby191-static.a
	rm -rf ruby19/lib/tcltk
	zip -Xqr9 ../ruby19.zip ruby19
	rm -rf ruby19
