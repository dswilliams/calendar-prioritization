# Agent Architecture

This document outlines the structure and responsibilities of the AI agents within the Calendar Prioritizer system. It will be updated as agents are developed and modified.

## 1. Prioritization Agent (Core Agent)

### Role
The primary agent responsible for analyzing calendar events, applying prioritization rules, and identifying issues. It will coordinate with other specialized agents for additional context.

### Inputs
*   Raw calendar events (from Google Calendar API).
*   User memory (personal info, relationships, goals, preferences).

### Core Logic
*   **Event Processing:** Utilizes `formatCalendarEvent` (or similar utility) to standardize event data.
*   **Prioritization Engine:** Applies defined rules (urgency, ownership, attendee count, meeting purpose, etc.) to rank events. This will involve focused LLM calls and potentially internal programmatic logic.
*   **Issue Detection:** Identifies and flags common calendar issues (e.g., missing agendas, unresponded invites, conflicts).

### Outputs
*   Structured data (e.g., JSON) containing:
    *   Top N prioritized meetings with brief explanations.
    *   List of flagged issues.
    *   Remaining events in a prioritized order.

### Interaction with Other Agents
*   Calls the Research Agent for vague event titles/descriptions.
*   Calls the Relationship Agent for attendee relationship context.

### Technology
*   **LLM:** Ollama (`calendar-prioritizer` model or a refined version).
*   **Communication:** Internal function calls or structured data exchange.

## 2. Research Agent (Specialized Agent)

### Role
Provides additional context for calendar events by performing external research, primarily web searches using SearXNG.

### Triggers
*   Called by the Orchestrator when the `options.researchEvents` flag is true.
*   Determines internally if research is needed for a specific event based on its content (title, description, location).

### Inputs
*   Array of calendar events.
*   User memory (for potential user location context).

### Core Logic
*   **Context Analysis:** Determines if an event requires research based on generic terms, ambiguous locations, or acronyms.
*   **Query Construction:** Extracts searchable terms from the event.
*   **Web Search:** Calls the `searxngClient` to perform web searches via the SearXNG API.
*   **Content Analysis:** Processes search results to extract relevant information, categorize findings (event type, venue info, context summary), and identify keywords.
*   **Caching:** Uses an in-memory cache to store research results and avoid duplicate searches for the same event.

### Outputs
*   An array of structured research results, one object per event, with the following format:
    ```json
    {
      "calendar_entry_id": "string",
      "research_conducted": true,
      "confidence_level": "high|medium|low|none",
      "findings": {
        "event_type": "business|personal|social|unknown",
        "venue_info": "string or null",
        "context_summary": "string",
        "keywords_found": ["array", "of", "relevant", "terms"]
      },
      "search_metadata": {
        "queries_used": ["array of search terms"],
        "results_processed": "number",
        "timestamp": "ISO datetime"
      }
    }
    ```

### Technology
*   **Language:** Node.js
*   **Dependencies:** `searxngClient.js` utility module.
*   **Communication:** Called directly by the Orchestrator.

## 3. Relationship Agent (Specialized Agent - Future)

### Role
Provides context on the relationships between the user and event attendees.

### Triggers
*   Called by the Prioritization Agent when attendee relationship context is needed for prioritization.

### Inputs
*   List of attendee names/emails from the Prioritization Agent.

### Core Logic
*   **Relationship Lookup:** Accesses a defined relationship database (e.g., extended `user_memory.json`, a dedicated local file, or potentially an external API with user consent).
*   **Relationship Inference:** Infers relationship types if not explicitly defined (e.g., based on shared domains, past interactions).

### Outputs
*   Structured relationship information for the attendees (e.g., "colleague," "manager," "family member," "potential client").

### Technology
*   **Data Source:** `user_memory.json` or a dedicated relationship data store.
*   **LLM:** Potentially a small LLM for inference, or rule-based logic.
*   **Communication:** Exposed as an MCP server tool.

## Agent Orchestration

### Role
Manages the flow of information and calls between different agents. This is handled by the `backend/agents/orchestrator.js` module.

### Responsibilities
*   Receiving initial requests (e.g., from the frontend for calendar prioritization).
*   Calling the Research Agent if the `options.researchEvents` flag is true.
*   Calling the Relationship Agent if the `options.analyzeRelationships` flag is true (future implementation).
*   Calling the Prioritization Agent with the original events and results from other agents.
*   Aggregating results from all agents and formatting the final response.

### Technology
*   Node.js (`backend/agents/orchestrator.js`).
*   Direct function calls to other agent modules.
