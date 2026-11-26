/* General Lab Review Template
   One repository per lab; one folder per experiment.
   Experiment content is loaded from config.json.
*/
const md = window.markdownit({ html: true, breaks: true });
if (window.texmath && window.katex) {
  md.use(window.texmath, { engine: window.katex, delimiters: "dollars" });
}

const SECTION_FILES = [
  ["Aim", "aim.md"],
  ["Theory", "theory.md"],
  ["Pretest", "pretest.json"],
  ["Procedure", "procedure.md"],
  ["Simulation", "simulation/index.html"],
  ["Posttest", "posttest.json"],
  ["References", "references.md"],
  ["Contributors", "contributors.md"]
];

let appConfig = null;
let activeExperiment = null;
let activeFile = "aim.md";
let loadToken = 0;

const $ = (selector) => document.querySelector(selector);
const preview = $("#preview");

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function showError(message) {
  preview.innerHTML = `<div class="error">${escapeHTML(message)}</div>`;
}

async function loadConfig() {
  const response = await fetch("./config.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load config.json (${response.status})`);
  const config = await response.json();
  if (!config.lab || !Array.isArray(config.experiments)) {
    throw new Error("Invalid config.json: expected lab and experiments.");
  }
  return config;
}

function experimentBasePath(experiment) {
  return `${experiment.path.replace(/\/+$/, "")}/`;
}

function renderExperimentList() {
  const container = $("#experimentList");
  container.replaceChildren();

  const header = document.createElement("div");
  header.className = "experiment-header";
  header.innerHTML = '<div class="experiment-title">🧪 Experiments</div><div class="experiment-arrow" id="experimentArrow">▼</div>';
  header.addEventListener("click", toggleExperiments);

  const list = document.createElement("div");
  list.className = "experiment-container";
  list.id = "experimentContainer";

  const scroll = document.createElement("div");
  scroll.className = "experiment-scroll";

  const enabledExperiments = appConfig.experiments.filter((exp) => exp.enabled !== false);
  enabledExperiments.forEach((experiment) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "experiment-card";
    card.dataset.experimentId = experiment.id;
    card.textContent = experiment.title;
    card.addEventListener("click", () => selectExperiment(experiment.id, true));
    scroll.appendChild(card);
  });

  list.appendChild(scroll);
  container.append(header, list);
}

function setActiveCard(experimentId) {
  document.querySelectorAll(".experiment-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.experimentId === experimentId);
  });
}

function setActiveTab(file) {
  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.file === file;
    tab.classList.toggle("active", active);
    if (active) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  $("#tabsMenu")?.classList.remove("show-tabs");
}

async function selectExperiment(experimentId, updateUrl = false) {
  const experiment = appConfig.experiments.find((item) => item.id === experimentId);
  if (!experiment) return;
  activeExperiment = experiment;
  setActiveCard(experiment.id);
  $(".preview-title").textContent = experiment.title;
  activeFile = "aim.md";
  setActiveTab(activeFile);
  if (updateUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("experiment", experiment.id);
    history.replaceState({}, "", url);
  }
  await loadSection(activeFile);
}

async function loadSection(file) {
  if (!activeExperiment) return;
  activeFile = file;
  setActiveTab(file);
  const token = ++loadToken;
  const url = new URL(`${experimentBasePath(activeExperiment)}${file}`, window.location.href);

  if (file.endsWith(".json")) {
    await loadQuiz(url, token);
  } else if (file.endsWith(".html")) {
    loadSimulation(url);
  } else {
    await loadMarkdown(url, token);
  }
}

async function loadMarkdown(url, token) {
  preview.innerHTML = '<div class="loading">Loading content…</div>';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`File not found (${response.status})`);
    const markdown = await response.text();
    if (token !== loadToken) return;
    preview.innerHTML = md.render(markdown);

    // Resolve relative media and links against the Markdown file, not the lab homepage.
    preview.querySelectorAll("img[src], a[href]").forEach((element) => {
      const attribute = element.tagName === "IMG" ? "src" : "href";
      const raw = element.getAttribute(attribute);
      if (!raw || /^(https?:|mailto:|tel:|data:|#|\/)/i.test(raw)) return;
      element.setAttribute(attribute, new URL(raw, url).href);
      if (element.tagName === "IMG") {
        element.loading = "lazy";
        element.onerror = () => { element.alt = `Image unavailable: ${raw}`; };
      } else {
        element.target = "_blank";
        element.rel = "noopener noreferrer";
      }
    });
  } catch (error) {
    if (token === loadToken) showError(`Unable to load ${url.pathname.split("/").pop()}: ${error.message}`);
  }
}

