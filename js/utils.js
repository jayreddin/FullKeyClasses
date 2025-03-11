
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
