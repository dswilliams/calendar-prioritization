// Default user memory values
module.exports = {
  personalInfo: {
    name: "Dan Williams",
    occupation: "Job Seeker",
    location: "Toronto"
  },
  relationships: [
    { name: "Sara", relation: "Wife" },
    { name: "Isaac", relation: "Son" },
    { name: "Nathan", relation: "Son" }
  ],
  goals: [
    { description: "Find a well-paying job", priority: "high" },
    { description: "Learn to code with AI", priority: "high" },
    { description: "Build AI-powered tools", priority: "medium" }
  ],
  preferences: {
    meetingTypes: {
      "jobInterviews": { priority: "very high" },
      "familyEvents": { priority: "high" },
      "networkingEvents": { priority: "medium" }
    }
  },
  feedback: {
    lastInteractions: []
  }
};
