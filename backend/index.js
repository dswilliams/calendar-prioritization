require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');
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
  'https://www.googleapis.com/auth/userinfo.email'
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5001/auth/google/callback'
);

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
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'calendar-prioritizer',
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Ollama API response received');
    
    return data.response; // Return just the response text
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
}

function formatCalendarEvent(event, userEmail) {
  const startTime = event.start.dateTime || event.start.date;
  const endTime = event.end.dateTime || event.end.date;
  const date = new Date(startTime).toLocaleDateString();
  const organizerName = event.organizer?.displayName || event.organizer?.email || 'Unknown';
  const attendeesCount = event.attendees ? event.attendees.length : 0;
  const description = event.description || 'None';
  const location = event.location || 'None';
  const isUserOrganizer = event.organizer?.email === userEmail;
  
  // Find user's response status
  let responseStatus = 'No Response';
  if (event.attendees) {
    const userAttendee = event.attendees.find(attendee => attendee.email === userEmail);
    if (userAttendee) {
      responseStatus = userAttendee.responseStatus;
    }
  }

  return `Title: ${event.summary || 'Untitled'}
Time: ${startTime} - ${endTime}, ${date}
Organizer: ${organizerName} / is_user_organizer: ${isUserOrganizer}
Attendees: ${attendeesCount} people
Response Status: ${responseStatus}
Description: ${description}
Location: ${location}`;
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

    res.redirect('http://localhost:5173?auth=success');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect('http://localhost:5173?auth=error&message=' + encodeURIComponent(error.message));
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running!  <a href="/auth/google">Connect to Google Calendar</a>');
});

// Calendar API endpoint
app.get('/api/calendar', async (req, res) => {
  try {
    // Check if we have auth tokens
    if (!oauth2Client.credentials || Object.keys(oauth2Client.credentials).length === 0) {
      return res.status(401).json({ message: 'Not authenticated with Google Calendar' });
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

    // Format the calendar events for the LLM
    const formattedEvents = eventList.map(event => formatCalendarEvent(event, userEmail)).join('\n\n---\n\n');

    // Construct the prompt for the LLM
    const prompt = `You are a productivity assistant designed to help users focus on what truly matters in their calendars. You have a "productive sass" personality - direct, competent, and with a hint of deadpan charm, like a really competent barista who casually fixes emotional baggage while handing out espresso. Be concise, professional, but with a bit of sass.

Based on these upcoming calendar events, rank the top 3 most important meetings this week and flag any calendar issues.

Prioritization Criteria:
- Urgency: Events happening today or tomorrow are likely more important
- Ownership: Events where the user is the organizer carry more weight
- Meeting purpose: Meetings with clear agendas/descriptions are more important 
- Attendee count: Consider both small focused meetings and large meetings where the user is presenting
- Lower priority signals: Daily standups, commute blocks, routine 1:1s with no agenda

Calendar Issues to Flag:
- Important meetings missing agendas/descriptions
- Meetings the user hasn't responded to yet
- Meeting conflicts (overlapping times)

Calendar Events:
${formattedEvents}

Format your response with:
1. A brief, sassy intro (1-2 sentences)
2. TOP PRIORITY MEETINGS (numbered 1-3) with a short explanation (2-3 sentences max) for each
3. FLAGGED ISSUES (if any)
4. A brief conclusion with actionable advice`;

    try {
      // Call the Ollama API with proper error handling
      const ollamaResponse = await callOllamaAPI(prompt);
      console.log('Ollama response received, length:', ollamaResponse.length);
      
      // Return the formatted response directly to the client
      res.json(ollamaResponse);
    } catch (error) {
      console.error('Error with Ollama API:', error);
      res.status(500).json({
        message: 'Error processing calendar with LLM',
        error: error.message
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
