import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { motion } from 'framer-motion';
import UserProfile from './components/UserProfile';
import './App.css';

function App() {
  const [authStatus, setAuthStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [prioritizedData, setPrioritizedData] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [researchResults, setResearchResults] = useState(null); // New state for research results
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showResearchFindings, setShowResearchFindings] = useState(false);
  const [activeView, setActiveView] = useState('calendar'); // 'calendar' or 'profile'

  // Function to fetch calendar data
  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/calendar', {
        credentials: 'include' // Include credentials for cross-origin requests
      });

      if (!response.ok) {
        // Parse the error response to check for a prompt
        const errorData = await response.json();
        
        // If the error response includes a prompt, set it
        if (errorData && errorData.prompt) {
          setPrompt(errorData.prompt);
        }
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          // Clear the connection status cookie
          document.cookie = 'google_calendar_connected=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          setAuthStatus(null);
          throw new Error('Your Google Calendar connection has expired or been revoked. Please reconnect.');
        } else {
          throw new Error(errorData.message || `API responded with status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Calendar data received:', data);

      if (data && data.prioritization && data.prioritization.response && data.prioritization.prompt) {
        setPrioritizedData(data.prioritization.response);
        setPrompt(data.prioritization.prompt);
        setResearchResults(data.research || null); // Store research results
        // setRelationships(data.relationships || null); // Future: store relationship data
        console.log('Frontend: Prioritized data set:', data.prioritization.response ? data.prioritization.response.substring(0, 50) + '...' : 'empty');
        console.log('Frontend: Research results set:', data.research);
      } else if (data.message) {
        // Handle error messages from the API
        throw new Error(data.message);
      } else {
        // Handle unexpected data structure
        console.error('Unexpected data structure from API:', data);
        throw new Error('Received unexpected data from the server.');
      }

    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      // setShowPrompt(true); // Removed: Prompt should be closed by default
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam === 'success') {
      setAuthStatus('success');
      // Clean up URL parameters immediately after processing
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url);
    } else if (authParam === 'error') {
      setAuthStatus('error');
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url);
    }
    
    // Check for existing connection cookie on initial load
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
    
    // If not authenticated via URL param, check cookie
    if (!authParam && checkConnectionStatus()) {
      // authStatus is already set to 'success' by checkConnectionStatus
    }
  }, []); // Run only once on component mount

  // Separate useEffect to fetch data when authStatus is success and not yet fetched
  useEffect(() => {
    // Only fetch if authenticated, not already fetching, and not already done with initial fetch
    if (authStatus === 'success' && !isLoading && !initialFetchDone) {
      fetchCalendarEvents();
      setInitialFetchDone(true);
    }
  }, [authStatus, isLoading, initialFetchDone]); // Depend on authStatus, isLoading, and initialFetchDone

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
          className="text-4xl font-bold text-center text-gray-800 mb-4"
        >
          Calendar Prioritizer
        </motion.h1>
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-4 py-2 mx-2 rounded-md ${activeView === 'calendar' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={`px-4 py-2 mx-2 rounded-md ${activeView === 'profile' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            User Profile
          </button>
        </div>
        
        {activeView === 'calendar' && authStatus === 'success' ? (
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <pre className="text-gray-700">{prioritizedData}</pre>

                {researchResults && researchResults.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowResearchFindings(!showResearchFindings)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded mb-2"
                    >
                      {showResearchFindings ? 'Hide Research Findings' : 'Show Research Findings'}
                    </button>
                    {showResearchFindings && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Research Findings</h3>
                        {researchResults.map((result, index) => result.research_conducted && (
                          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                            <h4 className="font-medium text-gray-700">Event ID: {result.calendar_entry_id}</h4>
                            <p className="text-sm text-gray-600">Confidence: {result.confidence_level}</p>
                            {result.findings.event_type && <p className="text-sm text-gray-600">Type: {result.findings.event_type}</p>}
                            {result.findings.venue_info && <p className="text-sm text-gray-600">Venue: {result.findings.venue_info}</p>}
                            {result.findings.context_summary && <p className="text-sm text-gray-600">Summary: {result.findings.context_summary}</p>}
                            {result.findings.keywords_found && result.findings.keywords_found.length > 0 && (
                              <p className="text-sm text-gray-600">Keywords: {result.findings.keywords_found.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : activeView === 'calendar' && authStatus === 'error' && !isLoading ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-4">Authentication failed. Please try again.</p>
            <a 
              href="http://localhost:5001/auth/google" 
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors"
            >
              Reconnect to Google Calendar
            </a>
          </div>
        ) : activeView === 'calendar' ? (
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
        ) : activeView === 'profile' ? (
          <UserProfile />
        ) : null}

        {isLoading && authStatus === 'success' && activeView === 'calendar' && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
            <p className="text-red-600 mb-2">{error}</p>
            <p className="text-gray-700">Please try refreshing the page or reconnecting your calendar.</p>
          </div>
        )}
        
          <div className="mt-6">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded mb-2"
            >
              {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
            </button>
            {showPrompt && (
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 mt-2">
                {prompt && <pre className="text-gray-700">{prompt}</pre>}
                {!prompt && error && <p className="text-gray-700">No prompt available due to an error.</p>}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export default App;
