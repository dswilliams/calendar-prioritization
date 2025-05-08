## Codebase Summary

### Key Components and Their Interactions
- **Frontend (React):** Handles UI, user interactions, and communication with the backend API.
- **Backend (Node.js/Express):** Manages API endpoints, authentication (Google OAuth 2.0), calendar integration, LLM interaction, and data formatting.
- **Google Calendar API:** Fetches calendar events from Google Calendar.
- **Microsoft Graph API:** (Not yet implemented) Fetches calendar events from Microsoft Calendar.
- **Ollama API:** Prioritizes calendar events and generates explanations using the Mistral 7B model.

### Data Flow
1. User interacts with the Frontend.
2. Frontend sends requests to the Backend API.
3. Backend interacts with Google Calendar API and/or Microsoft Graph API to fetch calendar events.
4. Backend formats data and sends it to the Ollama API.
5. Ollama API returns prioritized events and explanations.
6. Backend formats the response and sends it to the Frontend.
7. Frontend parses and displays the structured results to the user.

### External Dependencies
- React
- Tailwind CSS
- Framer Motion
- Node.js
- Express.js
- cookie-parser
- googleapis
- dotenv

### Recent Significant Changes
- Initial project setup and documentation.
- Implemented Google Calendar OAuth 2.0 authentication.
- Updated backend port to 5001.
- Updated frontend to use the new backend port.
- Removed session management and implemented a simpler redirect-based authentication flow.
- Implemented basic calendar read functionality for Google Calendar (current week).
- Improved error handling in the `/api/calendar` route, providing more informative error messages to the client.
- Cleaned up backend code by removing redundant functions and variables.
- Successfully implemented Google Calendar OAuth 2.0 authentication and basic calendar read functionality.
- Implemented the function to format calendar events for the LLM
- Implemented the function to call the Ollama API
- Removed Google Gemini API and related code
- Updated the backend to use Ollama for LLM functionality
- Added userinfo.email and userinfo.profile scopes to OAuth flow
- Updated prompt to include user's name and improve formatting
- Fixed backend issues with formatCalendarEvent function
- Enhanced frontend UI with Tailwind CSS for better user experience
- Implemented LLM response parsing to display structured data
- Added refresh button functionality to fetch updated calendar data
- Improved loading states and error handling in the frontend
- Simplified CSS by leveraging Tailwind for most styling needs

### User Feedback Integration and Its Impact on Development
- N/A (initial project setup)
- Successfully implemented Google Calendar OAuth 2.0 authentication and basic calendar read functionality.
- Improved UI based on best practices for displaying prioritized calendar data

### Additional Documentation
- N/A
