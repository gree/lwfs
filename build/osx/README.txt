

                                 LWFS
                           Mac OS X edition


Installation
============

1. Right-click fix-file-permissions and select "Open." Select "OK" for
   the following dialog:

     "fix-file-permissions" is from an unidentified developer. Are you
     sure you want to open it?

   The terminal then opens and fix-file-permissions starts. Close the
   terminal once the following message is displayed:

     Process completed

2. Open stop.app. This will stop any running LWFS instance.

3. Remove previously installed LWFS applications.

4. Copy this folder onto your drive, such as under /Application.


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
