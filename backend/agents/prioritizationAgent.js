/**
 * Prioritization Agent
 * 
 * This agent is responsible for analyzing calendar events, applying prioritization rules,
 * and identifying issues. It will eventually coordinate with other specialized agents
 * for additional context.
 */

const fs = require('fs');
const path = require('path');

// Rate limiter for Ollama API to prevent overloading
let lastOllamaCall = 0;
const OLLAMA_RATE_LIMIT_MS = 500; // 500ms between calls

/**
 * Calls the Ollama API with a prompt
 * @param {string} prompt - The prompt to send to the Ollama API
 * @returns {Promise<string>} - The response from the Ollama API
 */
async function callOllamaAPI(prompt) {
  try {
    // Simple rate limiting
    const now = Date.now();
    const timeElapsed = now - lastOllamaCall;
    if (timeElapsed < OLLAMA_RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, OLLAMA_RATE_LIMIT_MS - timeElapsed));
    }

    console.log('Calling Ollama API with prompt length:', prompt.length);

    // Update last call time
    lastOllamaCall = Date.now();

    // Check if Ollama API is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          model: 'calendar-prioritizer',
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama API error response:', errorText);

        // Check for specific error types
        if (response.status === 404) {
          throw new Error('Model not found. Please make sure the calendar-prioritizer model is available in Ollama.');
        } else if (response.status === 500) {
          throw new Error('Ollama server error. Please check the Ollama server logs for more information.');
        } else {
          throw new Error(`Ollama API error: ${response.status} - ${errorText || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      console.log('Ollama API response received');

      return data.response; // Return just the response text
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Ollama API request timed out. Please check if the Ollama server is running.');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Failed to fetch')) {
        throw new Error('Could not connect to Ollama API. Please make sure the Ollama server is running at http://localhost:11434.');
      }
      
      // Re-throw the error
      throw error;
    }
  } catch (error) {
    console.error('Error calling Ollama API:', error);

    // Re-throw as a uniform Error to avoid leaking node-fetch internals
    throw new Error(`Ollama API failure: ${error.message}`);
  }
}

/**
 * Formats a calendar event for the LLM
 * @param {Object} event - The calendar event to format
 * @returns {string} - The formatted event
 */
function formatCalendarEvent(event) {
  const startTime = event.start.dateTime || event.start.date;
  const endTime = event.end.dateTime || event.end.date;
  const date = new Date(startTime).toLocaleDateString();
  const organizerName = event.organizer?.displayName || event.organizer?.email || 'Unknown';

  // Get attendee details
  let attendeesCount = 0;
  let attendeesList = '';
  if (event.attendees && event.attendees.length > 0) {
    attendeesCount = event.attendees.length;
    // Get up to 5 attendees for the LLM to consider
    const limitedAttendees = event.attendees.slice(0, 5);
    attendeesList = limitedAttendees.map(attendee => {
      const name = attendee.displayName || attendee.email || 'Unknown';
      const responseStatus = attendee.responseStatus || 'Unknown';
      return `${name} (${responseStatus})`;
    }).join(', ');

    if (event.attendees.length > 5) {
      attendeesList += `, and ${event.attendees.length - 5} more`;
    }
  }

  // Format description
  let description = event.description || 'None';
  if (description && description.split(' ').length > 100) {
    description = description.split(' ').slice(0, 100).join(' ') + '...';
  }

  // Get location and conference details
  const location = event.location || 'None';
  let conferenceData = 'None';
  if (event.conferenceData && event.conferenceData.conferenceId) {
    conferenceData = `Conference ID: ${event.conferenceData.conferenceId}`;
    if (event.conferenceData.conferenceSolution && event.conferenceData.conferenceSolution.name) {
      conferenceData += ` (${event.conferenceData.conferenceSolution.name})`;
    }
  }

  // Get recurrence information
  const isRecurring = event.recurringEventId ? 'Yes' : 'No';

  // Get creation and update times
  const created = event.created ? new Date(event.created).toLocaleString() : 'Unknown';
  const updated = event.updated ? new Date(event.updated).toLocaleString() : 'Unknown';

  return `Title: ${event.summary || 'Untitled'}
Time: ${startTime} - ${endTime}, ${date}
Organizer: ${organizerName}
Attendees: ${attendeesCount} people${attendeesList ? ` (${attendeesList})` : ''}
Description: ${description}
Location: ${location}
Conference Data: ${conferenceData}
Recurring: ${isRecurring}
Created: ${created}
Last Updated: ${updated}`;
}

/**
 * Constructs the prompt for the LLM
 * @param {Array} formattedEvents - The formatted calendar events
 * @param {Object} userMemory - The user memory data
 * @param {string} userEmail - The user's email address
 * @returns {string} - The constructed prompt
 */
function constructPrompt(formattedEvents, userMemory, userEmail, researchMap) {
  // Extract user information from memory with fallbacks to defaults
  const personalInfo = userMemory.personalInfo || {};
  const relationships = userMemory.relationships || [];
  const goals = userMemory.goals || [];
  const meetingPreferences = userMemory.preferences?.meetingTypes || {};

  // Format relationships for the prompt
  const relationshipsText = relationships.map(r => `- ${r.name} (${r.relation})`).join('\n');
  
  // Format goals for the prompt
  const goalsText = goals.map(g => `- ${g.description} (Priority: ${g.priority})`).join('\n');
  
  // Format meeting preferences for the prompt
  const preferencesText = Object.entries(meetingPreferences)
    .map(([type, { priority }]) => `- ${type}: ${priority} priority`)
    .join('\n');

  // Construct the prompt for the LLM
  return `# Instruction: You are an impact-focused assistant designed to help me prioritize my calendar. You have a "productive sass" personality - direct, competent, and with deadpan charm. Be concise and professional, and pushy enough as you expect me to be better than I am today.

Based on these upcoming calendar events, rank the top 3 most important meetings this week and then flag all calendar issues.

# About Me:
- My name is ${personalInfo.name || 'User'}
- My occupation is ${personalInfo.occupation || 'Not specified'}
- My location is ${personalInfo.location || 'Not specified'}
- My email is ${userEmail || 'Not specified'}

# My Important Relationships:
${relationshipsText || '- None specified'}

# My Goals:
${goalsText || '- None specified'}

# My Meeting Preferences:
${preferencesText || '- None specified'}

# Rules to abide by:
- Assume the current date is May 18, 2025 and you are analyzing the full week of events. Every mention of an event should be relative to today's date. 
- Analyze the the purpose and potential impact of each event.
- Do not assume my relationship with any other person mentioned.

# Additional Prioritization Criteria:
- Urgency: Today/tomorrow, Impact Weighting=80/100. 
- Ownership: User is the organizer, Impact Weighting= 80/100. 
- Between 1 and 10 attendees : If User is organizer, Impact Weighting=100/100. If not, 40/100.
- Between 10 and 20 attendees: If User is organizer, Impact Weighting=100/100. If not, 20/100.
- More than 20 attendees: If User is organizer, Impact Weighting=100/100. If not, 10/100.
- If 0 Attendees, Impact Weight=10/100.
- Meeting purpose: Description indicates high impact, but the content matters more. Provide your own Impact Weighting score between 0 and 100. 
- Lower priority events: Daily standups, commute blocks, routine 1:1s with no agenda. Impact Weighting=0/100.
- Events that can have immediate impact are more important than events that are part of a larger goal. Example: a longer running project block is less important than an event with a clear short term outcome. 

# Calendar Issues to Flag:
- Important meetings missing agendas/descriptions
- Important meetings the user hasn't responded to yet
- Meeting conflicts

# Format your response with:
- A brief, sassy intro with the tone of being my mentor/guide without saying you're my mentor/guide (1 sentence)
- TOP PRIORITY MEETINGS (numbered 1-3) with a short explanation (1-2 sentences max) for each.
- FLAGGED ISSUES (based on the flagging criteria, if any)
- Motivational phrase based on the priorities ahead (1 sentence).
- In a separate section, called Other Events, the rest of the events provided to you in the "Calendar Events" section in their priority order. Format the responses as [Title] [MM/DD HH:MM] [Reason for lower priority]. 

# Calendar Events:
${formattedEvents}

# Research Findings for Events:
${limitedEventList.map(event => {
    const research = researchMap.get(event.id);
    if (research && research.research_conducted) {
        const startTime = event.start.dateTime || event.start.date;
        const endTime = event.end.dateTime || event.end.date;
        const date = new Date(startTime).toLocaleDateString();
        const time = new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `Event ID: ${event.id}
Event Name: ${event.summary || 'Untitled'}
Date/Time: ${date} ${time}
Research Context Summary: ${research.context_summary}
Inferred Event Type: ${research.event_type}
Inferred Location: ${research.venue_info}
Confidence Level: ${research.confidence_level}
Search Query Used: ${research.query || 'N/A'}
---`;
    }
    return '';
}).filter(Boolean).join('\n\n')}

# Impact of Research on Prioritization:
Research findings, when available and confident, provide additional context that can influence the prioritization of events. For example, if research reveals a vague event is a critical industry conference, its priority might increase. Conversely, if research shows an event is a casual social gathering, its priority might decrease. The LLM should use this information to make more informed prioritization decisions.`;
}

/**
 * Prioritizes calendar events using the Ollama API
 * @param {Array} events - The calendar events to prioritize
 * @param {Object} userMemory - The user memory data
 * @param {string} userEmail - The user's email address
 * @returns {Promise<Object>} - The prioritized events and prompt
 */
async function prioritizeEvents(events, userMemory, userEmail, researchResults = []) {
  try {
    // Limit the number of events to 20
    const limitedEventList = events.slice(0, 20);

    // Format the calendar events for the LLM
    const formattedEvents = limitedEventList.map(event => formatCalendarEvent(event)).join('\n\n---\n\n');
    
    // Create a map of event IDs to their research findings for easy lookup
    const researchMap = new Map(researchResults.map(r => [r.id, r.findings]));

    // Construct the prompt
    const prompt = constructPrompt(formattedEvents, userMemory, userEmail, researchMap);

    // Call the Ollama API with proper error handling
    const ollamaResponse = await callOllamaAPI(prompt);
    console.log('Ollama response received, length:', ollamaResponse.length);

    // Return the formatted response and the prompt
    return {
      response: ollamaResponse,
      prompt: prompt
    };
  } catch (error) {
    console.error('Error prioritizing events:', error);
    throw error;
  }
}

module.exports = {
  prioritizeEvents,
  formatCalendarEvent
};
