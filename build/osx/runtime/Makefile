# -*- mode: makefile-gmake; -*-

LIBJPEG=http://www.ijg.org/files/jpegsrc.v8d.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.2.50.tar.gz
ZLIB=http://zlib.net/zlib-1.2.8.tar.gz

WGET=wget --no-check-certificate

default:
	@echo 'make [ all | ruby | gems | cleanall | clean | updateruby ]'

all: cleanall download zlib libpng libjpeg ruby gems

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi

checkso:
	(otool -L `which ruby`; find /usr/local/rvm -name '*.bundle' | xargs otool -L) | grep '	' | sort | uniq

ruby:
	sudo bash -c 'source _bashrc; curl -L https://get.rvm.io | bash'
	sudo bash -c 'source _bashrc; rvm install 1.9.3 --autolibs=disabled -C "--with-opt-dir="`pwd`"/opt"'

gems:
	sudo bash -c 'source _bashrc; gem install httpclient'
	sudo bash -c 'source _bashrc; gem install ../../../vendor/cache/listen-*[0-9].gem'
	sudo bash -c 'source _bashrc; gem install rb-fsevent'
	sudo bash -c 'source _bashrc; gem install sinatra'
	sudo bash -c 'source _bashrc; gem install thin'
	sudo bash -c 'source _bashrc; gem install uuidtools'
	sudo bash -c 'source _bashrc; gem install ../../../vendor/cache/libxml-ruby-*[0-9].gem'
	sudo bash -c 'source _bashrc; gem install ../../../vendor/cache/rb-img-*[0-9].gem'

zlib:
	tar xzf dl/zlib*.tar.gz
	source _bashrc; cd `basename zlib*.tar.gz .tar.gz`; ./configure --static; make
	mkdir -p opt/include opt/lib
	cp `basename zlib*.tar.gz .tar.gz`/zconf.h opt/include
	cp `basename zlib*.tar.gz .tar.gz`/zlib.h opt/include
	cp `basename zlib*.tar.gz .tar.gz`/libz.a opt/lib

libpng:
	tar xzf dl/libpng*.tar.gz
	source _bashrc; cd libpng-1.2.50; ./configure; make
	mkdir -p opt/include opt/lib
	cd `basename libpng*.tar.gz .tar.gz`; cp png*.h ../opt/include
	cd `basename libpng*.tar.gz .tar.gz`; cp .libs/libpng.a ../opt/lib

libjpeg:
	tar xzf dl/jpegsrc.v8d.tar.gz
	source _bashrc; cd jpeg-8d; ./configure; make
	mkdir -p opt/include opt/lib
	cd jpeg-8d; cp jconfig.h jerror.h jmorecfg.h  jpeglib.h ../opt/include
	cd jpeg-8d; cp .libs/libjpeg.a ../opt/lib

cleanall: clean
	rm -rf dl
	sudo rm -rf /usr/local/rvm

clean:
	rm -rf opt
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*

updateruby:
	rm -f ../ruby19.zip
	cp -r /usr/local/rvm/rubies/default ruby19
	chmod -R 755 ruby19
	find ruby19 -name '*.o' | xargs rm -f
	rm -rf ruby19/lib/ruby/gems/1.9.1/cache/*
	zip -Xqr9 ../ruby19.zip ruby19
	rm -rf ruby19