async function loadQuiz(url, token) {
  preview.innerHTML = '<div class="loading">Loading quiz…</div>';
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`File not found (${response.status})`);
    const data = await response.json();
    if (token !== loadToken) return;
    if (!Array.isArray(data.questions)) throw new Error("Quiz JSON must contain a questions array.");

    const wrapper = document.createElement("div");
    wrapper.className = "quiz-wrapper";
    data.questions.forEach((question, index) => {
      const card = document.createElement("section");
      card.className = "quiz-card";
      const heading = document.createElement("h3");
      heading.textContent = `Question ${index + 1}`;
      const prompt = document.createElement("p");
      prompt.className = "question-text";
      prompt.textContent = question.question || "Question text missing";
      card.append(heading, prompt);

      const options = document.createElement("div");
      options.className = "options";
      Object.entries(question.answers || {}).forEach(([key, value]) => {
        const option = document.createElement("div");
        option.className = `option ${key === question.correctAnswer ? "correct-option" : ""}`;
        option.textContent = `${key}: ${value}`;
        options.appendChild(option);
      });
      card.appendChild(options);

      if (question.explanations && typeof question.explanations === "object") {
        const details = document.createElement("details");
        details.className = "explanation-box";
        const summary = document.createElement("summary");
        summary.textContent = "View explanations";
        details.appendChild(summary);
        Object.entries(question.explanations).forEach(([key, value]) => {
          const explanation = document.createElement("p");
          explanation.textContent = `${key}: ${value}`;
          details.appendChild(explanation);
        });
        card.appendChild(details);
      }
      wrapper.appendChild(card);
    });
    preview.replaceChildren(wrapper);
  } catch (error) {
    if (token === loadToken) showError(`Unable to load quiz: ${error.message}`);
  }
}

function loadSimulation(url) {
  const wrapper = document.createElement("div");
  wrapper.className = "simulation-wrapper";
  const frame = document.createElement("iframe");
  frame.src = url.href;
  frame.className = "simulation-frame";
  frame.title = `${activeExperiment.title} simulation`;
  frame.setAttribute("allowfullscreen", "");
  const toolbar = document.createElement("div");
  toolbar.className = "simulation-toolbar";
  const link = document.createElement("a");
  link.href = url.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open Fullscreen";
  toolbar.appendChild(link);
  wrapper.append(frame, toolbar);
  preview.replaceChildren(wrapper);
}

function toggleMenu() {
  $("#tabsMenu")?.classList.toggle("show-tabs");
}

function toggleExperiments() {
  const container = $("#experimentContainer");
  const arrow = $("#experimentArrow");
  if (!container) return;
  container.classList.toggle("closed");
  if (arrow) arrow.textContent = container.classList.contains("closed") ? "▶" : "▼";
}

function switchTab(event, file) {
  if (event) event.preventDefault();
  loadSection(file);
}

function openModal(type) {
  const overlay = $("#modalOverlay");
  const title = $("#modalTitle");
  const content = $("#modalContent");
  if (!overlay || !title || !content) return;
  title.textContent = type === "developers" ? "Lab Contributors" : "Review Guidelines";
  if (type === "developers") {
    const contributors = appConfig?.lab?.contributors || [];
    content.textContent = contributors.length
      ? contributors.map((person) => `${person.name || ""} – ${person.role || ""}`).join("\n")
      : "Contributor details will be maintained in the experiment's contributors.md file.";
  } else {
    content.innerHTML = "<ul class='guideline-list'><li>Verify theory accuracy</li><li>Validate pretest and posttest questions</li><li>Check simulation behaviour</li><li>Check content formatting and asset loading</li></ul>";
  }
  overlay.classList.add("show");
}

function closeModal() {
  $("#modalOverlay")?.classList.remove("show");
}

document.addEventListener("click", (event) => {
  if (event.target === $("#modalOverlay")) closeModal();
  const tab = event.target.closest(".tab[data-file]");
  if (tab) switchTab(event, tab.dataset.file);
});

window.addEventListener("DOMContentLoaded", async () => {
  try {
    appConfig = await loadConfig();
    $("#labTitle").textContent = appConfig.lab.title || "Virtual Lab";
    document.title = `${appConfig.lab.title || "Virtual Lab"} – Experiment Review`;
    const deployment = $("#deploymentInfo");
    if (deployment) deployment.textContent = "Latest published lab version";
    renderExperimentList();

    const enabled = appConfig.experiments.filter((exp) => exp.enabled !== false);
    if (!enabled.length) {
      showError("No experiments are currently configured for this lab.");
      return;
    }
    const requestedId = new URLSearchParams(window.location.search).get("experiment");
    const initial = enabled.find((exp) => exp.id === requestedId) || enabled[0];
    await selectExperiment(initial.id, false);
  } catch (error) {
    console.error(error);
    showError(`Lab website could not be initialized: ${error.message}`);
  }
});
