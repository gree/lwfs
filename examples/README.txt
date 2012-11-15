This folder contains several examples that can be converted with LWFS.

* 01_animated_building.swf, 02_animated_building/

  Basic examples. A swf file placed directly under LWFS_work/ will be
  converted by extracting images embedded in the swf file itself. If
  you correctly stores linkage information in the swf file (by using
  LWF_Publish.jsfl) and put corresponding images as in
  02_animated_building/, LWFS utilizes these images.

* 03_lwf_logo

  A bouncing lwf logo and a corresponding .lwfconf file. The logo is
  placed at (0,0) in Flash -- such a placement is often happen when
  you want to create a lwf and control its position later. It however
  makes difficult to check the result, so a user may put a .lwfconf
  file to adjust a initial position.

* 04_cat

  An example contains JavaScript as in the form of ActionScript
  comments. A cat moves horizontally by the script and jumps when a
  user taps the button. This example also utilizes a texture sheet.

* 05_template

  A self-contained template project. It contains index.html, lwf.js,
  etc., and don't depend on any script predefined in LWFS. LWFS works
  as a simple web server if there is index.html. A displayed part
  itself is converted separately from 02_animated_building/ and is
  referred here. Various parameters are configured with
  window["test_args"] and/or in the URL, and the page works well not
  only on PC but also on Android/iOS device. Though this example
  itself doesn't respond to touches, test.js utilized here correctly
  handle them.
