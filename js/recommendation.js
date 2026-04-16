/**
 * recommendation.js
 * Contains the AI logic to recommend the best entry, breaks, and exits.
 */

// Simple mapping logic: Sectors map to closest primary gates
const seatToGateMap = {
    '100': ['south', 'east'],
    '200': ['north', 'west'],
    'vip': ['vip'],
    // Default fallback is all gates
};

/**
 * 1. Personalized Entry Strategy
 * Expects seat number (string) and live gates data.
 */
export function calculateBestEntry(seatInput, arrivalTime, liveGates) {
    let normalized = seatInput.toLowerCase().trim();
    let preferredIds = [];

    if (normalized.includes('10')) preferredIds = seatToGateMap['100'];
    else if (normalized.includes('20')) preferredIds = seatToGateMap['200'];
    else if (normalized.includes('vip')) preferredIds = seatToGateMap['vip'];
    else preferredIds = liveGates.map(g => g.id); // All gates

    // From the preferred gates, find the one with the lowest live density
    let viableGates = liveGates.filter(g => preferredIds.includes(g.id));
    if(viableGates.length === 0) viableGates = liveGates; // fallback

    const bestGate = viableGates.reduce((min, cur) => cur.density < min.density ? cur : min);

    // Dynamic routing string
    const routes = {
        'north': 'Take Highway 4 Exit, park in Lot A.',
        'south': 'Take Main St. Blvd, walk via Pedestrian Bridge.',
        'east': 'East Avenue drop-off zone.',
        'west': 'Metro Station West Walkway.',
        'vip': 'Valet Lane 1.'
    };

    return {
        gateName: bestGate.name,
        density: bestGate.density,
        route: routes[bestGate.id] || "Follow standard terminal signs.",
        reason: `Based on your seat, ${bestGate.name} is the closest entry. It currently has lowest wait time in your sector.`
    };
}

/**
 * 2. Smart Break Planner
 * Predicts the optimal time based on current phase.
 */
export function calculateBreaks(currentPhase) {
    // If it's pre-game, suggest Q1. If Q1, suggest Mid Q2. (Avoiding halftime peaks)
    
    let foodStrategy = { time: "End of Quarter 1", est: "15%" };
    let restStrategy = { time: "Mid Quarter 2", est: "5%" };

    if (currentPhase === 'Halftime' || currentPhase === 'Quarter 3') {
        foodStrategy = { time: "Wait until Quarter 4 starts", est: "10%" };
        restStrategy = { time: "Immediately after Halftime rush", est: "12%" };
    }

    return { food: foodStrategy, restroom: restStrategy };
}

/**
 * 3. Smart Exit Prediction
 */
export function calculateBestExit(seatInput, liveGates) {
    // Similar to entry, we want the lowest density gate nearby
    const entryRes = calculateBestEntry(seatInput, "exit", liveGates);
    
    return {
        gateName: entryRes.gateName,
        reason: `To beat the post-game rush, we predict ${entryRes.gateName} will have the fastest clearance rate from your section. Leave 5 mins before the end to avoid a 40-minute wait.`
    };
}
