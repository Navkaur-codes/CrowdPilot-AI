// ==========================================
// 1. FIREBASE ARCHITECTURE SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
};

let isFirebaseActive = false;
let firebaseAppInitialized = false;

function toggleDataStream(useFirebase) {
    const sourceText = document.getElementById('data-source-text');
    isFirebaseActive = useFirebase;

    if (useFirebase) {
        sourceText.textContent = "Firebase Live";
        sourceText.className = "source-text live";
        stopLocalSimulation();
        startFirebaseStream();
        showToast("Connected to live Firebase. Math simulator stopped.");
    } else {
        sourceText.textContent = "Local Sim";
        sourceText.className = "source-text local";
        stopFirebaseStream();
        startSimulation();
        showToast("Reverted to predictive Local Simulator.");
    }
}

function startFirebaseStream() {
    try {
        if (!firebaseAppInitialized) {
            firebase.initializeApp(firebaseConfig);
            firebaseAppInitialized = true;
        }
        firebase.database().ref('stadium_stats').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) handleLiveDataUpdate(data);
        });
    } catch(e) {
        showToast("Firebase Error. Are your API keys valid?");
    }
}
function stopFirebaseStream() {
    if (firebaseAppInitialized) firebase.database().ref('stadium_stats').off(); 
}

// ==========================================
// 2. LOCAL SIMULATOR LOGIC
// ==========================================
let simIntervalId = null;
let phaseIntervalId = null;

const state = {
    phaseIndex: 0,
    phases: ["Pre-Game", "Quarter 1", "Halftime", "Quarter 3", "Post-Game"],
    gates: [
        { id: 'vip', name: 'VIP Portal', baseDensity: 5 },
        { id: 'north', name: 'North Gate', baseDensity: 35 },
        { id: 'south', name: 'South Gate', baseDensity: 40 },
        { id: 'east', name: 'East Gate', baseDensity: 38 },
        { id: 'west', name: 'West Gate', baseDensity: 36 }
    ],
    amenities: [
        { id: 'food-main', name: 'Main Concourse Food', type: 'food', baseDensity: 10 },
        { id: 'rest-north', name: 'North Restrooms', type: 'restroom', baseDensity: 15 }
    ],
    merchandise: [
        { id: 'merch-main', name: 'Main Team Store', type: 'merch', baseDensity: 85 },
        { id: 'merch-kiosk', name: 'Level 2 Kiosk', type: 'merch', baseDensity: 40 }
    ]
};

const phaseModifiers = {
    "Pre-Game": { gates: 1.5, food: 0.5, rest: 0.2, merch: 1.2 },
    "Quarter 1": { gates: 0.2, food: 0.8, rest: 0.5, merch: 0.5 },
    "Halftime": { gates: 0.1, food: 3.0, rest: 2.5, merch: 1.8 },
    "Quarter 3": { gates: 0.2, food: 0.7, rest: 0.5, merch: 0.3 },
    "Post-Game": { gates: 2.0, food: 0.1, rest: 0.8, merch: 2.5 } 
};

let previousPhase = null;
function notifyListeners() {
    const activePhase = state.phases[state.phaseIndex];
    if (previousPhase !== activePhase && previousPhase !== null) {
        showToast(`Phase Shift: ${activePhase}. Recalculating crowd vectors.`);
    }
    previousPhase = activePhase;

    const mods = phaseModifiers[activePhase];
    const liveData = {
        phase: activePhase,
        gates: calculateLive(state.gates, mods.gates),
        amenities: state.amenities.map(a => {
            let m = a.type === 'food' ? mods.food : mods.rest;
            return calculateLive([a], m)[0];
        }),
        merchandise: calculateLive(state.merchandise, mods.merch)
    };
    handleLiveDataUpdate(liveData);
}

function calculateLive(items, modifier) {
    return items.map(item => {
        let fluctuation = (Math.random() * 20 - 10);
        let rawDensity = (item.baseDensity * modifier) + fluctuation;
        let density = Math.floor(Math.max(0, Math.min(100, rawDensity)));
        return { ...item, density };
    });
}

