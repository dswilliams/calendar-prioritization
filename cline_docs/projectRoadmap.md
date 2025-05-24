## Calendar Prioritizer - Project Roadmap

### High-Level Goals
- [x] Determine priority of calendar events using LLM
- [x] Flag potential calendar issues
- [x] Implement a "Productive Sass" personality
- [ ] Implement Microsoft Calendar integration (deprioritized for now)
- [x] Store the status of the connection and/or check each time we read the calendar
- [ ] UI/UX: Implement slow moving animations and a scientific, yet approachable feel to the front end
- [x] Implement user memory system for personalized calendar prioritization
- [x] Convert prioritization logic into a modular AI agent system (Phase 1)
- [x] Enhance AI agent system with specialized agents for research (completed) and relationship context (in progress)

### Key Features
- [x] User authentication and authorization (Google Calendar Implemented)
- [x] Calendar integration (Google Calendar Implemented)
- [x] LLM-based event prioritization
- [x] Issue flagging (missing agenda, no response, conflicts)
- [x] User-friendly UI with clear presentation of prioritized events and issues
- [x] "Productive Sass" personality in UI and error messages
- [x] User memory system to store personal information, relationships, goals, and preferences
- [ ] Auto-update of user memory based on feedback interactions

### Completion Criteria
- [ ] All key features are implemented and functional
- [ ] The application can successfully connect to Google and Microsoft Calendars
- [x] Calendar events are accurately prioritized based on the defined criteria
- [x] Potential calendar issues are correctly identified and flagged
- [x] The UI is intuitive and easy to use
- [x] The "Productive Sass" personality is consistently applied throughout the application
- [x] User memory is effectively used to personalize calendar prioritization
- [ ] The application is thoroughly tested and documented

### Completed Tasks
- Implemented Google Calendar OAuth 2.0 authentication
- Implemented basic calendar read functionality for Google Calendar (current week)
- Implemented LLM-based event prioritization using Ollama API
- Implemented issue flagging (missing agenda, no response, conflicts)
- Implemented user-friendly UI with clear presentation of prioritized events and issues
- Implemented "Productive Sass" personality in UI and error messages
- Implemented token refresh mechanism for Google OAuth
- Added robust error handling for Ollama API connection issues
- Enhanced calendar event formatting with more detailed information
- Improved error handling in the frontend for authentication issues
- Prevented calendar data from being fetched on every page refresh
- Implemented user memory system with persistent storage (user_memory.json)
- Created API endpoints for user memory operations (GET, POST, PUT)
- Developed UserProfile component for managing user information
- Integrated user memory with calendar prioritization for personalized results
- Converted prioritization logic into a modular AI agent system (Phase 1)
  - Created Prioritization Agent to handle core prioritization logic
  - Created placeholder Research Agent for future web search capabilities
  - Created placeholder Relationship Agent for future relationship context
  - Implemented Agent Orchestrator to manage agent interactions
  - Created comprehensive documentation in agentArchitecture.md
- Enhanced Research Agent with web search capabilities (Phase 2)
  - Implemented SearXNG client for web search functionality
  - Created robust error handling and instance management for SearXNG client
  - Implemented query construction logic to build effective search queries
  - Added result processing to extract meaningful information from search results
  - Implemented caching mechanism to avoid redundant searches
  - Added comprehensive test suite for the Research Agent
