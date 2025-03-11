
document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chatMessages');
  const userInput = document.getElementById('userInput');
  const sendButton = document.getElementById('sendButton');

  // Add a welcome message
  addMessage('Hello! I\'m your AI assistant. How can I help you today?', 'ai');

  // Send message when clicking the send button
  sendButton.addEventListener('click', sendMessage);
  
  // Send message when pressing Enter (not Shift+Enter)
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    
    // Simulate AI response (in a real app, you would call an API here)
    setTimeout(() => {
      const responses = [
        "I'm here to help you with any questions!",
        "That's an interesting question. Let me think about it.",
        "I understand what you're asking. Here's what I think...",
        "Thanks for sharing that with me.",
        "Could you provide more details about your question?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'ai');
    }, 1000);
  }

  function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
