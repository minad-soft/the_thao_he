@echo off
cd /d "%~dp0"

echo ==========================================
echo    TU DONG DAY CODE LEN GITHUB
echo ==========================================

IF NOT EXIST ".git" (
    echo [1/5] Khoi tao Git repository lan dau...
    git init
    git remote add origin https://github.com/minad-soft/the_thao_he.git
    git branch -M main
) ELSE (
    echo [1/5] Thu muc da co Git repository.
)

echo [2/5] Dang them cac file thay doi vao Git...
git add .

echo [3/5] Dang tao commit moi...
git commit -m "Auto commit"

echo [4/5] Dang day code len GitHub (nhanh main)...
git push -u origin main

echo.
echo [5/5] DA DAY CODE THANH CONG!
echo ==========================================
pause
