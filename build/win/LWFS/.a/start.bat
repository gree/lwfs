cd /d %~dp0
set PATH=%~dp0ruby19\bin;%PATH%
if exist "..\.lwfsrc" copy "..\.lwfsrc" tmp.bat & call tmp.bat
set JRUBY_OPTS="--server -J-Djruby.jit.threshold=30"
set LWFS_REMOTE_SERVER=
set TZ=
cd lwfs
ruby -Ku %~dp0ruby19\bin\rackup lwfs.ru
