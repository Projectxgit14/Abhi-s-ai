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

const robotPrompts = [
  "Captain's log: Abhishek is building toward Data Scientist and AI/ML Engineer roles.",
  "I can explain his AI E-Commerce Customer Intelligence Platform.",
  "Ask me why his Python, SQL, Power BI, Tableau, and ML skills matter.",
  "I can guide you through his dashboard and analytics projects.",
  "Privacy rule active: I do not reveal age, phone, salary, address, or private details.",
  "Try asking: what dashboard projects should I see?"
];

let idleSpeakTimer = null;
let idlePromptIndex = 0;

const stopWords = new Set([
  "a", "about", "am", "an", "and", "are", "as", "at", "be", "can", "do", "for",
  "from", "give", "how", "i", "in", "is", "it", "me", "my", "of", "on", "or",
  "should", "tell", "that", "the", "this", "to", "what", "who", "why", "with",
  "you", "your"
]);

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function buildDocuments() {
  const docs = [];

  docs.push({
    id: "about",
    title: "About",
    tags: ["about", "bio", "intro", "who"],
    text: `${profile.name} is ${profile.headline}. ${profile.summary}`
  });

  profile.projects.forEach((project) => {
    docs.push({
      id: `project-${project.name}`,
      title: project.name,
      tags: ["project", "build", "github", "demo", ...project.stack],
      text: `${project.name}: ${project.description} Impact: ${project.impact}. Stack: ${project.stack.join(", ")}. Link: ${project.url || profile.links.github}.`
    });
  });

  docs.push({
    id: "skills",
    title: "Skills",
    tags: ["skills", "tech", "stack", "tools"],
    text: `Core skills: ${profile.skills.join(", ")}. Strengths: ${profile.strengths.join(", ")}.`
  });

  docs.push({
    id: "resume",
    title: "Resume Pitch",
    tags: ["resume", "hire", "recruiter", "pitch", "summary"],
    text: profile.resumePitch
  });

  docs.push({
    id: "contact",
    title: "Contact",
    tags: ["contact", "email", "linkedin", "github", "connect"],
    text: `Email: ${profile.links.email}. GitHub: ${profile.links.github}. LinkedIn: ${profile.links.linkedin}.`
  });

  return docs.map((doc) => ({
    ...doc,
    tokens: tokenize(`${doc.title} ${doc.tags.join(" ")} ${doc.text}`)
  }));
}

const documents = buildDocuments();

function scoreDocument(questionTokens, doc) {
  return questionTokens.reduce((score, token) => {
    const exactMatches = doc.tokens.filter((item) => item === token).length;
    const fuzzyMatches = doc.tokens.some((item) => item.includes(token) || token.includes(item)) ? 0.35 : 0;
    return score + exactMatches + fuzzyMatches;
  }, 0);
}

