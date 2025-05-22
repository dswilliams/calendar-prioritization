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

// Import agent modules
const agentOrchestrator = require('./agents/orchestrator');
const { formatCalendarEvent } = require('./agents/prioritizationAgent');

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
  console.log('API /api/calendar endpoint hit');
  try {
    // Check if we have auth tokens in cookies
    const googleAuthCookie = req.cookies.google_auth;
    console.log('Cookies received:', req.cookies);

    if (!googleAuthCookie) {
      console.log('No google_auth cookie found');
      return res.status(401).json({ message: 'Not authenticated with Google Calendar' });
    }

    let tokens;
    try {
      tokens = JSON.parse(googleAuthCookie);
      console.log('Successfully parsed auth tokens');
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

    console.log('Using agent orchestrator to prioritize calendar events');
    
    try {
      // Call the agent orchestrator to prioritize the calendar events
      const orchestrationResults = await agentOrchestrator.orchestrateCalendarPrioritization(
        eventList,
        userMemory,
        userEmail,
        {
          // Enable these options when the agents are fully implemented
          analyzeRelationships: false,
          researchEvents: false
        }
      );
      
      console.log('Orchestration complete, response length:', 
        orchestrationResults.prioritization.response.length);
      
      // Return the results to the client
      console.log('Sending response to client with prioritized data');
      res.json({
        response: orchestrationResults.prioritization.response,
        prompt: orchestrationResults.prioritization.prompt,
        // Include additional data from other agents if available
        relationships: orchestrationResults.relationships,
        research: orchestrationResults.research
      });
    } catch (error) {
      console.error('Error with agent orchestration:', error);
      // Return error to the client
      res.status(500).json({
        message: 'Error processing calendar with agent orchestration',
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

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
