
// Settings functionality

export function setupSettings() {
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

  // Apply saved text size
  const savedTextSize = localStorage.getItem("text-size");
  if (savedTextSize) {
    document.documentElement.style.setProperty(
      "--text-size",
      savedTextSize + "px"
    );
  }

  // Apply compact mode if set
  if (localStorage.getItem("compact-mode") === "true") {
    document.body.classList.add("compact-mode");
  }

  // Apply high contrast mode if set
  if (localStorage.getItem("high-contrast") === "true") {
    document.body.classList.add("high-contrast");
  }

  // Apply reduced motion if set
  if (localStorage.getItem("reduced-motion") === "true") {
    document.body.classList.add("reduced-motion");
  }
}

// Function to save settings to local storage
export function saveSettings(settings) {
  Object.keys(settings).forEach(key => {
    localStorage.setItem(key, settings[key]);
  });
}

// Function to load settings from local storage
export function loadSettings() {
  return {
    theme: localStorage.getItem("theme") || "light",
    textSize: localStorage.getItem("text-size") || "16",
    compactMode: localStorage.getItem("compact-mode") === "true",
    notificationSounds: localStorage.getItem("notification-sounds") !== "false",
    autoSaveChats: localStorage.getItem("auto-save-chats") !== "false",
    highContrast: localStorage.getItem("high-contrast") === "true",
    reducedMotion: localStorage.getItem("reduced-motion") === "true",
    defaultModel: localStorage.getItem("default-model") || "gpt-4o-mini",
    temperature: localStorage.getItem("temperature") || "0.7",
    maxTokens: localStorage.getItem("max-tokens") || "2048",
    topP: localStorage.getItem("top-p") || "0.9",
    frequencyPenalty: localStorage.getItem("frequency-penalty") || "0.0",
    presencePenalty: localStorage.getItem("presence-penalty") || "0.0",
    ttsRate: localStorage.getItem("tts-rate") || "1",
    ttsPitch: localStorage.getItem("tts-pitch") || "1",
    autoDeleteHistory: localStorage.getItem("auto-delete-history") === "true",
    systemPrompt: localStorage.getItem("system-prompt") || "",
  };
}

// Function to clear all settings
export function clearAllSettings() {
  localStorage.clear();
}
