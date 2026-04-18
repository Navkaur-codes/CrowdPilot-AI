/**
 * Crowd Pilot AI - Vanilla Unit Tests
 * 
 * Tests the core recommendation logic mathematically to guarantee 
 * deterministic overrides for Weather, ADA, and VIP parameters.
 */

// We mock the live data vector
const mockGates = [
    { id: 'vip', name: 'VIP Portal', density: 10 },
    { id: 'north', name: 'North Gate', density: 30 },
    { id: 'south', name: 'South Gate', density: 40 },
    { id: 'east', name: 'East Gate', density: 20 },
    { id: 'west', name: 'West Gate', density: 15 } // Inherently the best for generic tests
];

// Simple Vanilla Assertion Builder
function runTest(name, action) {
    try {
        action();
        console.log(`%c[PASS] ${name}`, 'color: #10b981; font-weight: bold;');
        return `<div class="pass-block">✓ PASS: ${name}</div>`;
    } catch(e) {
        console.error(`%c[FAIL] ${name}`, 'color: #ff0055; font-weight: bold;');
        console.error(e);
        return `<div class="fail-block">✗ FAIL: ${name} <br> <span style="font-size:0.85em; opacity:0.8;">${e.message}</span></div>`;
    }
}

function assertEqual(actual, expected, msg) {
    if (actual !== expected) {
        throw new Error(`${msg} - Math Mismatch: Expected [${expected}], got [${actual}]`);
    }
}

// Ensure the main thread is unlocked and app.js initialized
setTimeout(() => {
    const resultsContainer = document.getElementById('test-results');
    let html = "<h2>Unit Test Results</h2>";
    
    // Test 1: Standard Routing
    html += runTest("Standard Routing Logic (Lowest Valid Density)", () => {
        store.isADA = false;
        const res = calculateBestEntry("100", mockGates, false);
        // For '100', allowed gates are south, east, west. West is 15 (lowest).
        assertEqual(res.id, 'west', 'Standard 100-level routing failed to pick lowest cost edge');
    });

    // Test 2: Weather Override
    html += runTest("Weather Override Protocol (Avoid Outdoor)", () => {
        store.isADA = false;
        const res = calculateBestEntry("100", mockGates, true);
        // For '100', allowed are south, east, west. West has +500 rain penalty. East is 20.
        assertEqual(res.id, 'east', 'Rain protocol failed to penalize West Gate');
    });

    // Test 3: ADA Accessibility Override
    html += runTest("ADA Accessibility Protocol (Ramps Priority)", () => {
        store.isADA = true;
        const res = calculateBestEntry("200", mockGates, false);
        // For '200', allowed are north, east, west. North and West ADA penalty +1000.
        assertEqual(res.id, 'east', 'ADA protocol failed to lockout stair-heavy paths');
    });

    // Test 4: VIP Override
    html += runTest("VIP Hardware Lock (Ignores Matrix Density)", () => {
        store.isADA = false;
        const mockedVIPGates = JSON.parse(JSON.stringify(mockGates));
        mockedVIPGates[0].density = 99; // VIP heavily crowded
        mockedVIPGates[3].density = 0;  // East empty
        const res = calculateBestEntry("VIP", mockedVIPGates, false);
        // Even though VIP is at 99%, the VIP ticket strictly locks the path to VIP.
        assertEqual(res.id, 'vip', 'VIP override logic succumbed to density routing');
    });

    resultsContainer.innerHTML = html;
}, 300);
