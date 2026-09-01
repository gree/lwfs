

                                 LWFS
                           Mac OS X edition


Installation
============

1. Right-click the folder contains this README.txt and select
   "Services/New Terminal at Folder."

2. Enter
   xattr -cr .
   and hit return.

3. Open stop.app. This will stop any running LWFS instance.

4. Remove previously installed LWFS applications.

5. Copy this folder onto your drive, such as under /Application.


Note on recent OS X
-------------------

Recent OS X requires an apple script downloaded "to be signed," but
start.app and stop.app here are not signed so the following message
will be displayed if we try to open start.app, for example:

     "start" is damaged and can't be opened. You should move it to the
     Trash.

The above fix-file-permissions fixes this issue by adjusting file
attributes.

Start/Stop LWFS
===============

* Open start.app or start-remote.app. This starts LWFS and open a
  browser.

  * If you open start.app, the browser will connect to the web server
    that LWFS invokes on the local PC. You can work even if you are
    offline.

  * If you open start-remote.app, the browser will connect to the
    common remote web server. You can easily share conversion results
    with others.

* Open stop.app to stop LWFS.
