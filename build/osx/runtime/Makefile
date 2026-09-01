# -*- mode: makefile-gmake; -*-

RUBY=https://cache.ruby-lang.org/pub/ruby/2.7/ruby-2.7.8.tar.bz2
GETTEXT=https://ftp.jaist.ac.jp/pub/GNU/gettext/gettext-0.20.2.tar.gz
LIBJPEG=http://www.ijg.org/files/jpegsrc.v9d.tar.gz
LIBPNG=http://prdownloads.sourceforge.net/libpng/libpng-1.6.58.tar.gz
ZLIB=https://zlib.net/fossils/zlib-1.3.2.tar.gz
LIBICONV=https://ftp.jaist.ac.jp/pub/GNU/libiconv/libiconv-1.16.tar.gz
LIBLZMA=https://tukaani.org/xz/xz-5.2.5.tar.gz
LIBXML2=http://xmlsoft.org/sources/libxml2-2.9.10.tar.gz
YAML=http://pyyaml.org/download/libyaml/yaml-0.2.4.tar.gz
GDBM=https://ftp.jaist.ac.jp/pub/GNU/gdbm/gdbm-1.18.1.tar.gz
GMP=https://ftp.jaist.ac.jp/pub/GNU/gmp/gmp-6.3.0.tar.xz
OPENSSL=https://www.openssl.org/source/openssl-1.1.1w.tar.gz
RSYNC=http://rsync.samba.org/ftp/rsync/src/rsync-3.1.3.tar.gz

WGET=wget --no-check-certificate

default:
	@echo 'make [ all | ruby | gems | cleanall | clean | updateruby | rsync ]'

#all: checksdk cleanall download gettext zlib libpng libjpeg libiconv liblzma libxml2 yaml gmp gdbm openssl ruby gems rsync checkso
all: cleanall download gettext zlib libpng libjpeg libiconv liblzma libxml2 yaml gmp gdbm openssl ruby gems rsync checkso

#checksdk:
#	@source _bashrc; if [ ! -d $$SDKROOT ]; then echo "cannot find $$SDKROOT"; exit 1; fi

download:
	if [ ! -d dl ]; then mkdir dl; fi
	cd dl; if [ ! -f `basename $(RUBY)` ]; then $(WGET) $(RUBY); fi
	cd dl; if [ ! -f `basename $(GETTEXT)` ]; then $(WGET) $(GETTEXT); fi
	cd dl; if [ ! -f `basename $(LIBJPEG)` ]; then $(WGET) $(LIBJPEG); fi
	cd dl; if [ ! -f `basename $(LIBPNG)` ]; then $(WGET) $(LIBPNG); fi
	cd dl; if [ ! -f `basename $(ZLIB)` ]; then $(WGET) $(ZLIB); fi
	cd dl; if [ ! -f `basename $(LIBICONV)` ]; then $(WGET) $(LIBICONV); fi
	cd dl; if [ ! -f `basename $(LIBLZMA)` ]; then $(WGET) $(LIBLZMA); fi
	cd dl; if [ ! -f `basename $(LIBXML2)` ]; then $(WGET) $(LIBXML2); fi
	cd dl; if [ ! -f `basename $(YAML)` ]; then $(WGET) $(YAML); fi
	cd dl; if [ ! -f `basename $(GMP)` ]; then $(WGET) $(GMP); fi
	cd dl; if [ ! -f `basename $(GDBM)` ]; then $(WGET) $(GDBM); fi
	cd dl; if [ ! -f `basename $(OPENSSL)` ]; then $(WGET) $(OPENSSL); fi
	cd dl; if [ ! -f `basename $(RSYNC)` ]; then $(WGET) $(RSYNC); fi

checkso:
	(otool -L `find /usr/local/ruby27/bin -type f -name ruby`; find /usr/local/ruby27 -name '*.bundle' | xargs otool -L) | grep '	' | sort | uniq

ruby:
	tar xjf dl/ruby-*.tar.bz2
#	bash -c 'source _bashrc; cd ruby-*; ./configure --prefix=/usr/local/ruby27 --target=x86_64-apple-darwin15 --disable-install-doc --with-openssl-dir=`echo ../openssl-*`; make'
	bash -c 'source _bashrc; cd ruby-*; ./configure --prefix=/usr/local/ruby27 --disable-install-doc --with-openssl-dir=`echo ../openssl-*`; make'
	sudo bash -c 'source _bashrc; cd ruby-*; make install'

