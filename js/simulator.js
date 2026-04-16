/**
 * simulator.js
 * Handles the generation of fake real-time data for the venue.
 * 
 * In a real application, this module would be replaced by WebSockets 
 * or API polling to a backend server (e.g. Firebase Realtime Database).
 */

// Core state
export const state = {
    phaseIndex: 0,
    phases: ["Pre-Game", "Quarter 1", "Quarter 2", "Halftime", "Quarter 3", "Quarter 4", "Post-Game"],
    gates: [
        { id: 'north', name: 'North Gate', baseDensity: 20 },
        { id: 'south', name: 'South Gate', baseDensity: 50 },
        { id: 'east', name: 'East Gate', baseDensity: 30 },
        { id: 'west', name: 'West Gate', baseDensity: 70 },
        { id: 'vip', name: 'VIP Entrance', baseDensity: 5 }
    ],
    amenities: [
        { id: 'food-main', name: 'Main Concourse Food', type: 'food', baseDensity: 10 },
        { id: 'food-upper', name: 'Upper Deck Snacks', type: 'food', baseDensity: 5 },
        { id: 'rest-north', name: 'North Restrooms', type: 'restroom', baseDensity: 15 },
        { id: 'rest-south', name: 'South Restrooms', type: 'restroom', baseDensity: 25 },
    ]
};

// Modifiers based on the game phase (simulates how crowds behave)
const phaseModifiers = {
    "Pre-Game": { gates: 1.5, food: 0.5, rest: 0.2 },
    "Quarter 1": { gates: 0.2, food: 0.8, rest: 0.5 },
    "Quarter 2": { gates: 0.1, food: 1.0, rest: 0.8 },
    "Halftime": { gates: 0.1, food: 3.0, rest: 2.5 },
    "Quarter 3": { gates: 0.2, food: 0.7, rest: 0.5 },
    "Quarter 4": { gates: 0.5, food: 0.3, rest: 0.4 },
    "Post-Game": { gates: 2.0, food: 0.1, rest: 0.8 } // Exiting surge
};

// Callbacks array for when data updates
const listeners = [];

export function subscribeToSimulation(callback) {
    listeners.push(callback);
}

function notifyListeners() {
    const activePhase = state.phases[state.phaseIndex];
    const mods = phaseModifiers[activePhase];

    // Generate current tick data
    const liveData = {
        phase: activePhase,
        gates: calculateLive(state.gates, mods.gates),
        amenities: state.amenities.map(a => {
            let m = a.type === 'food' ? mods.food : mods.rest;
            return calculateLive([a], m)[0];
        })
    };

    listeners.forEach(cb => cb(liveData));
}

function calculateLive(items, modifier) {
    return items.map(item => {
        // Random fluctuation +/- 10%
        let fluctuation = (Math.random() * 20 - 10);
        let rawDensity = (item.baseDensity * modifier) + fluctuation;
        let density = Math.floor(Math.max(0, Math.min(100, rawDensity)));
        return { ...item, density };
    });
}

// Start Simulator
export function startSimulation() {
    // Update data every 3 seconds
    setInterval(notifyListeners, 3000);
    
    // Progress the game phase every 30 seconds for demonstration purposes
    setInterval(() => {
        if(state.phaseIndex < state.phases.length - 1) {
            state.phaseIndex++;
            console.log("Game advanced to:", state.phases[state.phaseIndex]);
        }
    }, 30000);

    // Initial trigger
    notifyListeners();
}
