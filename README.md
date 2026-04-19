# Crowd Pilot AI 🏟️
**The Holographic Stadium Matrix & Smart Event Companion**

🚀 **[Live Demo Available Here](https://crowdpilot-ai.onrender.com)**

A lightweight, purely vanilla HTML/CSS/JavaScript web application designed to act as a personalized, state-of-the-art AI dashboard for attendees at large-scale sporting venues. Built as a high-performance "Command Center" interface.

## 🎯 The Problem
Navigating massive sporting venues is notoriously frustrating. Attendees struggle with bottlenecked entry gates, unpredictable restroom/food lines, and post-game traffic surges. Simple static maps don't adapt to the real-time flow of human traffic, sudden weather changes, or accessibility constraints.

## 💡 The Solution
**Crowd Pilot AI** serves as your proactive, context-aware stadium concierge. By reading real-time saturation matrices alongside your specific user constraints (Seat uplinks, weather, ADA needs), the application dynamically calculates optimal entry paths, suggests intelligent break times to avoid rushes, and predicts the fastest exit strategies.

---

## 🏢 Chosen Vertical
Our chosen vertical is **Sports & Live Entertainment**, specifically focusing on large-scale stadium event management and attendee experience optimization.

## 🧠 Approach & Logic
Our approach avoids heavy external API dependencies in favor of an **Onboard Smart Local AI engine**. The logic is powered by a localized matrix simulator that tracks virtual "surge" queues across the stadium. The routing logic calculates optimal paths by dynamically assigning penalty weights to specific graph edges based on real-time factors:
- Physical distance to the target destination
- Real-time queue saturation at gates and facilities
- Environmental heuristics (e.g., Weather rendering outdoor paths invalid)
- Accessibility requirements (e.g., ADA mode forcing ramps over stairs)

## ⚙️ How the Solution Works
The application functions as a highly reactive, central command dashboard:
1. **Data Ingestion:** The dashboard listens to an internal JavaScript simulator (or Firebase WebSockets in production) to update localized wait times every few seconds.
2. **User Constraint Matrix:** The Uplink form sets the user's ultimate physical goal (e.g., VIP, Section 104). Weather and ADA toggles apply strict heuristic filters restricting certain pathways.
3. **Reactive UI & AI:** The visual Holographic Radar dynamically highlights the computed optimal path by reading the updated graph. The integrated Chatbot reads these exact live data arrays to answer natural language questions contextually, all without requiring an external AI API key or round-trip server delay.

## 🤔 Assumptions Made
To ensure the prototype functions immediately for reviewers without friction, the following assumptions and design choices were made:
- **No external API keys provided:** We assume reviewers want a zero-configuration "plug and play" experience. Therefore, the default AI engine and data matrices rely entirely on a robust internal Local Simulator rather than demanding OpenAI or Firebase keys.
- **Modern Browser Engine:** We assume the usage of a modern browser (Chrome, Edge, Safari) that natively supports modern CSS features (CSS Grid, CSS Subgrid, `backdrop-filter` for glassmorphism) without requiring heavy polyfills.
- **Voice Sandbox Restrictions:** We assume that if voice functionality is formally tested, the reviewer will launch the application over a local development server (`localhost`), as modern browsers universally strictly block `navigator.mediaDevices.getUserMedia` when running on raw `file:///` protocols for security reasons.

---

## ✨ Core Features

* **Ticket Uplink Personalization:** Users input their specific Section/Seat and Expected Arrival time to establish a static uplink. The routing array then dynamically tailors all gate and mobility recommendations to their specific physical endpoint in the venue.
* **Live Holographic Radar Array:** A dynamic SVG-powered stadium map that visually tracks your paths, illuminating optimal active routes and pulsing entry nodes based on traffic density.
* **Facilities & Merchandise Demand Tracking:** Real-time analytics monitor the surge matrices for crucial amenities like Main Concourse Food and the primary Team Stores, steering users away from high wait times.
* **Onboard Smart Local AI:** A completely custom, zero-dependency Natural Language Processing (NLP) chat engine. Ask about food, routing, or traffic via text or **Voice**, and the AI will analyze the live matrix to give you instantaneous, context-correct advice without needing external API keys.
* **Weather Override Protocols:** Raining? The AI actively re-evaluates the matrix, instantly penalizing outdoor entries (like the West Gate) and routing you exclusively through covered pathways.
* **ADA Accessibility Mode:** Seamlessly filters routing graphs to prioritize ramps and elevators, physically locking out stair-heavy entrances.
* **Predictive Event Sequencing:** The matrix constantly reads the game phase (Pre-Game, Halftime, Q3). It knows halftime triggers massive restroom/merch queues, and will intelligently advise you to hold off until the 3rd Quarter.
* **Transit & Rideshare Analytics:** Forewarns you about external post-game congestion loops and dynamic uber/rideshare surge pricing (>2.0x).

---

## 🛠️ Architecture

This application is engineered strictly on a **Vanilla Frontend Stack (< 1MB)** for lightning-fast UI performance:

* `index.html`: The structural backbone deploying a heavily optimized CSS Grid "Command Center" responsive layout.
* `style.css`: Powers the premium aesthetic—dark-glassmorphism, CSS sub-grid meshes, cyber-typography, and hardware-accelerated 3D tilt effects.
* `app.js`: The central monolithic controller. Houses the AI parsing engine, Firebase WebSocket listeners, DOM manipulation tree, and the temporal Event Simulator clock.

*(Note: There are no build steps, no React/Vue bloat, and zero compilation dependencies.)*

---

## 🚀 How to Run

There are two ways to access the Crowd Pilot AI dashboard:

### 1. Instant Access (Recommended)
Simply visit the **[Live Demo](https://crowdpilot-ai.onrender.com)** to see the app in action immediately with no installation required.

### 2. Local Setup
If you prefer to run the project locally or inspect the source code:

1. **Clone or Download** this repository.
2. **Launch the App:** You can launch the dashboard by simply double-clicking `index.html` to open it in your browser (`file:///`).
3. **Using the Voice AI:** *Important!* Modern browsers proactively block microphone execution on `file:///` protocols for security reasons. To use the **Voice Chat** feature, you must serve the application on a local server context:
   * **VS Code:** Right-click `index.html` and use the **Live Server** extension.
   * **NodeJS:** Open a terminal and run `npx serve`. 
   *(Then open the provided `http://localhost:XXXX` link in your browser!)*

---

## 🔌 External Connectivity

* **Firebase Realtime Database:** The dashboard features a persistent Data Source override toggle. Switch it to "Firebase Live" to kill the localized JavaScript matrix simulator and listen securely for active cloud WebSocket pushes, reflecting truly live turnstile hardware metrics! *(Note: The repository is configured to run off the Local Simulator by default for immediate evaluation. Connecting to Firebase requires inputting your own API keys in `app.js`).*

---

## 🧪 How to Test & Evaluate

To fully experience the dynamic, reactive nature of the Crowd Pilot AI during judging, we highly recommend trying the following sequences:

1. **Data Source Check:** Ensure the top sub-header toggle for **Data Source** is set to "Local Sim" (default). This powers the entire application using the onboard JavaScript matrix engine, sidestepping the need to manually configure Firebase API keys.
2. **Test the Uplink & Routing Lock:** Enter "VIP" in the Ticket Uplink form and hit submit. Watch the holographic radar instantly illuminate the top-right VIP node. Override it with "104" or "North" and watch standard entry calculations seamlessly recalculate on the map.
3. **Stress Test the Local AI:** Open the chat widget (bottom right). Try throwing complex natural phrases at it like *"Where gets me inside the fastest?"*, *"Where can I get a beer?"*, or *"When should I leave?"*. It will read the **live matrix values** on your screen to answer contextually instead of giving pre-canned responses.
4. **Trigger Environmental Overrides:** Toggle the **Weather** feature along the top sub-header. Now, ask the AI again where to enter—it will intentionally lock out the "West Gate" (programmed computationally as an outdoor pathway) and dynamically advise an indoor alternative to keep you dry.
5. **Trigger Accessibility Protocols:** Toggle the **Access (ADA)** switch. Both the holographic map and the AI text engine will instantly penalize paths with stairs and prioritize ramps and elevators.
6. **Observe Predictive Phases:** Let the app run. The internal simulator will automatically advance the "Event Phase" (Pre-Game ➔ Q1 ➔ Halftime) every 20 seconds. Watch the massive, sudden spike in Restroom and Merchandise demand the exact second Halftime triggers, and see how the AI actively advises against using facilities during to this surge.

### Test Coverage Matrix

By executing the steps above, reviewers will successfully perform manual end-to-end verification of the following systems:
- **Routing logic:** Validates dynamic grid-cost calculations and node lock-ins based on user Uplink location.
- **Weather override:** Validates the successful application of penalty weights to outdoor matrices (e.g., West Gate block).
- **ADA routing:** Validates immediate graph rerouting to prioritize ramps/elevators over heavy inclines or stairs.
- **AI response logic:** Validates that the natural language parser correctly reads state and issues context-aware (non-canned) responses for gates, food, and exit traffic.
