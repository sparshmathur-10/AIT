#!/bin/bash

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy frontend build to Django templates and static
echo "Copying frontend files to Django..."
cp frontend/dist/index.html backend/templates/
cp -r frontend/dist/assets backend/staticfiles/

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
python -m pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Build complete!" 