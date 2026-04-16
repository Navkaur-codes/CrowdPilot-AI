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
        { id: 'north', name: 'North Gate', baseDensity: 20 },
        { id: 'south', name: 'South Gate', baseDensity: 50 },
        { id: 'east', name: 'East Gate', baseDensity: 30 },
        { id: 'west', name: 'West Gate', baseDensity: 70 }
    ],
    amenities: [
        { id: 'food-main', name: 'Main Concourse Food', type: 'food', baseDensity: 10 },
        { id: 'rest-north', name: 'North Restrooms', type: 'restroom', baseDensity: 15 }
    ]
};

const phaseModifiers = {
    "Pre-Game": { gates: 1.5, food: 0.5, rest: 0.2 },
    "Quarter 1": { gates: 0.2, food: 0.8, rest: 0.5 },
    "Halftime": { gates: 0.1, food: 3.0, rest: 2.5 },
    "Quarter 3": { gates: 0.2, food: 0.7, rest: 0.5 },
    "Post-Game": { gates: 2.0, food: 0.1, rest: 0.8 } 
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
        })
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
    '100': ['south', 'east'],
    '200': ['north', 'west'],
    'vip': ['north']
};

function calculateBestEntry(seatInput, liveGates, isRaining) {
    let normalized = (seatInput || "").toString().toLowerCase().trim();
    
    // Fallback if no logic matches
    let preferredIds = ['north', 'south', 'east', 'west'];
    if (normalized.includes('10')) preferredIds = seatToGateMap['100'];
    else if (normalized.includes('20')) preferredIds = seatToGateMap['200'];
    else if (normalized.includes('vip')) preferredIds = seatToGateMap['vip'];
    else preferredIds = liveGates.map(g => g.id);

    // Weather Logic: If Raining, West Gate (outdoor pathway) is heavily penalized
    let processedGates = liveGates.map(g => {
        let penalty = (isRaining && g.id === 'west') ? 500 : 0; 
        return { ...g, score: g.density + penalty };
    });

    let viableGates = processedGates.filter(g => preferredIds.includes(g.id));
    if(viableGates.length === 0) viableGates = processedGates; 
    
    const bestGate = viableGates.reduce((min, cur) => cur.score < min.score ? cur : min);
    
    let reason = `Closest optimal entry mapped.`;
    if(isRaining && bestGate.id !== 'west' && preferredIds.includes('west')) {
        reason = `Weather override: Outdoor West Gate skipped due to rain. Routing to ${bestGate.name}.`;
    }

    return { gateName: bestGate.name, density: bestGate.density, id: bestGate.id, reason };
}

// ==========================================
// 4. CHATBOT, GEMINI, & VOICE SpeechRecognition
// ==========================================
let activeGeminiKey = null;

function initChatbot() {
    const toggleBtn = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('ai-chat-widget');
    const header = document.getElementById('chat-header');
    
    header.addEventListener('click', () => chatWidget.classList.toggle('collapsed'));

    // API Modal setup
    document.getElementById('api-settings-btn').addEventListener('click', () => document.getElementById('api-modal').classList.remove('hidden'));
    document.getElementById('close-modal-btn').addEventListener('click', () => document.getElementById('api-modal').classList.add('hidden'));
    document.getElementById('save-key-btn').addEventListener('click', () => {
        const val = document.getElementById('gemini-key-input').value.trim();
        if(val) { activeGeminiKey = val; document.getElementById('api-modal').classList.add('hidden'); showToast("Gemini AI API Key Activated."); }
    });

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

        recognition.onerror = () => {
            micBtn.classList.remove('listening');
            showToast("Microphone error or permission denied.");
        };
    } else {
        micBtn.style.display = 'none'; // hide if unsupported
    }

    async function handleSend() {
        const text = inputField.value.trim();
        if(!text) return;
        appendMessage(text, 'user');
        inputField.value = '';
        
        const thinkingId = appendThinking();

        if(activeGeminiKey) {
            const reply = await queryRealGemini(text, store.current());
            removeThinking(thinkingId);
            appendMessage(reply, 'bot');
        } else {
            setTimeout(() => {
                removeThinking(thinkingId);
                const reply = processLocalFallbackLogic(text, store.current());
                appendMessage(reply, 'bot');
            }, 800);
        }
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

async function queryRealGemini(userMessage, liveData) {
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeGeminiKey}`;
    try {
        const prompt = `You are a helpful stadium assistant mapping. Be extremely concise.
        DATA: ${JSON.stringify(liveData)}
        USER: ${userMessage}`;
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if(!response.ok) throw new Error("API Failure");
        const data = await response.json(); return data.candidates[0].content.parts[0].text;
    } catch(err) { return "<b>API Error.</b> Check key."; }
}

function processLocalFallbackLogic(query, liveData) {
    if(query.toLowerCase().includes('gate')) return "Checking gates... I recommend checking the Live Map for the lowest density route.";
    if(query.toLowerCase().includes('food')) return "Food lines are shortest at the Main Concourse right now.";
    return "I am analyzing. (Note: Put in a Gemini Key for true open-ended questions!)";
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

const store = { latestData: null, userConfig: null, isRaining: false, current: function() { return this.latestData; } };

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

    // Illuminate SVG Map
    updateSVGMap(entryData.id);
}

function getColorForDensity(pct) {
    if(pct < 40) return 'var(--success)';
    if(pct < 75) return 'var(--warning)';
    return 'var(--danger)';
}

function createStatRow(item) {
    const col = getColorForDensity(item.density);
    const div = document.createElement('div'); div.className = 'stat-row';
    div.innerHTML = `
        <span class="stat-name">${item.name}</span>
        <div class="stat-val-wrapper">
            <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${item.density}%; background:${col}"></div></div>
            <div class="stat-pct" style="color:${col}">${item.density}%</div>
        </div>`;
    return div;
}
