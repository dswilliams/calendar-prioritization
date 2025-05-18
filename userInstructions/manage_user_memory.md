# Managing User Memory in Calendar Prioritizer

This guide explains how to use and manage the user memory system in the Calendar Prioritizer application.

## Overview

The user memory system stores personal information about the user to provide more personalized calendar prioritization. This information includes:

- Personal information (name, occupation, location)
- Important relationships (family members, colleagues, etc.)
- Goals with priority levels
- Meeting type preferences

## Accessing User Memory

1. Start the backend server:
   ```bash
   node backend/index.js
   ```

2. Start the frontend development server:
   ```bash
   cd frontend && npm run dev
   ```

3. Open the application in your browser (typically at http://localhost:5173 or http://localhost:5174)

4. Click on the "User Profile" tab in the navigation bar

## Managing User Memory

### Personal Information

In the "Personal Info" tab, you can view and edit your personal information:
- Name
- Occupation
- Location

### Relationships

In the "Relationships" tab, you can manage your important relationships:
- Add new relationships by clicking the "Add Relationship" button
- Edit existing relationships by modifying the name and relation fields
- Remove relationships by clicking the delete button

### Goals

In the "Goals" tab, you can manage your goals:
- Add new goals by clicking the "Add Goal" button
- Edit existing goals by modifying the description and priority fields
- Remove goals by clicking the delete button

### Meeting Preferences

In the "Preferences" tab, you can manage your meeting type preferences:
- Add new meeting types by clicking the "Add Meeting Type" button
- Edit the priority of existing meeting types using the dropdown menu
- Remove meeting types by clicking the delete button

## Saving Changes

After making changes to your user memory, click the "Save Profile" button at the bottom of the page to save your changes.

## How User Memory Affects Calendar Prioritization

The information stored in user memory is used to personalize the calendar prioritization process:

1. Personal information is used to identify you in the calendar events
2. Relationships are used to prioritize events with important people
3. Goals are used to prioritize events that align with your current goals
4. Meeting preferences are used to prioritize specific types of meetings

This personalization helps the Calendar Prioritizer provide more relevant and impactful recommendations for your calendar events.

## Technical Details

The user memory is stored in a JSON file (`user_memory.json`) on the server. The file is loaded when the server starts and updated when you save changes through the user interface.

Default values are provided in case the user memory file doesn't exist or certain information is missing.
