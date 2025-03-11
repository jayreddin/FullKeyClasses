
// Attachments handling

export function setupAttachments(currentAttachments, attachmentPreview, fileInput) {
  function setupAttachmentHandling(event) {
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

  function removeAttachment(index, element) {
    currentAttachments[index] = null; // Don't shift array to keep indexes consistent
    element.remove();
  }

  return { setupAttachmentHandling, removeAttachment };
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " bytes";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
