const { researchEvents, researchCache } = require('../agents/researchAgent');
const { SearXNGClient, SEARXNG_CONFIG } = require('../utils/searxngClient');

// Mock the searxngClient to control search results for testing
jest.mock('../utils/searxngClient', () => {
  return {
    SearXNGClient: jest.fn(() => ({
      search: jest.fn((query) => {
        if (query.includes('ambiguous meeting')) {
          return Promise.resolve({
            results: [
              { title: 'Ambiguous Meeting Context', snippet: 'This meeting is about project alpha and beta.' },
              { title: 'Another result', snippet: 'Some other irrelevant info.' }
            ]
          });
        }
        if (query.includes('Q3 Sync')) {
          return Promise.resolve({
            results: [
              { title: 'Q3 Sync Objectives', snippet: 'Key objectives for the third quarter sync.' },
              { title: 'Financial Review Q3', snippet: 'Review of Q3 financial performance.' }
            ]
          });
        }
        if (query.includes('unknown venue')) {
          return Promise.resolve({
            results: [
              { title: 'Venue Information', snippet: 'The venue is located at 123 Main St, City.' }
            ]
          });
        }
        if (query.includes('clear event')) {
          return Promise.resolve({ results: [] }); // No research needed for clear events
        }
        return Promise.resolve({ results: [] });
      }),
    })),
    SEARXNG_CONFIG: {
      retry_attempts: 3
    }
  };
});

const searxngClient = new SearXNGClient();

