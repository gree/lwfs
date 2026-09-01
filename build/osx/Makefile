build: testtag clean
	mkdir -p tmp/LWFS
	cp -a LWFS tmp/LWFS/LWFS
	cp -a README*.txt *.app tmp/LWFS
	for i in x86_64 arm64; \
	do \
	  unzip -q ruby27-$$i.zip -d tmp/LWFS/LWFS/.a; \
	  mv tmp/LWFS/LWFS/.a/ruby27 tmp/LWFS/LWFS/.a/ruby27-$$i; \
	done
	mkdir -p tmp/LWFS/LWFS/.a/lwfs
	cp -a ../../{lib,lwfs.rb,lwfs.ru,lwfs.conf,tmpl} tmp/LWFS/LWFS/.a/lwfs
	find tmp/LWFS -name '.git*' -print0 | xargs -0 rm -rf
	find tmp/LWFS -name '.DS_Store' -print0 | xargs -0 rm -rf
	chmod -R 755 tmp/LWFS
	TAG=`cat ../TAG`; \
	echo $$TAG > tmp/LWFS/LWFS/.a/lwfs/lib/LWFS_VERSION; \
	cd tmp; \
	zip -Xqr9 ../LWFS-osx-$$TAG.zip LWFS; \
	cd ..; \
	rm -rf tmp

testtag:
	test -f ../TAG

clean:
	rm -rf LWFS-osx* LWFS-osx*.zip tmp

buildcontrolapps:
	for i in start stop; \
	do \
	  rm -rf $$i.app; \
	  platypus --quit-after-execution --name $$i.app --bundle-identifier net.gree.lwfs.$$i $$i.sh $$i.app; \
	done
