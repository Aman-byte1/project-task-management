@echo off
echo ========================================
echo    SCREENSHOT ORGANIZER
echo ========================================
echo.

echo This script helps you organize screenshots for the Project & Task Management Application
echo.

echo Recommended screenshots to take:
echo.

echo 1. Application Interface:
echo    - Login page
echo    - Admin dashboard
echo    - Employee dashboard
echo    - Dark/Light mode toggle
echo.

echo 2. Key Features:
echo    - Task creation form
echo    - Task filtering (dropdowns)
echo    - Task details modal
echo    - Project management
echo    - User management
echo.

echo 3. Docker Setup:
echo    - Docker Compose running
echo    - Application in browser
echo    - Database connected
echo.

echo Naming Convention:
echo - Use PNG format for best quality
echo - Number them sequentially: 01-, 02-, 03-, etc.
echo - Use descriptive names: login-page, admin-dashboard, etc.
echo.

echo Example structure:
echo screenshots/
echo ├── 01-login-page.png
echo ├── 02-admin-dashboard.png
echo ├── 03-employee-dashboard.png
echo ├── 04-task-creation.png
echo ├── 05-task-filtering.png
echo ├── 06-dark-mode.png
echo └── 07-docker-setup.png
echo.

echo Press any key to open the screenshots folder...
pause >nul

start screenshots

echo.
echo Screenshots folder is now open!
echo.
echo Remember to:
echo 1. Take high-quality screenshots (PNG format)
echo 2. Use consistent naming convention
echo 3. Avoid showing sensitive information
echo 4. Update the main README.md to reference screenshots
echo.

pause