function startSimulation() {
    simIntervalId = setInterval(notifyListeners, 3000);
    phaseIntervalId = setInterval(() => {
        if(state.phaseIndex < state.phases.length - 1) {
            state.phaseIndex++;
        } else {
            // Re-loop for infinite presentation
            state.phaseIndex = 0;
            showToast("Event sequence reboot. Re-initializing matrix...");
        }
    }, 20000); 
    notifyListeners();
}

function stopLocalSimulation() {
    clearInterval(simIntervalId); clearInterval(phaseIntervalId);
}

// ==========================================
// 3. RECOMMENDATION & WEATHER LOGIC
// ==========================================
const seatToGateMap = {
    '100': ['south', 'east', 'west'],
    '200': ['north', 'east', 'west'],
    '300': ['north', 'south', 'east', 'west'],
    'vip': ['vip']
};

function calculateBestEntry(seatInput, liveGates, isRaining) {
    let normalized = (seatInput || "").toString().toLowerCase().trim();
    
    // Fallback if no logic matches
    let preferredIds = ['north', 'south', 'east', 'west'];
    if (normalized.includes('10')) preferredIds = seatToGateMap['100'];
    else if (normalized.includes('20')) preferredIds = seatToGateMap['200'];
    else if (normalized.includes('30')) preferredIds = seatToGateMap['300'];
    else if (normalized.includes('vip') || normalized.includes('club')) preferredIds = seatToGateMap['vip'];
    else preferredIds = liveGates.filter(g => g.id !== 'vip').map(g => g.id); // exclude VIP for general traffic

    // Weather Logic: If Raining, West Gate (outdoor pathway) is heavily penalized
    let processedGates = liveGates.map(g => {
        let penalty = (isRaining && g.id === 'west') ? 500 : 0; 
        return { ...g, score: g.density + penalty };
    });

    // ADA Logic: Heavily penalize North and West gates (assume they have stairs/barriers)
    processedGates = processedGates.map(g => {
        let adaPenalty = (store.isADA && (g.id === 'north' || g.id === 'west')) ? 1000 : 0;
        return { ...g, score: g.score + adaPenalty };
    });

    let viableGates = processedGates.filter(g => preferredIds.includes(g.id));
    if(viableGates.length === 0) viableGates = processedGates; 
    
    const bestGate = viableGates.reduce((min, cur) => cur.score < min.score ? cur : min);
    
    let reason = `Closest optimal entry mapped.`;
    if(isRaining && bestGate.id !== 'west') {
        reason = `Weather Protocol Active: Outdoor West Gate bypassed. Routing to ${bestGate.name}.`;
    } else if (store.isADA) {
        reason = `ADA Mode Active: Prioritizing level pathways. Routing to ${bestGate.name}.`;
    }

    return { gateName: bestGate.name, density: bestGate.density, id: bestGate.id, reason };
}

