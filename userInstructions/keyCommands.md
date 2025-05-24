# Key Commands for Calendar Prioritizer

This guide provides all the essential commands needed to run the Calendar Prioritizer application, including setting up and running Ollama, the local LLM, SearXNG, backend, and frontend.

## Prerequisites

Ensure you have the following installed:
- Node.js and npm
- Ollama (for running the local LLM)
- Docker and Docker Compose (for running SearXNG)

## SearXNG Management

The Research Agent uses a self-hosted SearXNG instance for web searches. The `setup_searxng.sh` script now includes dependency checks for `docker` and `openssl`. Use the `dev_searxng.sh` script to manage the SearXNG Docker container. This script has been reviewed and fixed for duplicate content.

```bash
# Start SearXNG in detached mode and run tests
./dev_searxng.sh start

# Stop the running SearXNG container
./dev_searxng.sh stop

# Restart the SearXNG container
./dev_searxng.sh restart

# View real-time logs from the SearXNG container
./dev_searxng.sh logs

# Run tests to verify SearXNG instance connectivity and functionality
./dev_searxng.sh test
```

## Step 1: Start Ollama

Ollama needs to be running before you can use the local LLM.

```bash
# Start the Ollama service
ollama serve
ollama run calendar-prioritizer
```

This will start the Ollama service on http://localhost:11434.

## Step 2: Create and Pull the Calendar Prioritizer Model

If you haven't already created the calendar-prioritizer model, you need to create it using the Modelfile.

```bash
# Create the calendar-prioritizer model
ollama create calendar-prioritizer -f Modelfile
```

If the model already exists but you want to update it:

```bash
# Update the calendar-prioritizer model
ollama pull calendar-prioritizer
```

## Step 3: Verify the Model is Available

Check that the calendar-prioritizer model is available in Ollama:

```bash
# List all available models
ollama list
```

You should see `calendar-prioritizer` in the list of models.

## Step 4: Start SearXNG

Ensure your local SearXNG instance is running.

```bash
# Start SearXNG in detached mode and run tests
./dev_searxng.sh start
```

## Step 5: Start the Backend Server

Navigate to the project root directory and start the backend server:

```bash
# Start the backend server
node backend/index.js
```

The backend server will start on http://localhost:5001.

## Step 6: Start the Frontend Development Server

In a new terminal window, navigate to the project root directory and start the frontend development server:

```bash
# Navigate to the frontend directory
cd frontend

# Start the frontend development server
npm run dev
```

The frontend development server will start on http://localhost:5173 (or another port if 5173 is already in use).

## Step 7: Access the Application

Open your web browser and navigate to:

```
http://localhost:5173
```

Or the alternative port if provided in the terminal output.

## Additional Commands

### Install Dependencies

If you need to install or update dependencies:

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Build the Frontend for Production

```bash
# Navigate to the frontend directory
cd frontend

# Build for production
npm run build
```

### Test the Ollama API

To test if the Ollama API is working correctly:

```bash
# Test the Ollama API with a simple prompt
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "calendar-prioritizer",
  "prompt": "Hello, how are you?",
  "stream": false
}'
```

### Troubleshooting

### Ollama Issues

If you encounter issues with Ollama:

```bash
# Check Ollama status
ollama ps

# Restart Ollama
killall ollama
ollama serve
```

### Backend Issues

If the backend server fails to start:

```bash
# Check if port 5001 is already in use
lsof -i :5001

# Kill the process using port 5001 (replace PID with the actual process ID)
kill -9 PID
```

### Frontend Issues

If the frontend development server fails to start:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

## Complete Startup Sequence

For a fresh start of the entire application, run these commands in order:

```bash
# 1. Start Ollama
ollama serve

# In a new terminal:
# 2. Verify the calendar-prioritizer model
ollama list

# In a new terminal:
# 3. Start SearXNG
./dev_searxng.sh start

# In a new terminal:
# 4. Start the backend server
node backend/index.js

# In a new terminal:
# 5. Start the frontend development server
cd frontend && npm run dev

# 6. Open the application in your browser at the URL shown in the frontend terminal output
