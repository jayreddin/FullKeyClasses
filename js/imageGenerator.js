
// Image generator functionality for JR AI Chat

export function setupImageGenerator(
  modelSelector,
  messageInput,
  sendButton,
  imageGenOptions,
  chatContainer,
  addMessageToChat,
  addTypingIndicator
) {
  // Track when the image generator model is selected
  modelSelector.addEventListener("change", () => {
    const isImageGenerator = modelSelector.value === "image-generator";
    imageGenOptions.style.display = isImageGenerator ? "block" : "none";
    
    // Update placeholder text
    if (isImageGenerator) {
      messageInput.placeholder = "Describe the image you want to generate...";
    } else {
      messageInput.placeholder = "Type your message here...";
    }
  });

  // Handle image generation
  async function generateImage() {
    if (modelSelector.value !== "image-generator") return false;
    
    const prompt = messageInput.value.trim();
    if (!prompt) {
      alert("Please enter a description for the image you want to generate");
      return true;
    }
    
    // Get image generation options
    const imageSize = document.getElementById("image-size").value;
    const imageStyle = document.getElementById("image-style").value;
    const imageQuality = document.getElementById("image-quality").value;
    const imageCount = parseInt(document.getElementById("image-count").value);
    
    // Show user message with prompt
    addMessageToChat("user", prompt, chatContainer);
    
    // Clear input
    messageInput.value = "";
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator(chatContainer);
    
    try {
      // Generate images
      const options = {
        model: "dall-e-3",
        prompt: prompt,
        size: imageSize,
        style: imageStyle,
        quality: imageQuality,
        n: imageCount
      };
      
      // Call the Puter AI image generation API
      const response = await puter.ai.generateImage(prompt, options);
      
      // Remove typing indicator
      typingIndicator.remove();
      
      // Create message with generated images
      let messageContent = `Generated ${imageCount} image${imageCount > 1 ? 's' : ''} with prompt: "${prompt}"<br><br>`;
      
      // For demonstration, we'll handle both array responses and single image responses
      if (Array.isArray(response)) {
        messageContent += '<div class="generated-images-grid">';
        response.forEach((img, index) => {
          messageContent += `
            <div class="generated-image-container">
              <img src="${img.url || img}" alt="Generated image ${index + 1}" class="generated-image" data-full-url="${img.url || img}">
            </div>
          `;
        });
        messageContent += '</div>';
      } else {
        const imageUrl = response.url || response;
        messageContent += `
          <div class="generated-image-container">
            <img src="${imageUrl}" alt="Generated image" class="generated-image" data-full-url="${imageUrl}">
          </div>
        `;
      }
      
      // Add to chat
      const messageElement = addMessageToChat("assistant", messageContent, chatContainer);
      
      // Add click event to open images in modal
      setTimeout(() => {
        const images = messageElement.querySelectorAll('img.generated-image');
        images.forEach(img => {
          img.addEventListener('click', () => {
            const modal = document.getElementById("image-modal");
            const modalImg = document.getElementById("modal-image");
            if (modal && modalImg) {
              modalImg.src = img.getAttribute("data-full-url") || img.src;
              modal.style.display = "flex";
            }
          });
        });
      }, 0);
      
    } catch (error) {
      // Remove typing indicator
      typingIndicator.remove();
      
      // Show error message
      addMessageToChat("error", `Failed to generate image: ${error.message || "Unknown error"}`, chatContainer);
    }
    
    return true; // Indicate that we handled the image generation
  }

  // Add the image generation handler to the send button
  const originalOnClick = sendButton.onclick;
  sendButton.onclick = async function() {
    const handled = await generateImage();
    if (!handled && originalOnClick) {
      originalOnClick.call(this);
    }
  };
  
  // Add image modal to document if not already present
  if (!document.getElementById("image-modal")) {
    const imageModal = document.createElement("div");
    imageModal.id = "image-modal";
    imageModal.className = "image-modal";
    imageModal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <img id="modal-image" src="">
      </div>
    `;
    document.body.appendChild(imageModal);
    
    // Close modal when clicking on X or outside the image
    const closeModal = imageModal.querySelector(".close-modal");
    closeModal.addEventListener("click", () => {
      imageModal.style.display = "none";
    });
    
    imageModal.addEventListener("click", (e) => {
      if (e.target === imageModal) {
        imageModal.style.display = "none";
      }
    });
  }
}
