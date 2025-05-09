import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [authStatus, setAuthStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [prioritizedData, setPrioritizedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedResponse, setParsedResponse] = useState({
    intro: '',
    priorityMeetings: [],
    flaggedIssues: [],
    advice: ''
  });
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Function to parse the LLM response into structured data
  const parseResponse = (response) => {
    if (!response) return;
    
    const result = {
      intro: '',
      priorityMeetings: [],
      flaggedIssues: [],
      advice: ''
    };
    
    // Split the response by lines
    const lines = response.split('\n');
    
    let currentSection = '';
    let meetingNumber = 0;
    let isThoughtProcess = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for thought process section (we'll skip this in the UI)
      if (line.toLowerCase().includes('step by step thought process') || 
          line.toLowerCase().includes('thought process')) {
        isThoughtProcess = true;
        continue;
      }
      
      // Check for the end of thought process section
      if (isThoughtProcess && line.match(/^[0-9]\./)) {
        isThoughtProcess = false;
      }
      
      // Skip thought process lines
      if (isThoughtProcess) continue;
      
      // Check for intro section (usually starts with 1.)
      if (line.match(/^1\./) || (currentSection === '' && !line.match(/^[0-9]\./))) {
        currentSection = 'intro';
        result.intro += line.replace(/^1\./, '').trim() + ' ';
        continue;
      }
      
      // Check for priority meetings section (usually starts with 2.)
      if (line.match(/^2\./) || line.toLowerCase().includes('top priority meetings') || 
          line.toLowerCase().includes('priority meetings')) {
        currentSection = 'priorityMeetings';
        continue;
      }
      
      // Check for flagged issues section (usually starts with 3.)
      if (line.match(/^3\./) || line.toLowerCase().includes('flagged issues')) {
        currentSection = 'flaggedIssues';
        continue;
      }
      
      // Check for advice section (usually starts with 4.)
      if (line.match(/^4\./) || line.toLowerCase().includes('actionable advice')) {
        currentSection = 'advice';
        continue;
      }
      
      // Process content based on current section
      if (currentSection === 'priorityMeetings') {
        // Check if this is a new meeting (starts with a number)
        if (line.match(/^[0-9]\./)) {
          meetingNumber = parseInt(line.match(/^([0-9])\./)[1]);
          const meetingTitle = line.replace(/^[0-9]\./, '').trim();
          result.priorityMeetings.push({
            number: meetingNumber,
            title: meetingTitle,
            explanation: ''
          });
        } else if (result.priorityMeetings.length > 0) {
          // Add to the explanation of the current meeting
          result.priorityMeetings[result.priorityMeetings.length - 1].explanation += line + ' ';
        }
      } else if (currentSection === 'flaggedIssues') {
        // Add to flagged issues
        if (line.match(/^[-•*]/)) {
          // This is a bullet point
          result.flaggedIssues.push(line.replace(/^[-•*]/, '').trim());
        } else if (result.flaggedIssues.length > 0) {
          // Append to the last issue
          result.flaggedIssues[result.flaggedIssues.length - 1] += ' ' + line;
        } else {
          // First issue without bullet
          result.flaggedIssues.push(line);
        }
      } else if (currentSection === 'advice') {
        // Add to advice
        result.advice += line + ' ';
      }
    }
    
    // Clean up and trim all text fields
    result.intro = result.intro.trim();
    result.advice = result.advice.trim();
    result.priorityMeetings.forEach(meeting => {
      meeting.explanation = meeting.explanation.trim();
    });
    
    return result;
  };

  // Function to fetch calendar data
  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5001/api/calendar', {
        credentials: 'include' // Include credentials for cross-origin requests
      });
      
      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          // Clear the connection status cookie
          document.cookie = 'google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          setAuthStatus(null);
          throw new Error('Your Google Calendar connection has expired or been revoked. Please reconnect.');
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log('Calendar data received:', data);
      
      // Check if the data is a string (raw LLM response)
      if (typeof data === 'string') {
        setPrioritizedData(data);
        const parsed = parseResponse(data);
        setParsedResponse(parsed);
        console.log('Parsed response:', parsed);
      } else if (data.message) {
        // Handle error messages from the API
        throw new Error(data.message);
      } else {
        // If it's structured data
        setEvents(data);
      }
      
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get authentication status from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    // Update auth status based on URL parameter
    if (authParam === 'success') {
      setAuthStatus('success');
      
      // Fetch calendar events only when auth is successful and initial fetch hasn't been done
      if (!initialFetchDone) {
        fetchCalendarEvents();
        setInitialFetchDone(true);
      }
    } else if (authParam === 'error') {
      setAuthStatus('error');
    }
    
    // Clean up URL parameters after processing
    if (authParam) {
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url);
    }
    
    // Check for existing connection cookie
    const checkConnectionStatus = () => {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('google_calendar_connected=true')) {
          setAuthStatus('success');
          return true;
        }
      }
      return false;
    };
    
    // Only fetch calendar data on initial load if not already fetched
    if (!authParam && checkConnectionStatus() && !initialFetchDone) {
      fetchCalendarEvents();
      setInitialFetchDone(true);
    }
  }, [initialFetchDone]); // Add initialFetchDone to dependency array

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center mb-6">
          <a href="https://vitejs.dev" target="_blank" rel="noreferrer" className="mx-2">
            <img src={viteLogo} className="h-12 logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer" className="mx-2">
            <img src={reactLogo} className="h-12 logo react" alt="React logo" />
          </a>
        </div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="text-4xl font-bold text-center text-gray-800 mb-8"
        >
          Calendar Prioritizer
        </motion.h1>
        
        {authStatus === 'success' ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-green-600 font-semibold">Connected to Google Calendar!</p>
              <button 
                onClick={fetchCalendarEvents}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-blue-300"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Calendar'}
              </button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-4 text-gray-600">Analyzing your calendar...</p>
              </div>
            ) : prioritizedData ? (
              <div className="space-y-6">
                {parsedResponse.intro && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-lg italic text-gray-700">{parsedResponse.intro}</p>
                  </div>
                )}
                
                {parsedResponse.priorityMeetings.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">TOP PRIORITY MEETINGS</h2>
                    <div className="space-y-4">
                      {parsedResponse.priorityMeetings.map((meeting, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {meeting.number}. {meeting.title}
                          </h3>
                          <p className="text-gray-600 mt-2">{meeting.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {parsedResponse.flaggedIssues.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">FLAGGED ISSUES</h2>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <ul className="list-disc pl-5 space-y-2">
                        {parsedResponse.flaggedIssues.map((issue, index) => (
                          <li key={index} className="text-gray-700">{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {parsedResponse.advice && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">ACTIONABLE ADVICE</h2>
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-gray-700">{parsedResponse.advice}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <details>
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      View raw LLM response
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded-md text-xs overflow-auto max-h-96">
                      {prioritizedData}
                    </pre>
                  </details>
                </div>
              </div>
            ) : null}
          </div>
        ) : authStatus === 'error' ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-4">Authentication failed. Please try again.</p>
            <a 
              href="http://localhost:5001/auth/google" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              Reconnect to Google Calendar
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-700 mb-6">Please connect your calendar to get started.</p>
            <a
              href="http://localhost:5001/auth/google"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect to Google Calendar'}
            </a>
          </div>
        )}

        {isLoading && authStatus !== 'success' && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Connecting to Google Calendar...</p>
          </div>
        )}
        
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-gray-700">Please try refreshing the page or reconnecting your calendar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
