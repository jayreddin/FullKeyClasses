
// Utility helper functions

// Detect code language based on content
export function detectCodeLanguage(code) {
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

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

// Read file as text
export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Get model display name
export function getModelDisplayName(modelId) {
  const modelNames = {
    "deepseek-reasoner": "DeepSeek Reasoner",
    "o3-mini": "O3 Mini",
    "o1-mini": "O1 Mini",
    "claude-3-7-sonnet": "Claude 3.7 Sonnet",
    "gemini-2.0-flash": "Gemini 2.0 Flash",
  };
  return modelNames[modelId] || modelId;
}

// Get model description
export function getModelDescription(modelId) {
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
// Utility functions for the application

// Function to safely get DOM elements with error handling
export function getElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.error(`Element not found: ${selector}`);
  }
  return element;
}

// Function to apply theme
export function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    // Update Prism theme for code blocks
    document.getElementById("prism-theme-dark").disabled = false;
  } else {
    document.body.classList.remove("dark-theme");
    // Update Prism theme for code blocks
    document.getElementById("prism-theme-dark").disabled = true;
  }
}

// Function to apply text size
export function applyTextSize(size) {
  document.documentElement.style.setProperty('--text-size', `${size}px`);
}

// Function to apply compact mode
export function applyCompactMode(isCompact) {
  if (isCompact) {
    document.body.classList.add("compact-mode");
  } else {
    document.body.classList.remove("compact-mode");
  }
}

// Function to initialize DOM elements and load settings
export function initializeDOM() {
  const settings = loadSettings();
  
  // Apply settings
  applyTheme(settings.theme);
  applyTextSize(settings.textSize);
  applyCompactMode(settings.compactMode);
  
  // Set theme toggle state
  const themeToggle = getElement("#theme-toggle");
  if (themeToggle) {
    themeToggle.checked = settings.theme === "dark";
    themeToggle.addEventListener("change", (e) => {
      const newTheme = e.target.checked ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      applyTheme(newTheme);
    });
  }
  
  // Set model selector
  const modelSelector = getElement("#model-selector");
  if (modelSelector) {
    modelSelector.value = settings.defaultModel;
    modelSelector.addEventListener("change", (e) => {
      localStorage.setItem("default-model", e.target.value);
      document.getElementById("active-model-indicator").textContent = `Active: ${e.target.value}`;
      
      // Toggle image generation options visibility
      const isImageGenerator = e.target.value === "image-generator";
      if (document.getElementById("image-gen-options")) {
        document.getElementById("image-gen-options").style.display = isImageGenerator ? "block" : "none";
      }
    });
    
    // Trigger the change event to set initial state
    modelSelector.dispatchEvent(new Event("change"));
  }
}

// Function to format a timestamp
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to create a HTML element with attributes and content
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'classList' && Array.isArray(value)) {
      value.forEach(cls => element.classList.add(cls));
    } else {
      element.setAttribute(key, value);
    }
  }
  
  if (content) {
    element.innerHTML = content;
  }
  
  return element;
}

import { loadSettings } from './settings.js';
