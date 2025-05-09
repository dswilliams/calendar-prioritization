## Calendar Prioritizer - Project Roadmap

### High-Level Goals
- [x] Determine priority of calendar events using LLM
- [x] Flag potential calendar issues
- [x] Implement a "Productive Sass" personality
- [ ] Implement Microsoft Calendar integration (deprioritized for now)
- [x] Store the status of the connection and/or check each time we read the calendar
- [ ] UI/UX: Implement slow moving animations and a scientific, yet approachable feel to the front end

### Key Features
- [x] User authentication and authorization (Google Calendar Implemented)
- [x] Calendar integration (Google Calendar Implemented)
- [x] LLM-based event prioritization
- [x] Issue flagging (missing agenda, no response, conflicts)
- [x] User-friendly UI with clear presentation of prioritized events and issues
- [x] "Productive Sass" personality in UI and error messages

### Completion Criteria
- [ ] All key features are implemented and functional
- [ ] The application can successfully connect to Google and Microsoft Calendars
- [x] Calendar events are accurately prioritized based on the defined criteria
- [x] Potential calendar issues are correctly identified and flagged
- [x] The UI is intuitive and easy to use
- [x] The "Productive Sass" personality is consistently applied throughout the application
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
