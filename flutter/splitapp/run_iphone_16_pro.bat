@echo off
title Apple iPhone 16 Pro Emulator
echo Cleaning stale emulator locks...
del /f /q "%USERPROFILE%\.android\avd\iPhone_16_Pro.avd\*.lock" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\AndroidEmulator" 2>nul
cd /d "%LOCALAPPDATA%\Android\sdk\emulator"
echo Starting Apple iPhone 16 Pro Mobile Emulator on your display...
emulator.exe -avd iPhone_16_Pro -no-snapshot-load -crash-report-mode never
