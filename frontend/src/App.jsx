import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [authStatus, setAuthStatus] = useState(null);
  const [events, setEvents] = useState([]);
  let auth;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let auth = urlParams.get('auth');

    if (auth === 'success') {
      setAuthStatus('success');
    } else if (auth === 'error') {
      setAuthStatus('error');
    }

    const fetchCalendarEvents = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/calendar');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };

    if (auth === 'success') {
      fetchCalendarEvents();
    } 
  }, [auth]);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      {authStatus === 'success' && (
        <p>Authentication successful!</p>
      )}
      {authStatus === 'error' && (
        <p>Authentication failed.</p>
      )}
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <a href="http://localhost:5001/auth/google">Connect to Google Calendar</a>

      <h2>Calendar Events</h2>
      <ul>
        {events.map(event => (
          <li key={event.id}>
            {event.summary} - {event.start.dateTime || event.start.date}
          </li>
        ))}
      </ul>
    </>
  )
}

export default App;
