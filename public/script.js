const socket = io();
let userId = '';
let currentRecipient = '';
let typingTimeout;
const sound = new Audio('notify.mp3');

// Register user
function registerUser() {
    userId = document.getElementById('userIdInput').value.trim();
    if (!userId) return alert('Please enter your username');

    socket.emit('register', userId);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-screen').style.display = 'block';
    document.getElementById('currentUserId').textContent = userId;
    loadEmojiPicker();
}

// Online users list
socket.on('online users', list => {
    const ul = document.getElementById('onlineUsers');
    ul.innerHTML = list.filter(id => id !== userId).map(id => `
        <li onclick="selectUser('${id}')">
            <span class="user-badge"></span>
            ${id}
        </li>
    `).join('');
});

function selectUser(id) {
    currentRecipient = id;
    document.getElementById('chatWith').textContent = id;
    document.getElementById('chat-select').style.display = 'none';
    document.getElementById('chat-box').style.display = 'block';
    document.getElementById('messages').innerHTML = '';
    document.getElementById('messageInput').focus();
    socket.emit('get history', { userId, withUser: id });
}

// Message handling
socket.on('chat history', chats => {
    chats.forEach(msg => appendMessage(msg.from === userId ? 'you' : 'they', msg.message));
    scrollDown();
});

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message || !currentRecipient) return;

    appendMessage('you', message);
    socket.emit('private message', { to: currentRecipient, from: userId, message });
    input.value = '';
    scrollDown();
}

socket.on('private message', ({ from, message }) => {
    if (from === currentRecipient) {
        appendMessage('they', message);
        scrollDown();
        sound.play();
    }
});

function appendMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `<div class="msg-bubble">${text}</div>`;
    document.getElementById('messages').appendChild(div);
}

function scrollDown() {
    const m = document.getElementById('messages');
    m.scrollTop = m.scrollHeight;
}

// Typing indicator
function notifyTyping() {
    if (currentRecipient) {
        socket.emit('typing', { to: currentRecipient, from: userId });
    }
}

socket.on('typing', ({ from }) => {
    if (from === currentRecipient) {
        document.getElementById('typingIndicator').textContent = 'typing...';
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            document.getElementById('typingIndicator').textContent = '';
        }, 1000);
    }
});

// Emoji picker
function loadEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲"];

    picker.innerHTML = emojis.map(emoji =>
        `<span onclick="addEmoji('${emoji}')">${emoji}</span>`
    ).join('');
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'block' ? 'none' : 'block';
}

function addEmoji(emoji) {
    const input = document.getElementById('messageInput');
    input.value += emoji;
    input.focus();
}

const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

messageInput.addEventListener('input', () => {
    if (messageInput.value.trim() !== '') {
        sendBtn.classList.remove('hidden');
    } else {
        sendBtn.classList.add('hidden');
    }
});

// Event listeners
document.getElementById('messageInput').addEventListener('input', notifyTyping);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});