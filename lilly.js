// Grab references to our HTML elements
const chatContainer = document.getElementById('chat-container');
const chatBody = document.getElementById('chat-body');
const chatInput = document.getElementById('chat-input');
const chatToggle = document.getElementById('chat-toggle');

// Toggle the chatbot visibility
chatToggle.addEventListener('click', () => {
  chatContainer.classList.toggle('hidden');
});

// Function to append messages to the chat window
function appendMessage(message, sender) {
  const messageElem = document.createElement('div');
  messageElem.className = 'chat-message ' + (sender === 'user' ? 'user-message' : 'bot-message');
  messageElem.textContent = message;
  chatBody.appendChild(messageElem);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Simple rule-based response logic
function botResponse(userMessage) {
  let response = "I'm sorry, I didn't understand that.";
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    response = 'Hello there! How can I help you today?';
  } else if (lowerMessage.includes('help')) {
    response = 'Sure, let me know what you need assistance with.';
  } else if (lowerMessage.includes('interlocknoco')) {
    response = 'InterlockNoCo is your go-to place for all things interlock!';
  }
  // Add more response rules as needed
  return response;
}

// Listen for the Enter key to send messages
chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const userMessage = chatInput.value.trim();
    appendMessage(userMessage, 'user');
    chatInput.value = '';

    // Simulate a short delay for the bot's reply
    setTimeout(() => {
      const response = botResponse(userMessage);
      appendMessage(response, 'bot');
    }, 500);
  }
});