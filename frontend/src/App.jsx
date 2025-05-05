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

  useEffect(() => {
    // Get authentication status from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    // Update auth status based on URL parameter
    if (authParam === 'success') {
      setAuthStatus('success');
      
      // Fetch calendar events only when auth is successful
      const fetchCalendarEvents = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await fetch('http://localhost:5001/api/calendar', {
            credentials: 'include' // Include credentials for cross-origin requests
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Calendar data received:', data);
          
          // Check if the data is a string (raw LLM response)
          if (typeof data === 'string') {
            setPrioritizedData(data);
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
      
      fetchCalendarEvents();
    } else if (authParam === 'error') {
      setAuthStatus('error');
    }
    
    // Clean up URL parameters after processing
    if (authParam) {
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url);
    }
  }, []); // Empty dependency array ensures this only runs once on mount

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Calendar Prioritizer
      </motion.h1>
      
      {authStatus === 'success' ? (
        <div className="auth-status success">
          <p>Connected to Google Calendar!</p>
          {prioritizedData && !isLoading && (
            <div className="prioritized-data">
              <h2>Your Prioritized Calendar</h2>
              <pre>{prioritizedData}</pre>
            </div>
          )}
        </div>
      ) : authStatus === 'error' ? (
        <div className="auth-status error">
          <p>Authentication failed. Please try again.</p>
        </div>
      ) : (
        <div className="auth-prompt">
          <p>Please connect your calendar to get started.</p>
          <a href="http://localhost:5001/auth/google" className="connect-button">
            Connect to Google Calendar
          </a>
        </div>
      )}
      
      {isLoading && <p>Loading your calendar data...</p>}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p>Please try refreshing the page or reconnecting your calendar.</p>
        </div>
      )}
      
      {events.length > 0 && !prioritizedData && !isLoading && (
        <div className="events-list">
          <h2>Calendar Events</h2>
          <ul>
            {events.map((event, index) => (
              <li key={event.id || index}>
                {event.summary} - {event.start?.dateTime || event.start?.date || 'No date'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default App;