// ==========================================
// 4. CHATBOT, GEMINI, & VOICE SpeechRecognition
// ==========================================
function initChatbot() {
    const toggleBtn = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('ai-chat-widget');
    const header = document.getElementById('chat-header');
    
    header.addEventListener('click', () => chatWidget.classList.toggle('collapsed'));

    const sendBtn = document.getElementById('chat-send-btn');
    const inputField = document.getElementById('chat-input-field');
    const micBtn = document.getElementById('mic-btn');
    const messagesContainer = document.getElementById('chat-messages');

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleSend(); });

    // Voice AI (SpeechRecognition Web API)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;

        micBtn.addEventListener('click', () => {
            micBtn.classList.add('listening');
            recognition.start();
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputField.value = transcript;
            micBtn.classList.remove('listening');
            setTimeout(handleSend, 500); // Auto send after brief pause
        };

        recognition.onerror = (event) => {
            micBtn.classList.remove('listening');
            if (event.error === 'not-allowed') showToast("Mic Denied: Secure context required! Serve via localhost/HTTPS, not purely file://");
            else showToast("Microphone Error: " + event.error);
        };
    } else {
        micBtn.style.display = 'none'; // hide if unsupported
    }

    function handleSend() {
        const text = inputField.value.trim();
        if(!text) return;
        appendMessage(text, 'user');
        inputField.value = '';
        
        const thinkingId = appendThinking();

        setTimeout(() => {
            removeThinking(thinkingId);
            const reply = processLocalFallbackLogic(text, store.current());
            appendMessage(reply, 'bot');
        }, 800);
    }
    function appendMessage(text, sender) {
        const div = document.createElement('div'); div.className = `message ${sender}`; div.innerHTML = text; 
        messagesContainer.appendChild(div); scrollToBottom();
    }
    function appendThinking() {
        const div = document.createElement('div'); div.className = 'message thinking'; div.id = 'thinking-' + Date.now();
        div.innerHTML = 'Thinking...'; messagesContainer.appendChild(div); scrollToBottom(); return div.id;
    }
    function removeThinking(id) { const el = document.getElementById(id); if(el) el.remove(); }
    function scrollToBottom() { messagesContainer.scrollTop = messagesContainer.scrollHeight; }
}


function processLocalFallbackLogic(query, liveData) {
    const q = query.toLowerCase();
    
    // Greeting
    if (q.match(/hello|hi\b|hey|help|morning|afternoon|evening/)) {
        return `Hello! I am your onboard Stadium AI. I am scanning the holographic matrix right now. Ask me about **gates, restrooms, food, or exit strategies**!`;
    }

    // Gate / Route Logic
    if (q.match(/gate|enter|entrance|door|go in|walk|route/)) {
        let gates = [...liveData.gates];
        if (store.isADA) {
            gates = gates.map(g => (g.id === 'north' || g.id === 'west') ? {...g, density: g.density + 1000} : g);
        }
        if (store.isRaining) {
            gates = gates.map(g => g.id === 'west' ? {...g, density: g.density + 500} : g);
        }
        gates.sort((a,b) => a.density - b.density);
        const best = gates[0];
        
        let msg = `Looking at live cameras... <b>${best.name}</b> is the best path at just ${best.density}% capacity.`;
        if (store.isADA) msg += " (Prioritized fully accessible ramped pathway).";
        if (store.isRaining && best.id !== 'west') msg += " (Keeping you indoors to avoid the rain).";
        return msg;
    }

    // Food / Drinks
    if (q.match(/food|drink|hungry|eat|beer|water|rations|concessions/)) {
        const foodOptions = [...liveData.amenities].filter(a => a.type === 'food').sort((a,b) => a.density - b.density);
        if (liveData.phase === 'Halftime') {
            return `Normally I would suggest ${foodOptions[0].name}, but it's Halftime and lines are heavily spiked (${foodOptions[0].density}%). I recommend waiting until Q3 if possible!`;
        }
        return `Your quickest option is <b>${foodOptions[0].name}</b>. It is currently at ${foodOptions[0].density}% saturation.`;
    }

    // Restrooms
    if (q.match(/restroo|bathroo|toilet|washroo|pee/)) {
        const rests = [...liveData.amenities].filter(a => a.type === 'restroom').sort((a,b) => a.density - b.density);
        return `The closest restroom queue with the lowest wait is <b>${rests[0].name}</b> (${rests[0].density}% capacity).`;
    }

    // Merch
    if (q.match(/merch|store|jersey|buy|shop|apparel/)) {
        const stores = [...liveData.merchandise].sort((a,b) => a.density - b.density);
        return `To beat the crowds, head to <b>${stores[0].name}</b>. The primary store lines are moving slowing.`;
    }

    // Exiting
    if (q.match(/exit|leave|traffic|uber|rideshare|train|parking/)) {
        if (liveData.phase === 'Post-Game' || liveData.phase === 'Quarter 3') {
            return `<b style="color:var(--danger)">Surge Pricing Alert:</b> Rideshares are experiencing severe surging (>2x). Transit lines might be delayed. Follow your blue HUD path on the map for the fastest egress threshold.`;
        }
        return `It is currently ${liveData.phase}. If you leave 5 minutes before Post-Game, you will bypass 80% of the stadium parking and traffic congestion!`;
    }

    // Phase / Status
    if (q.match(/phase|quarter|time|status/)) {
        return `We are actively in the <b>${liveData.phase}</b> phase. My internal matrix is tracking thousands of human nodes clustered adjusting to this schedule.`;
    }

    // Fallback Unrecognized
    return `I am evaluating the matrix. I specialize in reading physical stadium sensors regarding <b>gates, food, restrooms, merch, and traffic</b>. Try asking definitively about one of those topics!`;
}

