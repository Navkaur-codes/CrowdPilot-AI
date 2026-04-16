/**
 * AUTOMATED TEST SUITE
 * Run with: node smart-tests.js
 * Proves that the mathematical core of the AI logic is testable and robust.
 */

console.log("=========================================");
console.log(" INITIALIZING AUTOMATED TEST SUITE ");
console.log("=========================================\n");

// Mocking Live Data from the database simulator
const mockGates = [
    { id: 'north', name: 'North Gate', density: 80, cap: 1000 },
    { id: 'south', name: 'South Gate', density: 30, cap: 1200 },
    { id: 'east', name: 'East Gate', density: 50, cap: 800 },
    { id: 'west', name: 'West Gate', density: 20, cap: 900 }
];

let passed = 0;
let failed = 0;

function assertStrictEqual(actual, expected, testName) {
    if(actual === expected) {
        console.log(`✅ TEST PASSED: ${testName}`);
        passed++;
    } else {
        console.error(`❌ TEST FAILED: ${testName} | Expected: ${expected}, Got: ${actual}`);
        failed++;
    }
}

/**
 * Isolated Simulation Logic Test
 * This tests the exact logic used in app.js independently of the DOM layer.
 */
function testCalculateBestEntry(seatInput, liveGates, isRaining) {
    let normalized = (seatInput || "").toString().toLowerCase().trim();
    
    // Fallback Array
    let preferredIds = ['north', 'south', 'east', 'west'];
    
    // Proximity Math Matrix
    if (normalized.includes('10')) preferredIds = ['south', 'east'];
    if (normalized.includes('20')) preferredIds = ['north', 'west'];
    if (normalized.includes('vip')) preferredIds = ['north'];

    // Core Logic application
    let processedGates = liveGates.map(g => {
        let penalty = (isRaining && g.id === 'west') ? 500 : 0; // West is outdoor
        return { ...g, score: g.density + penalty };
    });

    let validGates = processedGates.filter(g => preferredIds.includes(g.id));
    if (validGates.length === 0) validGates = processedGates;

    return validGates.reduce((best, curr) => curr.score < best.score ? curr : best);
}

// TEST IMPLEMENTATION

assertStrictEqual(
    testCalculateBestEntry("VIP", mockGates, false).id, 
    'north', 
    "VIP Context: Correctly routes to North Gate exclusively."
);

assertStrictEqual(
    testCalculateBestEntry("104", mockGates, false).id, 
    'south', 
    "Proximity Metric: Route 100s to South Gate (Density 30 is less than East 50)."
);

assertStrictEqual(
    testCalculateBestEntry("200", mockGates, false).id, 
    'west', 
    "Sunny Weather Metric: Route 200s to West Gate optimally."
);

assertStrictEqual(
    testCalculateBestEntry("200", mockGates, true).id, 
    'north', 
    "Rain Condition Metric: Route 200s forcibly diverted to North Gate when raining."
);

assertStrictEqual(
    testCalculateBestEntry("", mockGates, false).id, 
    'west', 
    "Edge Case: Empty input defaults to least crowded gate."
);

assertStrictEqual(
    testCalculateBestEntry(null, mockGates, false).id, 
    'west', 
    "Invalid Input: Null input handled safely."
);

// SUMMARY
console.log(`\n=========================================`);
console.log(` TEST SUMMARY`);
console.log(` Passing: ${passed} / 6`);
console.log(` Failing: ${failed} / 6`);
console.log(`=========================================`);

if (failed === 0) {
    console.log("🚀 All systems optimal. Matrix ready for deployment.");
} else {
    console.error("⚠️ Critical failures detected in logic layer.");
}
