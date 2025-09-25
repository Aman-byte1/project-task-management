#!/bin/bash
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Dependencies installed successfully!"
echo "To start the backend: cd backend && npm run dev"
echo "To start the frontend: cd frontend && npm start"
