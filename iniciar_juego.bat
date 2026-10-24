@echo off
setlocal
cd /d "%~dp0"

set "PORT=8123"
set "PY="
where py >nul 2>nul && set "PY=py"
if not defined PY where python >nul 2>nul && set "PY=python"

if not defined PY (
  echo.
  echo No se encontro Python en este equipo.
  echo No pasa nada: puedes abrir index.html directamente.
  echo Konoha 3D ya lleva los modelos integrados y funciona sin servidor.
  echo Este lanzador es solo una alternativa opcional.
  echo.
  pause
  exit /b 1
)

echo.
echo  KONOHA 3D - SERVIDOR LOCAL (OPCIONAL)
echo  -------------------------------------
echo  Carpeta: %CD%
echo  Direccion: http://127.0.0.1:%PORT%
echo.
echo  Tambien puedes jugar abriendo index.html directamente.
echo  Este lanzador solo sirve el juego por HTTP si lo prefieres.
echo  Se abrira una ventana con el servidor. Cierrala para detenerlo.
echo. 

start "Konoha 3D - Servidor local" cmd /k "%PY% -m http.server %PORT% --bind 127.0.0.1"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"
exit /b 0
