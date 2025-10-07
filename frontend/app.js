const socket = new WebSocket('https://fradoka-chat-app-backend.hosting.codeyourfuture.io/'); // Connect to WebSocket server

const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const nameInput = document.getElementById('name-input');
const messageInput = document.getElementById('message-input');
socket.addEventListener('open', () => {
    console.log('Connected to WebSocket server');
});

socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'all-messages') {
        // when first connected, load all existing messages
        data.messages.forEach(addMessageToChat);
    } else if (data.type === 'new-message') {
        // when a new message is received
        addMessageToChat(data.message);
    } else if (data.type === 'update-message') {
        // when a message is updated (like/dislike)
        updateMessageInChat(data.message);
    }
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent page reload on form submit
    const name = nameInput.value.trim() || 'Anonymous';
    const text = messageInput.value.trim();
    if (!text) return; // don't send empty messages

    const message = { type: 'new-message', name, text };
    socket.send(JSON.stringify(message)); // Send new message to server
    messageInput.value = ''; // Clear input field
});

function addMessageToChat(message) {
    const messageElem = document.createElement('div');
    messageElem.className = 'message';
    messageElem.id = `message-${message.id}`;
    messageElem.innerHTML = `
        <strong>${message.name}:</strong> ${message.text} <span class="time">${message.time}</span>
        <div class="reactions">
            <button onclick="sendReaction(${message.id}, 'like')">👍 ${message.likes}</button>
            <button onclick="sendReaction(${message.id}, 'dislike')">👎 ${message.dislikes}</button>
        </div>
    `;
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}

function updateMessageInChat(message) {
    const messageElem = document.getElementById(`message-${message.id}`);
    if (messageElem) {
        const reactionsDiv = messageElem.querySelector('.reactions');
        reactionsDiv.innerHTML = `
            <button onclick="sendReaction(${message.id}, 'like')">👍 ${message.likes}</button>
            <button onclick="sendReaction(${message.id}, 'dislike')">👎 ${message.dislikes}</button>
        `;
    }
}

function sendReaction(messageID, reaction) {
    socket.send(JSON.stringify({ type: 'reaction', messageID, reaction }));
}
window.sendReaction = sendReaction; // expose to global scope for inline onclick