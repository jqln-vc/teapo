@echo off
REM teapo — headless dev-server launcher for Task Scheduler (mirrors ninedocs).
REM
REM The task starts this through `conhost --headless` so no console window appears.
REM conhost always exits 0, whatever this script returns, so Task Scheduler cannot
REM tell a crash from a clean exit and its own restart setting never fires. The
REM restarts therefore live here: up to 3, one minute apart, like the ninedocs task.
REM
REM Runs vite directly with node rather than through `npm run dev`, so there is one
REM process to supervise instead of an npm wrapper around it.
REM
REM Output goes to run.log. The previous session's log is kept as run.prev.log, so
REM a crash from before the last logon is still readable.
setlocal
cd /d "%~dp0"
if exist run.log move /y run.log run.prev.log >nul

set /a attempt=0
:start
set /a attempt+=1
echo [%date% %time%] starting teapo (attempt %attempt% of 4) >> run.log
"C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js >> run.log 2>&1
set code=%errorlevel%
echo [%date% %time%] teapo exited with code %code% >> run.log

rem 0xC0000142 (-1073741502) is STATUS_DLL_INIT_FAILED: the process could not start
rem at all, which is what every child reports while the job object is being torn
rem down by Stop-ScheduledTask. Retrying then is pointless — and worse, the sleep
rem below fails instantly too, so the whole retry budget evaporates in milliseconds
rem and a later genuine crash finds nothing left. Treat it as "we are being stopped".
if %code%==-1073741502 (
  echo [%date% %time%] process tree is being torn down; not retrying >> run.log
  exit /b %code%
)

if %attempt% geq 4 (
  echo [%date% %time%] giving up after %attempt% attempts; the next logon will try again >> run.log
  exit /b %code%
)
echo [%date% %time%] restarting in 60s >> run.log
REM `timeout` refuses to run without an interactive console; ping is the portable sleep.
ping -n 61 127.0.0.1 >nul
goto start
