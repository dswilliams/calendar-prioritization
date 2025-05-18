## Tech Stack

### Frontend
- **Framework:** React
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** React Hooks (useState, useEffect)

### Backend
- **Language:** Node.js
- **Framework:** Express.js
- **Authentication:** OAuth 2.0
- **Token Storage:** Secure, encrypted server-side sessions (e.g., express-session)
- **API Key Management:** Environment variables
- **Data Storage:** JSON files (user_memory.json)

### LLM
- **Provider:** Mistral 7B (Local)
- **Inference Engine:** Ollama

### User Memory System
- **Storage:** JSON file-based persistence
- **Structure:** Modular design with personal info, relationships, goals, and preferences
- **API:** RESTful endpoints (GET, POST, PUT)
- **Default Values:** Centralized in defaultUserMemory.js
