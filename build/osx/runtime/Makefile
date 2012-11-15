# -*- mode: makefile-gmake; -*-

default:
	@echo 'make [ all | ruby | gems | cleanall | clean | updateruby ]'

all: cleanall ruby gems

ruby:
	sudo bash -c 'source _bashrc; curl -L https://get.rvm.io | bash -s stable --ruby'

gems:
	sudo bash -c 'source _bashrc; gem install httpclient'
	sudo bash -c 'source _bashrc; gem install rb-fsevent'
	sudo bash -c 'source _bashrc; gem install uuidtools'
	sudo bash -c 'mkdir /opt/local/lib/bk; mv /opt/local/lib/lib{iconv,xml2,z}*.dylib /opt/local/lib/bk;  mv /opt/local/lib/lib{iconv,xml2}*.la /opt/local/lib/bk'
	sudo bash -c 'source _bashrc; gem install ../../../gems/libxml-ruby-*[0-9].gem'
	sudo bash -c 'mv /opt/local/lib/bk/* /opt/local/lib; rmdir /opt/local/lib/bk'
	sudo bash -c 'mkdir /opt/local/lib/bk; mv /opt/local/lib/lib{jpeg,png,z}*.dylib /opt/local/lib/bk;  mv /opt/local/lib/lib{jpeg,png}*.la /opt/local/lib/bk'
	sudo bash -c 'source _bashrc; gem install ../../../gems/rb-img-*[0-9].gem'
	sudo bash -c 'mv /opt/local/lib/bk/* /opt/local/lib; rmdir /opt/local/lib/bk'

cleanall: clean
	sudo rm -rf /usr/local/rvm

clean:
	@echo

updateruby:
	rm -f ../ruby19.zip
	cp -r /usr/local/rvm/rubies/default ruby19
	chmod -R 755 ruby19
	find ruby19 -name '*.o' | xargs rm -f
	rm -rf ruby19/lib/ruby/gems/1.9.1/cache/*
	zip -Xqr9 ../ruby19.zip ruby19
	rm -rf ruby19
