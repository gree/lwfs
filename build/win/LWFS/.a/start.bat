cd /d "%~dp0"
set PATH=%~dp0ruby19\bin;%PATH%
if exist "..\.lwfsrc" copy "..\.lwfsrc" tmp.bat & call tmp.bat
set JRUBY_OPTS="--server -J-Djruby.jit.threshold=30"
set TZ=
set LWFS_USE_REMOTE_SERVER=0
set LWFS_LOG_FILE=../../lwfs.log
cd lwfs

if "%LWFS_DATA_FOLDER%" == "." goto :setdatafolder

ver | find "XP"
if %errorlevel% EQU 0 goto :winxp

:run
ruby "%~dp0ruby19\bin\rackup" lwfs.ru
exit

:setdatafolder
set LWFS_DATA_FOLDER=..\..\..
goto :run

:winxp
set ShellFolders=HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders
for /f "usebackq tokens=*" %%i in (`reg query "%ShellFolders%" /v Desktop`) do @set RESULT=%%i
set LWFS_DATA_FOLDER=%RESULT:Desktop	REG_SZ	=%
goto :run
