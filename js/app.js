/**
 * app.js
 * Main controller. Binds the simulator data to the DOM and Recommendations.
 */

import { startSimulation, subscribeToSimulation } from './simulator.js';
import { calculateBestEntry, calculateBreaks, calculateBestExit } from './recommendation.js';
import { initChatbot } from './chatbot.js';

// DOM Elements
const phaseDisplay = document.getElementById('event-phase-display');
const gatesContainer = document.getElementById('live-gates-container');
const amenitiesContainer = document.getElementById('live-amenities-container');

// Personalization Elements
const form = document.getElementById('personalization-form');
const seatInput = document.getElementById('seat-input');
const arrivalInput = document.getElementById('arrival-time');
const lockScreen = document.querySelector('.lock-screen');
const planStatusCard = document.getElementById('plan-status-card');
const recContent = document.getElementById('recommendation-content');

// Recommendation Outputs
const recGate = document.getElementById('rec-gate');
const recGateReason = document.getElementById('rec-gate-reason');
const recRoute = document.getElementById('rec-route');
const recFoodTime = document.getElementById('rec-food-time');
const recRestroomTime = document.getElementById('rec-restroom-time');
const recExitGate = document.getElementById('rec-exit-gate');
const recExitReason = document.getElementById('rec-exit-reason');

// Global store to hold latest data for chatbot and triggers
const store = {
    latestData: null,
    userConfig: null,
    current: function() { return this.latestData; }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Hook up Simulation
    subscribeToSimulation(handleLiveDataUpdate);
    startSimulation();

    // 2. Hook up Form
    form.addEventListener('submit', handleFormSubmit);

    // 3. Init Chatbot
    initChatbot(store);
});


function handleLiveDataUpdate(liveData) {
    store.latestData = liveData;

    // Update Header
    phaseDisplay.textContent = liveData.phase;

    // Render Live Feed (Column 3)
    renderStats(liveData.gates, gatesContainer);
    renderStats(liveData.amenities, amenitiesContainer);

    // If User has customized plan, refresh recommendations dynamically
    if(store.userConfig) {
        refreshRecommendations();
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    store.userConfig = {
        seat: seatInput.value,
        arrival: arrivalInput.value
    };

    // Unlock the UI
    lockScreen.style.display = 'none';
    recContent.classList.remove('locked-state');
    planStatusCard.style.display = 'none'; // hide the empty state card

    // Generate initial plan
    refreshRecommendations();
}

function refreshRecommendations() {
    if(!store.latestData || !store.userConfig) return;

    // 1. Entry Recommendation
    const entryData = calculateBestEntry(store.userConfig.seat, store.userConfig.arrival, store.latestData.gates);
    recGate.textContent = entryData.gateName;
    recGateReason.textContent = entryData.reason;
    recRoute.textContent = entryData.route;
    
    // Add visually dynamic styling to the badge
    const entryBadge = document.getElementById('rec-entry-time');
    entryBadge.textContent = "Live Route";
    entryBadge.style.background = getColorForDensity(entryData.density);

    // 2. Breaks
    const breakData = calculateBreaks(store.latestData.phase);
    recFoodTime.textContent = `${breakData.food.time} (est. ${breakData.food.est} crowd)`;
    recRestroomTime.textContent = `${breakData.restroom.time} (est. ${breakData.restroom.est} crowd)`;

    // 3. Exits
    const exitData = calculateBestExit(store.userConfig.seat, store.latestData.gates);
    recExitGate.textContent = exitData.gateName;
    recExitReason.textContent = exitData.reason;
}

// UI Helper methods
function renderStats(itemsArray, container) {
    container.innerHTML = '';
    itemsArray.forEach(item => {
        const color = getColorForDensity(item.density);
        
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
            <div class="stat-name">${item.name}</div>
            <div class="stat-val-wrapper">
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${item.density}%; background-color: ${color}"></div>
                </div>
                <div class="stat-pct" style="color: ${color}">${item.density}%</div>
            </div>
        `;
        container.appendChild(row);
    });
}

function getColorForDensity(pct) {
    if(pct < 40) return 'var(--success)';
    if(pct < 75) return 'var(--warning)';
    return 'var(--danger)';
}
