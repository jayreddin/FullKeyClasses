// Puter AI Chat App
import { addMessageToChat, addTypingIndicator } from './js/chat.js';
import { setupEmojiPicker } from './js/emoji.js';
import { setupUtilityBar, showPopup, closePopup } from './js/utilityBar.js';
import { setupAttachments } from './js/attachments.js';
import { setupVoiceAndSpeech } from './js/voiceSpeech.js';
import { setupSettings } from './js/settings.js';
import { 
  loadChatHistory, 
  saveChatToHistory, 
  saveChatMessage, 
  loadChatFromHistory, 
  getChatHistory, 
  loadChatHistoryFromStorage,
  updateLastAssistantMessage 
} from './js/chatHistory.js';
import { initializeDOM } from './js/utils.js';


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
  const activeModelIndicator = document.getElementById("active-model-indicator");

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

  // App state
  let activeDeepThinkModel = null;
  let knowledgeBase = [];
  let currentUtilityMode = null;
  let currentAttachments = [];
  let tempAttachments = [];
  let currentChatId = generateChatId();
  let chatHistoryList = [];
  let isTtsEnabled = false;

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

  // Setup modal functionality
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

  // Helper functions
  function generateChatId() {
    return "chat_" + Date.now();
  }

  // Setup components
  setupEmojiPicker(messageInput);
  setupUtilityBar(
    utilityPopup, 
    popupTitle, 
    popupBody, 
    popupClose, 
    popupCancel, 
    popupSave, 
    activeModelIndicator,
    currentUtilityMode,
    tempAttachments,
    currentAttachments,
    attachmentPreview,
    modal,
    modalImage,
    activeDeepThinkModel,
    knowledgeBase,
    chatHistoryList,
    newChatBtn,
    historyBtn,
    imageUploadBtn,
    fileUploadBtn,
    codeBtn,
    websearchBtn,
    deepthinkBtn,
    knowledgebaseBtn,
    settingsBtn,
    showImageInModal,
    generateChatId,
    currentChatId,
    saveChatToHistory,
    loadChatFromHistory,
    chatContainer,
    messageInput,
    addMessageToChat
  );

  const { setupAttachmentHandling, removeAttachment } = setupAttachments(
    currentAttachments,
    attachmentPreview,
    fileInput
  );

  const { speakText, toggleVoiceRecording, toggleTextToSpeech } = setupVoiceAndSpeech(
    micButton,
    ttsButton,
    messageInput,
    isTtsEnabled
  );

  setupSettings();

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
    addMessageToChat("user", messageContent, chatContainer);
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
    const typingIndicator = addTypingIndicator(chatContainer);

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
      const messageWithContext = additionalContext
        ? userMessage + additionalContext
        : userMessage;

      if (useStream) {
        // Get streaming response
        const messages = await getChatHistory();

        // Add system prompt if available
        if (systemPrompt) {
          messages.unshift({ role: "system", content: systemPrompt });
        }

        messages.push({ role: "user", content: messageWithContext });

        // Remove typing indicator
        typingIndicator.remove();

        // Create AI message container
        const aiMessageElement = addMessageToChat("assistant", "", chatContainer);

        // Use streaming API
        const resp = await puter.ai.chat(messages, false, {
          model: selectedModel,
          stream: true,
        });

        let fullResponse = "";
        for await (const part of resp) {
          fullResponse += part?.text || "";
          aiMessageElement.innerHTML = marked.parse(fullResponse);

          // Activate syntax highlighting for code blocks
          setTimeout(() => {
            Prism.highlightAllUnder(aiMessageElement);
          }, 0);

          aiMessageElement.scrollIntoView({ behavior: "smooth" });
        }

        // Store the message in chat history
        saveChatMessage("user", userMessage);
        saveChatMessage("assistant", fullResponse);

        // Speak response if text-to-speech is enabled
        if (isTtsEnabled) {
          speakText(fullResponse);
        }
      } else {
        // Get regular response
        const messages = await getChatHistory();

        // Add system prompt if available
        if (systemPrompt) {
          messages.unshift({ role: "system", content: systemPrompt });
        }

        // Check for image attachments to process
        let hasImageAttachments = false;
        let imageContext = "";

        for (const attachment of validAttachments) {
          if (attachment.type.startsWith("image/")) {
            hasImageAttachments = true;
            // In production, use the real vision API
            imageContext += "This message contains an image attachment. ";
          } else if (
            attachment.type === "application/pdf" ||
            attachment.name.endsWith(".docx") ||
            attachment.name.endsWith(".doc") ||
            attachment.name.endsWith(".txt")
          ) {
            // Add instruction to OCR the document
            imageContext += `This message contains a document attachment (${attachment.name}). Please analyze its contents. `;
          }
        }

        // Add image context to message if needed
        if (hasImageAttachments || imageContext) {
          messageWithContext = `${messageWithContext}\n\n${imageContext}`;
        }

        messages.push({ role: "user", content: messageWithContext });

        const response = await puter.ai.chat(messages, false, {
          model: selectedModel,
        });

        // Remove typing indicator
        typingIndicator.remove();

        // Add AI response to chat
        addMessageToChat("assistant", response.text, chatContainer);

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
        chatContainer
      );
    }
  }

  // Function to generate image using DALL-E
  async function generateImage(prompt) {
    if (!prompt) {
      addMessageToChat(
        "error",
        "Please provide a description for the image you want to generate.",
        chatContainer
      );
      return;
    }

    // Get image generation options
    const imageSize = document.getElementById("image-size").value;
    const imageStyle = document.getElementById("image-style").value;
    const imageQuality = document.getElementById("image-quality").value;
    const imageCount = parseInt(document.getElementById("image-count").value);

    // Create a message container for the AI response
    const aiMessageElement = addMessageToChat("assistant", "", chatContainer);
    aiMessageElement.innerHTML = `
      <div class="image-gen-container">
        <div class="image-gen-status">
          <p>Generating ${imageCount > 1 ? imageCount + " images" : "image"} (${imageSize}, ${imageStyle}, ${imageQuality})...</p>
          <div class="upload-spinner"></div>
          <div class="generation-timer">Estimated time: <span id="countdown">30</span> seconds</div>
        </div>
        <div class="image-gen-preview" style="display: none;"></div>
      </div>
    `;

    // Add countdown
    const countdownElement = aiMessageElement.querySelector("#countdown");
    let timeLeft = 30;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (countdownElement) countdownElement.textContent = timeLeft;
      if (timeLeft <= 0) clearInterval(countdownInterval);
    }, 1000);

    try {
      // Call Puter API for image generation (testing mode)
      // In production, you would use the actual API
      setTimeout(async () => {
        clearInterval(countdownInterval);

        // Simulate generated images
        let imagesHTML = "";

        for (let i = 0; i < imageCount; i++) {
          // In production, use actual API response
          const dummyImageResponse = {
            success: true,
            url: `https://source.unsplash.com/random/${imageSize}/?${encodeURIComponent(prompt)}&sig=${i}`,
          };

          if (dummyImageResponse.success) {
            const imageUrl = dummyImageResponse.url;
            imagesHTML += `
              <div class="generated-image-container">
                <img src="${imageUrl}" alt="Generated image ${i + 1}" class="generated-image">
                <button class="save-image-btn" data-url="${imageUrl}">Save</button>
              </div>
            `;
          }
        }

        // Update the message content with the generated images
        const statusElement =
          aiMessageElement.querySelector(".image-gen-status");
        const previewElement =
          aiMessageElement.querySelector(".image-gen-preview");

        statusElement.style.display = "none";
        previewElement.style.display = "block";

        if (imagesHTML) {
          previewElement.innerHTML = `
            <div class="generated-images-grid">
              ${imagesHTML}
            </div>
            <div class="image-gen-prompt">
              <p><strong>Prompt:</strong> ${prompt}</p>
              <p><strong>Settings:</strong> ${imageSize}, ${imageStyle}, ${imageQuality}</p>
            </div>
          `;

          // Add event listeners to save buttons
          const saveButtons =
            previewElement.querySelectorAll(".save-image-btn");
          saveButtons.forEach((button) => {
            button.addEventListener("click", (e) => {
              const url = e.target.getAttribute("data-url");
              const link = document.createElement("a");
              link.href = url;
              link.download = "generated-image-" + Date.now() + ".png";
              link.click();
            });
          });

          // Make images clickable to view in modal
          const generatedImages =
            previewElement.querySelectorAll(".generated-image");
          generatedImages.forEach((img) => {
            img.addEventListener("click", () => {
              showImageInModal(img.src);
            });
          });

          // Save to chat history
          saveChatMessage("assistant", aiMessageElement.innerHTML);
        } else {
          // Handle error
          previewElement.innerHTML = `
            <p>Sorry, there was an error generating your image(s). Please try again.</p>
          `;
          saveChatMessage("assistant", aiMessageElement.innerHTML);
        }
      }, 3000); // Simulate API delay
    } catch (error) {
      clearInterval(countdownInterval);
      aiMessageElement.innerHTML = `
        <p>Error generating image: ${error.message || "Unknown error"}</p>
      `;
      saveChatMessage("assistant", aiMessageElement.innerHTML);
    }
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

  // Event listeners
  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  fileInput.addEventListener("change", setupAttachmentHandling);

  // Model selection change event
  modelSelector.addEventListener("change", function () {
    const imageGenOptions = document.getElementById("image-gen-options");
    if (this.value === "image-generator") {
      imageGenOptions.style.display = "block";
    } else {
      imageGenOptions.style.display = "none";
    }
  });

  // Initialize chat history
  loadChatHistory(chatContainer);

  // Load saved chat history list
  loadChatHistoryFromStorage(chatHistoryList);

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

  // Initialize voice input and text-to-speech
  micButton.addEventListener("click", toggleVoiceRecording);
  ttsButton.addEventListener("click", toggleTextToSpeech);

  // Load TTS preference
  const savedTtsPreference = localStorage.getItem("tts-enabled");
  if (savedTtsPreference === "true") {
    isTtsEnabled = true;
    ttsButton.classList.add("active");
    ttsButton.title = "Disable text-to-speech";
  }

  // Export global functions to window for event handler access
  window.showImageInModal = showImageInModal;
  window.removeAttachment = removeAttachment;
  window.updateLastAssistantMessage = updateLastAssistantMessage;

  try {
    // Initialize DOM and load settings
    initializeDOM();

    // Initialize all components
    setupEmojiPicker(messageInput);
    const { setupAttachmentHandling, removeAttachment } = setupAttachments(
      currentAttachments,
      attachmentPreview,
      fileInput
    );
    const { speakText, toggleVoiceRecording, toggleTextToSpeech } = setupVoiceAndSpeech(
      micButton,
      ttsButton,
      messageInput,
      isTtsEnabled
    );
    setupSettings();
    setupUtilityBar(
      utilityPopup,
      popupTitle,
      popupBody,
      popupClose,
      popupCancel,
      popupSave,
      activeModelIndicator,
      currentUtilityMode,
      tempAttachments,
      currentAttachments,
      attachmentPreview,
      modal,
      modalImage,
      activeDeepThinkModel,
      knowledgeBase,
      chatHistoryList,
      newChatBtn,
      historyBtn,
      imageUploadBtn,
      fileUploadBtn,
      codeBtn,
      websearchBtn,
      deepthinkBtn,
      knowledgebaseBtn,
      settingsBtn,
      showImageInModal,
      generateChatId,
      currentChatId,
      saveChatToHistory,
      loadChatFromHistory,
      chatContainer,
      messageInput,
      addMessageToChat
    );

    // Load any saved chat history
    loadChatHistory(chatContainer);

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Error initializing application:", error);
  }
});