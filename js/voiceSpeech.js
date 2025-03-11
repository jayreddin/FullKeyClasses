
// Voice input and text-to-speech functionality

export function setupVoiceAndSpeech(micButton, ttsButton, messageInput, isTtsEnabled) {
  let speechRecognition = null;
  let isRecording = false;
  let synthesis = window.speechSynthesis;

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

  return { speakText, toggleVoiceRecording, toggleTextToSpeech };
}
