# Calendar Prioritizer

## Project Overview
The Calendar Prioritizer is an intelligent application designed to help users manage their schedules more effectively. It leverages a modular AI agent system to prioritize calendar events, flag potential issues (e.g., missing agendas, conflicts), and provide personalized insights based on user memory. The application integrates with Google Calendar and uses a local Large Language Model (LLM) for advanced event analysis.

## Key Features
- **LLM-based Event Prioritization:** Utilizes a local Mistral 7B LLM via Ollama to intelligently rank calendar events.
- **Issue Flagging:** Automatically identifies and flags common calendar issues such as missing agendas, no responses from attendees, and scheduling conflicts.
- **Personalized Prioritization:** Incorporates a user memory system to store personal information, relationships, goals, and preferences, enabling highly personalized event prioritization.
- **Modular AI Agent System:** Features a flexible architecture with specialized agents:
    - **Prioritization Agent:** Core logic for event analysis and ranking.
    - **Research Agent:** Enhances event context through web searches using a self-hosted SearXNG instance.
    - **Relationship Agent:** (Future enhancement) Provides context on attendee relationships.
- **Google Calendar Integration:** Seamlessly connects with Google Calendar for event fetching and management.
- **User-Friendly Interface:** A clean and intuitive frontend built with React and Tailwind CSS, designed for clear presentation of prioritized events and issues.
- **"Productive Sass" Personality:** Delivers insights and error messages with a unique, engaging tone.

## Tech Stack
The project is built using a modern full-stack approach:

### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** React Hooks

### Backend
- **Language:** Node.js
- **Framework:** Express.js
- **Authentication:** Google OAuth 2.0
- **Data Storage:** JSON files (for user memory)

### AI & LLM
- **Local LLM:** Mistral 7B via Ollama
- **Web Search:** Self-hosted SearXNG instance (Dockerized)

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose

## Architecture Overview
The application follows a client-server architecture with a sophisticated AI agent system at its core. The React frontend communicates with the Node.js/Express backend. The backend handles Google Calendar integration, user memory management, and orchestrates the AI agents. The Prioritization Agent uses Ollama for LLM inference, while the Research Agent leverages SearXNG for web searches to enrich event context.

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/en/download/) (includes npm)
- [Ollama](https://ollama.ai/download) (for running local LLMs)
- [Docker](https://www.docker.com/get-started/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Environment Variables
Create a `.env` file in the `backend/` directory with your Google OAuth 2.0 credentials. You will need to set up a Google Cloud Project and enable the Google Calendar API.
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:5001/auth/google/callback
```

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/calendar-prioritizer.git
    cd calendar-prioritizer
    ```
2.  **Install Backend Dependencies:**
    ```bash
    npm install
    ```
3.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

### Ollama Setup
1.  **Start Ollama Service:**
    ```bash
    ollama serve
    ```
    This will start the Ollama service, typically on `http://localhost:11434`.
2.  **Create/Pull Calendar Prioritizer Model:**
    ```bash
    ollama create calendar-prioritizer -f Modelfile
    ```
    If you need to update the model later, you can use `ollama pull calendar-prioritizer`.
3.  **Verify Model Availability:**
    ```bash
    ollama list
    ```
    Ensure `calendar-prioritizer` is listed.

### SearXNG Setup (Local Web Search)
The Research Agent uses a self-hosted SearXNG instance.
1.  **Run Setup Script:**
    ```bash
    ./setup_searxng.sh
    ```
    This script will set up and start the SearXNG Docker container.
2.  **Verify Installation:**
    ```bash
    ./test_searxng.sh
    ```
    SearXNG should be available at `http://localhost:8080`.

## Running the Application

To run the full application, you will need multiple terminal windows.

### Complete Startup Sequence
1.  **Start Ollama:** (If not already running)
    ```bash
    ollama serve
    ```
2.  **Start SearXNG:** (If not already running)
    ```bash
    ./dev_searxng.sh start
    ```
3.  **Start the Backend Server:**
    ```bash
    node backend/index.js
    ```
    The backend server will start on `http://localhost:5001`.
4.  **Start the Frontend Development Server:**
    ```bash
    cd frontend
    npm run dev
    ```
    The frontend will typically start on `http://localhost:5173`.

### Access the Application
Open your web browser and navigate to the URL provided by the frontend development server (e.g., `http://localhost:5173`).

## Troubleshooting

### Ollama Issues
- **Check Status:** `ollama ps`
- **Restart:** `killall ollama` then `ollama serve`

### Backend Issues
- **Port in Use:** If port `5001` is in use, find and kill the process:
    ```bash
    lsof -i :5001
    kill -9 <PID>
    ```

### Frontend Issues
- **Clear Cache & Reinstall:**
    ```bash
    cd frontend
    npm cache clean --force
    rm -rf node_modules
    npm install
    ```

### SearXNG Issues
- **Check Container Status:** `docker compose ps`
- **View Logs:** `docker compose logs searxng`
- **Reset Configuration:** Remove `searxng/` directory and run `./setup_searxng.sh` again.

## Future Enhancements
- Implement Microsoft Calendar integration.
- Enhance Relationship Agent for more sophisticated relationship context.
- Implement auto-update of user memory based on feedback interactions.
- Add loading states and animations for improved user experience.
