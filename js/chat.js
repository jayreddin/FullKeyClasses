
// Chat message handling functions

// Add message to chat UI
export function addMessageToChat(role, content, chatContainer) {
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
        <span class="message-label">You</span>
        <span class="message-timestamp">${timestamp}</span>
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
        document.getElementById("message-input").value = content;
        document.getElementById("message-input").focus();
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
        <span class="message-label">AI</span>
        <span class="message-timestamp">${timestamp}</span>
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
              "Could not find the previous user message to regenerate a response."
            );
            return;
          }

          // Remove the current AI message
          messageElement.classList.add("message-deleting");
          setTimeout(async () => {
            messageElement.remove();

            // Show typing indicator
            const typingIndicator = addTypingIndicator(chatContainer);

            // Generate new response
            try {
              const selectedModel = document.getElementById("model-selector").value;
              const useStream =
                document.getElementById("stream-toggle").checked;
              if (useStream) {
                const messages = await window.getChatHistory();
                // Add the last user message again
                messages.push({ role: "user", content: prevUserMessage });

                // Remove typing indicator
                typingIndicator.remove();

                // Create AI message container
                const aiMessageElement = addMessageToChat("assistant", "", chatContainer);

                // Use streaming API with proper options format
                const resp = await puter.ai.chat(prevUserMessage, {
                  model: selectedModel,
                  stream: true,
                });

                let fullResponse = "";
                for await (const part of resp) {
                  fullResponse += part?.text || "";
                  aiMessageElement.querySelector(
                    ".message-content"
                  ).innerHTML = marked.parse(fullResponse);
                  aiMessageElement.scrollIntoView({ behavior: "smooth" });
                }

                // Update chat history (replace last assistant message)
                window.updateLastAssistantMessage(fullResponse);
              } else {
                const messages = await window.getChatHistory();
                // Add the last user message again
                messages.push({ role: "user", content: prevUserMessage });

                const response = await puter.ai.chat(prevUserMessage, {
                  model: selectedModel,
                });

                // Remove typing indicator if it exists
                if (typingIndicator) typingIndicator.remove();

                // Add AI response to chat
                addMessageToChat("assistant", response.text, chatContainer);

                // Update chat history (replace last assistant message)
                window.updateLastAssistantMessage(response.text);
              }
            } catch (error) {
              // Remove typing indicator
              if (typingIndicator) typingIndicator.remove();

              // Show error message
              addMessageToChat(
                "error",
                `Error: ${error.message || "Something went wrong"}`,
                chatContainer
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
        <span class="message-label">System</span>
        <span class="message-timestamp">${timestamp}</span>
      </div>
      <div class="message-content">${content}</div>
    `;
  }

  chatContainer.appendChild(messageElement);
  messageElement.scrollIntoView({ behavior: "smooth" });
  return messageElement.querySelector(".message-content");
}

// Add typing indicator
export function addTypingIndicator(chatContainer) {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const indicator = document.createElement("div");
  indicator.className = "message assistant-message typing-indicator";
  indicator.innerHTML = `
    <div class="message-header">
      <span class="message-label">AI</span>
      <span class="message-timestamp">${timestamp}</span>
    </div>
    <div class="message-content"><div class="dot-flashing"></div></div>
  `;
  chatContainer.appendChild(indicator);
  indicator.scrollIntoView({ behavior: "smooth" });
  return indicator;
}
