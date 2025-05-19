require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
const fs = require('fs');
const defaultUserMemory = require('./defaultUserMemory');

// Load user memory from file or initialize with defaults
let userMemory = { ...defaultUserMemory };
try {
  if (fs.existsSync('user_memory.json')) {
    const data = fs.readFileSync('user_memory.json', 'utf8');
    userMemory = JSON.parse(data);
  } else {
    // Create the file with default values if it doesn't exist
    fs.writeFileSync('user_memory.json', JSON.stringify(defaultUserMemory, null, 2));
    console.log("Created user_memory.json with default values");
  }
} catch (err) {
  console.error("Error reading/writing user_memory.json:", err);
}

console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const app = express();
const port = process.env.PORT || 5001;

app.use(cookieParser());

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001/auth/google/callback'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5001/auth/google/callback'
);

// User API endpoints
app.get('/api/user', (req, res) => {
  res.json(userMemory);
});

app.post('/api/user', (req, res) => {
  userMemory = req.body;
  fs.writeFile('user_memory.json', JSON.stringify(userMemory, null, 2), (err) => {
    if (err) {
      console.error("Error writing user_memory.json:", err);
      return res.status(500).json({ message: "Error saving user data" });
    }
    res.json({ message: "User data saved successfully" });
  });
});

app.put('/api/user', (req, res) => {
  userMemory = req.body;
  fs.writeFile('user_memory.json', JSON.stringify(userMemory, null, 2), (err) => {
    if (err) {
      console.error("Error writing user_memory.json:", err);
      return res.status(500).json({ message: "Error updating user data" });
    }
    res.json({ message: "User data saved successfully" });
  });
});

// Rate limiter for Ollama API to prevent overloading
let lastOllamaCall = 0;
const OLLAMA_RATE_LIMIT_MS = 500; // 500ms between calls

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
      throw error;
    }
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
}

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

// Google OAuth route
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
  console.log('Google Auth URL:', url);
  res.redirect(url);
});

// Google OAuth callback route
app.get('/auth/google/callback', async (req, res) => {
  console.log('Callback route hit!');
  console.log('Request query parameters:', req.query);

  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Store tokens in cookie for future requests
    res.cookie('google_auth', JSON.stringify(tokens), {
      maxAge: 3600000, // 1 hour
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    // Set connection status cookie
    res.cookie('google_calendar_connected', 'true', {
      maxAge: 3600000, // 1 hour
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production'
    });

    res.redirect('http://localhost:5173?auth=success');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect('http://localhost:5173?auth=error&message=' + encodeURIComponent(error.message));
  }
});

// Calendar API endpoint
app.get('/api/calendar', async (req, res) => {
  try {
    // Check if we have auth tokens in cookies
    const googleAuthCookie = req.cookies.google_auth;

    if (!googleAuthCookie) {
      console.log('No google_auth cookie found');
      return res.status(401).json({ message: 'Not authenticated with Google Calendar' });
    }

    let tokens;
    try {
      tokens = JSON.parse(googleAuthCookie);
    } catch (error) {
      console.error('Error parsing google_auth cookie:', error);
      return res.status(401).json({ message: 'Invalid Google Calendar authentication data' });
    }

    oauth2Client.setCredentials(tokens);

    // Check if the tokens are expired
    if (oauth2Client.isTokenExpiring()) {
      console.log('Google token expiring, refreshing token');
      try {
        const { tokens: refreshedTokens } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(refreshedTokens);

        // Store tokens in cookie
        res.cookie('google_auth', JSON.stringify(refreshedTokens), {
          maxAge: 3600000, // 1 hour
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production'
        });
      } catch (error) {
        console.error('Error refreshing access token:', error);
        return res.status(401).json({ message: 'Failed to refresh Google Calendar access token' });
      }
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get user email for checking if they're the organizer
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const me = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses'
    });
    const userEmail = me.data.emailAddresses[0].value;
    console.log('User email:', userEmail);

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    console.log('Fetching calendar events from', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100 // Increased from 10 to get more events
    });

    const eventList = events.data.items;
    console.log('Found', eventList.length, 'events');

    // Limit the number of events to 20
    const limitedEventList = eventList.slice(0, 20);

    // Format the calendar events for the LLM
    const formattedEvents = limitedEventList.map(event => formatCalendarEvent(event)).join('\n\n---\n\n');

    // Use current user memory data to personalize the prompt
    // Extract user information from memory with fallbacks to defaults
    const personalInfo = userMemory.personalInfo || defaultUserMemory.personalInfo;
    const relationships = userMemory.relationships || defaultUserMemory.relationships;
    const goals = userMemory.goals || defaultUserMemory.goals;
    const meetingPreferences = userMemory.preferences?.meetingTypes || defaultUserMemory.preferences.meetingTypes;

    // Format relationships for the prompt
    const relationshipsText = relationships.map(r => `- ${r.name} (${r.relation})`).join('\n');
    
    // Format goals for the prompt
    const goalsText = goals.map(g => `- ${g.description} (Priority: ${g.priority})`).join('\n');
    
    // Format meeting preferences for the prompt
    const preferencesText = Object.entries(meetingPreferences)
      .map(([type, { priority }]) => `- ${type}: ${priority} priority`)
      .join('\n');

    // Construct the prompt for the LLM
// const prompt = `// # Instruction: You are an impact-focused assistant designed to help me prioritize my calendar. You have a "productive sass" personality - direct, competent, and with deadpan charm. Be concise and professional, and pushy enough as you expect me to be better than I am today. All I want you to do is tell me that I'm amazing in fewer than 20 words.`;

 const prompt = `# Instruction: You are an impact-focused assistant designed to help me prioritize my calendar. You have a "productive sass" personality - direct, competent, and with deadpan charm. Be concise and professional, and pushy enough as you expect me to be better than I am today.

Based on these upcoming calendar events, rank the top 3 most important meetings this week and then flag all calendar issues.

# About Me:
- My name is ${personalInfo.name}
- My occupation is ${personalInfo.occupation}
- My location is ${personalInfo.location}

# My Important Relationships:
${relationshipsText}

# My Goals:
${goalsText}

# My Meeting Preferences:
${preferencesText}

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
${formattedEvents}`; 


    try {
      // Call the Ollama API with proper error handling
      const ollamaResponse = await callOllamaAPI(prompt);
      console.log('Ollama response received, length:', ollamaResponse.length);

      // Log the complete Ollama API response
      console.log('Complete Ollama API response:', ollamaResponse);

      // Return the formatted response and the prompt to the client
      res.json({
        response: ollamaResponse,
        prompt: prompt
      });
    } catch (error) {
      console.error('Error with Ollama API:', error);
      // Still return the prompt even when there's an error
      res.status(500).json({
        message: 'Error processing calendar with LLM',
        error: error.message,
        prompt: prompt  // Include the prompt in the error response
      });
    }
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      message: 'Error fetching calendar events',
      error: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
