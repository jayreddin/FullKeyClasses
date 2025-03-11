
// Utility bar functionality for JR AI Chat
import { formatFileSize, readFileAsText, detectCodeLanguage, getModelDisplayName, getModelDescription } from './utils.js';

export function setupUtilityBar(
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
) {
  // Setup popup handling
  popupClose.addEventListener("click", closePopup);
  popupCancel.addEventListener("click", closePopup);

  // New chat button handler
  newChatBtn.addEventListener("click", () => {
    // Save current chat to history if it has messages
    const messages = document.querySelectorAll(".message");
    if (messages.length > 0) {
      saveChatToHistory();
    }

    // Clear the chat interface
    chatContainer.innerHTML = "";
    currentAttachments.length = 0;
    attachmentPreview.innerHTML = "";

    // Generate a new chat ID
    currentChatId = generateChatId();

    // Add welcome message
    addMessageToChat("assistant", "Hello! How can I help you today?", chatContainer);
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
          currentChatId = loadChatFromHistory(chatId, chatHistoryList, chatContainer, currentAttachments, attachmentPreview);
          closePopup();
        });
      });
    }, 0);
  });

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
              window.removeAttachment(index, attachmentElement);
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
              window.removeAttachment(index, attachmentElement);
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

  // Deep Think
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

    setupKnowledgeBase(knowledgeBase);
  });

  function setupKnowledgeBase(knowledgeBase) {
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
          refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
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
            refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
          }
        });

        kbCancelBtn.addEventListener("click", () => {
          refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
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
                refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
              });
          }
        } else if (e.target.closest(".kb-delete-btn")) {
          const button = e.target.closest(".kb-delete-btn");
          const index = button.getAttribute("data-index");

          if (
            confirm("Are you sure you want to delete this knowledge base item?")
          ) {
            knowledgeBase.splice(index, 1);
            refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
          }
        }
      });
    }, 0);
  }

  // Helper function to refresh knowledge base list
  function refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn) {
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
              refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
            }
          });

        document
          .getElementById("kb-cancel-btn")
          .addEventListener("click", () => {
            refreshKnowledgeBaseList(knowledgeBase, kbContent, kbFileInput, kbUploadBtn, kbCreateBtn);
          });
      });
  }

  // Settings button handler is in settings.js
  return { showPopup, closePopup };
}

// Helper function to format time
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

// Helper function to show utility popup
export function showPopup(title, content, saveCallback) {
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  const utilityPopup = document.getElementById("utility-popup");
  const popupSave = document.getElementById("popup-save");
  
  popupTitle.textContent = title;
  popupBody.innerHTML = content;
  utilityPopup.style.display = "flex";

  // Set up the save callback
  popupSave.onclick = () => {
    if (saveCallback) saveCallback();
    closePopup();
  };
}

// Helper function to close utility popup
export function closePopup() {
  const utilityPopup = document.getElementById("utility-popup");
  const popupBody = document.getElementById("popup-body");
  
  utilityPopup.style.display = "none";
  popupBody.innerHTML = "";
}
