// Puter AI Chat App
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the chat interface
  const chatContainer = document.getElementById("chat-container");
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  const modelSelector = document.getElementById("model-selector");
  const clearButton = document.getElementById("clear-button");
  const attachButton = document.getElementById("attach-button");
  const fileInput = document.getElementById("file-input");
  const attachmentPreview = document.getElementById("attachment-preview");

  // Utility bar elements
  const utilityPopup = document.getElementById("utility-popup");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  const popupClose = document.getElementById("popup-close");
  const popupCancel = document.getElementById("popup-cancel");
  const popupSave = document.getElementById("popup-save");
  const activeModelIndicator = document.getElementById(
    "active-model-indicator",
  );

  // Utility buttons
  const newChatBtn = document.getElementById("new-chat-btn");
  const historyBtn = document.getElementById("history-btn");
  const imageUploadBtn = document.getElementById("image-upload-btn");
  const fileUploadBtn = document.getElementById("file-upload-btn");
  const codeBtn = document.getElementById("code-btn");
  const websearchBtn = document.getElementById("websearch-btn");
  const deepthinkBtn = document.getElementById("deepthink-btn");
  const knowledgebaseBtn = document.getElementById("knowledgebase-btn");
  const settingsBtn = document.getElementById("settings-btn");

  // Voice input and text-to-speech
  const micButton = document.getElementById("mic-button");
  const ttsButton = document.getElementById("text-to-speech-toggle");

  // Chat history management
  let chatHistory = [];
  let currentChatId = generateChatId();
  let isTtsEnabled = false;

  // App state
  let activeDeepThinkModel = null;
  let knowledgeBase = [];
  let currentUtilityMode = null;
  let tempAttachments = [];
  let speechRecognition = null;
  let isRecording = false;
  let synthesis = window.speechSynthesis;
  let chatHistoryList = [];

  // Helper functions for new features
  function generateChatId() {
    return "chat_" + Date.now();
  }

  function generateChatTitle(messages) {
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

  function formatTimeSince(timestamp) {
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

  // Create image preview modal
  const modal = document.createElement("div");
  modal.className = "image-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <img id="modal-image" src="" alt="Preview">
    </div>
  `;
  document.body.appendChild(modal);

  // Modal functionality
  const modalImage = document.getElementById("modal-image");
  const closeModal = document.querySelector(".close-modal");

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Function to show an image in the modal
  function showImageInModal(imageSrc) {
    modalImage.src = imageSrc;
    modal.style.display = "flex";
  }

  // Add global click event listener for images
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".image-attachment")) {
      showImageInModal(e.target.src);
    }
  });

  // Store attachments
  let currentAttachments = [];

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
    "😊",
    "👍",
    "🎉",
    "❤️",
    "😂",
    "🤔",
    "👀",
    "✅",
    "🚀",
    "🙏",
    "👋",
    "🔥",
    "⭐",
    "📎",
    "📅",
    "📌",
    "🏆",
    "💡",
    "🎯",
    "✨",
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

  // Utility bar functions
  function showPopup(title, content, saveCallback) {
    popupTitle.textContent = title;
    popupBody.innerHTML = content;
    utilityPopup.style.display = "flex";

    // Set up the save callback
    popupSave.onclick = () => {
      if (saveCallback) saveCallback();
      closePopup();
    };
  }

  function closePopup() {
    utilityPopup.style.display = "none";
    popupBody.innerHTML = "";
    currentUtilityMode = null;
    tempAttachments = [];
  }

  // New chat button handler
  newChatBtn.addEventListener("click", () => {
    // Save current chat to history if it has messages
    const messages = document.querySelectorAll(".message");
    if (messages.length > 0) {
      saveChatToHistory();
    }

    // Clear the chat interface
    chatContainer.innerHTML = "";
    currentAttachments = [];
    attachmentPreview.innerHTML = "";

    // Generate a new chat ID
    currentChatId = generateChatId();

    // Add welcome message
    addMessageToChat("assistant", "Hello! How can I help you today?");
  });

  // Chat history button handler
  historyBtn.addEventListener("click", () => {
    currentUtilityMode = "history";

    let historyContent = '<div class="history-list">';

    if (chatHistoryList.length === 0) {
      historyContent += '<div class="history-empty">No chat history yet</div>';
    } else {
      // Display chat history in reverse chronological order
      for (let i = chatHistoryList.length - 1; i >= 0; i--) {
        const chat = chatHistoryList[i];
        historyContent += `
          <div class="history-item" data-chat-id="${chat.id}">
            <div class="history-item-title">${chat.title}</div>
            <div class="history-item-time">${formatTimeSince(chat.timestamp)}</div>
          </div>
        `;
      }
    }

    historyContent += "</div>";

    showPopup("Chat History", historyContent, null);

    // Add event listeners to history items
    setTimeout(() => {
      const historyItems = document.querySelectorAll(".history-item");
      historyItems.forEach((item) => {
        item.addEventListener("click", () => {
          const chatId = item.getAttribute("data-chat-id");
          loadChatFromHistory(chatId);
          closePopup();
        });
      });
    }, 0);
  });

  // Function to save current chat to history
  function saveChatToHistory() {
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

    // Only save if there are messages
    if (messages.length > 0) {
      const chatTitle = generateChatTitle(messages);

      const chat = {
        id: currentChatId,
        title: chatTitle,
        messages: messages,
        timestamp: Date.now(),
        attachments: [...currentAttachments],
      };

      // Add to history
      chatHistoryList.push(chat);

      // Limit history to 30 entries
      if (chatHistoryList.length > 30) {
        chatHistoryList.shift();
      }

      // Save to local storage
      saveChatHistoryToStorage();
    }
  }

  // Function to load a chat from history
  function loadChatFromHistory(chatId) {
    const chat = chatHistoryList.find((c) => c.id === chatId);
    if (!chat) return;

    // Save current chat before switching
    saveChatToHistory();

    // Clear current chat
    chatContainer.innerHTML = "";
    currentAttachments = [];
    attachmentPreview.innerHTML = "";

    // Set current chat ID
    currentChatId = chatId;

    // Load messages
    chat.messages.forEach((msg) => {
      const role =
        msg.role === "user"
          ? "user"
          : msg.role === "assistant"
            ? "assistant"
            : "error";
      addMessageToChat(role, msg.content, true);
    });

    // Load attachments if any
    if (chat.attachments && chat.attachments.length > 0) {
      currentAttachments = [...chat.attachments];
      updateAttachmentPreview();
    }
  }

  // Function to update attachment preview
  function updateAttachmentPreview() {
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
          removeAttachment(index, attachmentElement);
        });
    });
  }

  // Function to save chat history to local storage
  function saveChatHistoryToStorage() {
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

  // Function to load chat history from local storage
  function loadChatHistoryFromStorage() {
    const historyIndex = localStorage.getItem("chat_history_index");
    if (!historyIndex) return;

    try {
      const index = JSON.parse(historyIndex);
      chatHistoryList = [];

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

  // Close popup handlers
  popupClose.addEventListener("click", closePopup);
  popupCancel.addEventListener("click", closePopup);

  // Image Upload
  imageUploadBtn.addEventListener("click", () => {
    currentUtilityMode = "image";
    const content = `
      <p>Upload images to include in your message.</p>
      <input type="file" id="image-file-input" accept="image/*" multiple style="display: none;">
      <button id="select-images-btn" class="popup-btn">Select Images</button>
      <div class="upload-preview" id="image-preview"></div>
    `;

    showPopup("Image Upload", content, () => {
      // Add selected images to the message
      if (tempAttachments.length > 0) {
        tempAttachments.forEach((item) => {
          currentAttachments.push(item);

          // Create preview element for the main chat
          const attachmentElement = document.createElement("div");
          attachmentElement.className = "attachment-item";
          attachmentElement.innerHTML = `
            <span class="file-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </span>
            <span class="file-name">${item.name}</span>
            <span class="remove-attachment" data-index="${currentAttachments.length - 1}">
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
              removeAttachment(index, attachmentElement);
            });
        });
      }
    });

    // Set up image selection after popup is shown
    setTimeout(() => {
      const imageFileInput = document.getElementById("image-file-input");
      const selectImagesBtn = document.getElementById("select-images-btn");
      const imagePreview = document.getElementById("image-preview");

      selectImagesBtn.addEventListener("click", () => {
        imageFileInput.click();
      });

      imageFileInput.addEventListener("change", async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Process each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file.type.startsWith("image/")) continue;

          tempAttachments.push(file);

          // Create preview element
          const previewElement = document.createElement("div");
          previewElement.className = "upload-item uploading";

          // Generate preview and add to container
          try {
            const base64 = await fileToBase64(file);
            previewElement.innerHTML = `
              <img src="${base64}" alt="${file.name}">
              <div class="upload-progress">
                <div class="upload-spinner"></div>
              </div>
              <button class="remove-btn">×</button>
            `;

            imagePreview.appendChild(previewElement);

            // Simulate upload progress
            setTimeout(() => {
              previewElement.classList.remove("uploading");
              previewElement.querySelector(".upload-progress").remove();

              // Add remove button functionality
              const removeBtn = previewElement.querySelector(".remove-btn");
              removeBtn.addEventListener("click", () => {
                const index = tempAttachments.indexOf(file);
                if (index > -1) {
                  tempAttachments.splice(index, 1);
                }
                previewElement.remove();
              });
            }, 1500);
          } catch (error) {
            console.error("Failed to process image:", error);
          }
        }

        // Clear the file input
        event.target.value = "";
      });
    }, 0);
  });

  // File Upload
  fileUploadBtn.addEventListener("click", () => {
    currentUtilityMode = "file";
    const content = `
      <p>Upload files to include in your message.</p>
      <input type="file" id="document-file-input" multiple style="display: none;">
      <button id="select-files-btn" class="popup-btn">Select Files</button>
      <div class="upload-preview" id="file-preview"></div>
    `;

    showPopup("File Upload", content, () => {
      // Add selected files to the message
      if (tempAttachments.length > 0) {
        tempAttachments.forEach((item) => {
          currentAttachments.push(item);

          // Create preview element for the main chat
          const attachmentElement = document.createElement("div");
          attachmentElement.className = "attachment-item";

          // Determine file type icon based on extension
          const extension = item.name.split(".").pop().toLowerCase();

          attachmentElement.innerHTML = `
            <span class="file-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </span>
            <span class="file-name">${item.name}</span>
            <span class="remove-attachment" data-index="${currentAttachments.length - 1}">
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
              removeAttachment(index, attachmentElement);
            });
        });
      }
    });

    // Set up file selection after popup is shown
    setTimeout(() => {
      const documentFileInput = document.getElementById("document-file-input");
      const selectFilesBtn = document.getElementById("select-files-btn");
      const filePreview = document.getElementById("file-preview");

      selectFilesBtn.addEventListener("click", () => {
        documentFileInput.click();
      });

      documentFileInput.addEventListener("change", async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Process each file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          tempAttachments.push(file);

          // Create preview element
          const previewElement = document.createElement("div");
          previewElement.className = "upload-item uploading";
          previewElement.style.display = "flex";
          previewElement.style.alignItems = "center";
          previewElement.style.padding = "10px";

          // Get file extension
          const extension = file.name.split(".").pop().toLowerCase();

          previewElement.innerHTML = `
            <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <strong>${file.name}</strong>
              <div>${formatFileSize(file.size)}</div>
            </div>
            <div class="upload-progress" style="position: relative; width: 30px; height: 30px; margin-left: 10px;">
              <div class="upload-spinner"></div>
            </div>
            <button class="remove-btn" style="margin-left: 10px;">×</button>
          `;

          filePreview.appendChild(previewElement);

          // Simulate upload progress
          setTimeout(() => {
            previewElement.classList.remove("uploading");
            previewElement.querySelector(".upload-progress").remove();

            // Add remove button functionality
            const removeBtn = previewElement.querySelector(".remove-btn");
            removeBtn.addEventListener("click", () => {
              const index = tempAttachments.indexOf(file);
              if (index > -1) {
                tempAttachments.splice(index, 1);
              }
              previewElement.remove();
            });
          }, 1500);
        }

        // Clear the file input
        event.target.value = "";
      });
    }, 0);
  });

  // Code Editor
  codeBtn.addEventListener("click", () => {
    currentUtilityMode = "code";
    const content = `
      <div class="code-editor-container">
        <div class="code-language" id="code-language">Language: Auto-detect</div>
        <textarea id="code-editor" class="code-editor" placeholder="Enter your code here..."></textarea>
      </div>
    `;

    showPopup("Code Editor", content, () => {
      const codeEditor = document.getElementById("code-editor");
      const code = codeEditor.value.trim();
      const codeLanguageDiv = document.getElementById("code-language");

      if (code) {
        // Detect language
        const language = detectCodeLanguage(code);

        // Create code block for message
        const codeBlock = "```" + language + "\n" + code + "\n```";

        // Add to message input
        if (messageInput.value) {
          messageInput.value += "\n\n" + codeBlock;
        } else {
          messageInput.value = codeBlock;
        }
      }
    });

    // Set up real-time language detection
    setTimeout(() => {
      const codeEditor = document.getElementById("code-editor");
      const codeLanguageDiv = document.getElementById("code-language");

      codeEditor.addEventListener("input", () => {
        const code = codeEditor.value.trim();
        if (code.length > 10) {
          const language = detectCodeLanguage(code);
          codeLanguageDiv.textContent = `Language: ${language || "Auto-detect"}`;
        }
      });
    }, 0);
  });

  // Web Search
  websearchBtn.addEventListener("click", () => {
    currentUtilityMode = "websearch";
    const content = `
      <p>Enter a URL to search or analyze:</p>
      <input type="text" id="url-input" class="websearch-input" placeholder="https://example.com">
      <button id="load-url-btn" class="popup-btn">Load URL</button>
      <div id="url-preview" class="websearch-preview" style="display: none;"></div>
      <div id="url-actions" class="websearch-actions" style="display: none;">
        <button id="scrape-btn" class="websearch-action-btn">Web Scrape</button>
        <button id="read-btn" class="websearch-action-btn">Read</button>
        <button id="search-btn" class="websearch-action-btn">Search</button>
      </div>
    `;

    showPopup("Web Search", content, () => {
      const urlInput = document.getElementById("url-input");
      const url = urlInput.value.trim();

      if (url) {
        // Add the URL as context to the message
        if (messageInput.value) {
          messageInput.value += "\n\nURL for context: " + url;
        } else {
          messageInput.value = "URL for context: " + url;
        }
      }
    });

    // Set up URL loading functionality
    setTimeout(() => {
      const urlInput = document.getElementById("url-input");
      const loadUrlBtn = document.getElementById("load-url-btn");
      const urlPreview = document.getElementById("url-preview");
      const urlActions = document.getElementById("url-actions");
      let scrapeBtn, readBtn, searchBtn;

      // Only try to access these elements if they exist
      if (urlActions) {
        scrapeBtn = document.getElementById("scrape-btn");
        readBtn = document.getElementById("read-btn");
        searchBtn = document.getElementById("search-btn");
      }

      // Allow Enter key to trigger URL loading
      urlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          loadUrlBtn.click();
        }
      });

      loadUrlBtn.addEventListener("click", () => {
        let url = urlInput.value.trim();

        if (!url) {
          alert("Please enter a valid URL");
          return;
        }

        // Add http:// if missing
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
          urlInput.value = url;
        }

        // Show loading in preview
        urlPreview.style.display = "block";
        urlPreview.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <div class="upload-spinner" style="margin: 0 auto;"></div>
            <p>Loading preview...</p>
          </div>
        `;

        // Simulate fetching website metadata and generating preview
        // In a real implementation, you would use fetch() or a similar API to get data from the URL
        setTimeout(() => {
          // Create a visual preview with favicon and site info
          urlPreview.innerHTML = `
            <div style="padding: 20px; display: flex; align-items: flex-start; gap: 15px;">
              <div style="min-width: 32px;">
                <img src="https://www.google.com/s2/favicons?domain=${url}&sz=32" alt="Site icon" style="width: 32px; height: 32px; border-radius: 4px;">
              </div>
              <div>
                <h4 style="margin: 0 0 8px 0;">${url}</h4>
                <p style="margin: 0 0 15px 0;">Website content loaded. You can now interact with this URL using the options below:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Web Scrape: Extract all text content from the page</li>
                  <li>Read: AI will read and analyze the page content</li>
                  <li>Search: Use this URL as context for your query</li>
                </ul>
              </div>
            </div>
          `;
          urlActions.style.display = "flex";

          // Set up action buttons with more descriptive prompts
          scrapeBtn.addEventListener("click", () => {
            messageInput.value = `Please extract and organize the main content from this URL: ${url}`;
            closePopup();
          });

          readBtn.addEventListener("click", () => {
            messageInput.value = `Please read and provide a comprehensive summary of this URL: ${url}. What are the key points and insights?`;
            closePopup();
          });

          searchBtn.addEventListener("click", () => {
            messageInput.value = `Using this URL as context (${url}), please help me understand `;
            closePopup();
            messageInput.focus();
            // Place cursor at the end of the input
            const len = messageInput.value.length;
            messageInput.setSelectionRange(len, len);
          });
        }, 1500);
      });
    }, 0);
  });

  // Deep Think button functionality
  deepthinkBtn.addEventListener("click", () => {
    // If already active, deactivate
    if (activeDeepThinkModel) {
      activeDeepThinkModel = null;
      deepthinkBtn.classList.remove("active");
      activeModelIndicator.textContent = "";
      return;
    }

    currentUtilityMode = "deepthink";
    const content = `
      <p>Select a reasoning model to enhance your chat experience:</p>
      <select id="reasoning-model" class="model-select">
        <option value="">Select a model</option>
        <option value="deepseek-reasoner">Deepseek Reasoner</option>
        <option value="o3-mini">O3 Mini</option>
        <option value="o1-mini">O1 Mini</option>
        <option value="claude-3-7-sonnet">Claude 3.7 Sonnet</option>
        <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
      </select>
      <p class="description" id="model-description"></p>
    `;

    showPopup("Deep Think", content, () => {
      const reasoningModel = document.getElementById("reasoning-model");
      const selectedModel = reasoningModel.value;

      if (selectedModel) {
        activeDeepThinkModel = selectedModel;
        deepthinkBtn.classList.add("active");
        activeModelIndicator.textContent = `Active: ${getModelDisplayName(selectedModel)}`;
      }
    });

    // Set up model description updates
    setTimeout(() => {
      const reasoningModel = document.getElementById("reasoning-model");
      const modelDescription = document.getElementById("model-description");

      reasoningModel.addEventListener("change", () => {
        const selectedModel = reasoningModel.value;
        if (selectedModel) {
          modelDescription.textContent = getModelDescription(selectedModel);
        } else {
          modelDescription.textContent = "";
        }
      });
    }, 0);
  });

  // Knowledge Base
  knowledgebaseBtn.addEventListener("click", () => {
    currentUtilityMode = "knowledgebase";

    // Create knowledge base list HTML
    let kbListHTML = "<p>No knowledge base items yet.</p>";
    if (knowledgeBase.length > 0) {
      kbListHTML = '<div class="kb-list">';
      knowledgeBase.forEach((item, index) => {
        kbListHTML += `
          <div class="kb-item">
            <span>${item.title}</span>
            <div class="kb-item-actions">
              <button class="kb-item-btn kb-view-btn" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="kb-item-btn kb-delete-btn" data-index="${index}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        `;
      });
      kbListHTML += "</div>";
    }

    const content = `
      <div class="kb-controls">
        <button id="kb-upload-btn" class="popup-btn">Upload File</button>
        <button id="kb-create-btn" class="popup-btn">Create New</button>
      </div>
      <div id="kb-content">
        ${kbListHTML}
      </div>
      <input type="file" id="kb-file-input" accept=".txt,.md,.json,.csv" style="display: none;">
    `;

    showPopup("Knowledge Base", content, () => {
      // Nothing needed here, actions handled by specific buttons
    });

    // Set up knowledge base functionality
    setTimeout(() => {
      const kbUploadBtn = document.getElementById("kb-upload-btn");
      const kbCreateBtn = document.getElementById("kb-create-btn");
      const kbFileInput = document.getElementById("kb-file-input");
      const kbContent = document.getElementById("kb-content");

      // Upload file
      kbUploadBtn.addEventListener("click", () => {
        kbFileInput.click();
      });

      kbFileInput.addEventListener("change", async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        try {
          const content = await readFileAsText(file);
          knowledgeBase.push({
            title: file.name,
            content: content,
            type: "file",
          });

          // Update UI
          refreshKnowledgeBaseList();
        } catch (error) {
          console.error("Failed to read file:", error);
        }

        // Clear the file input
        event.target.value = "";
      });

      // Create new
      kbCreateBtn.addEventListener("click", () => {
        kbContent.innerHTML = `
          <div class="kb-editor">
            <input type="text" id="kb-title" placeholder="Title">
            <textarea id="kb-text" placeholder="Enter your knowledge base content here..."></textarea>
            <button id="kb-save-file-btn" class="popup-btn">Save File</button>
            <button id="kb-cancel-btn" class="popup-btn">Cancel</button>
          </div>
        `;

        const kbSaveFileBtn = document.getElementById("kb-save-file-btn");
        const kbCancelBtn = document.getElementById("kb-cancel-btn");
        const kbTitle = document.getElementById("kb-title");
        const kbText = document.getElementById("kb-text");

        kbSaveFileBtn.addEventListener("click", () => {
          const title = kbTitle.value.trim() || "Untitled";
          const content = kbText.value.trim();

          if (content) {
            knowledgeBase.push({
              title: title,
              content: content,
              type: "manual",
            });

            // Update UI
            refreshKnowledgeBaseList();
          }
        });

        kbCancelBtn.addEventListener("click", () => {
          refreshKnowledgeBaseList();
        });
      });

      // View and delete setup
      document.addEventListener("click", (e) => {
        if (e.target.closest(".kb-view-btn")) {
          const button = e.target.closest(".kb-view-btn");
          const index = button.getAttribute("data-index");
          const item = knowledgeBase[index];

          if (item) {
            kbContent.innerHTML = `
              <h4>${item.title}</h4>
              <pre style="white-space: pre-wrap; max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-top: 10px;">${item.content}</pre>
              <button id="kb-back-btn" class="popup-btn" style="margin-top: 10px;">Back</button>
            `;

            document
              .getElementById("kb-back-btn")
              .addEventListener("click", () => {
                refreshKnowledgeBaseList();
              });
          }
        } else if (e.target.closest(".kb-delete-btn")) {
          const button = e.target.closest(".kb-delete-btn");
          const index = button.getAttribute("data-index");

          if (
            confirm("Are you sure you want to delete this knowledge base item?")
          ) {
            knowledgeBase.splice(index, 1);
            refreshKnowledgeBaseList();
          }
        }
      });

      // Helper function to refresh knowledge base list
      function refreshKnowledgeBaseList() {
        // Create knowledge base list HTML
        let kbListHTML = "<p>No knowledge base items yet.</p>";
        if (knowledgeBase.length > 0) {
          kbListHTML = '<div class="kb-list">';
          knowledgeBase.forEach((item, index) => {
            kbListHTML += `
              <div class="kb-item">
                <span>${item.title}</span>
                <div class="kb-item-actions">
                  <button class="kb-item-btn kb-view-btn" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button class="kb-item-btn kb-delete-btn" data-index="${index}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            `;
          });
          kbListHTML += "</div>";
        }

        kbContent.innerHTML = `
          <div class="kb-controls">
            <button id="kb-upload-btn" class="popup-btn">Upload File</button>
            <button id="kb-create-btn" class="popup-btn">Create New</button>
          </div>
          ${kbListHTML}
        `;

        // Reattach event listeners
        document
          .getElementById("kb-upload-btn")
          .addEventListener("click", () => {
            kbFileInput.click();
          });

        document
          .getElementById("kb-create-btn")
          .addEventListener("click", () => {
            kbContent.innerHTML = `
            <div class="kb-editor">
              <input type="text" id="kb-title" placeholder="Title">
              <textarea id="kb-text" placeholder="Enter your knowledge base content here..."></textarea>
              <button id="kb-save-file-btn" class="popup-btn">Save File</button>
              <button id="kb-cancel-btn" class="popup-btn">Cancel</button>
            </div>
          `;

            document
              .getElementById("kb-save-file-btn")
              .addEventListener("click", () => {
                const title =
                  document.getElementById("kb-title").value.trim() ||
                  "Untitled";
                const content = document.getElementById("kb-text").value.trim();

                if (content) {
                  knowledgeBase.push({
                    title: title,
                    content: content,
                    type: "manual",
                  });

                  // Update UI
                  refreshKnowledgeBaseList();
                }
              });

            document
              .getElementById("kb-cancel-btn")
              .addEventListener("click", () => {
                refreshKnowledgeBaseList();
              });
          });
      }
    }, 0);
  });

  // Settings
  settingsBtn.addEventListener("click", () => {
    currentUtilityMode = "settings";
    const content = `
      <div class="settings-tabs">
        <div class="settings-tab active" data-tab="app-ui">App UI</div>
        <div class="settings-tab" data-tab="ai-settings">AI Settings</div>
        <div class="settings-tab" data-tab="accessibility">Accessibility</div>
        <div class="settings-tab" data-tab="privacy">Privacy</div>
        <div class="settings-tab" data-tab="about">About</div>
      </div>

      <div class="settings-section active" id="app-ui-section">
        <h4>App UI</h4>
        <div class="settings-row">
          <label for="settings-theme">Theme:</label>
          <div class="setting-group">
            <label for="theme-toggle">Dark Mode:</label>
            <label class="toggle">
              <input type="checkbox" id="settings-theme-toggle" ${document.body.classList.contains("dark-theme") ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <label for="text-size">Text Size:</label>
          <div class="text-size-control">
            <button id="text-size-decrease" class="popup-btn" style="padding: 0 8px;">-</button>
            <input type="number" id="text-size-value" value="16" min="10" max="24">
            <button id="text-size-increase" class="popup-btn" style="padding: 0 8px;">+</button>
          </div>
        </div>
        <div class="settings-row">
          <label for="compact-mode">Compact Mode:</label>
          <div class="setting-group">
            <label class="toggle">
              <input type="checkbox" id="compact-mode-toggle" ${localStorage.getItem("compact-mode") === "true" ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <label for="notification-sounds">Notification Sounds:</label>
          <div class="setting-group">
            <label class="toggle">
              <input type="checkbox" id="notification-sounds-toggle" ${localStorage.getItem("notification-sounds") !== "false" ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <label for="auto-save-chats">Auto-save Chats:</label>
          <div class="setting-group">
            <label class="toggle">
              <input type="checkbox" id="auto-save-chats-toggle" ${localStorage.getItem("auto-save-chats") !== "false" ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <div class="settings-row">
          <button id="clear-button" class="popup-btn" style="background-color: #f44336; color: white;">Clear Current Chat</button>
        </div>
      </div>

      <div class="settings-section" id="ai-settings-section">
        <h4>AI Settings</h4>
        <div class="settings-row">
          <label for="default-model">Default AI Model:</label>
          <select id="default-model-selector" class="settings-select">
            <option value="gpt-4o-mini" ${localStorage.getItem("default-model") === "gpt-4o-mini" || !localStorage.getItem("default-model") ? "selected" : ""}>GPT-4o Mini (Default)</option>
            <option value="gpt-4o" ${localStorage.getItem("default-model") === "gpt-4o" ? "selected" : ""}>GPT-4o</option>
            <option value="claude-3-7-sonnet" ${localStorage.getItem("default-model") === "claude-3-7-sonnet" ? "selected" : ""}>Claude 3.7 Sonnet</option>
            <option value="deepseek-chat" ${localStorage.getItem("default-model") === "deepseek-chat" ? "selected" : ""}>DeepSeek Chat</option>
            <option value="gemini-2.0-flash" ${localStorage.getItem("default-model") === "gemini-2.0-flash" ? "selected" : ""}>Gemini 2.0 Flash</option>
          </select>
        </div>

        <div class="settings-row">
          <label for="stream-toggle">Stream Response:</label>
          <div class="setting-group">
            <label class="toggle">
              <input type="checkbox" id="settings-stream-toggle" ${document.getElementById("stream-toggle").checked ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="settings-row">
          <label>System Prompt:</label>
          <div style="width: 100%;">
            <textarea id="system-prompt" class="system-prompt-editor" placeholder="Enter a system prompt for the AI..."></textarea>
            <p class="settings-hint">This prompt will be sent to the AI at the beginning of every conversation.</p>
          </div>
        </div>

        <div class="advanced-settings-row">
          <div class="advanced-settings-title">Advanced AI Parameters</div>

          <div class="slider-setting">
            <div class="ai-param-label">
              <span>Temperature</span>
              <span class="info-icon" title="Controls randomness. Lower values produce more focused responses, higher values produce more creative ones.">ⓘ</span>
            </div>
            <div class="slider-container">
              <input type="range" id="temperature-slider" min="0" max="2" step="0.1" value="${localStorage.getItem("temperature") || "0.7"}">
              <span class="slider-value" id="temperature-value">${localStorage.getItem("temperature") || "0.7"}</span>
            </div>
          </div>

          <div class="slider-setting">
            <div class="ai-param-label">
              <span>Max Tokens</span>
              <span class="info-icon" title="Maximum length of the AI's response.">ⓘ</span>
            </div>
            <div class="slider-container">
              <input type="range" id="max-tokens-slider" min="256" max="4096" step="256" value="${localStorage.getItem("max-tokens") || "2048"}">
              <span class="slider-value" id="max-tokens-value">${localStorage.getItem("max-tokens") || "2048"}</span>
            </div>
          </div>

          <div class="slider-setting">
            <div class="ai-param-label">
              <span>Top P</span>
              <span class="info-icon" title="Controls diversity. Lower values make output more focused, higher values more diverse.">ⓘ</span>
            </div>
            <div class="slider-container">
              <input type="range" id="top-p-slider" min="0" max="1" step="0.05" value="${localStorage.getItem("top-p") || "0.9"}">
              <span class="slider-value" id="top-p-value">${localStorage.getItem("top-p") || "0.9"}</span>
            </div>
          </div>
          <div class="slider-setting">
            <div class="ai-param-label">
              <span>Frequency Penalty</span>
              <span class="info-icon" title="Reduces repetition by penalizing tokens that appear frequently.">ⓘ</span>
            </div>
            <div class="slider-container">
              <input type="range" id="frequency-penalty-slider" min="0" max="2" step="0.1" value="${localStorage.getItem("frequency-penalty") || "0.0"}">
              <span class="slider-value" id="frequency-penalty-value">${localStorage.getItem("frequency-penalty") || "0.0"}</span>
            </div>
          </div>

          <div class="slider-setting">
            <div class="ai-param-label">
              <span>Presence Penalty</span>
              <span class="info-icon" title="Encourages variety by penalizing tokens already used.">ⓘ</span>
            </div>
            <div class="slider-container">
              <input type="range" id="presence-penalty-slider" min="0" max="2" step="0.1" value="${localStorage.getItem("presence-penalty") || "0.0"}">
              <span class="slider-value" id="presence-penalty-value">${localStorage.getItem("presence-penalty") || "0.0"}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section" id="accessibility-section">
        <h4>Accessibility</h4>
        <div class="accessibility-section">
          <div class="settings-row">
            <label for="high-contrast-mode">High Contrast Mode:</label>
            <div class="setting-group">
              <label class="toggle">
                <input type="checkbox" id="high-contrast-toggle" ${localStorage.getItem("high-contrast") === "true" ? "checked" : ""}>
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-row">
            <label for="reduced-motion">Reduced Motion:</label>
            <div class="setting-group">
              <label class="toggle">
                <input type="checkbox" id="reduced-motion-toggle" ${localStorage.getItem("reduced-motion") === "true" ? "checked" : ""}>
                <span class="slider"></span>
              </label>
            </div>
          </div>

          <div class="settings-row">
            <label for="tts-settings">Text-to-Speech:</label>
            <div style="width: 100%;">
              <div class="settings-row">
                <label for="tts-rate">Speech Rate:</label>
                <div class="slider-container">
                  <input type="range" id="tts-rate-slider" min="0.5" max="2" step="0.1" value="${localStorage.getItem("tts-rate") || "1"}">
                  <span class="slider-value" id="tts-rate-value">${localStorage.getItem("tts-rate") || "1"}</span>
                </div>
              </div>
              <div class="settings-row">
                <label for="tts-pitch">Speech Pitch:</label>
                <div class="slider-container">
                  <input type="range" id="tts-pitch-slider" min="0.5" max="2" step="0.1" value="${localStorage.getItem("tts-pitch") || "1"}">
                  <span class="slider-value" id="tts-pitch-value">${localStorage.getItem("tts-pitch") || "1"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section" id="privacy-section">
        <h4>Privacy</h4>
        <div class="settings-row">
          <button id="clear-all-data-btn" class="popup-btn" style="background-color: #f44336; color: white;">Clear All Chat Data</button>
        </div>
        <p class="settings-hint">This will permanently delete all your chat history and settings. This action cannot be undone.</p>

        <div class="settings-row">
          <label for="auto-delete-history">Auto-delete History:</label>
          <div class="setting-group">
            <label class="toggle">
              <input type="checkbox" id="auto-delete-history-toggle" ${localStorage.getItem("auto-delete-history") === "true" ? "checked" : ""}>
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <p class="settings-hint">When enabled, chat history older than 30 days will be automatically deleted.</p>
      </div>

      <div class="settings-section" id="about-section">
        <h4>About JR AI Chat</h4>
        <p>Version: 0.1.0</p>
        <p>Created By <a href="https://github.io/jayreddin">Jamie Reddin</a> using <a href="https://puter.com">Puter.com</a></p>
      </div>
    `;

    showPopup("Settings", content, () => {
      // Save settings
      const themeToggle = document.getElementById("settings-theme-toggle");
      const textSize = document.getElementById("text-size-value");
      const compactMode = document.getElementById("compact-mode-toggle");
      const notificationSounds = document.getElementById(
        "notification-sounds-toggle",
      );
      const defaultModel = document.getElementById("default-model-selector");
      const systemPrompt = document.getElementById("system-prompt");
      const settingsStreamToggle = document.getElementById(
        "settings-stream-toggle",
      );
      const temperatureSlider = document.getElementById("temperature-slider");
      const maxTokensSlider = document.getElementById("max-tokens-slider");
      const topPSlider = document.getElementById("top-p-slider");
      const frequencyPenaltySlider = document.getElementById(
        "frequency-penalty-slider",
      );
      const presencePenaltySlider = document.getElementById(
        "presence-penalty-slider",
      );
      const autoDeleteHistoryToggle = document.getElementById(
        "auto-delete-history-toggle",
      );

      // Sync stream toggle with main UI if it exists
      const mainStreamToggle = document.getElementById("stream-toggle");
      if (mainStreamToggle && settingsStreamToggle) {
        mainStreamToggle.checked = settingsStreamToggle.checked;
      }

      // Apply theme
      if (themeToggle.checked) {
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark");

        // If using dark theme, enable dark code theme
        document.getElementById("prism-theme-dark").disabled = false;
      } else {
        document.body.classList.remove("dark-theme");
        localStorage.setItem("theme", "light");

        // If using light theme, disable dark code theme
        document.getElementById("prism-theme-dark").disabled = true;
      }

      // Apply text size
      const fontSize = textSize.value + "px";
      document.documentElement.style.setProperty("--text-size", fontSize);
      localStorage.setItem("text-size", textSize.value);

      // Apply compact mode
      if (compactMode.checked) {
        document.body.classList.add("compact-mode");
        localStorage.setItem("compact-mode", "true");
      } else {
        document.body.classList.remove("compact-mode");
        localStorage.setItem("compact-mode", "false");
      }

      // Apply notification sounds setting
      localStorage.setItem("notification-sounds", notificationSounds.checked);

      // Apply default model
      localStorage.setItem("default-model", defaultModel.value);

      // If the default model changed, update the model selector
      if (modelSelector.value !== defaultModel.value) {
        modelSelector.value = defaultModel.value;
      }

      // Save system prompt
      localStorage.setItem("system-prompt", systemPrompt.value);

      // Save advanced AI parameters
      localStorage.setItem("temperature", temperatureSlider.value);
      localStorage.setItem("max-tokens", maxTokensSlider.value);
      localStorage.setItem("top-p", topPSlider.value);
      localStorage.setItem("frequency-penalty", frequencyPenaltySlider.value);
      localStorage.setItem("presence-penalty", presencePenaltySlider.value);
      localStorage.setItem(
        "auto-delete-history",
        autoDeleteHistoryToggle.checked,
      );
    });

    // Set up settings functionality
    setTimeout(() => {
      const settingsTabs = document.querySelectorAll(".settings-tab");
      const themeToggle = document.getElementById("settings-theme-toggle");
      const textSizeValue = document.getElementById("text-size-value");
      const textSizeDecrease = document.getElementById("text-size-decrease");
      const textSizeIncrease = document.getElementById("text-size-increase");
      const compactModeToggle = document.getElementById("compact-mode-toggle");
      const notificationSoundsToggle = document.getElementById(
        "notification-sounds-toggle",
      );
      const systemPrompt = document.getElementById("system-prompt");
      const clearAllDataBtn = document.getElementById("clear-all-data-btn");
      const temperatureSlider = document.getElementById("temperature-slider");
      const maxTokensSlider = document.getElementById("max-tokens-slider");
      const topPSlider = document.getElementById("top-p-slider");
      const frequencyPenaltySlider = document.getElementById(
        "frequency-penalty-slider",
      );
      const presencePenaltySlider = document.getElementById(
        "presence-penalty-slider",
      );
      const temperatureValue = document.getElementById("temperature-value");
      const maxTokensValue = document.getElementById("max-tokens-value");
      const topPValue = document.getElementById("top-p-value");
      const frequencyPenaltyValue = document.getElementById(
        "frequency-penalty-value",
      );
      const presencePenaltyValue = document.getElementById(
        "presence-penalty-value",
      );
      const autoDeleteHistoryToggle = document.getElementById(
        "auto-delete-history-toggle",
      );

      // Tab navigation
      settingsTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          // Remove active class from all tabs
          settingsTabs.forEach((t) => t.classList.remove("active"));

          // Add active class to clicked tab
          tab.classList.add("active");

          // Hide all sections
          document.querySelectorAll(".settings-section").forEach((section) => {
            section.classList.remove("active");
          });

          // Show selected section
          const sectionId = tab.getAttribute("data-tab") + "-section";
          document.getElementById(sectionId).classList.add("active");
        });
      });

      // Load saved settings
      const savedTextSize = localStorage.getItem("text-size");
      if (savedTextSize) {
        textSizeValue.value = savedTextSize;
        // Apply the text size immediately to show the current value
        document.documentElement.style.setProperty(
          "--text-size",
          savedTextSize + "px",
        );
      }

      const savedSystemPrompt = localStorage.getItem("system-prompt");
      if (savedSystemPrompt) {
        systemPrompt.value = savedSystemPrompt;
      }

      // Text size controls with live preview
      textSizeDecrease.addEventListener("click", () => {
        if (parseInt(textSizeValue.value) > 10) {
          textSizeValue.value = parseInt(textSizeValue.value) - 1;
          // Apply the change immediately for preview
          document.documentElement.style.setProperty(
            "--text-size",
            textSizeValue.value + "px",
          );
        }
      });

      textSizeIncrease.addEventListener("click", () => {
        if (parseInt(textSizeValue.value) < 24) {
          textSizeValue.value = parseInt(textSizeValue.value) + 1;
          // Apply the change immediately for preview
          document.documentElement.style.setProperty(
            "--text-size",
            textSizeValue.value + "px",
          );
        }
      });

      // Also apply text size on manual input
      textSizeValue.addEventListener("input", () => {
        const size = parseInt(textSizeValue.value);
        if (size >= 10 && size <= 24) {
          document.documentElement.style.setProperty(
            "--text-size",
            size + "px",
          );
        }
      });

      // Clear all data button
      clearAllDataBtn.addEventListener("click", () => {
        if (
          confirm(
            "Are you sure you want to clear all chat history and settings? This action cannot be undone.",
          )
        ) {
          // Clear localStorage
          localStorage.clear();

          // Clear chat history from KV store
          puter.kv
            .del("chat_history")
            .then(() => {
              alert("All data has been cleared. The page will now reload.");
              window.location.reload();
            })
            .catch((error) => {
              console.error("Failed to clear chat history:", error);
              alert("Failed to clear chat history. Please try again.");
            });
        }
      });

      // Apply theme changes immediately for preview
      themeToggle.addEventListener("change", () => {
        if (themeToggle.checked) {
          document.body.classList.add("dark-theme");
          document.getElementById("prism-theme-dark").disabled = false;
        } else {
          document.body.classList.remove("dark-theme");
          document.getElementById("prism-theme-dark").disabled = true;
        }
      });

      // Apply compact mode immediately for preview
      compactModeToggle.addEventListener("change", () => {
        if (compactModeToggle.checked) {
          document.body.classList.add("compact-mode");
        } else {
          document.body.classList.remove("compact-mode");
        }
      });

      // Advanced AI parameter sliders with live preview and storage
      function updateSliderValue(slider, valueElement) {
        valueElement.textContent = slider.value;
        localStorage.setItem(valueElement.id, slider.value);
      }

      temperatureSlider.addEventListener("input", () =>
        updateSliderValue(temperatureSlider, temperatureValue),
      );
      maxTokensSlider.addEventListener("input", () =>
        updateSliderValue(maxTokensSlider, maxTokensValue),
      );
      topPSlider.addEventListener("input", () =>
        updateSliderValue(topPSlider, topPValue),
      );
      frequencyPenaltySlider.addEventListener("input", () =>
        updateSliderValue(frequencyPenaltySlider, frequencyPenaltyValue),
      );
      presencePenaltySlider.addEventListener("input", () =>
        updateSliderValue(presencePenaltySlider, presencePenaltyValue),
      );

      // Load saved values for advanced AI parameters
      const savedTemperature = localStorage.getItem("temperature");
      if (savedTemperature) {
        temperatureSlider.value = savedTemperature;
        temperatureValue.textContent = savedTemperature;
      }

      const savedMaxTokens = localStorage.getItem("max-tokens");
      if (savedMaxTokens) {
        maxTokensSlider.value = savedMaxTokens;
        maxTokensValue.textContent = savedMaxTokens;
      }

      const savedTopP = localStorage.getItem("top-p");
      if (savedTopP) {
        topPSlider.value = savedTopP;
        topPValue.textContent = savedTopP;
      }

      const savedFrequencyPenalty = localStorage.getItem("frequency-penalty");
      if (savedFrequencyPenalty) {
        frequencyPenaltySlider.value = savedFrequencyPenalty;
        frequencyPenaltyValue.textContent = savedFrequencyPenalty;
      }

      const savedPresencePenalty = localStorage.getItem("presence-penalty");
      if (savedPresencePenalty) {
        presencePenaltySlider.value = savedPresencePenalty;
        presencePenaltyValue.textContent = savedPresencePenalty;
      }

      // Auto-delete history toggle
      const savedAutoDeleteHistory = localStorage.getItem(
        "auto-delete-history",
      );
      if (savedAutoDeleteHistory) {
        autoDeleteHistoryToggle.checked = savedAutoDeleteHistory === "true";
      }
    }, 0);
  });

  // Helper functions
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function detectCodeLanguage(code) {
    // More comprehensive language detection based on syntax
    // Python
    if (
      code.includes("import ") &&
      (code.includes("def ") || code.includes("class ")) &&
      code.includes(":")
    )
      return "python";
    if (code.match(/from\s+[\w\.]+\s+import\s+/)) return "python";

    // JavaScript/TypeScript
    if (
      code.includes("const ") &&
      code.includes(";") &&
      (code.includes("function") || code.includes("=>"))
    )
      return "javascript";
    if (
      code.includes("import ") &&
      code.includes("from ") &&
      code.includes(";")
    )
      return "javascript";
    if (
      code.includes("interface ") &&
      code.includes("extends") &&
      code.includes(";")
    )
      return "typescript";

    // Java
    if (
      code.includes("public class ") &&
      code.includes("void ") &&
      code.includes(";")
    )
      return "java";

    // C/C++
    if (
      code.includes("#include") &&
      (code.includes("int main") || code.includes("void main"))
    )
      return "cpp";

    // HTML
    if (
      code.includes("<!DOCTYPE html>") ||
      code.includes("<html>") ||
      (code.includes("<div") && code.includes("</div>"))
    )
      return "html";

    // CSS
    if (
      (code.includes("body {") || code.includes(".class {")) &&
      code.includes("}")
    )
      return "css";

    // SQL
    if (
      (code.includes("SELECT ") || code.includes("select ")) &&
      (code.includes(" FROM ") || code.includes(" from "))
    )
      return "sql";

    // PHP
    if (
      code.includes("<?php") ||
      (code.includes("function") && code.includes("$"))
    )
      return "php";

    // Go
    if (code.includes("package ") && code.includes("func ")) return "go";

    // Ruby
    if (code.includes("def ") && code.includes("end") && !code.includes(";"))
      return "ruby";

    // Bash/Shell
    if (
      code.includes("#!/bin/") ||
      (code.includes("if [") && code.includes("fi"))
    )
      return "bash";

    // Fallback
    return "";
  }

  function getModelDisplayName(modelId) {
    const modelNames = {
      "deepseek-reasoner": "DeepSeek Reasoner",
      "o3-mini": "O3 Mini",
      "o1-mini": "O1 Mini",
      "claude-3-7-sonnet": "Claude 3.7 Sonnet",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
    };
    return modelNames[modelId] || modelId;
  }

  function getModelDescription(modelId) {
    const descriptions = {
      "deepseek-reasoner":
        "Specialized for complex reasoning tasks and problem-solving.",
      "o3-mini": "Balanced reasoning capabilities with efficient performance.",
      "o1-mini": "Fast and efficient for general reasoning tasks.",
      "claude-3-7-sonnet": "Strong reasoning with nuanced understanding.",
      "gemini-2.0-flash":
        "Quick, efficient reasoning with Google's latest technology.",
    };
    return (
      descriptions[modelId] || "Advanced reasoning model for enhanced thinking."
    );
  }

  // Initialize chat history
  loadChatHistory(true); // Pass true to skip welcome message

  // Load saved chat history list
  loadChatHistoryFromStorage();

  // Load saved theme preference or respect OS preference
  const savedTheme = localStorage.getItem("theme");
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (
    document.body &&
    (savedTheme === "dark" || (!savedTheme && prefersDark))
  ) {
    document.body.classList.add("dark-theme");
  }

  // Create hidden stream toggle that will be controlled from settings
  const streamToggle = document.createElement("input");
  streamToggle.type = "checkbox";
  streamToggle.id = "stream-toggle";
  streamToggle.checked = true;
  streamToggle.style.display = "none";
  if (document.body) {
    document.body.appendChild(streamToggle);
  }

  // Initialize voice input
  micButton.addEventListener("click", toggleVoiceRecording);

  function toggleVoiceRecording() {
    if (isRecording) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  }

  function startVoiceRecording() {
    // Check if browser supports speech recognition
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    // Request microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(function (stream) {
        // Permission granted, start recording
        initiateSpeechRecognition();
        if (stream) stream.getTracks().forEach((track) => track.stop());
      })
      .catch(function (err) {
        alert("Microphone permission denied: " + err.message);
      });
  }

  function initiateSpeechRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();

    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = "en-US";

    let finalTranscript = "";

    speechRecognition.onstart = function () {
      isRecording = true;
      micButton.classList.add("recording");
      messageInput.placeholder = "Listening...";
    };

    speechRecognition.onresult = function (event) {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      messageInput.value = finalTranscript + interimTranscript;
    };

    speechRecognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      stopVoiceRecording();
    };

    speechRecognition.onend = function () {
      stopVoiceRecording();
    };

    speechRecognition.start();
  }

  function stopVoiceRecording() {
    if (speechRecognition) {
      speechRecognition.stop();
    }

    isRecording = false;
    micButton.classList.remove("recording");
    messageInput.placeholder = "Type your message here...";
  }

  // Initialize text-to-speech
  ttsButton.addEventListener("click", toggleTextToSpeech);

  function toggleTextToSpeech() {
    isTtsEnabled = !isTtsEnabled;

    if (isTtsEnabled) {
      ttsButton.classList.add("active");
      ttsButton.title = "Disable text-to-speech";

      // Check if TTS is supported
      if (!synthesis) {
        alert("Your browser does not support text-to-speech.");
        isTtsEnabled = false;
        ttsButton.classList.remove("active");
        return;
      }
    } else {
      ttsButton.classList.remove("active");
      ttsButton.title = "Enable text-to-speech";

      // Stop any ongoing speech
      if (synthesis) {
        synthesis.cancel();
      }
    }

    // Save preference
    localStorage.setItem("tts-enabled", isTtsEnabled ? "true" : "false");
  }

  // Function to speak text
  function speakText(text) {
    if (!isTtsEnabled || !synthesis) return;

    // Cancel any ongoing speech
    synthesis.cancel();

    // Clean text for better speech (remove markdown, code, etc.)
    const textElement = document.createElement("div");
    textElement.innerHTML = marked.parse(text);
    const cleanText = textElement.innerText;

    // Split text into chunks to handle long responses
    const chunks = splitTextIntoChunks(cleanText, 200);

    // Queue up each chunk for speaking
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);

      // If it's not the first chunk, add a slight delay
      if (index > 0) {
        utterance.onstart = () => {
          console.log(`Speaking chunk ${index + 1}/${chunks.length}`);
        };
      }

      synthesis.speak(utterance);
    });
  }

  // Helper function to split text into speakable chunks
  function splitTextIntoChunks(text, maxLength) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = "";
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += (currentChunk ? " " : "") + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  // Load TTS preference
  const savedTtsPreference = localStorage.getItem("tts-enabled");
  if (savedTtsPreference === "true") {
    isTtsEnabled = true;
    ttsButton.classList.add("active");
    ttsButton.title = "Disable text-to-speech";
  }

  // Event listeners
  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  fileInput.addEventListener("change", handleFileAttachment);

  // Model selection change event
  modelSelector.addEventListener("change", function () {
    const imageGenOptions = document.getElementById("image-gen-options");
    if (this.value === "image-generator") {
      imageGenOptions.style.display = "block";
    } else {
      imageGenOptions.style.display = "none";
    }
  });

  // Handle file attachment
  function handleFileAttachment(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      currentAttachments.push(file);

      // Create preview element
      const attachmentElement = document.createElement("div");
      attachmentElement.className = "attachment-item";
      attachmentElement.innerHTML = `
        <span class="file-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
            <polyline points="13 2 13 9 20 9"></polyline>
          </svg>
        </span>
        <span class="file-name">${file.name}</span>
        <span class="remove-attachment" data-index="${currentAttachments.length - 1}">
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
          removeAttachment(index, attachmentElement);
        });
    }

    // Clear the file input
    event.target.value = "";
  }

  // Remove an attachment
  function removeAttachment(index, element) {
    currentAttachments[index] = null; // Don't shift array to keep indexes consistent
    element.remove();
  }

  // Convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Format attachment for display in chat
  function formatAttachment(file, base64) {
    if (file.type.startsWith("image/")) {
      return `<div class="file-attachment image-attachment">
                <img src="${base64}" alt="${file.name}" title="${file.name}" />
                <div class="image-filename">${file.name}</div>
              </div>`;
    } else {
      // Determine file type icon based on extension
      const extension = file.name.split(".").pop().toLowerCase();
      let fileIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
          <polyline points="13 2 13 9 20 9"></polyline>
        </svg>
      `;

      // Different icons for common file types
      const fileTypeMap = {
        pdf: "#FF5252",
        doc: "#2196F3",
        docx: "#2196F3",
        xls: "#4CAF50",
        xlsx: "#4CAF50",
        ppt: "#FF9800",
        pptx: "#FF9800",
        zip: "#9C27B0",
        rar: "#9C27B0",
        txt: "#607D8B",
        csv: "#795548",
        json: "#FFC107",
        xml: "#00BCD4",
        html: "#E91E63",
        css: "#3F51B5",
        js: "#FFEB3B",
      };

      const color = fileTypeMap[extension] || "#78909C";

      return `<div class="file-attachment file-type-${extension}">
                <div class="file-icon" style="color: ${color}">
                  ${fileIcon}
                  <span class="file-extension">${extension}</span>
                </div>
                <span class="file-name">${file.name}</span>
              </div>`;
    }
  }

  // Send message function
  async function sendMessage() {
    const userMessage = messageInput.value.trim();
    if (userMessage === "" && currentAttachments.length === 0) return;

    // Prepare message content with attachments
    let messageContent = userMessage;
    let attachmentContent = "";

    // Process attachments
    const validAttachments = currentAttachments.filter((att) => att !== null);
    for (let file of validAttachments) {
      try {
        const base64 = await fileToBase64(file);
        attachmentContent += formatAttachment(file, base64);
      } catch (error) {
        console.error("Failed to process attachment:", error);
      }
    }

    // Combine text and attachments
    if (attachmentContent) {
      messageContent = `${messageContent}\n\n${attachmentContent}`;
    }

    // Add user message to chat
    addMessageToChat("user", messageContent);
    messageInput.value = "";

    // Clear attachments
    currentAttachments = [];
    attachmentPreview.innerHTML = "";

    // Check if we're using image generation model
    if (modelSelector.value === "image-generator") {
      generateImage(userMessage);
      return;
    }

    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    // Function to generate image using DALL-E
    async function generateImage(prompt) {
      if (!prompt) {
        addMessageToChat(
          "error",
          "Please provide a description for the image you want to generate.",
        );
        return;
      }

      // Get image generation options
      const imageSize = document.getElementById("image-size").value;
      const imageStyle = document.getElementById("image-style").value;
      const imageQuality = document.getElementById("image-quality").value;
      const imageCount = parseInt(document.getElementById("image-count").value);

      // Hide image generation options when sending
      document.getElementById("image-gen-options").style.display = "none";

      // Create a message container for the AI response
      const aiMessageElement = addMessageToChat("assistant", "");
      
      // Create thumbnails for loading
      let thumbnailsHTML = "";
      for (let i = 0; i < imageCount; i++) {
        thumbnailsHTML += `
          <div class="image-thumbnail" data-index="${i}">
            <div class="thumbnail-placeholder">
              <div class="thumbnail-progress">
                <div class="thumbnail-progress-bar" id="progress-${i}" style="width: 0%"></div>
                <div class="thumbnail-progress-text">0%</div>
              </div>
            </div>
          </div>
        `;
      }
      
      aiMessageElement.innerHTML = `
        <div class="image-gen-container">
          <div class="image-gen-thumbnails">
            ${thumbnailsHTML}
          </div>
          <div class="image-gen-preview-container">
            <button class="prev-image-btn">&lt;</button>
            <div class="image-gen-preview"></div>
            <button class="next-image-btn">&gt;</button>
          </div>
          <div class="image-gen-prompt">
            <p><strong>Prompt:</strong> ${prompt}</p>
            <p><strong>Settings:</strong> ${imageSize}, ${imageStyle}, ${imageQuality}</p>
          </div>
        </div>
      `;

      try {
        // Simulate progress updates for each thumbnail
        const progressIntervals = [];
        let generatedImages = [];
        
        for (let i = 0; i < imageCount; i++) {
          const progressBar = aiMessageElement.querySelector(`#progress-${i}`);
          const progressText = progressBar.parentElement.querySelector(".thumbnail-progress-text");
          let progress = 0;
          
          const interval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress > 100) progress = 100;
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
            
            // When progress reaches 100%, show the image
            if (progress >= 100) {
              clearInterval(interval);
              
              // In production, use the actual API response
              const imageUrl = `https://source.unsplash.com/random/${imageSize}/?${encodeURIComponent(prompt)}&sig=${i}`;
              
              generatedImages.push({
                url: imageUrl,
                index: i
              });
              
              // Replace the placeholder with the generated image
              const thumbnail = aiMessageElement.querySelector(`.image-thumbnail[data-index="${i}"]`);
              thumbnail.innerHTML = `<img src="${imageUrl}" class="thumbnail-image" alt="Generated image ${i + 1}">`;
              
              // If all images are generated, set up the preview
              if (generatedImages.length === imageCount) {
                setupImagePreview(aiMessageElement, generatedImages, prompt, imageSize, imageStyle, imageQuality);
              }
            }
          }, 500 + (i * 200)); // Stagger the progress updates
          
          progressIntervals.push(interval);
        }
        
        // If there's an error, clean up all intervals
        setTimeout(() => {
          progressIntervals.forEach(clearInterval);
          
          // If no images were generated, show an error
          if (generatedImages.length === 0) {
            aiMessageElement.querySelector('.image-gen-thumbnails').innerHTML = `
              <p>Sorry, there was an error generating your image(s). Please try again.</p>
            `;
          }
          
          // Save the message to chat history
          saveChatMessage("assistant", aiMessageElement.innerHTML);
        }, 10000); // Maximum time to wait for generation
        
      } catch (error) {
        aiMessageElement.querySelector('.image-gen-thumbnails').innerHTML = `
          <p>Error generating image: ${error.message || "Unknown error"}</p>
        `;
        saveChatMessage("assistant", aiMessageElement.innerHTML);
      }
    }
    
    // Function to set up image preview when thumbnails are clicked
    function setupImagePreview(messageElement, images, prompt, size, style, quality) {
      const thumbnails = messageElement.querySelectorAll('.image-thumbnail');
      const previewContainer = messageElement.querySelector('.image-gen-preview-container');
      const preview = messageElement.querySelector('.image-gen-preview');
      const prevBtn = messageElement.querySelector('.prev-image-btn');
      const nextBtn = messageElement.querySelector('.next-image-btn');
      
      let currentIndex = 0;
      
      // Show preview when a thumbnail is clicked
      thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
          currentIndex = index;
          showPreview();
        });
      });
      
      // Navigation buttons
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updatePreview();
      });
      
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        updatePreview();
      });
      
      function showPreview() {
        previewContainer.style.display = 'flex';
        updatePreview();
      }
      
      function updatePreview() {
        const image = images[currentIndex];
        preview.innerHTML = `
          <div class="full-image-preview">
            <img src="${image.url}" class="preview-image" alt="Generated image ${image.index + 1}">
            <button class="save-image-btn" data-url="${image.url}">Save Image</button>
          </div>
        `;
        
        // Add save button functionality
        preview.querySelector('.save-image-btn').addEventListener('click', () => {
          const url = image.url;
          const link = document.createElement('a');
          link.href = url;
          link.download = `generated-image-${Date.now()}.png`;
          link.click();
        });
        
        // Make image clickable to view in modal
        preview.querySelector('.preview-image').addEventListener('click', () => {
          showImageInModal(image.url);
        });
      }
    }

    try {
      // Determine which model to use - DeepThink or regular
      const selectedModel = activeDeepThinkModel || modelSelector.value;

      // Get system prompt if available
      const systemPrompt = localStorage.getItem("system-prompt");

      // Determine if streaming should be used
      const useStream = document.getElementById("stream-toggle").checked;

      // Add knowledge base if items exist
      let additionalContext = "";
      if (knowledgeBase.length > 0) {
        additionalContext = "\n\nKnowledge Base:\n";
        knowledgeBase.forEach((item) => {
          additionalContext += `[${item.title}]: ${item.content.substring(0, 500)}${item.content.length > 500 ? "..." : ""}\n\n`;
        });
      }

      // Combine message with knowledge base
      let messageWithContext = additionalContext
        ? userMessage + additionalContext
        : userMessage;

      // Process attachments for Vision AI or OCR
      let attachmentContext = "";
      let attachmentData = [];

      // Process each valid attachment
      for (const attachment of validAttachments) {
        const processedAttachment = await processAttachmentForAI(attachment);
        if (processedAttachment) {
          attachmentData.push(processedAttachment);

          if (processedAttachment.type === 'image') {
            attachmentContext += `I'm attaching an image (${attachment.name}) for you to analyze. `;
          } else if (processedAttachment.type === 'document') {
            attachmentContext += `I'm attaching a document (${attachment.name}) for OCR analysis. `;
          }
        }
      }

      // Combine message with attachment context
      if (attachmentContext) {
        messageWithContext = `${messageWithContext}\n\n${attachmentContext}`;
      }

      // Add actual vision data to message
      if (attachmentData.length > 0) {
        // Format message for vision APIs
        const images = attachmentData.filter(att => att.type === 'image');
        if (images.length > 0) {
          try {
            // For Puter API, we need to format the message specially for vision analysis
            const visionPrompt = messageWithContext + " (Please analyze this image in detail)";
            
            // This would use the actual Puter vision API
            // For demo purposes, we're using a regular message with context
            messageWithContext = visionPrompt;
            
            // For each image, add to the context
            images.forEach(img => {
              messageWithContext += `\n\nImage: ${img.name}`;
            });
          } catch (error) {
            console.error("Error processing images for vision AI:", error);
            messageWithContext += "\n\n[Vision analysis failed - please try again]";
          }
        }

        const documents = attachmentData.filter(att => att.type === 'document');
        if (documents.length > 0) {
          try {
            // For documents, extract text with OCR and include in the message
            documents.forEach(doc => {
              // In a real implementation, we would use an OCR API here
              // For demo purposes, we're adding placeholder text
              messageWithContext += `\n\nDocument OCR (${doc.name}): This would contain the extracted text from the document.`;
            });
          } catch (error) {
            console.error("Error processing documents for OCR:", error);
            messageWithContext += "\n\n[OCR processing failed - please try again]";
          }
        }
      }

      const formattedMessages = [];
      
      // Add system prompt if available
      if (systemPrompt) {
        formattedMessages.push({ role: "system", content: systemPrompt });
      }
      
      // Add chat history for context
      for (const msg of await getChatHistory()) {
        formattedMessages.push(msg);
      }
      
      // Add current user message
      formattedMessages.push({ role: "user", content: messageWithContext });

      if (useStream) {
        // Remove typing indicator
        typingIndicator.remove();

        // Create AI message container
        const aiMessageElement = addMessageToChat("assistant", "");

        // Use streaming API with formatted messages
        const resp = await puter.ai.chat(formattedMessages, {
          model: selectedModel,
          stream: true,
        });

        let fullResponse = "";
        for await (const part of resp) {
          fullResponse += part?.text || "";
          const contentElement = aiMessageElement.querySelector(".message-content");
          if (contentElement) {
            contentElement.innerHTML = marked.parse(fullResponse);
            
            // Activate syntax highlighting for code blocks
            setTimeout(() => {
              Prism.highlightAllUnder(contentElement);
            }, 0);
            
            aiMessageElement.scrollIntoView({ behavior: "smooth" });
          }
        }

        // Store the message in chat history
        saveChatMessage("user", userMessage);
        saveChatMessage("assistant", fullResponse);

        // Speak response if text-to-speech is enabled
        if (isTtsEnabled) {
          speakText(fullResponse);
        }
      } else {
        // Get regular response with formatted messages
        const response = await puter.ai.chat(formattedMessages, {
          model: selectedModel,
        });

        // Remove typing indicator
        typingIndicator.remove();

        // Add AI response to chat
        addMessageToChat("assistant", response.text);

        // Store the message in chat history
        saveChatMessage("user", userMessage);
        saveChatMessage("assistant", response.text);

        // Speak response if text-to-speech is enabled
        if (isTtsEnabled) {
          speakText(response.text);
        }
      }
    } catch (error) {
      // Remove typing indicator
      typingIndicator.remove();

      // Show error message
      addMessageToChat(
        "error",
        `Error: ${error.message || "Something went wrong"}`,
      );
    }
  }

  // Add message to chat UI
  function addMessageToChat(role, content) {
    const messageElement = document.createElement("div");
    messageElement.className = `message ${role}-message`;

    // Check if this message should be grouped with the previous one
    const lastMessage = chatContainer.lastElementChild;
    const shouldGroup =
      lastMessage &&
      lastMessage.classList.contains(`${role}-message`) &&
      !lastMessage.classList.contains("typing-indicator");

    if (shouldGroup) {
      messageElement.classList.add("grouped-message");
    }

    // Create timestamp
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Different styling based on role
    if (role === "user") {
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-label">You</span><span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${content}</div>
        <div class="message-actions">
          <div class="action-button edit-button" title="Edit message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <div class="action-button copy-button" title="Copy message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
          <div class="action-button delete-button" title="Delete message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
        </div>
      `;

      // Add event listeners for edit and copy buttons
      setTimeout(() => {
        const editButton = messageElement.querySelector(".edit-button");
        const copyButton = messageElement.querySelector(".copy-button");
        const deleteButton = messageElement.querySelector(".delete-button");

        editButton.addEventListener("click", () => {
          messageInput.value = content;
          messageInput.focus();
        });

        copyButton.addEventListener("click", () => {
          navigator.clipboard
            .writeText(content)
            .then(() => {
              // Optional: Show a brief "Copied" tooltip
              const originalTitle = copyButton.getAttribute("title");
              copyButton.setAttribute("title", "Copied!");
              setTimeout(() => {
                copyButton.setAttribute("title", originalTitle);
              }, 1000);
            })
            .catch((err) => {
              console.error("Failed to copy text: ", err);
            });
        });

        deleteButton.addEventListener("click", () => {
          // Add a confirmation before deleting
          if (confirm("Are you sure you want to delete this message?")) {
            messageElement.classList.add("message-deleting");
            setTimeout(() => {
              messageElement.remove();
              // Note: we should ideally update the KV store to remove this message as well
              // but we'll just handle the UI part for now
            }, 300);
          }
        });
      }, 0);
    } else if (role === "assistant") {
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-label">AI</span><span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${content ? marked.parse(content) : ""}</div>
        <div class="message-actions assistant-actions">
          <div class="action-button regenerate-button" title="Regenerate response">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 4v6h6"></path>
              <path d="M23 20v-6h-6"></path>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
          </div>
          <div class="action-button copy-button" title="Copy message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2424" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
          <div class="action-button delete-button" title="Delete message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
        </div>
      `;

      // Add event listener for copy button
      setTimeout(() => {
        const regenerateButton =
          messageElement.querySelector(".regenerate-button");
        const copyButton = messageElement.querySelector(".copy-button");
        const deleteButton = messageElement.querySelector(".delete-button");

        // Add copy buttons to code blocks
        const codeBlocks = messageElement.querySelectorAll("pre code");
        codeBlocks.forEach((codeBlock, index) => {
          const copyBtn = document.createElement("button");
          copyBtn.className = "code-copy-button";
          copyBtn.textContent = "Copy";
          copyBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard
              .writeText(codeBlock.textContent)
              .then(() => {
                copyBtn.textContent = "Copied!";
                setTimeout(() => {
                  copyBtn.textContent = "Copy";
                }, 2000);
              })
              .catch((err) => {
                console.error("Failed to copy code: ", err);
              });
          };
          codeBlock.parentNode.style.position = "relative";
          codeBlock.parentNode.appendChild(copyBtn);
        });

        // Activate syntax highlighting
        Prism.highlightAllUnder(messageElement);

        if (regenerateButton) {
          regenerateButton.addEventListener("click", async () => {
            // Find the previous user message
            let prevUserMessage = null;
            let currentElement = messageElement;

            // Navigate backwards to find the last user message
            while ((currentElement = currentElement.previousElementSibling)) {
              if (currentElement.classList.contains("user-message")) {
                const messageContentDiv =
                  currentElement.querySelector(".message-content");
                if (messageContentDiv) {
                  // Extract text content, ignoring any attachments
                  const contentHTML = messageContentDiv.innerHTML;
                  const tempDiv = document.createElement("div");
                  tempDiv.innerHTML = contentHTML;

                  // Remove any attachments from the content
                  const attachments =
                    tempDiv.querySelectorAll(".file-attachment");
                  attachments.forEach((attachment) => {
                    attachment.remove();
                  });

                  prevUserMessage = tempDiv.textContent.trim();
                  break;
                }
              }
            }

            if (!prevUserMessage) {
              alert(
                "Could not find the previous user message to regenerate a response.",
              );
              return;
            }

            // Remove the current AI message
            messageElement.classList.add("message-deleting");
            setTimeout(async () => {
              messageElement.remove();

              // Show typing indicator
              const typingIndicator = addTypingIndicator();

              // Generate new response
              try {
                const useStream =
                  document.getElementById("stream-toggle").checked;
                if (useStream) {
                  const messages = await getChatHistory();
                  // Add the last user message again
                  messages.push({ role: "user", content: prevUserMessage });

                  // Remove typing indicator
                  typingIndicator.remove();

                  // Create AI message container
                  const aiMessageElement = addMessageToChat("assistant", "");

                  // Use streaming API with proper options format
                  const resp = await puter.ai.chat(prevUserMessage, {
                    model: selectedModel,
                    stream: true,
                  });

                  let fullResponse = "";
                  for await (const part of resp) {
                    fullResponse += part?.text || "";
                    aiMessageElement.querySelector(
                      ".message-content",
                    ).innerHTML = marked.parse(fullResponse);
                    aiMessageElement.scrollIntoView({ behavior: "smooth" });
                  }

                  // Update chat history (replace last assistant message)
                  updateLastAssistantMessage(fullResponse);
                } else {
                  const messages = await getChatHistory();
                  // Add the last user message again
                  messages.push({ role: "user", content: prevUserMessage });

                  const response = await puter.ai.chat(prevUserMessage, {
                    model: selectedModel,
                  });

                  // Remove typing indicator if it exists
                  if (typingIndicator) typingIndicator.remove();

                  // Add AI response to chat
                  addMessageToChat("assistant", response.text);

                  // Update chat history (replace last assistant message)
                  updateLastAssistantMessage(response.text);
                }
              } catch (error) {
                // Remove typing indicator
                if (typingIndicator) typingIndicator.remove();

                // Show error message
                addMessageToChat(
                  "error",
                  `Error: ${error.message || "Something went wrong"}`,
                );
              }
            }, 300);
          });
        }

        copyButton.addEventListener("click", () => {
          // Get the raw content without markdown parsing
          navigator.clipboard
            .writeText(content)
            .then(() => {
              // Optional: Show a brief "Copied" tooltip
              const originalTitle = copyButton.getAttribute("title");
              copyButton.setAttribute("title", "Copied!");
              setTimeout(() => {
                copyButton.setAttribute("title", originalTitle);
              }, 1000);
            })
            .catch((err) => {
              console.error("Failed to copy text: ", err);
            });
        });

        if (deleteButton) {
          deleteButton.addEventListener("click", () => {
            if (confirm("Are you sure you want to delete this message?")) {
              messageElement.classList.add("message-deleting");
              setTimeout(() => {
                messageElement.remove();
              }, 300);
            }
          });
        }
      }, 0);
    } else {
      messageElement.innerHTML = `
        <div class="message-header">
          <span class="message-label">System</span><span class="message-timestamp">${timestamp}</span>
        </div>
        <div class="message-content">${content}</div>
      `;
    }

    chatContainer.appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: "smooth" });
    return messageElement.querySelector(".message-content");
  }

  // Add typing indicator
  function addTypingIndicator() {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const indicator = document.createElement("div");
    indicator.className = "message assistant-message typing-indicator";
    indicator.innerHTML = `
      <div class="message-header">
        <span class="message-label">AI</span><span class="message-timestamp">${timestamp}</span>
      </div>
      <div class="message-content"><div class="dot-flashing"></div></div>
    `;
    chatContainer.appendChild(indicator);
    indicator.scrollIntoView({ behavior: "smooth" });
    return indicator;
  }

  // Clear chat history
  async function clearChat() {
    // Clear UI
    chatContainer.innerHTML = "";

    // Clear KV store chat history
    await puter.kv.del("chat_history");

    // Add welcome message
    addMessageToChat("assistant", "Hello! How can I help you today?");
  }

  // Save chat message to KV store
  async function saveChatMessage(role, content) {
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
  async function getChatHistory() {
    try {
      const history = await puter.kv.get("chat_history");
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Failed to load chat history:", error);
      return [];
    }
  }

  // Update the last assistant message in the chat history
  async function updateLastAssistantMessage(newContent) {
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

  // Load chat history from KV store
  async function loadChatHistory(skipWelcome = false) {
    try {
      const history = await getChatHistory();

      if (history.length > 0) {
        // Display existing messages
        history.forEach((msg) => {
          addMessageToChat(msg.role, msg.content);
        });
      } else if (!skipWelcome) {
        // Add welcome message for new users
        addMessageToChat("assistant", "Hello! How can I help you today?");
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      if (!skipWelcome) {
        addMessageToChat("assistant", "Hello! How can I help you today?");
      }
    }
  }

  // New function to process attachments for AI
  async function processAttachmentForAI(attachment) {
    if (!attachment) return null;

    if (attachment.type.startsWith("image/")) {
      try {
        const base64 = await fileToBase64(attachment);
        return { type: "image", name: attachment.name, data: base64 };
      } catch (error) {
        console.error("Failed to process image:", error);
        return null;
      }
    } else if (
      attachment.type === "application/pdf" ||
      attachment.name.endsWith(".docx") ||
      attachment.name.endsWith(".doc") ||
      attachment.name.endsWith(".txt")
    ) {
      // Simulate OCR - in real application, call OCR API here
      return { type: "document", name: attachment.name, data: "OCR Result Placeholder" };
    } else {
      return null;
    }
  }

  // New function to process attachments for AI
  async function processAttachmentForAI(attachment) {
    if (!attachment) return null;

    if (attachment.type.startsWith("image/")) {
      try {
        const base64 = await fileToBase64(attachment);
        return { type: "image", name: attachment.name, data: base64 };
      } catch (error) {
        console.error("Failed to process image:", error);
        return null;
      }
    } else if (
      attachment.type === "application/pdf" ||
      attachment.name.endsWith(".docx") ||
      attachment.name.endsWith(".doc") ||
      attachment.name.endsWith(".txt")
    ) {
      // Simulate OCR - in real application, call OCR API here
      return { type: "document", name: attachment.name, data: "OCR Result Placeholder" };
    } else {
      return null;
    }
  }
});
