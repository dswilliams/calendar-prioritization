import { useState, useEffect } from 'react';

function UserProfile() {
  const [userMemory, setUserMemory] = useState({
    personalInfo: {
      name: '',
      occupation: '',
      location: ''
    },
    relationships: [],
    goals: [],
    preferences: {
      meetingTypes: {}
    },
    feedback: {
      lastInteractions: []
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Fetch user memory data
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    console.log('UserProfile: Initiating fetchUserMemory...');
    const fetchUserMemory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5001/api/user', {
          credentials: 'include',
          signal: signal // Pass the signal to the fetch request
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        setUserMemory(data);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('UserProfile: Fetch aborted.');
          return; // Ignore aborted fetches
        }
        console.error('Error fetching user memory:', error);
        setError('Failed to load user profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserMemory();

    // Cleanup function: abort the fetch if the component unmounts or the effect re-runs
    return () => {
      abortController.abort();
    };
  }, []); // Empty dependency array to run only on mount and cleanup on unmount
  
  // Save user memory data
  const saveUserMemory = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const response = await fetch('http://localhost:5001/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userMemory)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save user data: ${response.status}`);
      }
      
      setSuccessMessage('Profile saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving user memory:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle personal info changes
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setUserMemory({
      ...userMemory,
      personalInfo: {
        ...userMemory.personalInfo,
        [name]: value
      }
    });
  };
  
  // Handle relationship changes
  const handleRelationshipChange = (index, field, value) => {
    const updatedRelationships = [...userMemory.relationships];
    updatedRelationships[index] = {
      ...updatedRelationships[index],
      [field]: value
    };
    
    setUserMemory({
      ...userMemory,
      relationships: updatedRelationships
    });
  };
  
  // Add new relationship
  const addRelationship = () => {
    setUserMemory({
      ...userMemory,
      relationships: [
        ...userMemory.relationships,
        { name: '', relation: '' }
      ]
    });
  };
  
  // Remove relationship
  const removeRelationship = (index) => {
    const updatedRelationships = [...userMemory.relationships];
    updatedRelationships.splice(index, 1);
    
    setUserMemory({
      ...userMemory,
      relationships: updatedRelationships
    });
  };
  
  // Handle goal changes
  const handleGoalChange = (index, field, value) => {
    const updatedGoals = [...userMemory.goals];
    updatedGoals[index] = {
      ...updatedGoals[index],
      [field]: value
    };
    
    setUserMemory({
      ...userMemory,
      goals: updatedGoals
    });
  };
  
  // Add new goal
  const addGoal = () => {
    setUserMemory({
      ...userMemory,
      goals: [
        ...userMemory.goals,
        { description: '', priority: 'medium' }
      ]
    });
  };
  
  // Remove goal
  const removeGoal = (index) => {
    const updatedGoals = [...userMemory.goals];
    updatedGoals.splice(index, 1);
    
    setUserMemory({
      ...userMemory,
      goals: updatedGoals
    });
  };
  
  // Handle meeting type preference changes
  const handleMeetingTypeChange = (type, value) => {
    setUserMemory({
      ...userMemory,
      preferences: {
        ...userMemory.preferences,
        meetingTypes: {
          ...userMemory.preferences.meetingTypes,
          [type]: { priority: value }
        }
      }
    });
  };
  
  // Add new meeting type
  const addMeetingType = () => {
    const newType = prompt('Enter new meeting type:');
    if (newType && newType.trim() !== '') {
      setUserMemory({
        ...userMemory,
        preferences: {
          ...userMemory.preferences,
          meetingTypes: {
            ...userMemory.preferences.meetingTypes,
            [newType.trim()]: { priority: 'medium' }
          }
        }
      });
    }
  };
  
  // Remove meeting type
  const removeMeetingType = (type) => {
    const updatedMeetingTypes = { ...userMemory.preferences.meetingTypes };
    delete updatedMeetingTypes[type];
    
    setUserMemory({
      ...userMemory,
      preferences: {
        ...userMemory.preferences,
        meetingTypes: updatedMeetingTypes
      }
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'personal' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Info
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'relationships' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('relationships')}
        >
          Relationships
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'goals' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('goals')}
        >
          Goals
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'preferences' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>
      
      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={userMemory.personalInfo.name}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Occupation</label>
              <input
                type="text"
                name="occupation"
                value={userMemory.personalInfo.occupation}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={userMemory.personalInfo.location}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Relationships Tab */}
      {activeTab === 'relationships' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Relationships</h3>
            <button
              onClick={addRelationship}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Add Relationship
            </button>
          </div>
          
          {userMemory.relationships.length === 0 ? (
            <p className="text-gray-500 italic">No relationships added yet.</p>
          ) : (
            userMemory.relationships.map((relationship, index) => (
              <div key={index} className="flex items-center gap-4 mb-4 p-3 border border-gray-200 rounded-md">
                <div className="flex-grow grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Name</label>
                    <input
                      type="text"
                      value={relationship.name}
                      onChange={(e) => handleRelationshipChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Relation</label>
                    <input
                      type="text"
                      value={relationship.relation}
                      onChange={(e) => handleRelationshipChange(index, 'relation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeRelationship(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Goals</h3>
            <button
              onClick={addGoal}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Add Goal
            </button>
          </div>
          
          {userMemory.goals.length === 0 ? (
            <p className="text-gray-500 italic">No goals added yet.</p>
          ) : (
            userMemory.goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-4 mb-4 p-3 border border-gray-200 rounded-md">
                <div className="flex-grow grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Description</label>
                    <input
                      type="text"
                      value={goal.description}
                      onChange={(e) => handleGoalChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Priority</label>
                    <select
                      value={goal.priority}
                      onChange={(e) => handleGoalChange(index, 'priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="very high">Very High</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeGoal(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Meeting Type Preferences</h3>
            <button
              onClick={addMeetingType}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
            >
              Add Meeting Type
            </button>
          </div>
          
          {Object.keys(userMemory.preferences.meetingTypes).length === 0 ? (
            <p className="text-gray-500 italic">No meeting type preferences added yet.</p>
          ) : (
            Object.entries(userMemory.preferences.meetingTypes).map(([type, { priority }]) => (
              <div key={type} className="flex items-center gap-4 mb-4 p-3 border border-gray-200 rounded-md">
                <div className="flex-grow grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Meeting Type</label>
                    <input
                      type="text"
                      value={type}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => handleMeetingTypeChange(type, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="very high">Very High</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeMeetingType(type)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Error and Success Messages */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-600">
          {successMessage}
        </div>
      )}
      
      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={saveUserMemory}
          disabled={isSaving}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:bg-blue-300"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}

export default UserProfile;
