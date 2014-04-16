# -*- mode: makefile-gmake; -*-

LIBJPEG=http://www.ijg.org/files/jpegsrc.v8d.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.2.50.tar.gz
ZLIB=http://zlib.net/zlib-1.2.8.tar.gz
LIBICONV=http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.14.tar.gz
LIBXML2=http://xmlsoft.org/sources/libxml2-2.9.1.tar.gz
LIBYAML=http://pyyaml.org/download/libyaml/yaml-0.1.4.tar.gz
RSYNC=http://rsync.samba.org/ftp/rsync/src/rsync-3.1.0.tar.gz

WGET=wget --no-check-certificate

default:
	@echo 'make [ all | ruby | gems | cleanall | clean | updateruby | rsync ]'

all: cleanall download zlib libpng libjpeg libiconv libxml2 libyaml ruby gems rsync

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi
	cd dl; if [ ! -f `basename $(LIBICONV)` ]; then $(WGET) $(LIBICONV); fi
	cd dl; if [ ! -f `basename $(LIBXML2)` ]; then $(WGET) $(LIBXML2); fi
	cd dl; if [ ! -f `basename $(LIBYAML)` ]; then $(WGET) $(LIBYAML); fi
	cd dl; if [ ! -f `basename $(RSYNC)` ]; then $(WGET) $(RSYNC); fi

checkso:
	(otool -L `which ruby`; find /usr/local/rvm -name '*.bundle' | xargs otool -L) | grep '	' | sort | uniq

ruby:
	sudo bash -c 'source _bashrc; curl -L https://get.rvm.io | bash'
	sudo bash -c 'source _bashrc; rvm install 1.9.3 --32 --autolibs=disabled --without-readline --with-libyaml-dir="'`pwd`'/opt" --with-iconv-dir="`pwd`"/opt -C "--with-opt-dir="'`pwd`'"/opt"'

gems:
	sudo bash -c 'source _bashrc; gem install psych'
	sudo bash -c 'source _bashrc; gem install httpclient'
	sudo bash -c 'source _bashrc; gem install ../../../vendor/cache/listen-*[0-9].gem'
	sudo bash -c 'source _bashrc; gem install rb-fsevent'
	sudo bash -c 'source _bashrc; gem install sinatra'
	sudo bash -c 'source _bashrc; gem install thin'
	sudo bash -c 'source _bashrc; gem install uuidtools'
	sudo bash -c 'source _bashrc; gem install ../../../vendor/cache/ruby-lzma-*[0-9].gem'
	sudo bash -c "source _bashrc; gem install ../../../vendor/cache/libxml-ruby-*[0-9].gem -- --with-opt-dir=`pwd`/opt"
	sudo bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/rb-img-*[0-9].gem'
	sudo bash -c 'source _bashrc; gem install ../../../lib/swf2lwf/gems/actioncompiler-*[0-9].gem'

zlib:
	tar xzf dl/zlib*.tar.gz
	source _bashrc; cd zlib-*; ./configure --static; make
	mkdir -p opt/include opt/lib
	cd zlib-*; cp zconf.h zlib.h ../opt/include
	cd zlib-*; cp libz.a ../opt/lib

libpng:
	tar xzf dl/libpng*.tar.gz
	source _bashrc; cd libpng-*; ./configure; make
	mkdir -p opt/include opt/lib
	cd libpng-*; cp png*.h ../opt/include
	cd libpng-*; cp .libs/libpng.a ../opt/lib

libjpeg:
	tar xzf dl/jpegsrc.v8d.tar.gz
	source _bashrc; cd jpeg-*; ./configure; make
	mkdir -p opt/include opt/lib
	cd jpeg-*; cp jconfig.h jerror.h jmorecfg.h  jpeglib.h ../opt/include
	cd jpeg-*; cp .libs/libjpeg.a ../opt/lib

libiconv:
	tar xzf dl/libiconv-*.tar.gz
	source _bashrc; cd libiconv-1.14; ./configure --disable-shared; make
	mkdir -p opt/include opt/lib
	cd libiconv-*; cp lib/libcharset.h ../opt/include
	cd libiconv-*; cp lib/libcharset.a ../opt/lib
	cd libiconv-*; cp include/iconv.h ../opt/include
	cd libiconv-*; cp lib/.libs/libiconv.a ../opt/lib

libxml2:
	tar xzf dl/libxml2-*.tar.gz
	source _bashrc; cd libxml2-*; ./configure --disable-shared; make libxml2.la
	mkdir -p opt/include/libxml opt/lib
	cd libxml2-*; cp include/libxml/*.h ../opt/include/libxml
	cd libxml2-*; cp .libs/libxml2.a ../opt/lib

libyaml:
	tar xzf dl/yaml-0.1.4.tar.gz
	source _bashrc; cd yaml-*; ./configure; make
	mkdir -p opt/include opt/lib
	cd yaml-*; cp include/yaml.h ../opt/include
	cd yaml-*; cp src/.libs/libyaml.a ../opt/lib

rsync:
	tar xzf dl/rsync*.tar.gz
	source _bashrc; cd rsync*; ./configure; make

cleanall: clean
	rm -rf dl
	sudo rm -rf /usr/local/rvm

clean:
	rm -rf opt
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*
	rm -rf libiconv-*
	rm -rf libxml2-*
	rm -rf yaml-*
	rm -rf rsync*

updateruby:
	rm -f ../ruby19.zip
	cp -r /usr/local/rvm/rubies/default ruby19
	cp -r /usr/local/rvm/gems/ruby-1.9.3-*[0-9] ruby19/gems
	cp rsync-*/rsync ruby19/bin
	chmod -R 755 ruby19
	find ruby19 -name '*.o' | xargs rm -f
	rm -rf ruby19/lib/ruby/gems/1.9.1/cache/*
	rm -rf ruby19/lib/ruby/gems/1.9.1/doc/*
	rm -rf ruby19/gems/cache/*
	rm -rf ruby19/gems/doc/*
	zip -Xqr9 ../ruby19.zip ruby19
	rm -rf ruby19
