# Smart Personal Event Companion

A lightweight, purely vanilla HTML/CSS/JavaScript web application designed to act as a personalized AI assistant for attendees at large-scale sporting venues.

## Problem Statement
Navigating large sporting venues can be an overwhelming experience. Attendees often struggle with long queues at entry gates, unpredictable wait times for food and restrooms during breaks, and massive congestion when exiting. Standard stadium maps are static and do not adapt to the real-time flow of human traffic.

## Solution Overview
The **Smart Personal Event Companion** serves as a proactive AI guide. By accepting basic user inputs (expected arrival time and seat section), the application dynamically calculates the best entry routes, predictive break times, and the fastest exit strategies. It features a continuous real-time data simulator and an integrated chatbot to assist users conversationally.

## Features
- **Personalized Entry Recommendation**: Connects your seating section to the nearest, least-crowded entry gate.
- **Smart Break Planner**: Recommends the optimal time to grab food or use the restroom based on predictive modeling of the game's phase (e.g., avoiding the halftime rush).
- **Smart Exit Prediction**: Estimates the fastest route out of the stadium upon event conclusion.
- **AI Chat Assistant**: A conversational interface mocked up to answer queries about gates, food lines, and exit strategies.
- **Live Crowd Dashboard**: Real-time visual monitoring of entry gates and venue amenities, dynamically updating as the "event" progresses.

## Architecture
This application is strictly vanilla frontend (< 1MB) for maximum portability, organized using ES6 Modules:
- `index.html` & `style.css`: The Premium UI using a modern dark-glassmorphism aesthetic.
- `js/simulator.js`: The "Backend". Generates simulated crowd densities that react to an expanding timeline (Pre-game, Q1, Halftime, etc.).
- `js/recommendation.js`: Contains the algorithms mapping user seat data and live venue data to optimal itineraries.
- `js/chatbot.js`: Manages the conversational UI and processes user queries.
- `js/app.js`: The central controller binding data updates to DOM elements.

## Assumptions
- **Seating Logic**: It assumes specific sectors map geographically to specific venue gates (e.g., Sector 100 is closest to the South/East gates).
- **Predictive Crowds**: Assumes halftime and post-game trigger immediate massive surges in restroom and exit density respectively.
- **Data Model**: Since there is no physical backend, all live data is synthetically generated via the `simulator.js` clock rather than live IoT sensors.

## How to Run
Because this utilizes ES6 Modules (`type="module"`), you **must** serve it over an HTTP server (simply double-clicking the HTML file will result in CORS blocks by most modern browsers).

1. Clone the repository.
2. Open the directory in VS Code.
3. Use an extension like **Live Server** and hit "Go Live", or run a local Python server: `python -m http.server 8000`.
4. Open the provided `localhost` link in your browser.

## Google Services Integration
- **Gemini API**: Click the Settings Cog in the Chat Window to inject your API Key and run queries over the live JSON structure. Provide your AI Studio API key in the UI settings dialog.
- **Firebase Realtime Database**: The UI features a Data Toggle. When switching to Firebase, it kills local JS noise and listens for WebSocket pushes.

## Testing

Run the automated mathematical logic diagnostics:
```bash
node smart-tests.js
```
*This validates matrix robustness, null handling, and proximity algorithms independently of the DOM.*

## Accessibility
- Keyboard navigation supported
- High contrast UI
- Screen reader friendly layout

### Firebase Required JSON Structure
To successfully stream to this dashboard without errors, your Firebase Realtime node located at `/stadium_stats` must output standard JSON formatted strictly like this:
```json
{
  "phase": "Halftime",
  "gates": [
    { "id": "north", "name": "North Gate", "density": 85, "cap": 1000 }
  ],
  "amenities": [
    { "id": "food_1", "name": "Main Concourse", "density": 90, "cap": 500 }
  ]
}
```

## Future Enhancements
- **IoT Crowd Sensors**: Integrating physical turnstile hardware to replace API simulations.
- **AR Navigation**: Projecting the glowing SVG map paths directly onto the user's phone camera feed.
- **Progressive Web App (PWA)**: Enabling offline-first capability and push notifications.
- **Machine Learning**: Transitioning from rule-based AI routing to a fully predictive neural network for crowd dispersion.
