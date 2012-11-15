build: testtag clean
	mkdir -p tmp/LWFS
	cp -a LWFS tmp/LWFS/LWFS
	cp -a README*.txt *.app tmp/LWFS
	unzip -q ruby19.zip -d tmp/LWFS/LWFS/.a
	mkdir -p tmp/LWFS/LWFS/.a/lwfs
	cp -a ../../{htdocs,lib,lwfs.rb,tmpl} tmp/LWFS/LWFS/.a/lwfs
	find tmp/LWFS | grep '/\.git' | xargs rm -rf
	find tmp/LWFS | grep '/\.DS_Store' | xargs rm -rf
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
	rm -rf LWFS-osx* LWFS-osx*.zip
