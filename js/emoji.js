
// Emoji picker functionality

export function setupEmojiPicker(messageInput) {
  // Create emoji picker
  const emojiButton = document.createElement("button");
  emojiButton.className = "emoji-button";
  emojiButton.setAttribute("title", "Insert emoji");
  emojiButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  `;

  const emojiPicker = document.createElement("div");
  emojiPicker.className = "emoji-picker";

  // Common emojis
  const emojis = [
    "😊", "👍", "🎉", "❤️", "😂", "🤔", "👀", "✅", "🚀", "🙏",
    "👋", "🔥", "⭐", "📎", "📅", "📌", "🏆", "💡", "🎯", "✨",
  ];

  emojis.forEach((emoji) => {
    const emojiElement = document.createElement("span");
    emojiElement.className = "emoji";
    emojiElement.textContent = emoji;
    emojiElement.addEventListener("click", () => {
      messageInput.value += emoji;
      messageInput.focus();
      emojiPicker.style.display = "none";
    });
    emojiPicker.appendChild(emojiElement);
  });

  document.querySelector(".input-row").insertBefore(emojiButton, messageInput);
  document.querySelector(".input-container").appendChild(emojiPicker);

  emojiButton.addEventListener("click", (e) => {
    e.preventDefault();
    if (emojiPicker.style.display === "grid") {
      emojiPicker.style.display = "none";
    } else {
      emojiPicker.style.display = "grid";
    }
  });

  // Close emoji picker when clicking elsewhere
  document.addEventListener("click", (e) => {
    if (!emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
      emojiPicker.style.display = "none";
    }
  });
}
