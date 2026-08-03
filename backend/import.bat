@echo off
setlocal
set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"
if not exist "%MYSQL_EXE%" (
  echo MySQL client was not found at %MYSQL_EXE%.
  echo Install XAMPP/MySQL or update the path in this file.
  pause
  exit /b 1
)

echo Importing database schema...
"%MYSQL_EXE%" -u root -p < "%~dp0init.sql"
pause
