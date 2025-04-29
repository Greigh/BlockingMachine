@echo off
echo Uninstalling BlockingMachine components...

REM Remove file associations
assoc .blocklist=
ftype BlockingMachine.FilterList=

REM Remove desktop shortcut (if exists)
if exist "%USERPROFILE%\Desktop\BlockingMachine.lnk" (
  del /f /q "%USERPROFILE%\Desktop\BlockingMachine.lnk"
)

REM Note: We're not removing user data here by default
echo BlockingMachine uninstalled successfully.
echo.
echo Your filter lists and configuration files remain in "%USERPROFILE%\Documents\BlockingMachine".
echo If you want to remove these files, please delete them manually.

exit /b 0