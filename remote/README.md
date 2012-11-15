# LWFS Remote Server

LWFS normally works as a web server running on your PC. If you want to
check your contents on mobile devices, you need to have a WiFi access
point through which they can access to your PC. In order to avoid this
requirement, you can prepare a rsync/web server on some remote (Linux)
host and make LWFS to synchronize converted contents onto the remote
host.

## Files

This folder contains the following files for preparing a LWFS remote
server.

* lwfs-cleanup-daily.sh
    * Script to erase old files/folders under lwfs/.
* lwfs-apache.conf
    * Apache configuration file.
* lwfs-rsyncd-start.sh
    * Script to start rsyncd.
* lwfs-rsyncd.conf
    * Rsyncd configuration file.

## Preparation

    sudo mkdir -p /home/SERVERS/lwfs
    cp lwfs-cleanup-daily.sh /etc/cron.daily
    cp lwfs-apache.conf /etc/apache/conf.d

## How To Start

    sudo /usr/sbin/apachectl restart
    ./lwfs-rsyncd-start.sh
