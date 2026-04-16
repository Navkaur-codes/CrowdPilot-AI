/**
 * chatbot.js
 * Manages the AI Assistant interface and logic.
 * Prepares the architectural structure for integrating Google Gemini.
 */

/* 
// --- GEMINI INTEGRATION MOCKUP STRUCTURE ---
// In a production environment, you would use Firebase Cloud Functions 
// to securely call the Gemini API rather than exposing keys in the frontend.

const GEMINI_API_KEY = "YOUR_API_KEY_HERE";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function getGeminiResponse(userMessage, contextData) {
    try {
        const prompt = `You are a helpful stadium assistant. 
        Current Stadium Status: ${JSON.stringify(contextData)}
        User Question: ${userMessage}
        Please provide a short, helpful response based on the data.`;

        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API Error", error);
        return "I'm having trouble connecting to my AI brain. Let me revert to standard automated responses.";
    }
}
*/

export function initChatbot(liveDataContextStore) {
    const toggleBtn = document.getElementById('chat-toggle');
    const chatWidget = document.getElementById('ai-chat-widget');
    const header = document.getElementById('chat-header');
    
    // Toggle UI
    header.addEventListener('click', () => {
        chatWidget.classList.toggle('collapsed');
    });

    const sendBtn = document.getElementById('chat-send-btn');
    const inputField = document.getElementById('chat-input-field');
    const messagesContainer = document.getElementById('chat-messages');

    sendBtn.addEventListener('click', handleSend);
    inputField.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleSend();
    });

    function handleSend() {
        const text = inputField.value.trim();
        if(!text) return;

        appendMessage(text, 'user');
        inputField.value = '';

        // Show thinking indicator
        const thinkingId = appendThinking();

        // Simulate network delay for AI (or actual fetch to Gemini)
        setTimeout(() => {
            removeThinking(thinkingId);
            const reply = processLocalFallbackLogic(text, liveDataContextStore.current());
            appendMessage(reply, 'bot');
        }, 1000);
    }

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = text; // Using innerHTML to support basic formatting
        messagesContainer.appendChild(div);
        scrollToBottom();
    }

    function appendThinking() {
        const div = document.createElement('div');
        div.className = 'message thinking';
        div.id = 'thinking-' + Date.now();
        div.textContent = 'AI is thinking...';
        messagesContainer.appendChild(div);
        scrollToBottom();
        return div.id;
    }

    function removeThinking(id) {
        const el = document.getElementById(id);
        if(el) el.remove();
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Local Fallback Logic (Simulating Gemini's understanding)
function processLocalFallbackLogic(query, liveData) {
    const q = query.toLowerCase();

    if(q.includes('gate') || q.includes('enter') || q.includes('door')) {
        let sorted = [...liveData.gates].sort((a,b) => a.density - b.density);
        return `Based on live metrics, <b>${sorted[0].name}</b> is currently the least crowded (${sorted[0].density}% capacity). I recommend heading there!`;
    }

    if(q.includes('food') || q.includes('drink') || q.includes('hungry')) {
        let sorted = [...liveData.amenities].filter(a=>a.type==='food').sort((a,b) => a.density - b.density);
        return `The shortest line for food right now is at <b>${sorted[0].name}</b>. It's looking relatively clear at ${sorted[0].density}% capacity.`;
    }

    if(q.includes('leave') || q.includes('exit')) {
        return `We are currently in the <b>${liveData.phase}</b> phase. If you want to beat traffic, I recommend leaving 5 minutes before the end of Q4!`;
    }

    return "I am analyzing the stadium data. Can you clarify if you are asking about gates, food, restrooms, or exiting? <i>(Gemini API integration point)</i>";
}
