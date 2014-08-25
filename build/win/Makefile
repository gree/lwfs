build: testtag clean
	mkdir -p tmp/LWFS
	cp -a LWFS tmp/LWFS/LWFS
	cp -a README*.txt *.js tmp/LWFS
	unzip -q ruby19.zip -d tmp/LWFS/LWFS/.a
	mkdir -p tmp/LWFS/LWFS/.a/lwfs
	cp -a ../../{lib,lwfs.rb,lwfs.ru,lwfs.conf,tmpl} tmp/LWFS/LWFS/.a/lwfs
	find tmp/LWFS -name '.git*' -print0 | xargs -0 rm -rf
	find tmp/LWFS -name '.DS_Store' -print0 | xargs -0 rm -rf
	chmod -R 755 tmp/LWFS
	TAG=`cat ../TAG`; \
	echo $$TAG > tmp/LWFS/LWFS/.a/lwfs/lib/LWFS_VERSION; \
	cd tmp; \
	zip -Xqr9 ../LWFS-win-$$TAG.zip LWFS; \
	cd ..; \
	rm -rf tmp

testtag:
	test -f ../TAG

clean:
	rm -rf LWFS-win* LWFS-win*.zip tmp