// ==========================================
// 5. VISUAL CONTROLS & MAIN
// ==========================================
function showToast(msg) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    c.appendChild(t);
    
    // Critical: Remove DOM node after animation completes so invisible toasts don't stack and block UI clicks!
    setTimeout(() => { if (t.parentNode) t.remove(); }, 4500);
}

function updateSVGMap(targetGateId) {
    document.querySelectorAll('.map-path').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.gate-node').forEach(n => n.classList.remove('active'));
    
    if(targetGateId) {
        const path = document.getElementById(`path-${targetGateId}`);
        const node = document.getElementById(`node-${targetGateId}`);
        if(path) path.classList.add('active');
        if(node) node.classList.add('active');
    }
}

const store = { latestData: null, userConfig: null, isRaining: false, isADA: false, current: function() { return this.latestData; } };

document.addEventListener('DOMContentLoaded', () => {
    startSimulation();
    initChatbot();

    document.getElementById('personalization-form').addEventListener('submit', (e) => {
        e.preventDefault();
        store.userConfig = { 
            seat: document.getElementById('seat-input').value,
            arrival: document.getElementById('arrival-time').value 
        };
        document.getElementById('plan-lock-screen').style.display = 'none';
        refreshRecommendations();
        showToast("Static Uplink Acquired. Route Generated.");
    });
    
    document.getElementById('firebase-toggle').addEventListener('change', (e) => toggleDataStream(e.target.checked));
    
    // Weather Toggle Listener
    document.getElementById('weather-toggle').addEventListener('change', (e) => {
        store.isRaining = e.target.checked;
        document.getElementById('weather-icon').textContent = store.isRaining ? '🌧️' : '☀️';
        showToast(store.isRaining ? "Rain detected. Avoiding outdoor routes." : "Clear skies.");
        if(store.userConfig) refreshRecommendations(); // Recalculate if plan exists
    });

    // ADA Toggle Listener
    document.getElementById('ada-toggle').addEventListener('change', (e) => {
        store.isADA = e.target.checked;
        document.getElementById('ada-icon').textContent = store.isADA ? '🦽' : '🚶';
        showToast(store.isADA ? "ADA Accessibility Mode Active." : "Standard Routing.");
        if(store.userConfig) refreshRecommendations(); 
        document.querySelectorAll('.map-path, .gate-node').forEach(p => p.classList.toggle('ada-path', store.isADA));
    });

    // Mobile specific: disable 3D tilt on mobile layout to avoid messy touch panning, keep subtle on desktop
    document.querySelectorAll('.tilt-card').forEach(c => {
        c.addEventListener('mousemove', e => {
            const rect = c.getBoundingClientRect();
            const xRot = (((e.clientY - rect.top) / rect.height) - 0.5) * -5;
            const yRot = (((e.clientX - rect.left) / rect.width) - 0.5) * 5;
            c.style.transform = `perspective(800px) rotateX(${xRot}deg) rotateY(${yRot}deg)`;
        });
        c.addEventListener('mouseleave', () => c.style.transform = `none`);
    });
});

