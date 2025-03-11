
// Chat history management

export async function loadChatHistory(chatContainer) {
  try {
    const history = await getChatHistory();

    if (history.length > 0) {
      // Display existing messages
      history.forEach((msg) => {
        // Import dynamically to avoid circular dependency
        const { addMessageToChat } = await import('./chat.js');
        addMessageToChat(msg.role, msg.content, chatContainer);
      });
    } else {
      // Add welcome message for new users
      const { addMessageToChat } = await import('./chat.js');
      addMessageToChat("assistant", "Hello! How can I help you today?", chatContainer);
    }
  } catch (error) {
    console.error("Failed to load chat history:", error);
    const { addMessageToChat } = await import('./chat.js');
    addMessageToChat("assistant", "Hello! How can I help you today?", chatContainer);
  }
}

// Save chat message to KV store
export async function saveChatMessage(role, content) {
  try {
    let history = await getChatHistory();

    // For messages with attachments, strip out base64 data to save space
    let storageContent = content;
    if (content.includes("data:image")) {
      // Create a simplified version for storage that references attachments but doesn't include the raw data
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      // Replace image sources with placeholders
      const images = tempDiv.querySelectorAll("img");
      images.forEach((img, index) => {
        img.setAttribute("src", "[IMAGE ATTACHMENT]");
      });

      storageContent = tempDiv.innerHTML;
    }

    history.push({ role, content: storageContent });

    // Keep only the last 20 messages to avoid hitting storage limits
    if (history.length > 20) {
      history = history.slice(history.length - 20);
    }

    await puter.kv.set("chat_history", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
}

// Get chat history from KV store
export async function getChatHistory() {
  try {
    const history = await puter.kv.get("chat_history");
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

// Update the last assistant message in the chat history
export async function updateLastAssistantMessage(newContent) {
  try {
    let history = await getChatHistory();

    // Find the last assistant message in the history
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === "assistant") {
        history[i].content = newContent;
        break;
      }
    }

    await puter.kv.set("chat_history", JSON.stringify(history));
  } catch (error) {
    console.error("Failed to update chat history:", error);
  }
}

// Generate a chat title based on first message
export function generateChatTitle(messages) {
  if (messages.length < 2) return "New Chat";
  // Extract first user message as chat title or generate one
  for (const msg of messages) {
    if (msg.role === "user") {
      // Truncate and clean up the first user message to use as title
      const title = msg.content.split("\n")[0].substring(0, 30);
      return title + (title.length >= 30 ? "..." : "");
    }
  }
  return "New Chat";
}

// Format time for display
export function formatTimeSince(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return interval + " years ago";
  if (interval === 1) return interval + " year ago";

  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return interval + " months ago";
  if (interval === 1) return interval + " month ago";

  interval = Math.floor(seconds / 604800);
  if (interval > 1) return interval + " weeks ago";
  if (interval === 1) return interval + " week ago";

  interval = Math.floor(seconds / 86400);
  if (interval > 1) return interval + " days ago";
  if (interval === 1) return interval + " day ago";

  interval = Math.floor(seconds / 3600);
  if (interval > 1) return interval + " hours ago";
  if (interval === 1) return interval + " hour ago";

  interval = Math.floor(seconds / 60);
  if (interval > 1) return interval + " minutes ago";
  if (interval === 1) return interval + " minute ago";

  return "just now";
}

// Function to save current chat to history
export function saveChatToHistory() {
  // Get all messages in the chat
  const messageElements = document.querySelectorAll(".message");
  const messages = [];

  messageElements.forEach((element) => {
    const isUser = element.classList.contains("user-message");
    const isAssistant = element.classList.contains("assistant-message");
    const isError = element.classList.contains("error-message");

    if (isUser || isAssistant || isError) {
      const role = isUser ? "user" : isAssistant ? "assistant" : "system";
      const contentElement = element.querySelector(".message-content");
      const content = contentElement ? contentElement.innerHTML : "";

      messages.push({ role, content });
    }
  });

  return messages;
}

// Load chat history from local storage
export function loadChatHistoryFromStorage(chatHistoryList) {
  const historyIndex = localStorage.getItem("chat_history_index");
  if (!historyIndex) return;

  try {
    const index = JSON.parse(historyIndex);
    chatHistoryList.length = 0; // Clear the array

    // Load each chat from storage
    index.forEach((item) => {
      const chatData = localStorage.getItem(`chat_${item.id}`);
      if (chatData) {
        chatHistoryList.push(JSON.parse(chatData));
      }
    });
  } catch (error) {
    console.error("Failed to load chat history:", error);
  }
}

// Save chat history to local storage
export function saveChatHistoryToStorage(chatHistoryList) {
  // Simplified version of chat history for storage
  const simplifiedHistory = chatHistoryList.map((chat) => ({
    id: chat.id,
    title: chat.title,
    timestamp: chat.timestamp,
    messageCount: chat.messages.length,
  }));

  // Save each chat separately to avoid size limitations
  chatHistoryList.forEach((chat) => {
    localStorage.setItem(`chat_${chat.id}`, JSON.stringify(chat));
  });

  // Save index of chats
  localStorage.setItem(
    "chat_history_index",
    JSON.stringify(simplifiedHistory),
  );
}

// Load a specific chat from history
export function loadChatFromHistory(chatId, chatHistoryList, chatContainer, currentAttachments, attachmentPreview) {
  const chat = chatHistoryList.find((c) => c.id === chatId);
  if (!chat) return;

  // Save current chat before switching
  saveChatToHistory();

  // Clear current chat
  chatContainer.innerHTML = "";
  currentAttachments.length = 0;
  attachmentPreview.innerHTML = "";

  // Import dynamically to avoid circular dependency
  import('./chat.js').then(({addMessageToChat}) => {
    // Load messages
    chat.messages.forEach((msg) => {
      const role =
        msg.role === "user"
          ? "user"
          : msg.role === "assistant"
            ? "assistant"
            : "error";
      addMessageToChat(role, msg.content, chatContainer, true);
    });
  });

  // Load attachments if any
  if (chat.attachments && chat.attachments.length > 0) {
    currentAttachments.push(...chat.attachments);
    updateAttachmentPreview(currentAttachments, attachmentPreview);
  }
  
  return chat.id;
}

// Function to update attachment preview
export function updateAttachmentPreview(currentAttachments, attachmentPreview) {
  attachmentPreview.innerHTML = "";

  currentAttachments.forEach((attachment, index) => {
    if (!attachment) return;

    const attachmentElement = document.createElement("div");
    attachmentElement.className = "attachment-item";

    attachmentElement.innerHTML = `
      <span class="file-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
      </span>
      <span class="file-name">${attachment.name}</span>
      <span class="remove-attachment" data-index="${index}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </span>
    `;

    attachmentPreview.appendChild(attachmentElement);

    // Add click handler for removal
    attachmentElement
      .querySelector(".remove-attachment")
      .addEventListener("click", function () {
        const index = parseInt(this.getAttribute("data-index"));
        window.removeAttachment(index, attachmentElement);
      });
  });
}
