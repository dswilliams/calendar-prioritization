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

## 2. Research Agent (Specialized Agent - Future)

### Role
Provides additional context for calendar events by performing external research, primarily web searches.

### Triggers
*   Called by the Prioritization Agent when an event has a vague title, missing description, or requires external information for better prioritization.

### Inputs
*   Event title, description, and any other relevant keywords from the Prioritization Agent.

### Core Logic
*   **Web Search:** Utilizes web search tools (e.g., `browser_action` or a dedicated MCP tool for search APIs).
*   **Information Extraction & Summarization:** Processes search results to extract relevant information and summarizes it concisely.

### Outputs
*   A summary of research findings relevant to the event.

### Technology
*   **LLM:** Potentially a smaller, specialized LLM for summarization, or direct tool use.
*   **Tools:** Web search APIs, `browser_action`.
*   **Communication:** Exposed as an MCP server tool.

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
Manages the flow of information and calls between different agents. Currently, this role is implicitly handled by `backend/index.js`. In the future, it could become a more explicit module or even a dedicated orchestrator agent.

### Responsibilities
*   Receiving initial requests (e.g., from the frontend for calendar prioritization).
*   Calling the Prioritization Agent.
*   Handling conditional calls to specialized agents (Research, Relationship) based on the Prioritization Agent's needs.
*   Aggregating results from all agents and formatting the final response.

### Technology
*   Node.js (current `backend/index.js`).
*   Potentially a state machine or workflow engine for complex orchestrations.
*   MCP for inter-agent communication.
