@echo off
echo Installing BlockingMachine dependencies...

REM Create application directories if they don't exist
if not exist "%USERPROFILE%\Documents\BlockingMachine" (
  echo Creating application directories...
  mkdir "%USERPROFILE%\Documents\BlockingMachine"
)

REM Run the PowerShell script for more complex operations
powershell.exe -ExecutionPolicy Bypass -File "%~dp0download-filters.ps1"

REM Register file associations if needed
assoc .blocklist=BlockingMachine.FilterList
ftype BlockingMachine.FilterList="%~dp0..\..\BlockingMachine.exe" "%%1"

REM Create desktop shortcut
echo Creating desktop shortcut...
set SCRIPT="%TEMP%\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\BlockingMachine.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0..\..\BlockingMachine.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0..\..\" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0..\..\resources\app.ico" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo Installation completed successfully!
echo Starting BlockingMachine...
start "" "%~dp0..\..\BlockingMachine.exe"

exit /b 0