@echo off
echo Starting local web server for EMBEDGROW...
echo Once started, leave this window open. 
echo Press Ctrl+C to stop the server.
start http://localhost:8000
python -m http.server 8000
