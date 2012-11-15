#!/bin/sh
cd /home/SERVERS
find lwfs -atime +7 | grep '^lwfs/[0-9abcdef\-]+$'