function handleLiveDataUpdate(liveData) {
    store.latestData = liveData;
    document.getElementById('event-phase-display').textContent = liveData.phase;
    
    const gc = document.getElementById('live-gates-container'); gc.innerHTML = '';
    liveData.gates.forEach(item => gc.appendChild(createStatRow(item)));
    
    const ac = document.getElementById('live-amenities-container'); ac.innerHTML = '';
    liveData.amenities.forEach(item => ac.appendChild(createStatRow(item)));

    const mc = document.getElementById('live-merch-container');
    if (mc && liveData.merchandise) {
        mc.innerHTML = '';
        liveData.merchandise.forEach(item => mc.appendChild(createStatRow({ ...item, name: `${item.name} Demand` })));
    }

    if(store.userConfig) refreshRecommendations();
}

function calculateBestExit(seatInput, liveGates, isRaining) {
    const entryRes = calculateBestEntry(seatInput, liveGates, isRaining);
    return {
        gateName: entryRes.gateName,
        reason: `Based on current crowd distribution leading to ${entryRes.gateName}, exit via this threshold 5 mins early to avoid bottlenecks.`
    };
}

function refreshRecommendations() {
    if(!store.latestData || !store.userConfig) return;
    const entryData = calculateBestEntry(store.userConfig.seat, store.latestData.gates, store.isRaining);
    
    document.getElementById('rec-gate').textContent = entryData.gateName;
    document.getElementById('rec-gate-reason').textContent = entryData.reason;
    document.getElementById('rec-route').textContent = `Walk via ${entryData.gateName} corridor.`;
    
    // Update Badge Status
    const entryBadge = document.getElementById('rec-entry-time');
    entryBadge.textContent = "Active Live Route";
    entryBadge.style.background = getColorForDensity(entryData.density);
    
    // Breaks
    document.getElementById('rec-food-time').textContent = store.latestData.phase === 'Pre-Game' ? 'Go now' : 'Wait for Q4';
    document.getElementById('rec-restroom-time').textContent = store.latestData.phase === 'Halftime' ? 'Wait 5 mins' : 'Clear queue';

    // Predicted Exit
    const exitData = calculateBestExit(store.userConfig.seat, store.latestData.gates, store.isRaining);
    document.getElementById('rec-exit-gate').textContent = exitData.gateName;
    document.getElementById('rec-exit-reason').textContent = exitData.reason;

    // Transit & Rideshare
    const isLate = store.latestData.phase === 'Quarter 3' || store.latestData.phase === 'Post-Game';
    let surge = isLate ? (Math.random() * 2 + 1.5).toFixed(1) : "1.0";
    let status = isLate ? "Delayed (15m)" : "On Time";
    let surgeEl = document.getElementById('rec-surge-pricing');
    if(surgeEl) {
        surgeEl.textContent = `${surge}x ${surge > 2 ? '(High)' : '(Normal)'}`;
        surgeEl.style.color = surge > 2 ? 'var(--danger)' : 'var(--warning)';
        document.getElementById('rec-transit-status').textContent = status;
        document.getElementById('rec-transit-status').style.color = isLate ? 'var(--warning)' : '#fff';
    }

    // Illuminate SVG Map
    updateSVGMap(entryData.id);
}

function getColorForDensity(pct) {
    if(pct < 40) return 'var(--success)';
    if(pct < 75) return 'var(--warning)';
    return 'var(--danger)';
}

function createStatRow(item) {
    const isAvoided = store.isRaining && item.id === 'west';
    let col = getColorForDensity(item.density);
    if (isAvoided) col = 'var(--danger)';
    
    let nameDisplay = item.name;
    if (isAvoided) nameDisplay = `<span style="color:var(--danger)">⚠️ ${item.name} (Outdoor hazard)</span>`;

    const div = document.createElement('div'); div.className = 'stat-row';
    div.innerHTML = `
        <span class="stat-name">${nameDisplay}</span>
        <div class="stat-val-wrapper">
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${item.density}%; background:${col}"></div></div>
            <div class="stat-pct" style="color:${col}">${item.density}%</div>
        </div>`;
    return div;
}
