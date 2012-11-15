build: testtag clean
	cp -r ../../examples LWFS_work_examples
	find LWFS_work_examples | grep '/\.git' | xargs rm -rf
	find LWFS_work_examples | grep '/\.DS_Store' | xargs rm -rf
	zip -qr9 LWFS_work_examples-`cat ../TAG`.zip LWFS_work_examples
	rm -rf LWFS_work_examples

testtag:
	test -f ../TAG

clean:
	rm -rf LWFS_work_examples*
