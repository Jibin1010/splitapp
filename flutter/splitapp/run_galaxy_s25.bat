@echo off
title Samsung Galaxy S25 Base Emulator
echo Cleaning stale emulator locks...
del /f /q "%USERPROFILE%\.android\avd\Galaxy_S25.avd\*.lock" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\AndroidEmulator" 2>nul
cd /d "%LOCALAPPDATA%\Android\sdk\emulator"
echo Starting Samsung Galaxy S25 (Base) Android Emulator on your display...
emulator.exe -avd Galaxy_S25 -no-snapshot-load -crash-report-mode never
