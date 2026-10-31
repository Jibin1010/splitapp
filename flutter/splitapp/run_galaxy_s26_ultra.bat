@echo off
title Samsung Galaxy S26 Ultra Emulator (One UI 7)
echo Cleaning stale emulator locks...
del /f /q "%USERPROFILE%\.android\avd\Galaxy_S26_Ultra.avd\*.lock" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\AndroidEmulator" 2>nul
cd /d "%LOCALAPPDATA%\Android\sdk\emulator"
echo Starting Samsung Galaxy S26 Ultra Android Emulator on your display...
emulator.exe -avd Galaxy_S26_Ultra -no-snapshot-load -crash-report-mode never