gems:
#	sudo bash -c 'source _bashrc; gem update --system'
	sudo bash -c 'source _bashrc; gem install --no-document httpclient -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document rb-fsevent -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document sinatra -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document thin -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document uuidtools -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document rackup -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document ../../../vendor/cache/ruby-lzma-*[0-9].gem -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document ../../../vendor/cache/libxml-ruby-*[0-9].gem -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document ../../../lib/swf2lwf/gems/rb-img-*[0-9].gem -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'
	sudo bash -c 'source _bashrc; gem install --no-document ../../../lib/swf2lwf/gems/actioncompiler-*[0-9].gem -- --with-cflags="$$CFLAGS" --with-ldflags="$$LDFLAGS"'

gettext:
	tar xzf dl/gettext-0.20.2.tar.gz
	source _bashrc; cd gettext-*; export CFLAGS="$$CFLAGS -Wno-incompatible-function-pointer-types"; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd gettext-*; cp gettext-runtime/intl/libintl.h /tmp/opt/include
	cd gettext-*; cp gettext-runtime/intl/.libs/libintl.a /tmp/opt/lib

zlib:
	tar xzf dl/zlib*.tar.gz
	source _bashrc; cd zlib-*; ./configure --enable-static; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd zlib-*; cp zconf.h zlib.h /tmp/opt/include
	cd zlib-*; cp libz.a /tmp/opt/lib

libpng:
	tar xzf dl/libpng*.tar.gz
#	source _bashrc; cd libpng-*; export CFLAGS="$$CFLAGS -DPNG_NO_FLOATING_POINT_SUPPORTED"; ./configure; make
	source _bashrc; cd libpng-*; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd libpng-*; cp png*.h /tmp/opt/include
	cd libpng-*; cp .libs/libpng16.a /tmp/opt/lib/libpng.a

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

liblzma:
	tar xzf dl/xz-*.tar.gz
	source _bashrc; cd xz-*; ./configure --disable-shared; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd xz-*; cp ./src/liblzma/.libs/liblzma.a /tmp/opt/lib
	cd xz-*; cp -r src/liblzma/api/lzma* /tmp/opt/include

libxml2:
	tar xzf dl/libxml2-*.tar.gz
	source _bashrc; cd libxml2-*; export CFLAGS="$$CFLAGS -Wno-incompatible-function-pointer-types"; ./configure --disable-shared; make libxml2.la
	mkdir -p /tmp/opt/include/libxml /tmp/opt/lib
	cd libxml2-*; cp include/libxml/*.h /tmp/opt/include/libxml
	cd libxml2-*; cp .libs/libxml2.a /tmp/opt/lib

yaml:
	tar xzf dl/yaml-*.tar.gz
	source _bashrc; cd yaml-*; ./bootstrap; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd yaml-*; cp include/yaml.h /tmp/opt/include
	cd yaml-*; cp src/.libs/libyaml.a /tmp/opt/lib

gdbm:
	tar xzf dl/gdbm-*.tar.gz
	source _bashrc; cd gdbm-*; ./configure --without-readline; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd gdbm-*; cp src/gdbm.h /tmp/opt/include
	cd gdbm-*; cp src/.libs/libgdbm.a /tmp/opt/lib

gmp:
	tar xJf dl/gmp-*.tar.xz
	source _bashrc; cd gmp-*; ./configure; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd gmp-*; cp gmp.h gmpxx.h /tmp/opt/include
	cd gmp-*; cp .libs/libgmp.a /tmp/opt/lib

openssl:
	tar xzf dl/openssl-*.tar.gz
	source _bashrc; cd openssl-*; ./configure darwin64-arm64-cc; make
	mkdir -p /tmp/opt/include /tmp/opt/lib
	cd openssl-*; cp -r include/openssl /tmp/opt/include
	cd openssl-*; cp -r *.a /tmp/opt/lib

rsync:
	tar xzf dl/rsync*.tar.gz
	source _bashrc; cd rsync*; ./configure; make

cleanall: clean
	rm -rf dl
	sudo rm -rf /usr/local/ruby27

clean:
	rm -rf /tmp/opt
	rm -rf ruby-*
	rm -rf gettext-*
	rm -rf zlib-*
	rm -rf libpng-*
	rm -rf jpeg-*
	rm -rf libiconv-*
	rm -rf xz-*
	rm -rf libxml2-*
	rm -rf yaml-*
	rm -rf gdbm-*
	rm -rf gmp-*
	rm -rf openssl-*
	rm -rf rsync*

updateruby:
	rm -f ../ruby27.zip
	cp -r /usr/local/ruby27 ruby27
	cp rsync-*/rsync ruby27/bin
	chmod -R 755 ruby27
	find ruby27 -name '*.o' | xargs rm -f
	rm -rf ruby27/lib/ruby/gems/2.7.*/cache/*
	rm -rf ruby27/lib/ruby/gems/2.7.*/doc/*
	rm -rf ruby27/gems/cache/*
	rm -rf ruby27/gems/doc/*
	zip -Xqr9 ../ruby27.zip ruby27
	rm -rf ruby27
