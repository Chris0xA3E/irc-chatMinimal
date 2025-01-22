#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
cd Server && npm install
cd ../Client && npm install

# Start the server
echo "Starting the server..."
cd ../Server && node server.js &

# Wait for server to start
sleep 2

echo "Deployment complete! Server is running on port 3000"
echo "You can now open the client in your browser at http://localhost:3000" 