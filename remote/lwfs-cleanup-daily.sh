#!/bin/sh
cd /home/SERVERS

dt=15552000 # 60 * 60 * 24 * 30 * 6
d0=`date +%s`
d0=`expr $d0 - $dt`

for i in lwfs/[0-9abcdef][0-9abcdef][0-9abcdef][0-9abcdef][0-9abcdef][0-9abcdef][0-9abcdef][0-9abcdef]*
do
    d=`find $i -print0 | xargs -0 stat -c %y | sort -n -r | head -1`
    d=`date +%s -d "$d"`
    if [ $d -lt $d0 ]
    then
	echo $i
    fi
done | xargs rm -rf
