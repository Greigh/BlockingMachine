!macro customHeader
  RequestExecutionLevel admin  ; Request admin privileges on Windows Vista+
!macroend

!macro customInstall
  ; Add any custom installation steps for Windows
  ExecWait '"$INSTDIR\resources\installation\install-dependencies.bat"'
!macroend

!macro customUnInstall
  ; Add any custom uninstallation steps for Windows
  ExecWait '"$INSTDIR\resources\installation\uninstall-dependencies.bat"'
!macroend