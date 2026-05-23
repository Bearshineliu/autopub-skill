@echo off
echo 启动 autopub 飞书代理...
cd /d "%~dp0"
start cmd /k "node local-proxy.js"
echo 代理已启动
echo.
echo 在 Claude Code 中说"发布"即可推送内容到微信草稿箱
pause
