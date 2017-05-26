# -*- mode: makefile-gmake; -*-

RUBY=https://cache.ruby-lang.org/pub/ruby/2.3/ruby-2.3.4.tar.bz2
LIBJPEG=http://www.ijg.org/files/jpegsrc.v9b.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.2.57.tar.gz
ZLIB=http://zlib.net/zlib-1.2.11.tar.gz
LIBICONV=http://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.15.tar.gz
LIBXML2=http://xmlsoft.org/sources/libxml2-2.9.4.tar.gz
LIBYAML=https://github.com/yaml/libyaml/archive/0.1.7.tar.gz
GDBM=ftp://ftp.gnu.org/gnu/gdbm/gdbm-1.13.tar.gz
GMP=https://ftp.gnu.org/gnu/gmp/gmp-6.1.2.tar.bz2
#OPENSSL=https://www.openssl.org/source/openssl-1.0.2l.tar.gz
RSYNC=http://rsync.samba.org/ftp/rsync/src/rsync-3.1.2.tar.gz

WGET=wget --no-check-certificate

default:
	@echo 'make [ all | ruby | gems | cleanall | clean | updateruby | rsync ]'

#all: cleanall download zlib libpng libjpeg libiconv libxml2 libyaml gmp gdbm openssl ruby gems rsync
all: cleanall download zlib libpng libjpeg libiconv libxml2 libyaml gmp gdbm ruby gems rsync

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(RUBY)` ]; then $(WGET) $(RUBY); fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi
	cd dl; if [ ! -f `basename $(LIBICONV)` ]; then $(WGET) $(LIBICONV); fi
	cd dl; if [ ! -f `basename $(LIBXML2)` ]; then $(WGET) $(LIBXML2); fi
	cd dl; if [ ! -f `basename $(LIBYAML)` ]; then $(WGET) $(LIBYAML); mv `basename $(LIBYAML)` libyaml-`basename $(LIBYAML)`; fi
	cd dl; if [ ! -f `basename $(GMP)` ]; then $(WGET) $(GMP); fi
	cd dl; if [ ! -f `basename $(GDBM)` ]; then $(WGET) $(GDBM); fi
#	cd dl; if [ ! -f `basename $(OPENSSL)` ]; then $(WGET) $(OPENSSL); fi
	cd dl; if [ ! -f `basename $(RSYNC)` ]; then $(WGET) $(RSYNC); fi

checkso:
	(otool -L `find /usr/local/ruby23/bin -type f -name ruby`; find /usr/local/ruby23 -name '*.bundle' | xargs otool -L) | grep '	' | sort | uniq

ruby:
	tar xjf dl/ruby-*.tar.bz2
	bash -c 'source _bashrc; cd ruby-*; ./configure --prefix=/usr/local/ruby23 --target=i386-apple-darwin10.8.0 --disable-install-doc; make'
	sudo bash -c 'source _bashrc; cd ruby-*; make install'

gems:
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri httpclient -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri rb-fsevent -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri sinatra -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri thin -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri uuidtools -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri ../../../vendor/cache/ruby-lzma-*[0-9].gem -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri ../../../vendor/cache/libxml-ruby-*[0-9].gem -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri ../../../lib/swf2lwf/gems/rb-img-*[0-9].gem -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'
	sudo bash -c 'source _bashrc; gem install --no-rdoc --no-ri ../../../lib/swf2lwf/gems/actioncompiler-*[0-9].gem -- --with-cflags=\"$$CFLAGS\" --with-ldflags=\"$$LDFLAGS\"'

zlib:
	tar xzf dl/zlib*.tar.gz
	source _bashrc; cd zlib-*; ./configure --static; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd zlib-*; cp zconf.h zlib.h /tmp/opt/include
	cd zlib-*; cp libz.a /tmp/opt/lib

libpng:
	tar xzf dl/libpng*.tar.gz
	source _bashrc; cd libpng-*; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd libpng-*; cp png*.h /tmp/opt/include
	cd libpng-*; cp .libs/libpng.a /tmp/opt/lib

libjpeg:
	tar xzf dl/jpegsrc.*.tar.gz
	source _bashrc; cd jpeg-*; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd jpeg-*; cp jconfig.h jerror.h jmorecfg.h  jpeglib.h /tmp/opt/include
	cd jpeg-*; cp .libs/libjpeg.a /tmp/opt/lib

libiconv:
	tar xzf dl/libiconv-*.tar.gz
	source _bashrc; cd libiconv-*; ./configure --disable-shared; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd libiconv-*; cp lib/libcharset.h /tmp/opt/include
	cd libiconv-*; cp lib/libcharset.a /tmp/opt/lib
	cd libiconv-*; cp include/iconv.h /tmp/opt/include
	cd libiconv-*; cp lib/.libs/libiconv.a /tmp/opt/lib

libxml2:
	tar xzf dl/libxml2-*.tar.gz
	source _bashrc; cd libxml2-*; ./configure --disable-shared; make libxml2.la
	mkdir -p /tmp/opt/include/libxml /tmp/opt/lib
	cd libxml2-*; cp include/libxml/*.h /tmp/opt/include/libxml
	cd libxml2-*; cp .libs/libxml2.a /tmp/opt/lib

libyaml:
	tar xzf dl/libyaml-*.tar.gz
	source _bashrc; cd libyaml-*; ./bootstrap; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd libyaml-*; cp include/yaml.h /tmp/opt/include
	cd libyaml-*; cp src/.libs/libyaml.a /tmp/opt/lib

gdbm:
	tar xzf dl/gdbm-*.tar.gz
	source _bashrc; cd gdbm-*; ./configure --without-readline; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd gdbm-*; cp src/gdbm.h /tmp/opt/include
	cd gdbm-*; cp src/.libs/libgdbm.a /tmp/opt/lib

gmp:
	tar xjf dl/gmp-*.tar.bz2
	source _bashrc; cd gmp-*; ./configure ABI=32; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd gmp-*; cp gmp.h gmpxx.h /tmp/opt/include
	cd gmp-*; cp .libs/libgmp.a /tmp/opt/lib

# openssl:
# 	tar xzf dl/openssl-*.tar.gz
# 	source _bashrc; cd openssl-*; ./configure darwin64-i386-cc; make
# 	mkdir -p /tmp/opt/include /tmp/opt/lib
# 	cd openssl-*; cp -r include/openssl /tmp/opt/include
# 	cd openssl-*; cp -r *.a /tmp/opt/lib

rsync:
	tar xzf dl/rsync*.tar.gz
	source _bashrc; cd rsync*; ./configure; make

cleanall: clean
	rm -rf dl
	sudo rm -rf /usr/local/ruby23

clean:
	rm -rf /tmp/opt
	rm -rf ruby-*
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*
	rm -rf libiconv-*
	rm -rf libxml2-*
	rm -rf libyaml-*
	rm -rf gdbm-*
	rm -rf gmp-*
#	rm -rf openssl-*
	rm -rf rsync*

updateruby:
	rm -f ../ruby23.zip
	cp -r /usr/local/ruby23 ruby23
	cp rsync-*/rsync ruby23/bin
	chmod -R 755 ruby23
	find ruby23 -name '*.o' | xargs rm -f
	rm -rf ruby23/lib/ruby/gems/2.3.*/cache/*
	rm -rf ruby23/lib/ruby/gems/2.3.*/doc/*
	rm -rf ruby23/gems/cache/*
	rm -rf ruby23/gems/doc/*
	zip -Xqr9 ../ruby23.zip ruby23
	rm -rf ruby23
