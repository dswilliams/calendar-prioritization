require('dotenv').config();
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { google } = require('googleapis');

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
  'https://www.googleapis.com/auth/calendar.readonly'
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5001/auth/google/callback'
);

async function callOllamaAPI(prompt) {
  try {
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Ollama API response:', data);
    return data.response; // Adjust based on actual response structure
  } catch (error) {
    console.error('Error calling Ollama API:', error);
    throw error;
  }
}

function formatCalendarEvent(event, isUserOrganizer) {
  const startTime = event.start.dateTime || event.start.date;
  const endTime = event.end.dateTime || event.end.date;
  const date = new Date(startTime).toLocaleDateString();
  const organizerName = event.organizer.displayName || event.organizer.email;
  const attendeesCount = event.attendees ? event.attendees.length : 0;
  const description = event.description || 'None';
  const location = event.location || 'None';

  return `Title: ${event.summary}
Time: ${startTime} - ${endTime}, ${date}
Organizer: ${organizerName} / is_user_organizer: ${isUserOrganizer}
Attendees: ${attendeesCount} people
Response Status: ${event.attendees ? event.attendees.find(attendee => attendee.email === 'your_email@example.com')?.responseStatus || 'No Response' : 'No Response'}
Description: ${description}
Location: ${location}`;
}

// Function to generate the Google OAuth URL
function generateAuthUrl() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:5001/auth/google/callback'
  );
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });
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
  console.log('Request headers:', req.headers);
  console.log('Request query parameters:', req.query);

  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.redirect('http://localhost:5173?auth=success');
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.redirect('http://localhost:5173?auth=error&message=' + error.message);
    res.status(500).send('Error during Google authentication.');
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running!  <a href="/auth/google">Connect to Google Calendar</a>');
});

// Calendar API endpoint
app.get('/api/calendar', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
    const endOfWeek = new Date(now.setDate(now.getDate() + 6)); // Saturday

    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const eventList = events.data.items;

    // Format the calendar events for the LLM
    const formattedEvents = eventList.map(event => formatCalendarEvent(event, event.organizer.email === 'your_email@example.com')).join('\n');

    // Construct the prompt for the LLM
    const prompt = `You are a productivity assistant designed to help users focus on what truly matters in their calendars. Based on the following list of events and criteria, rank the top 3 most important meetings this week, and flag potential calendar issues.

Prioritization Criteria:
Urgency: Events happening today or tomorrow are likely more important.
Ownership: Events where the user is the organizer.
Content: Descriptions with specific goals.

Calendar Events:
${formattedEvents}

Task for LLM:
Output the Top 3 meetings, ranked and explained.

List any flagged issues separately.
`;

    // Call the Ollama API
    const ollamaResponse = await callOllamaAPI(prompt);

    // Parse the Ollama API response
    console.log('Ollama API response:', ollamaResponse);
    const prioritizedEvents = ollamaResponse; // Replace with actual parsing logic

    res.json(prioritizedEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    console.error('Full error object:', error);
    res.status(500).json({
      message: 'Error fetching calendar events',
      error: error.message,
      calendarId: 'primary',
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString()
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
