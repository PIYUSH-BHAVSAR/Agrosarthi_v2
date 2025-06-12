document.addEventListener("DOMContentLoaded", () => {
  const chatMessages = document.getElementById("chat-messages");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const micBtn = document.getElementById("mic-btn");
  const ttsToggleBtn = document.getElementById("tts-toggle-btn");
  const voiceIcon = document.getElementById("voice-icon");

  // Clear chat on refresh - use sessionStorage to detect refresh vs navigation
  if (!sessionStorage.getItem("page_loaded_before")) {
    // First load or refresh - clear chat history
    chatMessages.innerHTML = "";
    localStorage.removeItem("agro_chat_history");
    sessionStorage.setItem("page_loaded_before", "true");
  }

  // Stop any speech synthesis on load
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  // Track voice output (TTS) state
  let voiceOutputEnabled = false;

  // Track mic recognition state
  let recognition;
  let isRecognizing = false;

  // Load chat history from memory storage
  let chatHistory = [];
  
  // Load existing chat history from localStorage on page load
  function loadChatHistory() {
    const savedHistory = localStorage.getItem("agro_chat_history");
    if (savedHistory) {
      try {
        chatHistory = JSON.parse(savedHistory);
        // Restore messages to the chat window
        chatHistory.forEach(msg => {
          displayMessage(msg.text, msg.sender, msg.isHTML || false);
        });
      } catch (e) {
        console.error("Error loading chat history:", e);
        chatHistory = [];
      }
    }
  }

  // Save chat history to localStorage
  function saveChatHistory() {
    try {
      localStorage.setItem("agro_chat_history", JSON.stringify(chatHistory));
    } catch (e) {
      console.error("Error saving chat history:", e);
    }
  }

  // Language detection helper
  function detectLanguage(text) {
    const devanagari = /[\u0900-\u097F]/;
    return devanagari.test(text) ? "hi-IN" : "en-IN";
  }

  // Escape HTML to prevent injection
  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));
  }

  // Display message in chat window and save to history
  function displayMessage(text, sender, isHTML = false) {
    const msg = document.createElement("div");
    msg.className = `message ${sender}`;
    msg.innerHTML = isHTML ? text : escapeHTML(text);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to chat history (only if not already loading from history)
    const messageData = {
      text: text,
      sender: sender,
      isHTML: isHTML,
      timestamp: new Date().toISOString()
    };
    
    // Only add to history if it's a new message (not from loading)
    if (!chatHistory.some(msg => 
      msg.text === text && 
      msg.sender === sender && 
      Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp)) < 1000
    )) {
      chatHistory.push(messageData);
      saveChatHistory();
    }
  }

  // Speak bot response aloud ONLY if voiceOutputEnabled is true
  function speakOutLoud(text, lang) {
    if (!voiceOutputEnabled) return;

    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]*>/g, ""));
    utterance.lang = lang;
    synth.speak(utterance);
  }

  // Handle bot reply from API
  async function handleBotReply(text) {
    displayMessage(text, "user");
    const langCode = detectLanguage(text);

    try {
        const lang = getGlobalLanguage(); // Get selected global language

        const res = await fetch("https://agrosarthi-backend-885337506715.asia-south1.run.app/query/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: `${text} [lang=${lang}]` })
        });

        const data = await res.json();
        displayMessage(data.response, "bot", true);
        speakOutLoud(data.response, langCode);
    } catch (err) {
        const fallback = "⚠️ Sorry, could not reach server.";
        displayMessage(fallback, "bot");
        speakOutLoud(fallback, "en-IN");
    }
  }

  // Send user message
  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    userInput.value = "";
    handleBotReply(text);
  }

  sendBtn.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Setup SpeechRecognition for mic input
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "hi-IN"; // Set to Hindi by default
    recognition.continuous = false;
    recognition.interimResults = false;

    // Try to detect and switch language based on user preference
    // You can also set this to "mr-IN" for Marathi
    const preferredLang = localStorage.getItem("preferred_speech_lang") || "hi-IN";
    recognition.lang = preferredLang;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      userInput.value = text;
      sendMessage();
    };

    recognition.onerror = (event) => {
      console.error("Voice input error:", event.error);
      if (event.error === 'no-speech') {
        alert("कोई आवाज़ नहीं सुनी गई। कृपया फिर से कोशिश करें।"); // Hindi: No speech heard
      } else if (event.error === 'audio-capture') {
        alert("माइक्रोफ़ोन एक्सेस की अनुमति दें।"); // Hindi: Allow microphone access
      } else {
        alert("Voice input error: " + event.error);
      }
      stopRecognition();
    };

    recognition.onend = () => {
      isRecognizing = false;
      micBtn.classList.remove("listening");
    };
  }

  // Start voice recognition (mic)
  function startRecognition() {
    if (!recognition) return;
    recognition.start();
    isRecognizing = true;
    micBtn.classList.add("listening");
    // Stop TTS if speaking
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // Stop voice recognition (mic)
  function stopRecognition() {
    if (!recognition) return;
    recognition.stop();
    isRecognizing = false;
    micBtn.classList.remove("listening");
  }

  // Mic button toggles voice recognition
  micBtn.addEventListener("click", () => {
    if (isRecognizing) {
      stopRecognition();
    } else {
      startRecognition();
    }
  });

  // TTS toggle button toggles voice output on/off
  ttsToggleBtn.addEventListener("click", () => {
    voiceOutputEnabled = !voiceOutputEnabled;
    if (voiceOutputEnabled) {
      ttsToggleBtn.classList.add("speaking-enabled");
      voiceIcon.classList.add("active");
      // Speak last bot message if any
      const botMessages = chatMessages.querySelectorAll(".message.bot");
      if (botMessages.length > 0) {
        const lastBotMsg = botMessages[botMessages.length - 1].innerHTML;
        const langCode = detectLanguage(lastBotMsg);
        speakOutLoud(lastBotMsg, langCode);
      }
    } else {
      ttsToggleBtn.classList.remove("speaking-enabled");
      voiceIcon.classList.remove("active");
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  });

  // Function to switch speech recognition language
  window.setSpeechLanguage = function(langCode) {
    if (recognition) {
      recognition.lang = langCode;
      localStorage.setItem("preferred_speech_lang", langCode);
      console.log("Speech recognition language set to:", langCode);
    }
  };

  // Function to toggle between Hindi and Marathi
  window.toggleSpeechLanguage = function() {
    if (recognition) {
      const currentLang = recognition.lang;
      const newLang = currentLang === "hi-IN" ? "mr-IN" : "hi-IN";
      setSpeechLanguage(newLang);
      
      const langName = newLang === "hi-IN" ? "हिंदी" : "मराठी";
      alert(`आवाज़ पहचान की भाषा बदलकर ${langName} कर दी गई है।`);
    }
  };

  // Clear chat history function (optional - can be called manually)
  window.clearChatHistory = function() {
    chatHistory = [];
    chatMessages.innerHTML = "";
    localStorage.removeItem("agro_chat_history");
  };

  // Initialize: Load existing chat history
  loadChatHistory();
});