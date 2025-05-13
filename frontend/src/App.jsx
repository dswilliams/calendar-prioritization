import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  const [authStatus, setAuthStatus] = useState(null);
  const [events, setEvents] = useState([]);
  const [prioritizedData, setPrioritizedData] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

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

      if (data && data.response && data.prompt) {
        setPrioritizedData(data.response);
        setPrompt(data.prompt);
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <pre className="text-gray-700">{prioritizedData}</pre>
              </div>
            ) : null}
          </div>
        ) : authStatus === 'error' && !isLoading ? (
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

        {isLoading && authStatus === 'success' && (
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
        
        {prompt && (
          <div className="mt-6">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded"
            >
              {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
            </button>
            {showPrompt && (
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 mt-2">
                <pre className="text-gray-700">{prompt}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
