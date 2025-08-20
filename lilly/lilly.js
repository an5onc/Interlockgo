// Grab references to our HTML elements
const chatContainer = document.getElementById('chat-container');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const chatToggle = document.getElementById('chat-toggle');

let botPhrases = [];
let chatLog = []; // Chat history array

// Toggle chatbot visibility
chatToggle.addEventListener('click', () => {
  chatContainer.classList.toggle('hidden');
});

// Append message to chat window
function appendMessage(message, sender) {
  const messageElem = document.createElement('div');
  messageElem.className = 'chat-message ' + (sender === 'user' ? 'user-message' : 'bot-message');
  messageElem.textContent = message;
  chatBody.appendChild(messageElem);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Save chatLog to localStorage
function saveChatLog() {
  localStorage.setItem('chatLog', JSON.stringify(chatLog));
}

// Load chatLog from localStorage
function loadChatLog() {
  const storedLog = localStorage.getItem('chatLog');
  if (storedLog) {
    chatLog = JSON.parse(storedLog);
    chatLog.forEach(entry => {
      appendMessage(entry.user, 'user');
      appendMessage(entry.bot, 'bot');
    });
  }
}

// Fetch phrases from JSON file
function loadBotPhrases() {
  fetch('./lillyphrases.json?cacheBust=' + Date.now())
    .then(response => response.json())
    .then(data => {
      botPhrases = data;
    })
    .catch(error => {
      console.error('Failed to load bot phrases:', error);
    });
}

// Bot response logic
function botResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  for (const phrase of botPhrases) {
    if (phrase.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return phrase.response;
    }
  }
  return "I'm sorry, I didn't understand that. Try rephrasing your question.";
}

// Listen for Enter key
chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const userMessage = chatInput.value.trim();
    appendMessage(userMessage, 'user');
    chatInput.value = '';

    setTimeout(() => {
      const response = botResponse(userMessage);
      appendMessage(response, 'bot');

      // Log it and save
      chatLog.push({ user: userMessage, bot: response });
      saveChatLog();
    }, 500);
  }
});

// On page load
loadBotPhrases();
loadChatLog();