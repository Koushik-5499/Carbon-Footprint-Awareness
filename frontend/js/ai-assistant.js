document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await apiCall('/api/ai/recommendations');
        // Simple Markdown parsing replacement for HTML linebreaks/bold
        const recommendationsHtml = formatText(res.recommendations);
        document.getElementById('recommendationsContainer').innerHTML = recommendationsHtml;
    } catch (err) {
        document.getElementById('recommendationsContainer').textContent = err.message || 'Could not load recommendations at this time. Please make sure your Gemini API key is configured in the backend .env file.';
    }
});

document.getElementById('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const question = chatInput.value;
    chatInput.value = '';

    appendMessage('You', question);

    try {
        const res = await apiCall('/api/ai/ask', 'POST', { question });
        appendMessage('EcoBot', res.answer);
    } catch (err) {
        appendMessage('EcoBot', err.message || 'Sorry, I am having trouble connecting to my Gemini brain right now. Make sure the API key is configured.');
    }
});

function appendMessage(sender, text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageEl = document.createElement('div');
    messageEl.className = 'margin-bottom-1r';
    messageEl.innerHTML = `<strong>${sender}:</strong> ${formatText(text)}`;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatText(text) {
    if (!text) return '';
    const escaped = window.escapeHTML(text);
    return escaped
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}