describe('Research Agent', () => {
  beforeEach(() => {
    // Clear mock calls and reset cache before each test
    SearXNGClient.mockClear();
    searxngClient.search.mockClear();
    researchCache.clear();
  });

  const mockUserMemory = {
    personalInfo: {
      location: 'New York'
    }
  };

  it('should research an event with generic title', async () => {
    // Mock the search function to return specific results for this test
    searxngClient.search.mockImplementationOnce(() => {
      return Promise.resolve({
        results: [
          { title: 'Ambiguous Meeting Context', snippet: 'This meeting is about project alpha and beta.' },
          { title: 'Another result', snippet: 'Some other irrelevant info.' }
        ]
      });
    });
    
    const events = [{
      id: '1',
      summary: 'Team Meeting',
      description: 'Discuss project status',
      start: { dateTime: '2025-05-25T10:00:00Z' },
      location: 'Conference Room A'
    }];

    // Pass the mock client to researchEvents
    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(true);
    expect(results[0].confidence_level).toBe('medium');
    expect(results[0].findings.context_summary).toContain('project alpha and beta');
    expect(searxngClient.search).toHaveBeenCalledTimes(1);
    expect(searxngClient.search).toHaveBeenCalledWith('"Team Meeting"');
  });

  it('should research an event with an acronym in title', async () => {
    const events = [{
      id: '2',
      summary: 'Q3 Sync',
      description: 'Quarterly synchronization meeting',
      start: { dateTime: '2025-05-26T09:00:00Z' },
      location: 'Online'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(true);
    expect(results[0].confidence_level).toBe('medium');
    expect(results[0].findings.context_summary).toContain('Key objectives for the third quarter sync');
    expect(searxngClient.search).toHaveBeenCalledTimes(1);
    expect(searxngClient.search).toHaveBeenCalledWith('"Q3 Sync"');
  });

  it('should research an event with an ambiguous location', async () => {
    // Mock the search function to return specific results for this test
    searxngClient.search.mockImplementationOnce(() => {
      return Promise.resolve({
        results: [
          { title: 'Venue Information', snippet: 'The venue is located at 123 Main St, City.' }
        ]
      });
    });
    
    const events = [{
      id: '3',
      summary: 'Client Demo',
      description: 'Product demonstration',
      start: { dateTime: '2025-05-27T14:00:00Z' },
      location: 'Unknown Venue'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(true);
    expect(results[0].confidence_level).toBe('medium');
    expect(results[0].findings.venue_info).toBe('Unknown Venue');
    expect(results[0].findings.context_summary).toContain('123 Main St');
    expect(searxngClient.search).toHaveBeenCalledTimes(1);
    expect(searxngClient.search).toHaveBeenCalledWith('"Unknown Venue"');
  });

  it('should not research an event that is not ambiguous', async () => {
    const events = [{
      id: '4',
      summary: 'Dentist Appointment',
      description: 'Annual check-up',
      start: { dateTime: '2025-05-28T11:00:00Z' },
      location: '123 Dental Clinic, Anytown'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(false);
    expect(results[0].confidence_level).toBe('low');
    expect(searxngClient.search).not.toHaveBeenCalled();
  });

  it('should use cache for duplicate events', async () => {
    const events = [{
      id: '5',
      summary: 'Team Meeting',
      description: 'Discuss project status',
      start: { dateTime: '2025-05-25T10:00:00Z' },
      location: 'Conference Room A'
    }, {
      id: '5', // Duplicate ID
      summary: 'Team Meeting',
      description: 'Discuss project status',
      start: { dateTime: '2025-05-25T10:00:00Z' },
      location: 'Conference Room A'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(2);
    expect(results[0].research_conducted).toBe(true);
    expect(results[1].research_conducted).toBe(true);
    expect(searxngClient.search).toHaveBeenCalledTimes(1); // Only called once due to caching
  });

  it('should handle search API errors gracefully', async () => {
    searxngClient.search.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'));
    });

    const events = [{
      id: '6',
      summary: 'Problematic Event',
      description: 'This event will cause a search error',
      start: { dateTime: '2025-05-29T10:00:00Z' },
      location: 'Online'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(true);
    expect(results[0].confidence_level).toBe('none'); // Custom level for failed searches
    expect(results[0].findings.context_summary).toContain('Search failed: Network error');
    expect(searxngClient.search).toHaveBeenCalledTimes(1);
  });

  it('should retry search on network timeout', async () => {
    const events = [{
      id: '7',
      summary: 'Timeout Event',
      description: 'This event will cause a search timeout',
      start: { dateTime: '2025-05-30T10:00:00Z' },
      location: 'Online'
    }];

    searxngClient.search.mockImplementation(() => {
      return Promise.reject(new Error('Timeout'));
    });

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].research_conducted).toBe(true);
    expect(results[0].confidence_level).toBe('none');
    expect(results[0].findings.context_summary).toContain('Search failed: Timeout');
    expect(searxngClient.search).toHaveBeenCalledTimes(SEARXNG_CONFIG.retry_attempts);
  });

  it('should construct query with title and location', async () => {
    const events = [{
      id: '8',
      summary: 'Meeting with John Doe',
      description: 'Discuss project proposal',
      start: { dateTime: '2025-06-01T14:00:00Z' },
      location: 'Downtown Office'
    }];

    await researchEvents(events, mockUserMemory, searxngClient);
    expect(searxngClient.search).toHaveBeenCalledWith('"Meeting with John Doe" "Downtown Office"');
  });

  it('should remove stopwords from query', async () => {
    const events = [{
      id: '9',
      summary: 'Meeting with John Doe at Coffee Shop',
      description: 'Discuss project proposal',
      start: { dateTime: '2025-06-01T14:00:00Z' },
      location: 'Coffee Shop'
    }];

    await researchEvents(events, mockUserMemory, searxngClient);
    expect(searxngClient.search).toHaveBeenCalledWith('"John Doe Shop" "Shop"');
  });

  it('should add user location context when beneficial', async () => {
    const events = [{
      id: '10',
      summary: 'Coffee with John Doe',
      description: 'Casual catch-up',
      start: { dateTime: '2025-06-02T10:00:00Z' },
      location: ''
    }];

    await researchEvents(events, mockUserMemory, searxngClient);
    expect(searxngClient.search).toHaveBeenCalledWith('"John Doe" "New York"');
  });

  it('should process search results and extract information', async () => {
    searxngClient.search.mockImplementationOnce(() => {
      return Promise.resolve({
        results: [
          { title: 'Venue Details', snippet: 'This venue is a restaurant located at 456 Oak St.' },
          { title: 'Event Type', snippet: 'This is a business conference.' }
        ]
      });
    });

    const events = [{
      id: '11',
      summary: 'Important Meeting',
      description: 'Discuss key strategies',
      start: { dateTime: '2025-06-03T15:00:00Z' },
      location: 'Some Location'
    }];

    const results = await researchEvents(events, mockUserMemory, searxngClient);
    expect(results).toHaveLength(1);
    expect(results[0].findings.venue_info).toBe('Some Location');
    expect(results[0].findings.context_summary).toContain('This venue is a restaurant');
    expect(results[0].findings.event_type).toBe('business');
  });
});
