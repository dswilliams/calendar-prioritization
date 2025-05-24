/**
 * Agent Orchestrator
 * 
 * This module is responsible for coordinating the interactions between different agents.
 * It manages the flow of information and calls between agents.
 */

const prioritizationAgent = require('./prioritizationAgent');
const researchAgent = require('./researchAgent');
const relationshipAgent = require('./relationshipAgent');

/**
 * Orchestrates the calendar prioritization process
 * @param {Array} events - The calendar events to prioritize
 * @param {Object} userMemory - The user memory data
 * @param {string} userEmail - The user's email address
 * @param {Object} options - Additional options for the orchestration
 * @returns {Promise<Object>} - The orchestration results
 */
async function orchestrateCalendarPrioritization(events, userMemory, userEmail, options = {}) {
  console.log('Orchestrator: Starting calendar prioritization process');
  
  try {
    // Step 1: Basic event preprocessing
    console.log(`Orchestrator: Processing ${events.length} events`);
    
    // Step 2: Analyze relationships for events with attendees
    // This is a placeholder for future integration
    // In the future, we would selectively call the relationship agent for events that need it
    const relationshipResults = {};
    if (options.analyzeRelationships) {
      console.log('Orchestrator: Analyzing relationships (placeholder)');
      // This would be implemented in the future
    }
    
    // Step 3: Research vague event titles/descriptions
    // This is a placeholder for future integration
    // In the future, we would selectively call the research agent for events that need it
    let researchResults = [];
    if (options.researchEvents) {
      console.log('Orchestrator: Researching events with Research Agent');
      researchResults = await researchAgent.researchEvents(events, userMemory);
    }
    
    // Step 4: Prioritize events using the prioritization agent
    console.log('Orchestrator: Prioritizing events with Prioritization Agent');
    const prioritizationResults = await prioritizationAgent.prioritizeEvents(
      events, 
      userMemory, 
      userEmail
    );
    
    // Step 5: Return the combined results
    return {
      prioritization: prioritizationResults,
      relationships: relationshipResults,
      research: researchResults,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Orchestrator: Error during calendar prioritization', error);
    throw error;
  }
}

module.exports = {
  orchestrateCalendarPrioritization
};
