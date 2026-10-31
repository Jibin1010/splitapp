@echo off
title Pixel 10 Pro Emulator
echo Cleaning stale emulator locks...
del /f /q "%USERPROFILE%\.android\avd\Pixel_10_Pro.avd\*.lock" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\AndroidEmulator" 2>nul
cd /d "%LOCALAPPDATA%\Android\sdk\emulator"
echo Starting Pixel 10 Pro Android Emulator on your display...
emulator.exe -avd Pixel_10_Pro -no-snapshot-load -crash-report-mode never