function findBestSources(question) {
  const tokens = tokenize(question);
  const ranked = documents
    .map((doc) => ({ ...doc, score: scoreDocument(tokens, doc) }))
    .sort((a, b) => b.score - a.score);

  if (!tokens.length || ranked[0].score === 0) {
    return [documents[0], documents.find((doc) => doc.id === "resume")].filter(Boolean);
  }

  return ranked.filter((doc) => doc.score > 0).slice(0, 3);
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function classifyIntent(question) {
  const q = question.toLowerCase();
  const tokens = tokenize(question);
  const tokenSet = new Set(tokens);

  if (["girlfriend", "gf"].some((word) => tokenSet.has(word)) || q.includes("girl friend")) {
    return { name: "cosmic", label: "Cosmic answer", confidence: 0.99 };
  }

  const privateTerms = [
    "age", "birthday", "birth date", "dob", "date of birth", "salary", "income",
    "phone", "mobile", "address", "home address", "family", "father", "mother",
    "relationship", "boyfriend", "password", "private"
  ];

  if (hasAny(q, privateTerms)) return { name: "private", label: "Privacy guarded", confidence: 0.98 };
  if (["hello", "hi", "hey", "namaste"].some((word) => tokenSet.has(word))) return { name: "greeting", label: "Greeting", confidence: 0.9 };
  if (hasAny(q, ["contact", "email", "linkedin", "connect", "reach"])) return { name: "contact", label: "Contact", confidence: 0.96 };
  if (hasAny(q, ["resume", "cv", "recruiter", "hire", "hiring", "summary", "pitch"])) return { name: "resume", label: "Recruiter summary", confidence: 0.93 };
  if (hasAny(q, ["skill", "skills", "stack", "tool", "tools", "technology", "technologies"])) return { name: "skills", label: "Skills", confidence: 0.92 };
  if (hasAny(q, ["dashboard", "power bi", "tableau", "looker", "report", "visualization", "visualisation"])) return { name: "dashboards", label: "Dashboards", confidence: 0.91 };
  if (hasAny(q, ["data scientist", "data science", "ai ml", "ai/ml", "machine learning", "ml engineer", "fit", "career", "goal"])) return { name: "career", label: "Career fit", confidence: 0.88 };
  if (hasAny(q, ["project", "projects", "github", "repo", "repository", "built", "build", "portfolio"])) return { name: "projects", label: "Projects", confidence: 0.9 };
  if (hasAny(q, ["deploy", "host", "website", "pages", "vercel", "netlify"])) return { name: "deploy", label: "Deployment", confidence: 0.86 };
  if (hasAny(q, ["who is", "about", "intro", "background", "profile"])) return { name: "about", label: "About", confidence: 0.84 };

  const bestSources = findBestSources(question);
  const strongMatch = bestSources.some((source) => {
    const sourceTokens = new Set(source.tokens);
    return tokens.filter((token) => sourceTokens.has(token)).length >= 2;
  });

  if (strongMatch && [...tokenSet].length > 1) return { name: "knowledge", label: "Knowledge match", confidence: 0.62 };
  return { name: "unknown", label: "Not in profile", confidence: 0.35 };
}

function findDoc(id) {
  return documents.find((doc) => doc.id === id);
}

function setIntentBadge(intent) {
  if (!els.intentBadge) return;
  els.intentBadge.textContent = intent.label;
}

function speak(text) {
  if (!els.robotSpeech) return;
  const cleanText = String(text).replace(/\s+/g, " ").trim();
  const shortText = cleanText.length > 190 ? `${cleanText.slice(0, 187)}...` : cleanText;
  els.robotSpeech.textContent = shortText;
  if (els.robot) {
    els.robot.classList.add("speaking");
    window.clearTimeout(speak.stopTimer);
    speak.stopTimer = window.setTimeout(() => els.robot.classList.remove("speaking"), 1600);
  }
}

function scheduleIdleSpeech() {
  window.clearTimeout(idleSpeakTimer);
  idleSpeakTimer = window.setTimeout(() => {
    const prompt = robotPrompts[idlePromptIndex % robotPrompts.length];
    idlePromptIndex += 1;
    speak(prompt);
    scheduleIdleSpeech();
  }, 9000);
}

function answerQuestion(question) {
  const intent = classifyIntent(question);
  const sources = findBestSources(question);

  if (intent.name === "private") {
    return {
      intent,
      text: `Sorry, I can't disclose private or personal details that are not part of ${profile.name}'s public profile. I can answer about his skills, public projects, career goals, resume summary, GitHub, LinkedIn, or email.`,
      sources: []
    };
  }

  if (intent.name === "cosmic") {
    return {
      intent,
      text: "Cosmic Glitch is my gf.",
      sources: []
    };
  }

  if (intent.name === "greeting") {
    return {
      intent,
      text: `Hi, I am ${profile.agentName}. I can help you understand ${profile.name}'s data science direction, AI/ML projects, dashboard work, skills, and public contact links.`,
      sources: [findDoc("about")].filter(Boolean)
    };
  }

  if (intent.name === "projects") {
    const projectLines = profile.projects.map((project) => {
      return `${project.name}: ${project.description} Built with ${project.stack.join(", ")}. ${project.impact} ${project.url ? `Repo: ${project.url}` : ""}`;
    });
    return {
      intent,
      text: `Here are the strongest projects to show:\n${formatList(projectLines)}\n\nBest GitHub move: keep this agent as the pinned repo, add screenshots, and link the live demo at the top of the README.`,
      sources
    };
  }

  if (intent.name === "dashboards") {
    const dashboardProjects = profile.projects.filter((project) => {
      const text = `${project.name} ${project.description} ${project.stack.join(" ")}`.toLowerCase();
      return hasAny(text, ["dashboard", "power bi", "tableau", "looker", "analytics", "report"]);
    });

    return {
      intent,
      text: `The strongest dashboard and analytics work is:\n${formatList(dashboardProjects.map((project) => `${project.name}: ${project.description} Repo: ${project.url}`))}\n\nThis supports his Data Scientist path because it shows data cleaning, business analysis, visualization, and insight communication.`,
      sources: dashboardProjects.length ? dashboardProjects.map((project) => documents.find((doc) => doc.title === project.name)).filter(Boolean) : sources
    };
  }

  if (intent.name === "skills") {
    return {
      intent,
      text: `${profile.name}'s current stack is:\n${formatList(profile.skills)}\n\nThe strongest positioning is: ${profile.strengths.join(", ")}.`,
      sources
    };
  }

  if (intent.name === "career") {
    return {
      intent,
      text: `${profile.name} is aiming for Data Scientist and AI/ML Engineer roles. His profile fits that path through Python, SQL, data cleaning, EDA, ML projects, Power BI/Tableau/Looker dashboards, and public portfolio projects like customer intelligence and marketing analytics.\n\nBest positioning: analytics professional with business context from ad intelligence, now building AI/ML and data science projects that turn raw data into decision-ready insights.`,
      sources: [findDoc("about"), findDoc("skills"), findDoc("resume")].filter(Boolean)
    };
  }

  if (intent.name === "resume") {
    return {
      intent,
      text: `${profile.resumePitch}\n\nResume bullet you can use: "Built and deployed a personal AI portfolio agent with grounded retrieval, structured profile data, and a recruiter-friendly chat interface."`,
      sources
    };
  }

  if (intent.name === "contact") {
    return {
      intent,
      text: `You can contact ${profile.name} here:\n- Email: ${profile.links.email}\n- GitHub: ${profile.links.github}\n- LinkedIn: ${profile.links.linkedin}`,
      sources
    };
  }

  if (intent.name === "deploy") {
    return {
      intent,
      text: `Best deployment choice: GitHub Pages for the current static version. It is free, simple, and perfect for a resume link. If you later add a real LLM backend, move to Vercel or Netlify functions so your API key stays private.`,
      sources
    };
  }

  if (intent.name === "about" || intent.name === "knowledge") {
    return {
      intent,
      text: `${sources[0].text}\n\nI only answer from ${profile.name}'s public profile data. Ask about projects, skills, recruiter summary, dashboard work, AI/ML career fit, or contact links for a sharper answer.`,
      sources
    };
  }

  return {
    intent,
    text: `Sorry, I don't have that information in ${profile.name}'s public profile data. I can answer about his data science skills, AI/ML projects, dashboard work, resume summary, GitHub, LinkedIn, or email.`,
    sources: []
  };
}

function addMessage(role, text, sources = [], intent = null) {
  state.messages.push({ role, text, sources, intent });
  renderMessages();
}

function renderMessages() {
  els.chatLog.innerHTML = state.messages
    .map((message) => {
      const sourceHtml = message.sources.length
        ? `<div class="source-row">${message.sources.map((source) => `<span class="source-pill">${source.title}</span>`).join("")}</div>`
        : "";
      const confidenceHtml = message.intent
        ? `<div class="confidence">${escapeHtml(message.intent.label)} · ${Math.round(message.intent.confidence * 100)}% match</div>`
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ask(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;

  addMessage("user", cleanQuestion);
  window.clearTimeout(idleSpeakTimer);
  const response = answerQuestion(cleanQuestion);
  setIntentBadge(response.intent);
  speak("Thinking...");

  window.setTimeout(() => {
    addMessage("agent", response.text, response.sources, response.intent);
    speak(response.text);
    scheduleIdleSpeech();
  }, 220);
}

function renderSuggestions() {
  els.suggestions.innerHTML = profile.suggestedQuestions
    .map((question) => `<button type="button">${escapeHtml(question)}</button>`)
    .join("");

  els.suggestions.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => ask(button.textContent));
  });
}

function resetChat() {
  state.messages = [];
  setIntentBadge({ label: "Ready" });
  speak(`Hi, I am ${profile.agentName}. Ask me about Abhishek's public profile.`);
  scheduleIdleSpeech();
  addMessage(
    "agent",
    `Hi, I am ${profile.agentName}. Ask me about ${profile.name}'s AI/ML projects, dashboard work, data skills, recruiter summary, career fit, or public contact links. If something is private or not in my knowledge base, I will say so.`,
    [documents[0]]
  );
}

function hydrateProfile() {
  document.title = `${profile.agentName} | ${profile.name}`;
  els.role.textContent = profile.role;
  els.focus.textContent = profile.focus;
  els.location.textContent = profile.location;
}

function startCanvas() {
  const canvas = document.querySelector("#signalCanvas");
  const ctx = canvas.getContext("2d");
  const points = Array.from({ length: 74 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0007,
    vy: (Math.random() - 0.5) * 0.0007,
    r: 1 + Math.random() * 2
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);

    points.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < 0 || point.x > 1) point.vx *= -1;
      if (point.y < 0 || point.y > 1) point.vy *= -1;
    });

    points.forEach((point, index) => {
      const x = point.x * width;
      const y = point.y * height;
      ctx.beginPath();
      ctx.arc(x, y, point.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
      ctx.fill();

      for (let i = index + 1; i < points.length; i += 1) {
        const other = points[i];
        const ox = other.x * width;
        const oy = other.y * height;
        const distance = Math.hypot(x - ox, y - oy);
        if (distance < 150) {
          ctx.strokeStyle = `rgba(17, 166, 131, ${0.16 * (1 - distance / 150)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(ox, oy);
          ctx.stroke();
        }
      }
    });

    window.requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  ask(els.input.value);
  els.input.value = "";
});

els.reset.addEventListener("click", resetChat);

if (els.robot) {
  els.robot.addEventListener("click", () => {
    window.clearTimeout(idleSpeakTimer);
    const prompt = robotPrompts[Math.floor(Math.random() * robotPrompts.length)];
    speak(prompt);
    scheduleIdleSpeech();
  });
}

hydrateProfile();
renderSuggestions();
resetChat();
startCanvas();
