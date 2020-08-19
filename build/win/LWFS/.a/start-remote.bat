cd /d "%~dp0"
set PATH=%~dp0ruby27\bin;%PATH%
if exist "..\.lwfsrc" copy "..\.lwfsrc" tmp.bat & call tmp.bat
set JRUBY_OPTS="--server -J-Djruby.jit.threshold=30"
set TZ=
set LWFS_USE_REMOTE_SERVER=1
set LWFS_LOG_FILE=../../lwfs.log
for /f "usebackq tokens=*" %%i in (`ruby -e "puts Encoding.default_external"`) do @set LWFS_EXTERNAL_ENCODING=%%i
cd lwfs

if "%LWFS_DATA_FOLDER%" == "." goto :setdatafolder

ver | find "XP"
if %errorlevel% EQU 0 goto :winxp

:run
ruby -Ku "%~dp0ruby27\bin\rackup" lwfs.ru
exit

:setdatafolder
set LWFS_DATA_FOLDER=..\..\..
goto :run

:winxp
set ShellFolders=HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders
for /f "usebackq tokens=*" %%i in (`reg query "%ShellFolders%" /v Desktop`) do @set RESULT=%%i
set LWFS_DATA_FOLDER=%RESULT:Desktop	REG_SZ	=%
goto :run
