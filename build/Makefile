build: clean
	echo `date +'%Y%m%d-%H%M'` > TAG
	cd osx; make build
	cd win; make build
	cd ex; make build

clean:
	rm -f TAG
	cd osx; make clean
	cd win; make clean
	cd ex; make clean
