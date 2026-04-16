# Smart Personal Event Companion

A lightweight, purely vanilla HTML/CSS/JavaScript web application designed to act as a personalized AI dashboard for attendees at large-scale sporting venues. Built as a premium, high-performance holographic interface.

## Problem Statement
Navigating large sporting venues can be an overwhelming experience. Attendees often struggle with long queues at entry gates, unpredictable wait times for food and restrooms during breaks, and massive congestion when exiting. Standard stadium maps are static and do not adapt to the real-time flow of human traffic or sudden weather/accessibility constraints.

## Solution Overview
The **Smart Personal Event Companion** serves as a proactive AI guide. By accepting basic user inputs (expected arrival time and seat section), the application dynamically calculates the best entry routes, predictive break times, and the fastest exit strategies. It features a continuous real-time data simulator, live transit monitoring, and an integrated generative AI chatbot to assist users conversationally.

## Features
- **Personalized Entry Recommendation**: Connects your seating section to the nearest, least-crowded entry gate. Now includes exclusive **VIP Routing**.
- **ADA Accessibility Mode**: Seamlessly reroutes users away from non-compliant entrances (e.g., stairs) and pulses a distinct yellow route map to accessible gates.
- **Weather Override Protocols**: Real-time response algorithms that identify affected gates (e.g., West Gate exposed to rain) and automatically reroutes traffic away from hazards.
- **Smart Break Planner**: Recommends the optimal time to grab food or use the restroom based on predictive modeling of the game's phase (e.g., avoiding the halftime rush).
- **Transit & Rideshare Analytics**: Monitors external wait times and dynamically simulates escalating surge pricing once the stadium event enters Q3 or Post-Game phases.
- **Merchandise Traffic**: Tracks saturation levels for primary Team Stores and secondary Level 2 concourse Kiosks.
- **AI Chat Assistant**: A conversational interface that natively ties into the Google Gemini API to dynamically answer queries based on live venue matrices. 

## Architecture
This application is strictly vanilla frontend (< 1MB) for maximum portability and raw UI performance:
- `index.html`: Holds the Premium UI layout, deploying a heavily optimized CSS Grid "Command Center" structural backbone.
- `style.css`: Powers the modern dark-glassmorphism aesthetic, cyber-grid mesh backgrounds, and SVG radar micro-animations.
- `app.js`: The central monolithic controller. It encapsulates the routing engine, Firebase connection listeners, DOM manipulation logic, and the core temporal Event Simulator.

## Assumptions
- **Seating Logic**: It assumes specific sectors map geographically to specific venue gates (e.g., Sector "VIP" maps exclusively to the VIP Portal, standard tickets are rejected).
- **Predictive Crowds**: Assumes halftime triggers massive surges in restroom/merch demand, and post-game triggers 2.5x rideshare surge limits.
- **Data Model**: Since there is no physical backend, all live data is synthetically generated via the `app.js` phase simulation clock unless specifically augmented by overriding the Firebase Data Source toggle.

## How to Run
It is an entirely local, zero-dependency environment.

1. Clone the repository.
2. Directly open `index.html` in any modern web browser. (Because the architecture is consolidated into a pure monolithic framework without external module importing, a local Node/Python server is technically no longer required just to run the UI simulator!)

## Google Services Integration
- **Gemini AI**: Click the Settings Cog in the custom Chat Window to securely inject your personal API Key and chat seamlessly.
- **Firebase Realtime Database**: The UI features a Data Source Sub-Header Toggle. When switching to 'Live Stream', it kills local JS simulation noise and listens securely for active cloud WebSocket pushes.

## Future Enhancements
- **IoT Crowd Sensors**: Integrating physical turnstile hardware to replace API simulations entirely.
- **AR Navigation**: Projecting the glowing SVG map paths directly onto the user's phone camera feed for spatial computing.
