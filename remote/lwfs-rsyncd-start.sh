#!/bin/sh
cd /home/SERVERS
sudo rsync --daemon --config=lwfs-rsyncd.conf
