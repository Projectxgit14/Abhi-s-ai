const profile = window.AGENT_PROFILE;
const state = {
  messages: []
};

const els = {
  chatLog: document.querySelector("#chatLog"),
  form: document.querySelector("#chatForm"),
  input: document.querySelector("#questionInput"),
  reset: document.querySelector("#resetChat"),
  suggestions: document.querySelector("#suggestions"),
  intentBadge: document.querySelector("#intentBadge"),
  robot: document.querySelector("#robotAvatar"),
  robotSpeech: document.querySelector("#robotSpeech"),
  role: document.querySelector("#profileRole"),
  focus: document.querySelector("#profileFocus"),
  location: document.querySelector("#profileLocation")
};

// ... rest of your code ...

function formatConfidence(confidence) {
  if (confidence >= 0.95) return "🌟 High confidence";
  if (confidence >= 0.8) return "👍 Good match";
  if (confidence >= 0.5) return "🤔 Possible match";
  return "❓ Low confidence";
}

function renderMessages() {
  els.chatLog.innerHTML = state.messages
    .map((message) => {
      const sourceHtml = message.sources && message.sources.length
        ? `<div class="source-row">${message.sources.map((source) => `<span class="source-pill"><svg width='13' height='13' style='margin-right:2px;' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' fill='#1ed6b6'/><text x='4' y='15' fill='#042f28' font-size='13' font-weight='bold'>AI</text></svg>${source.title}</span>`).join("")}</div>`
        : "";
      const confidenceHtml = message.intent
        ? `<div class="confidence"><strong>${formatConfidence(message.intent.confidence)}</strong> <span>(${escapeHtml(message.intent.label)} &bull; ${Math.round(message.intent.confidence * 100)}% match)</span></div>`
        : "";
      return `
        <div class="message ${message.role}">
          <div class="bubble">${escapeHtml(message.text).replace(/\n/g, "<br>")}</div>
          ${confidenceHtml}
          ${sourceHtml}
        </div>
      `;
    })
    .join("");
  els.chatLog.scrollTop = els.chatLog.scrollHeight;
}

// Optionally, you can add additional AI "reasoning" feedback in answerQuestion()
const origAnswerQuestion = window.answerQuestion || answerQuestion;
window.answerQuestion = function(question) {
  const response = origAnswerQuestion(question);
  // If it's an agent message, add reasoning
  if (response && response.intent && response.sources && response.sources.length) {
    response.text += `\n\n<span style='color:#49ebd2;font-weight:600'>Evidence: Answer based on your structured public profile.</span>`;
  }
  return response;
};

// ... (the rest of your code remains unchanged) ...
