// Predictive Policing Hub - Application Logic & Excel Parser & Street Overlay

// --- 1. STREET NAVIGATION DEFINITIONS ---
const STREETS = ["Main St", "Broadway", "Pine St", "Market St", "Oak St", "Elm St", "Maple St", "Cedar St", "Hill St", "Valley St", "River Rd", "Harbor Blvd"];
const AVENUES = ["1st Ave", "2nd Ave", "3rd Ave", "4th Ave", "5th Ave", "6th Ave", "7th Ave", "8th Ave", "9th Ave", "10th Ave", "11th Ave", "12th Ave"];

function getIntersectionName(x, y) {
  const s = STREETS[Math.max(0, Math.min(y, STREETS.length - 1))];
  const a = AVENUES[Math.max(0, Math.min(x, AVENUES.length - 1))];
  return `${s} & ${a}`;
}

// Map textual location keywords to grid cells
function resolveGridCoords(locString) {
  const str = locString.toLowerCase();
  let x = -1;
  let y = -1;

  // Search Avenues
  AVENUES.forEach((ave, idx) => {
    if (str.includes(ave.toLowerCase()) || str.includes(`${idx + 1} ave`) || str.includes(`${idx + 1}th ave`) || str.includes(`${idx + 1}rd ave`) || str.includes(`${idx + 1}nd ave`) || str.includes(`${idx + 1}st ave`)) {
      x = idx;
    }
  });

  // Search Streets
  STREETS.forEach((st, idx) => {
    if (str.includes(st.toLowerCase())) {
      y = idx;
    }
  });

  // Deterministic hash fallback if street/ave keywords not found
  if (x === -1 || y === -1) {
    let hash = 0;
    for (let i = 0; i < locString.length; i++) {
      hash = locString.charCodeAt(i) + ((hash << 5) - hash);
    }
    if (x === -1) x = Math.abs(hash) % 12;
    if (y === -1) y = Math.abs(hash >> 4) % 12;
  }

  return { gridX: x, gridY: y };
}

function generate200KaggleSamples() {
  const dataset = [];
  const types = ["Burglary", "Theft", "Assault", "Robbery"];
  
  for (let i = 0; i < 200; i++) {
    let type = "";
    let gridX = 0;
    let gridY = 0;
    let hour = 12;
    
    const roll = Math.random();
    if (roll < 0.35) {
      type = "Burglary";
      gridX = 3 + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      gridY = 1 + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      hour = Math.floor(20 + Math.random() * 7) % 24;
    } else if (roll < 0.70) {
      type = "Theft";
      gridX = 7 + (Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      gridY = 2 + (Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      hour = 12 + Math.floor(Math.random() * 6);
    } else if (roll < 0.85) {
      type = Math.random() > 0.4 ? "Assault" : "Robbery";
      gridX = 8 + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      gridY = 3 + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0);
      hour = Math.floor(22 + Math.random() * 6) % 24;
    } else {
      type = types[Math.floor(Math.random() * types.length)];
      gridX = Math.floor(Math.random() * 12);
      gridY = Math.floor(Math.random() * 12);
      hour = Math.floor(Math.random() * 24);
    }
    
    gridX = Math.max(0, Math.min(gridX, 11));
    gridY = Math.max(0, Math.min(gridY, 11));
    
    const month = Math.random() > 0.5 ? "07" : (Math.random() > 0.3 ? "06" : "08");
    const day = Math.max(1, Math.min(28, Math.floor(1 + Math.random() * 28)));
    const dateStr = `2026-${month}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`;
    
    const location = getIntersectionName(gridX, gridY);
    dataset.push({ type, date: dateStr, location, gridX, gridY });
  }
  
  dataset.sort((a, b) => new Date(a.date) - new Date(b.date));
  return dataset;
}

// --- 2. DATASETS (Kaggle Sample Databases) ---
const KAGGLE_DATASETS = {
  "sf-sample": [
    { type: "Burglary", date: "2026-06-05 02:30", location: "Market St & 5th Ave", gridX: 4, gridY: 3 },
    { type: "Burglary", date: "2026-06-12 04:15", location: "Market St & 4th Ave", gridX: 3, gridY: 3 },
    { type: "Burglary", date: "2026-06-20 03:00", location: "Market St & 5th Ave", gridX: 4, gridY: 3 },
    { type: "Theft", date: "2026-06-25 14:20", location: "Pine St & 8th Ave", gridX: 7, gridY: 2 },
    { type: "Theft", date: "2026-06-28 16:45", location: "Pine St & 7th Ave", gridX: 6, gridY: 2 },
    { type: "Theft", date: "2026-07-02 18:10", location: "Pine St & 8th Ave", gridX: 7, gridY: 2 },
    { type: "Burglary", date: "2026-07-05 01:45", location: "Hill St & 2nd Ave", gridX: 1, gridY: 8 },
    { type: "Burglary", date: "2026-07-10 03:30", location: "Hill St & 2nd Ave", gridX: 1, gridY: 8 },
    { type: "Theft", date: "2026-07-15 15:30", location: "Valley St & 3rd Ave", gridX: 2, gridY: 9 },
    { type: "Theft", date: "2026-07-18 19:15", location: "Valley St & 2nd Ave", gridX: 1, gridY: 9 },
    { type: "Theft", date: "2026-07-22 17:00", location: "Pine St & 8th Ave", gridX: 7, gridY: 2 },
    { type: "Burglary", date: "2026-07-24 04:00", location: "Market St & 6th Ave", gridX: 5, gridY: 3 },
    { type: "Burglary", date: "2026-07-28 02:10", location: "Market St & 5th Ave", gridX: 4, gridY: 3 },
    { type: "Theft", date: "2026-08-01 13:40", location: "Pine St & 7th Ave", gridX: 6, gridY: 2 },
    { type: "Theft", date: "2026-08-03 16:50", location: "Valley St & 3rd Ave", gridX: 2, gridY: 9 },
  ],
  "chicago-sample": [
    { type: "Assault", date: "2026-06-02 22:30", location: "Oak St & 4th Ave", gridX: 3, gridY: 4 },
    { type: "Robbery", date: "2026-06-08 23:15", location: "Oak St & 4th Ave", gridX: 3, gridY: 4 },
    { type: "Assault", date: "2026-06-15 21:00", location: "Cedar St & 2nd Ave", gridX: 1, gridY: 7 },
    { type: "Robbery", date: "2026-06-22 01:20", location: "Cedar St & 2nd Ave", gridX: 1, gridY: 7 },
    { type: "Assault", date: "2026-06-29 20:45", location: "Broadway & 9th Ave", gridX: 8, gridY: 1 },
    { type: "Theft", date: "2026-07-03 12:10", location: "Broadway & 9th Ave", gridX: 8, gridY: 1 },
    { type: "Robbery", date: "2026-07-07 23:45", location: "Oak St & 5th Ave", gridX: 4, gridY: 4 },
    { type: "Assault", date: "2026-07-12 22:30", location: "Oak St & 4th Ave", gridX: 3, gridY: 4 },
    { type: "Assault", date: "2026-07-18 21:30", location: "Cedar St & 1st Ave", gridX: 0, gridY: 7 },
    { type: "Robbery", date: "2026-07-22 02:15", location: "Cedar St & 2nd Ave", gridX: 1, gridY: 7 },
    { type: "Assault", date: "2026-07-26 23:00", location: "Broadway & 10th Ave", gridX: 9, gridY: 1 },
    { type: "Robbery", date: "2026-07-31 01:10", location: "Oak St & 5th Ave", gridX: 4, gridY: 4 },
    { type: "Assault", date: "2026-08-02 20:50", location: "Broadway & 9th Ave", gridX: 8, gridY: 1 },
  ],
  "kaggle-200": generate200KaggleSamples(),
  "traffic-sample": [
    { type: "Speeding Collision", date: "2026-06-03 08:30", location: "Pine St & 5th Ave", gridX: 4, gridY: 2 },
    { type: "Speeding Collision", date: "2026-06-10 09:15", location: "Pine St & 5th Ave", gridX: 4, gridY: 2 },
    { type: "Pedestrian Collision", date: "2026-06-18 17:40", location: "Market St & 8th Ave", gridX: 7, gridY: 3 },
    { type: "Intersection Collision", date: "2026-06-25 12:20", location: "Market St & 9th Ave", gridX: 8, gridY: 3 },
    { type: "Speeding Collision", date: "2026-07-01 07:45", location: "Pine St & 6th Ave", gridX: 5, gridY: 2 },
    { type: "Pedestrian Collision", date: "2026-07-08 19:30", location: "Market St & 8th Ave", gridX: 7, gridY: 3 },
    { type: "Intersection Collision", date: "2026-07-15 14:15", location: "Market St & 9th Ave", gridX: 8, gridY: 3 },
    { type: "Speeding Collision", date: "2026-07-22 08:10", location: "Pine St & 5th Ave", gridX: 4, gridY: 2 },
    { type: "Pedestrian Collision", date: "2026-07-29 18:00", location: "Market St & 8th Ave", gridX: 7, gridY: 3 },
    { type: "Intersection Collision", date: "2026-08-01 11:30", location: "Market St & 9th Ave", gridX: 8, gridY: 3 },
  ],
  "nuisance-sample": [
    { type: "Noise Complaint", date: "2026-06-04 23:30", location: "Valley St & 2nd Ave", gridX: 1, gridY: 9 },
    { type: "Noise Complaint", date: "2026-06-11 23:45", location: "Valley St & 3rd Ave", gridX: 2, gridY: 9 },
    { type: "Vandalism", date: "2026-06-19 01:15", location: "Cedar St & 7th Ave", gridX: 6, gridY: 7 },
    { type: "Public Intoxication", date: "2026-06-26 22:10", location: "Market St & 8th Ave", gridX: 7, gridY: 3 },
    { type: "Noise Complaint", date: "2026-07-02 23:00", location: "Valley St & 3rd Ave", gridX: 2, gridY: 9 },
    { type: "Vandalism", date: "2026-07-09 02:40", location: "Cedar St & 6th Ave", gridX: 5, gridY: 7 },
    { type: "Public Intoxication", date: "2026-07-16 21:45", location: "Market St & 9th Ave", gridX: 8, gridY: 3 },
    { type: "Noise Complaint", date: "2026-07-23 23:15", location: "Valley St & 2nd Ave", gridX: 1, gridY: 9 },
    { type: "Vandalism", date: "2026-07-30 03:00", location: "Cedar St & 7th Ave", gridX: 6, gridY: 7 },
    { type: "Public Intoxication", date: "2026-08-02 22:50", location: "Market St & 8th Ave", gridX: 7, gridY: 3 },
  ],
  "uploaded": []
};

// Target elements
const tabs = document.querySelectorAll(".nav-item");
const sections = document.querySelectorAll(".content-section");

// Slide definitions (All 18 Slides from Session 31: Simple Guide for Non-Techies)
const slides = [
  {
    title: "1. Predictive Analytics for Crime Prevention",
    body: "<strong>Predicting Crime Before It Happens.</strong> A simple guide for law enforcement and beat officers—no coding, no mathematical jargon, just the tools and practical thinking behind proactive policing."
  },
  {
    title: "2. The Big Idea: Reactive vs. Predictive",
    body: "Traditional policing is <em>reactive</em>: a crime is reported, and officers arrive after the damage is done. Predictive policing spots patterns in <strong>PLACES and TIMES</strong> (like weather forecasting) to position patrols <em>before</em> trouble starts. <strong>Crucial Rule:</strong> Never predicts individual people committing a future crime."
  },
  {
    title: "3. The 5-Step Loop & The Feedback Trap",
    body: "Every system follows: <strong>1. Data</strong> ➔ <strong>2. Model</strong> ➔ <strong>3. Forecast</strong> ➔ <strong>4. Action</strong> ➔ <strong>5. Feedback</strong>. <strong>The Danger:</strong> If you only patrol where the computer says, you only find crime there, and the computer wrongly thinks it was 100% right. This is why every beat needs a baseline patrol floor."
  },
  {
    title: "4. Four Things You Can Predict",
    body: "Not all predictions carry equal risk: <strong>1. Places (Hotspots)</strong>: Low risk, highly reliable. <strong>2. Times (Hours/Seasons)</strong>: Low risk, reliable. <strong>3. Victims (Repeat targets)</strong>: Moderate risk, handle carefully. <strong>4. Offenders (Scoring suspects)</strong>: Highest risk of bias, strict oversight required."
  },
  {
    title: "5. Technique 1: Forecasting Trends Over Time",
    body: "Given the historical rhythm, what is likely to happen next month? We use moving averages and seasonal patterns (paydays, festival shopping). Always brief your commander with the <strong>shaded 95% confidence range</strong>, never treat a projection as a guaranteed certainty. Refresh every 4-6 weeks."
  },
  {
    title: "6. Technique 2: Turning Pins into Heatmaps",
    body: "Instead of scattered dots on a paper map, <strong>Kernel Density Estimation (KDE)</strong> blends nearby incidents into smooth zones of danger (brighter = higher concentration). Good to know: A hotspot that moves from month to month is often far more actionable than one that stays fixed."
  },
  {
    title: "7. Technique 3: Risk Terrain (What Makes a Place Risky)",
    body: "Heatmaps show where crime already occurred yesterday. <strong>Risk Terrain Modeling (RTM)</strong> asks: <em>What features of a place attract crime even with zero past history?</em> We stack layers: ATMs, late-night liquor vends, dark unlit alleys, and transit exits. Great for brand new malls and metro corridors!"
  },
  {
    title: "8. Technique 4 (Most Important): Near-Repeat Pattern",
    body: "A proven finding worldwide: after a residential burglary or robbery, the <strong>SAME house</strong> and its <strong>neighbors within 200m</strong> face sharply higher risk for the next <strong>2-4 weeks</strong>. The burglar is familiar with the escape routes and works the same area before moving on. One of the best-evidenced prevention windows available!"
  },
  {
    title: "9. Free Tools You Can Start Using This Week",
    body: "No expensive software licenses required: <strong>1. Excel FORECAST.ETS</strong>: Built-in, forecasts trends in 10 minutes. <strong>2. QGIS</strong>: Free mapping software for heatmaps. <strong>3. CrimeStat</strong>: Free US DOJ tool for crime clustering. <strong>4. Meta Prophet</strong>: Free holiday-aware forecasting."
  },
  {
    title: "10. Walkthrough 1: Forecasting in Excel",
    body: "No coding needed: 1. Arrange dates and incident counts in two spreadsheet columns. 2. Highlight both columns. 3. Go to Data Tab ➔ Click 'Forecast Sheet'. 4. Excel automatically plots the projection with upper and lower 95% confidence bands."
  },
  {
    title: "11. Walkthrough 2: Hotspot Map in QGIS",
    body: "Free software in 5 steps: 1. Import CSV of FIR latitude/longitude. 2. Open Processing Toolbox ➔ Heatmap (KDE). 3. Set radius to 200-300m for urban streets. 4. Style with a color scale (blue to bright red). 5. Overlay your police beat boundaries to check coverage gaps."
  },
  {
    title: "12. Judging a Model: PAI and PEI",
    body: "Is a forecast actually worth patrolling? <strong>PAI (Predictive Accuracy Index):</strong> Does our small flagged zone contain more crime than random chance? (Above 1.0 = effective). <strong>PEI (Prediction Efficiency Index):</strong> How close is our model to theoretical perfection? (Near 1.0 = best possible)."
  },
  {
    title: "13. Four Common Traps to Watch Out For",
    body: "<strong>1. Overfitting:</strong> Memorizing last year's noise; fails on new data. <strong>2. Data Leakage:</strong> Sneaking in info from after the crime (like arrest dates). <strong>3. Feedback Loops:</strong> Patrolling only flagged zones creating self-fulfilling stats. <strong>4. Missing Context:</strong> Forgetting footfall (a busy transit hub always has higher raw counts than a quiet street)."
  },
  {
    title: "14. Real-World Lessons: What Worked & What Backfired",
    body: "<strong>USA PredPol:</strong> Failed because drug arrest data created a racist feedback loop. <strong>Kent UK:</strong> Honest trial showed no benefit for violence; stopped gracefully. <strong>Los Angeles LASER:</strong> Scored individual people as 'chronic offenders'; shut down. <strong>Netherlands CAS:</strong> Excludes demographics by law, ethical board review; successful! <strong>India CCTNS:</strong> Building safeguards from day one."
  },
  {
    title: "15. Taking Action: A Hotspot Map is Not a Patrol Plan",
    body: "Four proven ways to act: <strong>1. Hot Spot Policing (Koper Rule):</strong> Short, frequent 10-15 minute stops with roof lights active. <strong>2. Problem-Oriented Policing (POP):</strong> Fix the broken streetlight or fix the broken gate. <strong>3. Directed Patrol:</strong> Discretion on tactics within the zone. <strong>4. Community Notification:</strong> Warn neighborhood watch without leaking names."
  },
  {
    title: "16. Non-Negotiable Safeguards",
    body: "<strong>1. Human-in-the-Loop:</strong> AI informs briefings; it never auto-dispatches. <strong>2. Bias Testing:</strong> Verify flagged zones don't simply copy old arrest bias. <strong>3. Audit Trail:</strong> Log every forecast and human decision. <strong>4. Right to Explanation:</strong> Explain in plain words why an area was visited. <strong>5. Place, Not Person:</strong> Default to location and time only."
  },
  {
    title: "17. Summary: What to Remember",
    body: "• Predicting places and times is safe and well-evidenced; predicting people is dangerous.<br>• Near-repeat victimization (2-4 weeks, 200m) is your best starting point.<br>• PAI and PEI tell you if a map is worth sending cars to.<br>• Always keep a baseline patrol floor to prevent feedback loops."
  },
  {
    title: "18. Conclusion",
    body: "<em>'The best forecast is the one that changes what happens on the ground tonight—and is honest enough to be checked tomorrow.'</em> Thank you for learning proactive policing!"
  }
];
let currentSlide = 0;

// Multiple Apps State
let activeApp = "crime";
const appConfigs = {
  crime: {
    title: "Crime Predictor Settings",
    dataset: "sf-sample",
    subcategories: ["Burglary", "Theft", "Assault", "Robbery"],
    badgeColor: "var(--color-danger)"
  },
  traffic: {
    title: "Traffic Accident Predictor Settings",
    dataset: "traffic-sample",
    subcategories: ["Speeding Collision", "Pedestrian Collision", "Intersection Collision"],
    badgeColor: "var(--color-warning)"
  },
  nuisance: {
    title: "Public Disorder Predictor Settings",
    dataset: "nuisance-sample",
    subcategories: ["Noise Complaint", "Public Intoxication", "Vandalism"],
    badgeColor: "var(--color-info)"
  }
};

// Live Monitoring State
let liveFeedActive = true;
let liveAlertsToday = 0;
let liveInterval = null;
let activeLiveIncidents = []; // Contains current active logs in monitoring map

// Initialize app elements on DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSlides();
  initDatasets();
  initFileUploader();
  initPredictorSuite();
  initLiveMonitoring();
  initSimulators();
  initPatrolAllocator();
  initSafeguards();
  initAirGapLab();
  initFactorFiles();
});

// --- 2. NAVIGATION SYSTEMS ---
function initTabs() {
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-target");
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      sections.forEach(sec => {
        if (sec.id === target) {
          sec.classList.add("active");
        } else {
          sec.classList.remove("active");
        }
      });
      
      if (target === "predictor-section") {
        updatePredictorDisplay();
      }
      if (target === "live-monitor-section") {
        renderLiveTelemetryMap();
      }
    });
  });
}

function initSlides() {
  const slideTitle = document.getElementById("slide-title");
  const slideBody = document.getElementById("slide-body");
  const prevBtn = document.getElementById("prev-slide-btn");
  const nextBtn = document.getElementById("next-slide-btn");
  const dotsContainer = document.getElementById("slide-dots");

  slides.forEach((_, idx) => {
    const dot = document.createElement("div");
    dot.className = `dot ${idx === 0 ? "active" : ""}`;
    dot.addEventListener("click", () => renderSlide(idx));
    dotsContainer.appendChild(dot);
  });

  function renderSlide(idx) {
    currentSlide = idx;
    slideTitle.innerHTML = slides[idx].title;
    slideBody.innerHTML = slides[idx].body;
    
    const dots = dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot, dIdx) => {
      if (dIdx === idx) dot.classList.add("active");
      else dot.classList.remove("active");
    });
  }

  prevBtn.addEventListener("click", () => {
    let nextIdx = currentSlide - 1;
    if (nextIdx < 0) nextIdx = slides.length - 1;
    renderSlide(nextIdx);
  });

  nextBtn.addEventListener("click", () => {
    let nextIdx = currentSlide + 1;
    if (nextIdx >= slides.length) nextIdx = 0;
    renderSlide(nextIdx);
  });
}

// --- 3. DATA ENGINE (Kaggle Samples & File Ingest) ---
let currentCrimeData = [];

function initDatasets() {
  const datasetSelect = document.getElementById("dataset-select");
  datasetSelect.addEventListener("change", (e) => {
    const val = e.target.value;
    loadPresetData(val);
  });
  loadPresetData("sf-sample");
}

function loadPresetData(presetName) {
  currentCrimeData = [...KAGGLE_DATASETS[presetName]];
  updateDataExplorerTable();
  
  // If user switches active preset, update live predictor base
  // Mapping the active app dataset accordingly if not uploaded
  if (presetName !== "uploaded") {
    if (presetName === "sf-sample" || presetName === "chicago-sample") {
      appConfigs.crime.dataset = presetName;
    } else if (presetName === "traffic-sample") {
      activeApp = "traffic";
      const appBtns = document.querySelectorAll(".app-btn");
      appBtns.forEach(b => b.classList.remove("active"));
      document.getElementById("app-btn-traffic").classList.add("active");
      configurePredictApp("traffic");
    } else if (presetName === "nuisance-sample") {
      activeApp = "nuisance";
      const appBtns = document.querySelectorAll(".app-btn");
      appBtns.forEach(b => b.classList.remove("active"));
      document.getElementById("app-btn-nuisance").classList.add("active");
      configurePredictApp("nuisance");
    }
  } else {
    // If local uploaded database, override crime app targets to point to uploaded
    appConfigs.crime.dataset = "uploaded";
    appConfigs.traffic.dataset = "uploaded";
    appConfigs.nuisance.dataset = "uploaded";
  }
  
  updatePredictorDisplay();
}

function updateDataExplorerTable() {
  const tbody = document.getElementById("dataset-tbody");
  tbody.innerHTML = "";

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  currentCrimeData.forEach(item => {
    const typeLower = item.type.toLowerCase();
    if (typeLower.includes("burglary") || typeLower.includes("assault") || typeLower.includes("robbery") || typeLower.includes("speeding")) {
      highCount++;
    } else if (typeLower.includes("theft") || typeLower.includes("collision") || typeLower.includes("vandalism")) {
      mediumCount++;
    } else {
      lowCount++;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="status-tag ${getCrimeTypeTagClass(item.type)}">${item.type}</span></td>
      <td>${item.date}</td>
      <td><strong>${item.location}</strong></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("data-total-count").innerText = currentCrimeData.length;
  document.getElementById("data-burglary-count").innerText = highCount;
  document.getElementById("data-theft-count").innerText = mediumCount;
  document.getElementById("data-assault-count").innerText = lowCount;
}

function getCrimeTypeTagClass(type) {
  const t = type.toLowerCase();
  if (t.includes("burglary") || t.includes("assault") || t.includes("robbery") || t.includes("speeding")) return "danger";
  if (t.includes("theft") || t.includes("collision") || t.includes("vandalism")) return "warning";
  return "safe";
}

// --- 4. EXCEL / CSV DRAG-DROP INGEST ENGINE ---
function initFileUploader() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const browseBtn = document.getElementById("browse-btn");
  const downloadLink = document.getElementById("download-sample-link");

  browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleUploadedFile(files[0]);
    }
  });

  downloadLink.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadSampleCSV();
  });
}

function downloadSampleCSV() {
  const sampleData = generate200KaggleSamples();
  let csvContent = "Classification,Date,Location\n";
  sampleData.forEach(row => {
    csvContent += `"${row.type}","${row.date}","${row.location}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "crime_precinct_200_samples.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleUploadedFile(file) {
  const uploadStatus = document.getElementById("upload-status");
  uploadStatus.style.display = "block";
  uploadStatus.className = "alert-box info";
  uploadStatus.innerHTML = `⏳ Ingesting and processing ${file.name}...`;

  const reader = new FileReader();
  const fileExtension = file.name.split('.').pop().toLowerCase();

  reader.onload = (e) => {
    try {
      let parsedRows = [];
      
      if (fileExtension === 'csv') {
        const text = e.target.result;
        parsedRows = parseCSVText(text);
      } else {
        // Excel parsing via SheetJS
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        parsedRows = XLSX.utils.sheet_to_json(worksheet);
      }

      if (parsedRows.length > 0) {
        processUploadedRows(parsedRows, file.name);
      } else {
        throw new Error("No readable rows found in file.");
      }
    } catch (err) {
      uploadStatus.className = "alert-box danger";
      uploadStatus.innerHTML = `❌ Error: ${err.message}`;
    }
  };

  if (fileExtension === 'csv') {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

function parseCSVText(text) {
  const lines = text.split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(",");
    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] ? cols[idx].trim() : "";
    });
    rows.push(rowObj);
  }
  return rows;
}

function processUploadedRows(rows, filename) {
  const uploadStatus = document.getElementById("upload-status");
  
  // Find column mapping dynamically
  let typeKey = "";
  let dateKey = "";
  let locKey = "";

  const sampleRow = rows[0];
  const keys = Object.keys(sampleRow);

  keys.forEach(k => {
    const lk = k.toLowerCase();
    if (lk.includes("type") || lk.includes("crime") || lk.includes("incident") || lk.includes("offense") || lk.includes("classification")) {
      typeKey = k;
    }
    if (lk.includes("date") || lk.includes("time") || lk.includes("timestamp")) {
      dateKey = k;
    }
    if (lk.includes("location") || lk.includes("address") || lk.includes("street") || lk.includes("intersection")) {
      locKey = k;
    }
  });

  // Safe defaults if columns aren't found
  typeKey = typeKey || keys[0];
  dateKey = dateKey || keys[1] || keys[0];
  locKey = locKey || keys[2] || keys[0];

  const formattedLogs = [];
  rows.forEach(row => {
    const rawType = row[typeKey] || "Incident";
    const rawDate = row[dateKey] || "2026-08-04 12:00";
    const rawLoc = row[locKey] || "Broadway & 1st Ave";

    const coords = resolveGridCoords(rawLoc);
    // Standardize intersection name format
    const cleanIntersection = getIntersectionName(coords.gridX, coords.gridY);

    formattedLogs.push({
      type: rawType,
      date: rawDate,
      location: cleanIntersection,
      gridX: coords.gridX,
      gridY: coords.gridY
    });
  });

  // Assign to uploaded DB
  KAGGLE_DATASETS["uploaded"] = formattedLogs;
  
  // Update App Config mapping presets to point to uploaded dataset
  appConfigs.crime.dataset = "uploaded";
  appConfigs.traffic.dataset = "uploaded";
  appConfigs.nuisance.dataset = "uploaded";

  // Re-populate custom categories
  const categories = [...new Set(formattedLogs.map(l => l.type))];
  appConfigs.crime.subcategories = categories;

  // Toggle dropdown selection to uploaded
  const select = document.getElementById("dataset-select");
  select.value = "uploaded";

  loadPresetData("uploaded");

  uploadStatus.className = "alert-box success";
  uploadStatus.innerHTML = `✅ Successfully ingested <strong>${formattedLogs.length}</strong> records from <strong>${filename}</strong>! All maps and forecasts have updated automatically.`;
}

// --- 5. PREDICTOR ENGINE (STREET OVERLAYS) ---
let activePredictorTab = "map";

function initPredictorSuite() {
  const runBtn = document.getElementById("run-prediction-btn");
  const tabMapBtn = document.getElementById("pred-tab-map");
  const tabTimeBtn = document.getElementById("pred-tab-time");
  const tabGmapBtn = document.getElementById("pred-tab-gmap");
  const appBtns = document.querySelectorAll(".app-btn");

  appBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      appBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeApp = btn.getAttribute("data-app");
      configurePredictApp(activeApp);
    });
  });

  tabMapBtn.addEventListener("click", () => {
    tabMapBtn.classList.add("active");
    tabTimeBtn.classList.remove("active");
    tabGmapBtn.classList.remove("active");
    document.getElementById("pred-map-panel").classList.add("active");
    document.getElementById("pred-time-panel").classList.remove("active");
    document.getElementById("pred-gmap-panel").classList.remove("active");
    activePredictorTab = "map";
    updatePredictorDisplay();
  });

  tabTimeBtn.addEventListener("click", () => {
    tabTimeBtn.classList.add("active");
    tabMapBtn.classList.remove("active");
    tabGmapBtn.classList.remove("active");
    document.getElementById("pred-time-panel").classList.add("active");
    document.getElementById("pred-map-panel").classList.remove("active");
    document.getElementById("pred-gmap-panel").classList.remove("active");
    activePredictorTab = "time";
    updatePredictorDisplay();
  });

  tabGmapBtn.addEventListener("click", () => {
    tabGmapBtn.classList.add("active");
    tabMapBtn.classList.remove("active");
    tabTimeBtn.classList.remove("active");
    document.getElementById("pred-gmap-panel").classList.add("active");
    document.getElementById("pred-map-panel").classList.remove("active");
    document.getElementById("pred-time-panel").classList.remove("active");
    activePredictorTab = "gmap";
    updatePredictorDisplay();
  });

  runBtn.addEventListener("click", updatePredictorDisplay);
  configurePredictApp("crime");
}

function configurePredictApp(appId) {
  const config = appConfigs[appId];
  document.getElementById("pred-app-title").innerText = config.title;
  
  const catSelect = document.getElementById("predict-crime-type");
  catSelect.innerHTML = `<option value="All">All Categories</option>`;
  config.subcategories.forEach(sub => {
    catSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });

  updatePredictorDisplay();
}

function updatePredictorDisplay() {
  const selectedSub = document.getElementById("predict-crime-type").value;
  const selectedTime = document.getElementById("predict-time").value;

  const activeDataset = appConfigs[activeApp].dataset;
  let filtered = [...KAGGLE_DATASETS[activeDataset]];

  if (selectedSub !== "All") {
    filtered = filtered.filter(item => item.type.toLowerCase() === selectedSub.toLowerCase());
  }

  if (selectedTime !== "All") {
    filtered = filtered.filter(item => {
      const hour = parseInt(item.date.split(" ")[1].split(":")[0]);
      if (selectedTime === "Morning") return hour >= 6 && hour < 12;
      if (selectedTime === "Evening") return hour >= 12 && hour < 20;
      if (selectedTime === "Night") return hour >= 20 || hour < 6;
      return true;
    });
  }

  const kdeRisk = calculateKDEGrid(filtered, 3.2);
  renderPredictiveMap(kdeRisk, filtered);
  updateOperationalTargets(kdeRisk, filtered);
  renderTimeSeriesForecast(filtered);
}

function calculateKDEGrid(data, bandwidth) {
  const size = 12;
  const grid = Array(size).fill(0).map(() => Array(size).fill(0));
  if (data.length === 0) return grid;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let density = 0;
      data.forEach(pt => {
        const dx = x - pt.gridX;
        const dy = y - pt.gridY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= bandwidth) {
          const u = dist / bandwidth;
          const k = (15 / 16) * Math.pow(1 - u * u, 2);
          density += k;
        }
      });
      grid[y][x] = density;
    }
  }

  let maxVal = 0.001;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x] > maxVal) maxVal = grid[y][x];
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[y][x] = grid[y][x] / maxVal;
    }
  }
  return grid;
}

function renderPredictiveMap(riskGrid, filteredIncidents) {
  const mapElement = document.getElementById("predictive-map");
  mapElement.innerHTML = "";

  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      
      const risk = riskGrid[y][x];
      if (risk > 0.7) {
        cell.style.background = `rgba(220, 38, 38, ${risk * 0.8})`;
      } else if (risk > 0.35) {
        cell.style.background = `rgba(217, 119, 6, ${risk * 0.6})`;
      } else if (risk > 0.08) {
        cell.style.background = `rgba(79, 70, 229, ${risk * 0.35})`;
      }
      
      const hasIncident = filteredIncidents.some(i => i.gridX === x && i.gridY === y);
      if (hasIncident) {
        const dot = document.createElement("div");
        dot.className = "cell-incident";
        cell.appendChild(dot);
      }

      // Convert coordinates into human readable intersection string
      const intersection = getIntersectionName(x, y);
      cell.title = `Intersection Area: ${intersection}\nRisk Intensity: ${(risk * 100).toFixed(0)}%`;
      
      cell.addEventListener("click", () => {
        alert(`Block Intersection: ${intersection}\nActive app scope: ${activeApp.toUpperCase()}\nForecasted Risk Level: ${(risk * 100).toFixed(1)}%\nHistorical matches here: ${filteredIncidents.filter(i => i.gridX === x && i.gridY === y).length}`);
        
        // Center Google Map
        const citySuffix = activeApp === "traffic" ? "Seattle" : (activeApp === "nuisance" ? "Boston" : "San Francisco");
        const mapIframe = document.getElementById("google-map-iframe");
        if (mapIframe) {
          mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(intersection + ", " + citySuffix)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }

        // Switch tab to Google Maps view
        const tabGmapBtn = document.getElementById("pred-tab-gmap");
        if (tabGmapBtn) {
          tabGmapBtn.click();
        }
      });

      mapElement.appendChild(cell);
    }
  }
}

function updateOperationalTargets(riskGrid, filtered) {
  let maxRisk = -1;
  let bestX = 0, bestY = 0;
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (riskGrid[y][x] > maxRisk) {
        maxRisk = riskGrid[y][x];
        bestX = x;
        bestY = y;
      }
    }
  }

  // Set best intersection name
  const bestIntersection = getIntersectionName(bestX, bestY);
  document.getElementById("highest-risk-beat-label").innerText = bestIntersection;

  let hourBuckets = Array(24).fill(0);
  filtered.forEach(item => {
    const hr = parseInt(item.date.split(" ")[1].split(":")[0]);
    hourBuckets[hr]++;
  });

  let maxHourCount = -1;
  let peakHour = 18;
  for (let h = 0; h < 24; h++) {
    if (hourBuckets[h] > maxHourCount) {
      maxHourCount = hourBuckets[h];
      peakHour = h;
    }
  }

  const endHour = (peakHour + 2) % 24;
  const pad = (n) => String(n).padStart(2, "0");
  document.getElementById("optimal-time-label").innerText = `${pad(peakHour)}:00 - ${pad(endHour)}:00`;

  // PAI Accuracy Score
  const hotspotThreshold = 0.45;
  let hotspotAreaCount = 0;
  let incidentsInHotspot = 0;
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (riskGrid[y][x] >= hotspotThreshold) {
        hotspotAreaCount++;
        incidentsInHotspot += filtered.filter(i => i.gridX === x && i.gridY === y).length;
      }
    }
  }

  const totalArea = 144;
  const totalIncidents = filtered.length || 1;
  const areaRatio = hotspotAreaCount / totalArea;
  const incidentRatio = incidentsInHotspot / totalIncidents;
  
  let pai = 1.0;
  if (areaRatio > 0) {
    pai = incidentRatio / areaRatio;
  }
  if (filtered.length === 0) pai = 0;
  document.getElementById("pai-score-label").innerText = pai.toFixed(2);

  // Dynamic Briefing Report logic
  const appConfig = appConfigs[activeApp];
  const appNoun = activeApp === "crime" ? "crime incident" : (activeApp === "traffic" ? "traffic collision" : "public disorder report");
  const actionNoun = activeApp === "crime" ? "directed patrols and visibility checks" : (activeApp === "traffic" ? "traffic speed enforcement stops" : "neighborhood disorder sweeps");
  
  let riskLevel = "Normal Baseline";
  let alertBoxClass = "info";
  if (maxRisk > 0.7) {
    riskLevel = "HIGH RISK WARNING";
    alertBoxClass = "danger";
  } else if (maxRisk > 0.35) {
    riskLevel = "ELEVATED RISK ADVISORY";
    alertBoxClass = "warning";
  } else if (filtered.length > 0) {
    riskLevel = "MODERATE RISK BASELINE";
    alertBoxClass = "info";
  }

  let reportHtml = "";
  if (filtered.length === 0) {
    reportHtml = `
      <div class="alert-box info" style="padding: 14px; font-size: 0.9rem; margin-bottom: 0;">
        <strong>📋 No Data Available</strong>
        <p style="margin-top: 8px;">Please load or upload historical records to generate an operational prediction report.</p>
      </div>
    `;
  } else {
    reportHtml = `
      <div class="alert-box ${alertBoxClass}" style="padding: 14px; font-size: 0.88rem; line-height: 1.5; margin-bottom: 0;">
        <strong>⚠️ ${riskLevel}</strong>
        <p style="margin-top: 8px;">
          The system forecasts an <strong>${riskLevel.toLowerCase()}</strong> for <strong>${appNoun}s</strong> at the intersection block of <strong>${bestIntersection}</strong>.
        </p>
        <p style="margin-top: 6px;">
          Peak activity windows are projected during the hours of <strong>${pad(peakHour)}:00 - ${pad(endHour)}:00</strong>.
        </p>
        <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.08); margin: 10px 0;">
        <p style="font-size: 0.82rem; color: var(--color-text-muted);">
          <strong>Officer Recommendation:</strong> Schedule 10-15 minute ${actionNoun} at this node during peak hours. Maintain normal coverage floor in other beats to prevent feedback loop bias.
          <em>(PAI efficiency score: ${pai.toFixed(2)}x)</em>
        </p>
      </div>
    `;
  }
  document.getElementById("briefing-report-content").innerHTML = reportHtml;

  // Google Maps updates
  const citySuffix = activeApp === "traffic" ? "Seattle" : (activeApp === "nuisance" ? "Boston" : "San Francisco");
  const mapIframe = document.getElementById("google-map-iframe");
  if (mapIframe) {
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(bestIntersection + ", " + citySuffix)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    if (mapIframe.src !== mapUrl) {
      mapIframe.src = mapUrl;
    }
  }
}

function renderTimeSeriesForecast(filtered) {
  const svg = document.getElementById("time-series-svg");
  if (!svg) return;
  svg.innerHTML = "";

  const baseVolume = filtered.length;
  const historyData = [];
  let seedValue = Math.max(3, Math.round(baseVolume * 0.7));
  
  for (let m = 1; m <= 12; m++) {
    const noise = (Math.random() - 0.5) * 2;
    const value = Math.max(1, Math.round(seedValue + (m * 0.15) + noise));
    historyData.push(value);
  }

  const alpha = 0.4;
  const beta = 0.2;
  let level = historyData[0];
  let trend = historyData[1] - historyData[0];
  for (let i = 1; i < historyData.length; i++) {
    const lastLevel = level;
    level = alpha * historyData[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const predictions = [];
  const errors = [];
  for (let step = 1; step <= 4; step++) {
    const forecastVal = Math.max(1, level + step * trend);
    predictions.push(forecastVal);
    errors.push(1.1 * Math.sqrt(step));
  }

  const width = svg.clientWidth || 600;
  const height = 350;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const maxVal = Math.max(...historyData, ...predictions.map((p, i) => p + errors[i])) + 2;

  const getX = (index) => paddingLeft + (index / 15) * (width - paddingLeft - paddingRight);
  const getY = (val) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom);

  for (let val = 0; val <= maxVal; val += Math.max(1, Math.round(maxVal / 5))) {
    const yCoord = getY(val);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", yCoord);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", yCoord);
    line.setAttribute("class", "chart-grid-line");
    svg.appendChild(line);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", paddingLeft - 10);
    txt.setAttribute("y", yCoord + 4);
    txt.setAttribute("text-anchor", "end");
    txt.setAttribute("class", "chart-axis-text");
    txt.textContent = Math.round(val);
    svg.appendChild(txt);
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "F1", "F2", "F3", "F4"];
  for (let idx = 0; idx < 16; idx++) {
    const xCoord = getX(idx);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", xCoord);
    label.setAttribute("y", height - paddingBottom + 20);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "chart-axis-text");
    label.textContent = months[idx];
    svg.appendChild(label);
  }

  const upper = [];
  const lower = [];
  predictions.forEach((pred, i) => {
    const idx = 12 + i;
    const err = errors[i];
    upper.push({ x: getX(idx), y: getY(pred + err) });
    lower.unshift({ x: getX(idx), y: getY(Math.max(0, pred - err)) });
  });

  if (upper.length > 0) {
    const connectionPointX = getX(11);
    const connectionPointY = getY(historyData[11]);
    let pathD = `M ${connectionPointX} ${connectionPointY} `;
    upper.forEach(pt => pathD += `L ${pt.x} ${pt.y} `);
    lower.forEach(pt => pathD += `L ${pt.x} ${pt.y} `);
    pathD += "Z";

    const fillArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fillArea.setAttribute("d", pathD);
    fillArea.setAttribute("class", "chart-area-confidence");
    svg.appendChild(fillArea);
  }

  let histD = `M ${getX(0)} ${getY(historyData[0])}`;
  for (let i = 1; i < historyData.length; i++) {
    histD += ` L ${getX(i)} ${getY(historyData[i])}`;
  }
  const histPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  histPath.setAttribute("d", histD);
  histPath.setAttribute("class", "chart-line historical");
  svg.appendChild(histPath);

  let predD = `M ${getX(11)} ${getY(historyData[11])}`;
  predictions.forEach((pred, i) => {
    predD += ` L ${getX(12 + i)} ${getY(pred)}`;
  });
  const predPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  predPath.setAttribute("d", predD);
  predPath.setAttribute("class", "chart-line predicted");
  svg.appendChild(predPath);

  historyData.forEach((val, i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", getX(i));
    dot.setAttribute("cy", getY(val));
    dot.setAttribute("r", 5);
    dot.setAttribute("class", "chart-point");
    svg.appendChild(dot);
  });

  predictions.forEach((val, i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", getX(12 + i));
    dot.setAttribute("cy", getY(val));
    dot.setAttribute("r", 5);
    dot.setAttribute("class", "chart-point forecast");
    svg.appendChild(dot);
  });
}

// --- 6. LIVE MONITORING SYSTEMS ---
function initLiveMonitoring() {
  const toggleBtn = document.getElementById("toggle-live-feed-btn");
  const clearBtn = document.getElementById("clear-live-logs-btn");

  toggleBtn.addEventListener("click", () => {
    liveFeedActive = !liveFeedActive;
    if (liveFeedActive) {
      toggleBtn.innerText = "Pause Telemetry Feed";
      toggleBtn.className = "btn btn-primary";
      startLiveMonitorLoop();
    } else {
      toggleBtn.innerText = "Resume Telemetry Feed";
      toggleBtn.className = "btn btn-outline";
      clearInterval(liveInterval);
    }
  });

  clearBtn.addEventListener("click", () => {
    document.getElementById("dispatch-logs").innerHTML = "";
    activeLiveIncidents = [];
    renderLiveTelemetryMap();
  });

  startLiveMonitorLoop();
  seedInitialLiveLogs();
}

function startLiveMonitorLoop() {
  clearInterval(liveInterval);
  liveInterval = setInterval(() => {
    if (!liveFeedActive) return;
    spawnRandomIncident();
  }, 4000);
}

function seedInitialLiveLogs() {
  const mockIncidents = [
    { type: "Traffic Incident", sectorX: 4, sectorY: 2, desc: "Collision reported at Pine St & 5th Ave." },
    { type: "Emergency Alert", sectorX: 5, sectorY: 8, desc: "Commercial burglary alarm active at River Rd & 6th Ave." },
    { type: "Disorder Report", sectorX: 8, sectorY: 3, desc: "Loud noise complaint at Market St & 9th Ave." }
  ];

  mockIncidents.forEach(inc => {
    const timestamp = getFormattedTime();
    addDispatchLogRow(timestamp, inc.type, inc.sectorX, inc.sectorY, inc.desc);
    activeLiveIncidents.push({ gridX: inc.sectorX, gridY: inc.sectorY, type: inc.type });
  });

  liveAlertsToday = mockIncidents.length;
  document.getElementById("kpi-active-alerts").innerText = liveAlertsToday;
}

function spawnRandomIncident() {
  const incidentPresets = [
    { type: "Emergency Alert", desc: "Reported shoplifting event. Dispatched.", color: "var(--color-danger)" },
    { type: "Emergency Alert", desc: "Burglary alert active. Primary response notified.", color: "var(--color-danger)" },
    { type: "Traffic Incident", desc: "Vehicles collision blocking lane.", color: "var(--color-warning)" },
    { type: "Traffic Incident", desc: "Speeding car reported on road.", color: "var(--color-warning)" },
    { type: "Disorder Report", desc: "Noise complaints reported in area.", color: "var(--color-info)" },
    { type: "Disorder Report", desc: "Graffiti and minor vandalism reported.", color: "var(--color-info)" }
  ];

  const randomIdx = Math.floor(Math.random() * incidentPresets.length);
  const inc = incidentPresets[randomIdx];
  const gridX = Math.floor(Math.random() * 12);
  const gridY = Math.floor(Math.random() * 12);
  const timestamp = getFormattedTime();

  const intersection = getIntersectionName(gridX, gridY);
  addDispatchLogRow(timestamp, inc.type, gridX, gridY, `${inc.desc} Location: ${intersection}`);

  activeLiveIncidents.push({ gridX, gridY, type: inc.type });
  if (activeLiveIncidents.length > 8) {
    activeLiveIncidents.shift();
  }

  renderLiveTelemetryMap();
  liveAlertsToday++;
  document.getElementById("kpi-active-alerts").innerText = liveAlertsToday;
  
  const rLevel = document.getElementById("kpi-risk-level");
  if (liveAlertsToday > 15) {
    rLevel.innerText = "HIGH RISK";
    rLevel.style.color = "var(--color-danger)";
  } else if (liveAlertsToday > 7) {
    rLevel.innerText = "ELEVATED";
    rLevel.style.color = "var(--color-warning)";
  } else {
    rLevel.innerText = "MODERATE";
    rLevel.style.color = "var(--color-success)";
  }
}

function addDispatchLogRow(time, type, x, y, desc) {
  const container = document.getElementById("dispatch-logs");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "dispatch-row";

  let badgeClass = "safe";
  if (type.includes("Emergency")) badgeClass = "danger";
  else if (type.includes("Traffic")) badgeClass = "warning";
  else badgeClass = "safe";

  row.innerHTML = `
    <span class="dispatch-time">${time}</span>
    <span class="status-tag ${badgeClass}">${type}</span>
    <span>${desc}</span>
  `;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function renderLiveTelemetryMap() {
  const mapElement = document.getElementById("live-telemetry-map");
  if (!mapElement) return;
  mapElement.innerHTML = "";

  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";

      const matchedInc = activeLiveIncidents.find(i => i.gridX === x && i.gridY === y);
      if (matchedInc) {
        const marker = document.createElement("div");
        marker.className = "cell-live-dispatch";
        
        let color = "var(--color-info)";
        if (matchedInc.type.includes("Emergency")) color = "var(--color-danger)";
        else if (matchedInc.type.includes("Traffic")) color = "var(--color-warning)";
        
        marker.style.color = color;
        marker.style.background = color;
        cell.appendChild(marker);
      }

      const intersection = getIntersectionName(x, y);
      cell.title = `Live Intersection: ${intersection}\nClick to dispatch patrol.`;
      
      cell.addEventListener("click", () => {
        alert(`Tactical patrol car dispatched to ${intersection}! ETA: 3 minutes.`);
        const time = getFormattedTime();
        addDispatchLogRow(time, "Patrol Response", x, y, `Patrol unit dispatched directly to ${intersection} for tactical presence.`);
      });

      mapElement.appendChild(cell);
    }
  }
}

function getFormattedTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

// --- 7. TECH SIMULATORS ---
function initSimulators() {
  const simTabs = document.querySelectorAll("[data-sim]");
  simTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const selectedSim = btn.getAttribute("data-sim");
      simTabs.forEach(t => t.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".widget-panel").forEach(p => p.classList.remove("active"));
      const targetPanel = document.getElementById(`sim-${selectedSim}-panel`);
      if (targetPanel) targetPanel.classList.add("active");
      
      if (selectedSim === "timeseries") {
        updateSimTimeSeries();
      } else if (selectedSim === "wordcloud") {
        renderHubWordCloud(HUB_WC_KEYWORDS);
      }
    });
  });

  initKDESimulator();
  initNearRepeatSimulator();
  initRTMSimulator();
  initTimeSeriesSimulator();
  initWordCloudSimulator();
}

// KDE Simulator Logic
let kdeIncidents = [];
function initKDESimulator() {
  const mapElement = document.getElementById("kde-grid-map");
  const clearBtn = document.getElementById("clear-kde-btn");

  function renderKDEMap() {
    mapElement.innerHTML = "";
    const risk = calculateKDEGrid(kdeIncidents, 2.5);

    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        
        const density = risk[y][x];
        if (density > 0.05) {
          cell.style.background = `rgba(220, 38, 38, ${density * 0.75})`;
        }
        
        const matches = kdeIncidents.filter(i => i.gridX === x && i.gridY === y);
        if (matches.length > 0) {
          const dot = document.createElement("div");
          dot.className = "cell-incident";
          cell.appendChild(dot);
        }

        const intersection = getIntersectionName(x, y);
        cell.title = `Location: ${intersection}\nDensity: ${(density * 100).toFixed(0)}%`;

        cell.addEventListener("click", () => {
          kdeIncidents.push({ gridX: x, gridY: y });
          renderKDEMap();
        });

        mapElement.appendChild(cell);
      }
    }
  }

  clearBtn.addEventListener("click", () => {
    kdeIncidents = [];
    renderKDEMap();
  });

  kdeIncidents = [
    { gridX: 5, gridY: 5 },
    { gridX: 6, gridY: 5 },
    { gridX: 5, gridY: 6 }
  ];
  renderKDEMap();
}

// Near-Repeat Simulator Logic
let nrIndexBurglary = { gridX: 5, gridY: 5 };
function initNearRepeatSimulator() {
  const mapElement = document.getElementById("nr-grid-map");
  const slider = document.getElementById("nr-weeks-slider");
  const label = document.getElementById("nr-weeks-label");
  const clearBtn = document.getElementById("clear-nr-btn");

  function renderNRMap() {
    const week = parseInt(slider.value);
    label.innerText = week;
    mapElement.innerHTML = "";

    let baseMultiplier = 1.0;
    if (week === 1) baseMultiplier = 9.0;
    else if (week === 2) baseMultiplier = 6.0;
    else if (week === 3) baseMultiplier = 4.0;
    else if (week === 4) baseMultiplier = 2.0;
    else if (week === 5) baseMultiplier = 1.3;
    else baseMultiplier = 1.0;

    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        if (nrIndexBurglary) {
          const dx = x - nrIndexBurglary.gridX;
          const dy = y - nrIndexBurglary.gridY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let cellMultiplier = 1.0;
          if (dist === 0) {
            cellMultiplier = baseMultiplier;
          } else if (dist <= 1.5) {
            cellMultiplier = 1.0 + (baseMultiplier - 1.0) * 0.5;
          } else if (dist <= 2.5) {
            cellMultiplier = 1.0 + (baseMultiplier - 1.0) * 0.2;
          }

          if (cellMultiplier > 4.0) {
            cell.style.background = `rgba(220, 38, 38, ${0.3 + cellMultiplier * 0.05})`;
          } else if (cellMultiplier > 1.5) {
            cell.style.background = `rgba(217, 119, 6, ${0.15 + cellMultiplier * 0.05})`;
          } else if (cellMultiplier > 1.01) {
            cell.style.background = `rgba(79, 70, 229, 0.1)`;
          }

          if (dist === 0) {
            const indexIndicator = document.createElement("div");
            indexIndicator.className = "cell-incident";
            indexIndicator.style.background = "var(--color-accent)";
            cell.appendChild(indexIndicator);
          }
        }

        const intersection = getIntersectionName(x, y);
        cell.title = `Location: ${intersection}`;

        cell.addEventListener("click", () => {
          nrIndexBurglary = { gridX: x, gridY: y };
          renderNRMap();
        });

        mapElement.appendChild(cell);
      }
    }
  }

  slider.addEventListener("input", renderNRMap);
  clearBtn.addEventListener("click", () => {
    nrIndexBurglary = null;
    renderNRMap();
  });

  renderNRMap();
}

// Risk Terrain Modeling (RTM) Simulator Logic
let rtmAttractors = [];
function initRTMSimulator() {
  const mapElement = document.getElementById("rtm-grid-map");
  const selectAttractor = document.getElementById("rtm-attractor-select");
  const clearBtn = document.getElementById("clear-rtm-btn");

  function renderRTMMap() {
    mapElement.innerHTML = "";
    const riskGrid = Array(12).fill(0).map(() => Array(12).fill(0));
    
    rtmAttractors.forEach(att => {
      for (let y = 0; y < 12; y++) {
        for (let x = 0; x < 12; x++) {
          const dx = x - att.gridX;
          const dy = y - att.gridY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= att.radius) {
            const factor = 1 - (dist / att.radius);
            riskGrid[y][x] += att.weight * factor;
          }
        }
      }
    });

    let maxRisk = 0.01;
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        if (riskGrid[y][x] > maxRisk) maxRisk = riskGrid[y][x];
      }
    }

    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";

        const risk = riskGrid[y][x] / maxRisk;
        if (risk > 0.6) {
          cell.style.background = `rgba(220, 38, 38, ${risk * 0.7})`;
        } else if (risk > 0.15) {
          cell.style.background = `rgba(217, 119, 6, ${risk * 0.5})`;
        } else if (risk > 0.01) {
          cell.style.background = `rgba(79, 70, 229, 0.1)`;
        }

        const hasAtt = rtmAttractors.find(a => a.gridX === x && a.gridY === y);
        if (hasAtt) {
          const icon = document.createElement("div");
          icon.className = "cell-attractor";
          if (hasAtt.type === "bar") icon.style.background = "var(--color-danger)";
          else if (hasAtt.type === "atm") icon.style.background = "var(--color-success)";
          cell.appendChild(icon);
        }

        const intersection = getIntersectionName(x, y);
        cell.title = `Location: ${intersection}`;

        cell.addEventListener("click", () => {
          const opt = selectAttractor.value;
          let weight = 4.0;
          let radius = 2.0;
          if (opt === "bar") { weight = 6.0; radius = 2.5; }
          else if (opt === "atm") { weight = 3.0; radius = 1.5; }
          else { weight = 4.0; radius = 3.0; }

          rtmAttractors.push({ gridX: x, gridY: y, type: opt, weight, radius });
          renderRTMMap();
        });

        mapElement.appendChild(cell);
      }
    }
  }

  clearBtn.addEventListener("click", () => {
    rtmAttractors = [];
    renderRTMMap();
  });

  rtmAttractors = [
    { gridX: 3, gridY: 4, type: "bar", weight: 6.0, radius: 2.5 },
    { gridX: 9, gridY: 7, type: "atm", weight: 3.0, radius: 1.5 }
  ];
  renderRTMMap();
}

// Time-Series Simulator Logic
function initTimeSeriesSimulator() {
  const dropdown = document.getElementById("sim-forecast-trend");
  const recalcBtn = document.getElementById("recalculate-forecast-btn");

  recalcBtn.addEventListener("click", () => {
    updateSimTimeSeries();
  });
  dropdown.addEventListener("change", () => {
    updateSimTimeSeries();
  });
}

function updateSimTimeSeries() {
  const trendType = document.getElementById("sim-forecast-trend").value;
  const historyData = [];

  for (let m = 1; m <= 12; m++) {
    let val = 10;
    const noise = (Math.random() - 0.5) * 3;
    if (trendType === "rising") {
      val = 8 + (m * 0.95) + noise;
    } else if (trendType === "falling") {
      val = 16 - (m * 0.8) + noise;
    } else if (trendType === "seasonal") {
      const seasonalFactor = Math.sin((m - 3) * (Math.PI / 3)) * 5;
      val = 11 + seasonalFactor + noise;
    } else {
      val = 12 + noise;
    }
    historyData.push(Math.max(1, Math.round(val)));
  }

  const alpha = 0.45;
  const beta = 0.2;
  let level = historyData[0];
  let trend = historyData[1] - historyData[0];

  for (let i = 1; i < historyData.length; i++) {
    const lastLevel = level;
    level = alpha * historyData[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - lastLevel) + (1 - beta) * trend;
  }

  const predictions = [];
  const standardErrors = [];
  for (let step = 1; step <= 4; step++) {
    const predVal = Math.max(1, level + step * trend);
    predictions.push(predVal);
    standardErrors.push(1.3 * Math.sqrt(step));
  }

  const svg = document.getElementById("sim-timeseries-svg");
  if (!svg) return;
  svg.innerHTML = "";

  const width = svg.clientWidth || 600;
  const height = 350;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const maxVal = Math.max(...historyData, ...predictions.map((p, i) => p + standardErrors[i])) + 2;

  const getX = (index) => paddingLeft + (index / 15) * (width - paddingLeft - paddingRight);
  const getY = (val) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom);

  for (let val = 0; val <= maxVal; val += Math.max(1, Math.round(maxVal / 5))) {
    const yCoord = getY(val);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", paddingLeft);
    line.setAttribute("y1", yCoord);
    line.setAttribute("x2", width - paddingRight);
    line.setAttribute("y2", yCoord);
    line.setAttribute("class", "chart-grid-line");
    svg.appendChild(line);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", paddingLeft - 10);
    txt.setAttribute("y", yCoord + 4);
    txt.setAttribute("text-anchor", "end");
    txt.setAttribute("class", "chart-axis-text");
    txt.textContent = Math.round(val);
    svg.appendChild(txt);
  }

  const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "F1", "F2", "F3", "F4"];
  for (let idx = 0; idx < 16; idx++) {
    const xCoord = getX(idx);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", xCoord);
    txt.setAttribute("y", height - paddingBottom + 20);
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("class", "chart-axis-text");
    txt.textContent = months[idx];
    svg.appendChild(txt);
  }

  const pointsUpper = [];
  const pointsLower = [];
  predictions.forEach((pred, i) => {
    const idx = 12 + i;
    const err = standardErrors[i];
    pointsUpper.push({ x: getX(idx), y: getY(pred + err) });
    pointsLower.unshift({ x: getX(idx), y: getY(Math.max(0, pred - err)) });
  });

  if (pointsUpper.length > 0) {
    const connectionPointX = getX(11);
    const connectionPointY = getY(historyData[11]);
    let pathD = `M ${connectionPointX} ${connectionPointY} `;
    pointsUpper.forEach(pt => pathD += `L ${pt.x} ${pt.y} `);
    pointsLower.forEach(pt => pathD += `L ${pt.x} ${pt.y} `);
    pathD += "Z";

    const fillArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
    fillArea.setAttribute("d", pathD);
    fillArea.setAttribute("class", "chart-area-confidence");
    svg.appendChild(fillArea);
  }

  let histD = `M ${getX(0)} ${getY(historyData[0])}`;
  for (let i = 1; i < historyData.length; i++) {
    histD += ` L ${getX(i)} ${getY(historyData[i])}`;
  }
  const histPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  histPath.setAttribute("d", histD);
  histPath.setAttribute("class", "chart-line historical");
  svg.appendChild(histPath);

  let predD = `M ${getX(11)} ${getY(historyData[11])}`;
  predictions.forEach((pred, i) => {
    predD += ` L ${getX(12 + i)} ${getY(pred)}`;
  });
  const predPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  predPath.setAttribute("d", predD);
  predPath.setAttribute("class", "chart-line predicted");
  svg.appendChild(predPath);

  historyData.forEach((val, i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", getX(i));
    dot.setAttribute("cy", getY(val));
    dot.setAttribute("r", 4.5);
    dot.setAttribute("class", "chart-point");
    svg.appendChild(dot);
  });

  predictions.forEach((val, i) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", getX(12 + i));
    dot.setAttribute("cy", getY(val));
    dot.setAttribute("r", 4.5);
    dot.setAttribute("class", "chart-point forecast");
    svg.appendChild(dot);
  });
}

// --- 7E. MODUS OPERANDI CRIME WORD CLOUD SIMULATOR ---
const HUB_WC_KEYWORDS = [
  { word: "balcony latch", count: 9, cat: "burglary", time: "02:00 - 04:30", area: "Sector 9 & Beat 4", deduction: "9 burglaries where ground/1st-floor sliding balcony latches were pried with a thin pry-tool while residents slept.", tactic: "Issue community alert to install secondary window pins. Post plainclothes night checkpoint at Sector 9 rear access lane at 02:00 AM." },
  { word: "black pulsar", count: 8, cat: "snatching", time: "06:30-08:00 & 19:30-21:00", area: "Station Road & Metro Exit 3", deduction: "Rider duo with obscured number plate targeting commuters looking down at smartphones.", tactic: "Focus ANPR cameras on commuter corridors; stop and inspect black Pulsar riders with tinted visors." },
  { word: "pillion rider", count: 8, cat: "snatching", time: "07:00 - 20:30", area: "Station Rd & Sector 3", deduction: "Pillion passenger leans to grab purse/strap while driver keeps throttle open for instant wrong-way alleyway escape.", tactic: "Deploy two-officer mobile interceptor team on parallel service road during rush hour." },
  { word: "midnight 02:00-04:00", count: 11, cat: "burglary", time: "02:00 - 04:00", area: "Beat 4 Residential", deduction: "Targeting deep circadian sleep trough. Offender times crimes right after routine 01:30 police cruiser pass.", tactic: "Stagger patrol shifts to unpredictable random intervals between 02:15 and 04:00." },
  { word: "unlit alley", count: 8, cat: "burglary", time: "01:30 - 04:30", area: "Sector 9 Perimeter", deduction: "Burglars use defective municipal lighting along rear boundary walls as concealment and escape routes.", tactic: "Send urgent lighting requisition to municipal ward officer; place temporary mobile solar floodlight." },
  { word: "electricity bill SMS", count: 7, cat: "cyber", time: "11:00 - 16:00", area: "City-wide / Senior Citizens", deduction: "Phishing SMS warning power cutoff tonight at 9:30 PM due to unpaid bill; directs victim to fake helpline.", tactic: "Issue cyber safety warning on official police handle; submit rogue SMS sender headers to telecom fraud portal." },
  { word: "OTP prompt", count: 9, cat: "cyber", time: "10:00 - 18:00", area: "Digital / Banking", deduction: "Social engineering caller impersonates bank fraud desk while prompting victim for incoming authorization OTP.", tactic: "Advise senior citizens clubs; liaise with bank branches to place prominent counter warnings 'No Bank Asks For OTP'." },
  { word: "tinted helmet", count: 7, cat: "snatching", time: "06:30 - 21:00", area: "Metro Corridor", deduction: "Both rider and pillion wear dark tinted visors to defeat municipal facial recognition CCTV cameras.", tactic: "Review entry toll cameras 15 minutes before incidents to catch riders with helmets off." },
  { word: "handle lock break", count: 6, cat: "autotheft", time: "21:00 - 05:00", area: "Metro Parking & Sector 4", deduction: "Forceful kick against handlebar snaps internal pin lock; ignition hotwired in under 45 seconds.", tactic: "Mandate perimeter gate security logging at open parking; encourage citizens to use disk locks." },
  { word: "ground floor window", count: 7, cat: "burglary", time: "02:30 - 04:30", area: "Sector 9", deduction: "Window grilles with rusted external screws removed quietly using cordless screwdrivers.", tactic: "Advise resident welfare association on internal weld reinforcements." },
  { word: "remote screen APK", count: 5, cat: "cyber", time: "12:00 - 17:00", area: "Digital", deduction: "Victim instructed to install utility update APK which grants remote screen-sharing and OTP snooping.", tactic: "Trigger immediate I4C (1930) portal dispute to block recipient mule account within the Golden Hour." },
  { word: "morning jogger", count: 5, cat: "snatching", time: "05:30 - 07:15", area: "Central Park Outer Ring", deduction: "Pedestrians exercising alone with exposed earphones or gold chains targeted in morning twilight.", tactic: "Position visible beat officer on foot near Central Park Gate 2 between 05:30 and 07:30." },
  { word: "crowbar", count: 6, cat: "burglary", time: "01:00 - 03:30", area: "Commercial Market Beat 2", deduction: "Heavy roll-down shutter center padlocks sheared off in commercial electronics shops.", tactic: "Coordinate with market night chowkidars; verify roll-down alarm sensors." },
  { word: "crossbody bag", count: 6, cat: "snatching", time: "18:00 - 21:00", area: "Market Gate 2", deduction: "Snatchers approach from behind on one-way lanes and forcefully yank straps, risking injury.", tactic: "Install high-visibility police barricades to slow down motorcycles entering pedestrian market lanes." },
  { word: "mule account", count: 6, cat: "cyber", time: "Anytime", area: "Banking Channels", deduction: "Stolen funds routed through newly opened current accounts in regional rural banks within 8 minutes.", tactic: "Request bank nodal officer for fast-track lien placement under Sec 91 CrPC / BNSS." },
  { word: "no CCTV", count: 9, cat: "burglary", time: "02:00 - 05:00", area: "Sector 9 Backlanes", deduction: "Culprits conduct daytime reconnaissance to map blind spots between private residential camera cones.", tactic: "Map community CCTV coverage; ask homeowners to angle one camera towards public alley." },
  { word: "master key", count: 5, cat: "autotheft", time: "13:00 - 17:00", area: "Civil Hospital Parking", deduction: "Worn master keys used to unlock older commuter bike models without setting off vibration alarms.", tactic: "Deploy civil defense volunteer at hospital parking gate to check vehicle registration tokens." },
  { word: "ECM bypass", count: 4, cat: "autotheft", time: "01:00 - 04:00", area: "Sector 5 Residential", deduction: "Electronic control module reprogrammer plugged into OBD port to duplicate key signals on SUVs.", tactic: "Patrol officers inspect stationary vehicles with broken quarter-glass during night rounds." },
  { word: "fake KYC", count: 6, cat: "cyber", time: "10:00 - 16:00", area: "Digital", deduction: "Phishing links warning SIM card deactivation unless immediate biometric KYC update is submitted.", tactic: "Run public cyber awareness campaign across local resident WhatsApp groups." },
  { word: "cut strap", count: 4, cat: "snatching", time: "19:00 - 21:00", area: "Metro Exit 3", deduction: "Small box cutter used by pillion rider to sever shoulder strap if victim holds on.", tactic: "Issue advisory warning pedestrians not to walk along roadway shoulders carrying bags on the traffic side." },
  { word: "cash counter", count: 4, cat: "burglary", time: "02:00 - 03:30", area: "Commercial Market", deduction: "Commercial burglaries where only liquid cash was looted, leaving heavy goods untouched.", tactic: "Advise merchants to empty cash tills nightly into drop-safes." },
  { word: "lock broken", count: 7, cat: "burglary", time: "01:30 - 04:00", area: "Sector 9", deduction: "Brass padlocks twisted off using iron pipe lever; indicates non-professional local opportunistic crew.", tactic: "Verify recently released property offenders residing within a 3km radius." },
  { word: "unattended scooter", count: 5, cat: "autotheft", time: "18:00 - 21:30", area: "Vegetable Market", deduction: "Scooters left running or with key in ignition while shoppers buy groceries.", tactic: "PA system announcements reminding shoppers to remove keys and lock vehicles." },
  { word: "pillion escape", count: 5, cat: "snatching", time: "19:30 - 21:30", area: "Station Road", deduction: "Rider weaves against oncoming traffic making pursuit by larger patrol four-wheelers impossible.", tactic: "Utilize two-wheeler Cheetah patrol units equipped with dashcams." }
];

const HUB_WC_CASES = [
  { id: "FIR-2024-101", date: "14 Oct 03:15", type: "Burglary", area: "Sector 9 (Beat 4)", text: "Complainant reported forced entry via balcony latch using thin wedge. Target was ground floor window facing unlit alley with no CCTV. Cash and jewelry taken during midnight 02:00-04:00.", keywords: ["balcony latch", "midnight 02:00-04:00", "unlit alley", "ground floor window", "no CCTV", "cash counter"] },
  { id: "FIR-2024-104", date: "17 Oct 02:45", type: "Burglary", area: "Sector 9 (Beat 4)", text: "Second incident in same block. Balcony latch pried open quietly, sliding window lifted. Midnight 02:00-04:00 hours. No CCTV coverage. Master bedroom ransacked, lock broken.", keywords: ["balcony latch", "midnight 02:00-04:00", "no CCTV", "lock broken", "ground floor window"] },
  { id: "FIR-2024-109", date: "21 Oct 03:30", type: "Burglary", area: "Sector 9 (Beat 4)", text: "Balcony latch on 1st floor climbed via drainpipe. Unlit alley escape path. Lock broken with crowbar marks. Occurred during midnight 02:00-04:00 window.", keywords: ["balcony latch", "unlit alley", "lock broken", "crowbar", "midnight 02:00-04:00"] },
  { id: "FIR-2024-112", date: "15 Oct 07:15", type: "Snatching", area: "Station Road", text: "Complainant morning jogger intercepted by black pulsar. Pillion rider wearing tinted helmet snatched gold chain. Motorcycle escaped towards highway.", keywords: ["black pulsar", "pillion rider", "tinted helmet", "morning jogger", "pillion escape"] },
  { id: "FIR-2024-116", date: "18 Oct 19:40", type: "Snatching", area: "Metro Exit 3", text: "Victim walking towards bus stand. Two suspects on black pulsar approached. Pillion rider grabbed crossbody bag with cut strap. Tinted helmet obscured faces.", keywords: ["black pulsar", "pillion rider", "tinted helmet", "crossbody bag", "cut strap", "pillion escape"] },
  { id: "FIR-2024-119", date: "22 Oct 06:50", type: "Snatching", area: "Central Park Outer Ring", text: "Morning jogger phone snatched by pillion rider on black pulsar. Suspects wore tinted helmet. Escaped against traffic on one-way stretch.", keywords: ["black pulsar", "pillion rider", "morning jogger", "tinted helmet", "pillion escape"] },
  { id: "FIR-2024-122", date: "16 Oct 14:10", type: "Cyber Fraud", area: "City-wide / Digital", text: "Victim received electricity bill SMS claiming midnight disconnection. Tricked into calling spoofed helpline and providing OTP prompt. Rs 85,000 transferred to mule account.", keywords: ["electricity bill SMS", "OTP prompt", "mule account", "fake KYC"] },
  { id: "FIR-2024-125", date: "19 Oct 11:30", type: "Cyber Fraud", area: "Digital", text: "Complainant targeted via fake KYC warning. Convinced to install remote screen APK to update bank credentials. Fraudsters captured OTP prompt and siphoned savings.", keywords: ["fake KYC", "remote screen APK", "OTP prompt", "mule account"] },
  { id: "FIR-2024-128", date: "20 Oct 23:45", type: "Auto Theft", area: "Metro Parking (Beat 2)", text: "Motorcycle stolen from dark corner of metro parking. Handle lock break evident from broken metal fragments. No CCTV coverage in blind spot.", keywords: ["handle lock break", "no CCTV", "master key", "unattended scooter"] }
];

let activeHubWord = "balcony latch";

function initWordCloudSimulator() {
  const filterChips = document.querySelectorAll("#hub-wc-filter-chips button");
  filterChips.forEach(btn => {
    btn.addEventListener("click", () => {
      filterChips.forEach(b => {
        b.className = "btn btn-sm btn-outline";
      });
      btn.className = "btn btn-sm btn-primary";
      const cat = btn.getAttribute("data-hub-cat");
      const filtered = cat === "all" ? HUB_WC_KEYWORDS : HUB_WC_KEYWORDS.filter(k => k.cat === cat);
      renderHubWordCloud(filtered);
      if (filtered.length > 0) selectHubWord(filtered[0].word);
    });
  });

  renderHubWordCloud(HUB_WC_KEYWORDS);
  selectHubWord("balcony latch");
}

function renderHubWordCloud(items) {
  const container = document.getElementById("hub-wc-cloud");
  if (!container) return;
  container.innerHTML = "";

  const minCount = Math.min(...items.map(i => i.count));
  const maxCount = Math.max(...items.map(i => i.count));

  items.forEach(item => {
    const norm = maxCount === minCount ? 0.5 : (item.count - minCount) / (maxCount - minCount);
    const fontSize = 13 + Math.round(norm * 18);

    const tag = document.createElement("div");
    tag.className = `wc-hub-tag wc-hub-${item.cat || 'burglary'} ${item.word === activeHubWord ? 'active' : ''}`;
    tag.style.fontSize = `${fontSize}px`;
    tag.innerHTML = `<span>${item.word}</span><span class="wc-count">${item.count}</span>`;

    tag.addEventListener("click", () => selectHubWord(item.word));
    container.appendChild(tag);
  });
}

function selectHubWord(word) {
  activeHubWord = word;

  document.querySelectorAll(".wc-hub-tag").forEach(el => {
    el.classList.toggle("active", el.querySelector("span").textContent.trim() === word);
  });

  const item = HUB_WC_KEYWORDS.find(k => k.word.toLowerCase() === word.toLowerCase()) || {
    word: word, count: 5, cat: "burglary", time: "Night Shift", area: "Sector 9",
    deduction: `Recurring tactical pattern '${word}' detected across recent beat incidents.`,
    tactic: "Increase foot patrol presence and check CCTV cameras covering the target area."
  };

  const wordTitle = document.getElementById("hub-wc-word-title");
  const freqBadge = document.getElementById("hub-wc-freq-badge");
  const catBadge = document.getElementById("hub-wc-cat-badge");
  const deduction = document.getElementById("hub-wc-deduction");
  const tactic = document.getElementById("hub-wc-tactic");
  const profile = document.getElementById("hub-wc-profile");

  if (wordTitle) wordTitle.textContent = item.word;
  if (freqBadge) freqBadge.textContent = `${item.count} Mentions`;
  if (catBadge) {
    catBadge.textContent = item.cat.toUpperCase();
    catBadge.className = `file-factor-badge wc-hub-${item.cat}`;
  }
  if (deduction) deduction.textContent = item.deduction;
  if (tactic) tactic.textContent = item.tactic;
  if (profile) profile.textContent = `${item.time} | ${item.area}`;

  const matchingCases = HUB_WC_CASES.filter(c =>
    c.keywords.some(k => k.toLowerCase() === word.toLowerCase()) ||
    c.text.toLowerCase().includes(word.toLowerCase())
  );

  const casesList = document.getElementById("hub-wc-cases-list");
  const matchCount = document.getElementById("hub-wc-matched-count");
  if (matchCount) matchCount.textContent = matchingCases.length;

  if (casesList) {
    casesList.innerHTML = "";
    if (matchingCases.length === 0) {
      casesList.innerHTML = `<p style="font-size:0.88rem;color:var(--color-text-muted);margin:8px 0;">No pre-indexed cases found for this specific term. Try 'balcony latch' or 'black pulsar'.</p>`;
    } else {
      matchingCases.forEach(c => {
        const card = document.createElement("div");
        card.className = "wc-hub-case-item";
        const reg = new RegExp(`(${word})`, "gi");
        const highlightedText = c.text.replace(reg, `<span class="wc-hub-highlight">$1</span>`);
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:0.8rem">
            <strong style="color:var(--color-primary)">${c.id}</strong> · <span>${c.date}</span> · <span class="file-factor-badge" style="background:#f1f5f9;color:#334155">${c.area}</span>
          </div>
          <div style="line-height:1.45;color:var(--color-text);font-size:0.88rem;">${highlightedText}</div>
        `;
        casesList.appendChild(card);
      });
    }
  }
}

// --- 8. PATROL ALLOCATOR GAME ---
function initPatrolAllocator() {
  const sliders = document.querySelectorAll(".allocator-slider");
  sliders.forEach(slider => {
    slider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      let totalAllocated = 0;
      sliders.forEach(s => totalAllocated += parseInt(s.value));
      
      if (totalAllocated > 10) {
        const overflow = totalAllocated - 10;
        e.target.value = Math.max(0, val - overflow);
      }
      updateAllocationDashboard();
    });
  });
  updateAllocationDashboard();
}

function updateAllocationDashboard() {
  const sliders = document.querySelectorAll(".allocator-slider");
  let totalAllocated = 0;
  let hasZeroPatrol = false;

  sliders.forEach(s => {
    const beat = s.getAttribute("data-beat");
    const val = parseInt(s.value);
    totalAllocated += val;

    document.getElementById(`val-beat-${beat}`).innerText = val;

    const statusTag = document.getElementById(`status-beat-${beat}`);
    if (val === 0) {
      statusTag.innerText = "Unpatrolled (Bias Risk)";
      statusTag.className = "status-tag danger";
      hasZeroPatrol = true;
    } else if (val <= 2) {
      statusTag.innerText = "Minimum Coverage Floor";
      statusTag.className = "status-tag safe";
    } else {
      statusTag.innerText = "Active Target Presence";
      statusTag.className = "status-tag safe";
    }
  });

  document.getElementById("allocated-count").innerText = totalAllocated;

  const verdictText = document.getElementById("allocator-verdict");
  const warningBox = document.getElementById("feedback-warning-box");
  const praiseBox = document.getElementById("allocator-praise-box");

  if (totalAllocated < 10) {
    verdictText.innerText = `Deploy Remaining Units (${10 - totalAllocated} idle cars)`;
    verdictText.style.color = "var(--color-warning)";
    warningBox.style.display = "block";
    praiseBox.style.display = "none";
  } else {
    if (hasZeroPatrol) {
      verdictText.innerText = "⚠️ Deployment has Blind Spots!";
      verdictText.style.color = "var(--color-danger)";
      warningBox.style.display = "block";
      praiseBox.style.display = "none";
    } else {
      verdictText.innerText = "✅ Deployed Safe Patrol Floor";
      verdictText.style.color = "var(--color-success)";
      warningBox.style.display = "none";
      praiseBox.style.display = "block";
    }
  }
}

// --- 9. SAFEGUARDS CHECKLIST ---
function initSafeguards() {
  const checkboxes = document.querySelectorAll(".checklist-box");
  checkboxes.forEach(box => {
    box.addEventListener("click", () => {
      box.classList.toggle("checked");
    });
  });
}

// --- 10. AIR-GAPPED POLICE AI & LOCAL MODEL PRACTICE LAB ---
let currentAirgapStep = 1;
let selectedAirgapModel = "llama";
let currentScenario = "burglary";

const scenarioData = {
  burglary: {
    id: "FIR-2026/089",
    type: "Burglary / Residential Break-In",
    locationName: "Sector 4, Green Palms",
    grid: "D4",
    timeWindow: "Friday 22:30 - 00:30",
    raw: `Complainant <span class="pii-highlight">Shri Ramesh Gupta</span>, S/o Late O.P. Gupta, residing at <span class="pii-highlight">Flat 304, Green Palms Apt, Sector 4</span>. Mobile: <span class="pii-highlight">98112-44591</span>. States that on 24-Oct night at approximately 23:00 while family was away, unknown suspects broke balcony grill latch and stole gold ornaments worth ₹2,00,000.`,
    cleaned: (level) => {
      if (level === 1) {
        return `Complainant: <span class="token-highlight">[PROTECTED_CITIZEN_01]</span><br>Address: Sector 4, Green Palms Apt<br>Crime: Burglary<br>Time: 23:00 Friday<br>MO: Balcony grill latch forced`;
      } else if (level === 2) {
        return `Complainant: <span class="token-highlight">[PROTECTED_CITIZEN_01]</span><br>Spatial Coordinate: <span class="token-highlight">Sector 4, Grid [D4]</span><br>Incident Type: <span class="token-highlight">Burglary / Break-In</span><br>Time Window: <span class="token-highlight">Friday 22:30 - 00:00</span><br>Modus Operandi: <span class="token-highlight">Balcony grill forced latch</span><br>Property Class: <span class="token-highlight">High-Value Residential</span>`;
      } else {
        return `ID: <span class="token-highlight">[TOKEN_9941]</span><br>Zone: <span class="token-highlight">Zone-4-West</span><br>Classification: <span class="token-highlight">Property Unoccupied</span><br>Time Bin: <span class="token-highlight">Night Q4</span><br>Contagion Code: <span class="token-highlight">NR-14</span>`;
      }
    },
    briefing: {
      where: "Sector 4, Green Palms Lane",
      when: "22:30 - 00:30 (Peak)",
      tactic: "12-Min Stop (Koper Rule)",
      radius: "200m Perimeter",
      publicText: "Officers are conducting brief high-visibility deterrence stops on Green Palms Lane because a residential break-in occurred nearby 3 days ago. Criminology shows neighboring homes face heightened risk for 14 days while the offender remains active."
    }
  },
  snatching: {
    id: "FIR-2026/104",
    type: "Purse Snatching / Street Robbery",
    locationName: "Metro North Exit Plaza",
    grid: "D5",
    timeWindow: "Friday 20:00 - 21:30",
    raw: `Victim <span class="pii-highlight">Sunita Kumari</span>, age 24, mobile <span class="pii-highlight">99554-12345</span>, walking near <span class="pii-highlight">Metro Gate 2 towards H-Block</span>. Two youths on black motorcycle snatched purse containing iPhone 15 and cash ₹5,000 at 20:15.`,
    cleaned: (level) => {
      if (level === 1) {
        return `Victim: <span class="token-highlight">[PROTECTED_CITIZEN_02]</span><br>Location: Metro Gate 2<br>Crime: Purse Snatching<br>Time: 20:15 Friday<br>MO: 2 youths on motorbike`;
      } else if (level === 2) {
        return `Victim: <span class="token-highlight">[PROTECTED_CITIZEN_02]</span><br>Spatial Coordinate: <span class="token-highlight">Metro North Exit, Grid [D5]</span><br>Incident Type: <span class="token-highlight">Snatching / Street Robbery</span><br>Time Window: <span class="token-highlight">Friday 20:00 - 21:30</span><br>Modus Operandi: <span class="token-highlight">Two riders on black motorbike, choke-point getaway</span><br>Target: <span class="token-highlight">Mobile Handsets & Handbags</span>`;
      } else {
        return `ID: <span class="token-highlight">[TOKEN_9942]</span><br>Zone: <span class="token-highlight">Transit-Perimeter-North</span><br>Classification: <span class="token-highlight">Transit Choke Snatch</span><br>Time Bin: <span class="token-highlight">Commute Evening</span><br>Contagion Code: <span class="token-highlight">RTM-Transit</span>`;
      }
    },
    briefing: {
      where: "Metro North Exit & Gate 2",
      when: "20:00 - 21:30 (Rush Hour)",
      tactic: "Static Beat Foot Patrol",
      radius: "150m Perimeter",
      publicText: "Constables are stationed near the Metro Gate 2 choke-point during evening commuter rush to deter motorcycle snatchers and safeguard pedestrian foot traffic."
    }
  },
  vehicle: {
    id: "FIR-2026/142",
    type: "Two-Wheeler Motor Theft",
    locationName: "Commercial Lot & Alley",
    grid: "E5",
    timeWindow: "Friday 19:30 - 22:00",
    raw: `Complainant <span class="pii-highlight">Rajesh Verma</span>, mobile <span class="pii-highlight">98765-11223</span>, parked Hero Splendor bike registration <span class="pii-highlight">DL-04-AB-1234</span> in unlit lot behind <span class="pii-highlight">Commercial Complex, Sector 4</span> at 19:30. Returned at 21:45 to find lock broken and bike stolen.`,
    cleaned: (level) => {
      if (level === 1) {
        return `Complainant: <span class="token-highlight">[PROTECTED_CITIZEN_03]</span><br>Location: Commercial Lot<br>Crime: Motor Theft<br>Time: 19:30-21:45<br>MO: Handle lock broken`;
      } else if (level === 2) {
        return `Complainant: <span class="token-highlight">[PROTECTED_CITIZEN_03]</span><br>Spatial Coordinate: <span class="token-highlight">Commercial Lot, Grid [E5]</span><br>Incident Type: <span class="token-highlight">Two-Wheeler Vehicle Theft</span><br>Time Window: <span class="token-highlight">Friday 19:30 - 22:00</span><br>Modus Operandi: <span class="token-highlight">Handle lock forced in unmonitored lot</span><br>Target: <span class="token-highlight">Commuter Motorcycles</span>`;
      } else {
        return `ID: <span class="token-highlight">[TOKEN_9943]</span><br>Zone: <span class="token-highlight">Commercial-East</span><br>Classification: <span class="token-highlight">Vehicle Theft Cluster</span><br>Time Bin: <span class="token-highlight">Evening Dark</span><br>Contagion Code: <span class="token-highlight">RTM-Parking</span>`;
      }
    },
    briefing: {
      where: "Commercial Lot & Back Alley",
      when: "19:30 - 22:00 (Evening)",
      tactic: "15-Min Drive-By + POP Lighting Check",
      radius: "250m Perimeter",
      publicText: "Visible patrol drive-bys to deter two-wheeler theft gangs targeting unmonitored parking. Station is also issuing a notice to property managers to repair broken floodlights."
    }
  }
};

function initAirGapLab() {
  // Step navigation buttons
  const stepBtns = document.querySelectorAll("#airgap-steps-nav .flow-step-btn");
  const stepPanels = document.querySelectorAll(".airgap-step-panel");

  function switchAirgapStep(stepNum) {
    currentAirgapStep = parseInt(stepNum);
    stepBtns.forEach(btn => {
      const s = parseInt(btn.getAttribute("data-step"));
      if (s === currentAirgapStep) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
      if (s < currentAirgapStep) {
        btn.classList.add("completed");
      } else {
        btn.classList.remove("completed");
      }
    });

    stepPanels.forEach(panel => {
      if (panel.id === `step-panel-${currentAirgapStep}`) {
        panel.style.display = "block";
      } else {
        panel.style.display = "none";
      }
    });

    if (currentAirgapStep === 3) {
      updateRiskSliders();
    }
    if (currentAirgapStep === 4) {
      renderAgenticBriefing();
    }
  }

  stepBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      switchAirgapStep(btn.getAttribute("data-step"));
    });
  });

  // Next / Back buttons
  const goto2 = document.getElementById("goto-step-2-btn");
  if (goto2) goto2.addEventListener("click", () => switchAirgapStep(2));
  const goto3 = document.getElementById("goto-step-3-btn");
  if (goto3) goto3.addEventListener("click", () => switchAirgapStep(3));
  const goto4 = document.getElementById("goto-step-4-btn");
  if (goto4) goto4.addEventListener("click", () => switchAirgapStep(4));
  const goto5 = document.getElementById("goto-step-5-btn");
  if (goto5) goto5.addEventListener("click", () => switchAirgapStep(5));

  const back1 = document.getElementById("backto-step-1-btn");
  if (back1) back1.addEventListener("click", () => switchAirgapStep(1));
  const back2 = document.getElementById("backto-step-2-btn");
  if (back2) back2.addEventListener("click", () => switchAirgapStep(2));
  const back3 = document.getElementById("backto-step-3-btn");
  if (back3) back3.addEventListener("click", () => switchAirgapStep(3));
  const back4 = document.getElementById("backto-step-4-btn");
  if (back4) back4.addEventListener("click", () => switchAirgapStep(4));

  const restartBtn = document.getElementById("restart-lab-btn");
  if (restartBtn) restartBtn.addEventListener("click", () => switchAirgapStep(1));

  // --- Step 1: Scenarios & Sanitization ---
  const scenarioBtns = document.querySelectorAll(".fir-scenario-btn");
  const rawDisplay = document.getElementById("raw-fir-display");
  const cleanedDisplay = document.getElementById("cleaned-fir-display");
  const sanitizationSlider = document.getElementById("sanitization-slider");
  const strictnessLabel = document.getElementById("strictness-level-label");
  const runRedactionBtn = document.getElementById("run-redaction-btn");
  const redactionBadge = document.getElementById("redaction-badge");

  function updateScenarioView() {
    const sc = scenarioData[currentScenario];
    const level = parseInt(sanitizationSlider.value);
    if (rawDisplay) rawDisplay.innerHTML = sc.raw;
    if (cleanedDisplay) cleanedDisplay.innerHTML = sc.cleaned(level);

    if (strictnessLabel) {
      if (level === 1) strictnessLabel.innerText = "Level 1: Standard (PII)";
      else if (level === 2) strictnessLabel.innerText = "Level 2: Strict Grid (Recommended)";
      else strictnessLabel.innerText = "Level 3: Maximum Air-Gap";
    }
  }

  scenarioBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      scenarioBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentScenario = btn.getAttribute("data-scenario");
      updateScenarioView();
    });
  });

  if (sanitizationSlider) {
    sanitizationSlider.addEventListener("input", updateScenarioView);
  }

  if (runRedactionBtn) {
    runRedactionBtn.addEventListener("click", () => {
      runRedactionBtn.innerText = "⏳ Scrubbing Citizen PII On Local Machine...";
      runRedactionBtn.disabled = true;
      if (cleanedDisplay) {
        cleanedDisplay.style.opacity = "0.4";
      }
      setTimeout(() => {
        runRedactionBtn.innerText = "✅ Sanitization Complete (0 PII Leaked)";
        runRedactionBtn.disabled = false;
        if (cleanedDisplay) {
          cleanedDisplay.style.opacity = "1";
        }
        if (redactionBadge) {
          redactionBadge.innerText = "Air-Gap Cleaned";
          redactionBadge.className = "status-tag safe";
        }
        setTimeout(() => {
          runRedactionBtn.innerText = "🛡️ Run Local Privacy Scrubbing";
        }, 2500);
      }, 600);
    });
  }

  // --- Step 2: Local Model Selection ---
  const modelCards = document.querySelectorAll(".local-model-card");
  modelCards.forEach(card => {
    card.addEventListener("click", () => {
      modelCards.forEach(c => {
        c.classList.remove("selected");
        const b = c.querySelector(".local-model-badge");
        if (b) b.style.display = "none";
      });
      card.classList.add("selected");
      const b = card.querySelector(".local-model-badge");
      if (b) b.style.display = "block";
      selectedAirgapModel = card.getAttribute("data-model");
    });
  });

  // --- Step 3: Real-Time Sliders & Interactive SVG Map ---
  const daysSlider = document.getElementById("realtime-days-slider");
  const radiusSlider = document.getElementById("realtime-radius-slider");
  const floorSlider = document.getElementById("realtime-floor-slider");
  const layerAtm = document.getElementById("layer-atm");
  const layerLighting = document.getElementById("layer-lighting");
  const layerLiquor = document.getElementById("layer-liquor");

  function updateRiskSliders() {
    if (!daysSlider) return;
    const days = parseInt(daysSlider.value);
    const radius = radiusSlider ? parseInt(radiusSlider.value) : 220;
    const floor = floorSlider ? parseInt(floorSlider.value) : 25;

    // Calculate Near-repeat risk multiplier (decays from 4.5 down to 1.0)
    let riskMult = Math.max(1.0, 4.5 - (days * 0.12)).toFixed(1);

    // Environmental bonus factors
    let envBonus = 0;
    if (layerAtm && layerAtm.checked) envBonus += 0.4;
    if (layerLighting && layerLighting.checked) envBonus += 0.5;
    if (layerLiquor && layerLiquor.checked) envBonus += 0.3;

    const totalRisk = (parseFloat(riskMult) + envBonus).toFixed(1);

    // Days label & badge
    const daysVal = document.getElementById("slider-days-val");
    if (daysVal) {
      if (days <= 7) {
        daysVal.className = "status-tag danger";
        daysVal.innerText = `Day ${days} (Peak Risk ${totalRisk}x)`;
      } else if (days <= 18) {
        daysVal.className = "status-tag warning";
        daysVal.innerText = `Day ${days} (Medium Risk ${totalRisk}x)`;
      } else {
        daysVal.className = "status-tag safe";
        daysVal.innerText = `Day ${days} (Fading Risk ${totalRisk}x)`;
      }
    }

    // Radius label
    const radiusVal = document.getElementById("slider-radius-val");
    if (radiusVal) radiusVal.innerText = `${radius} Metres`;

    // Floor label & bias warning
    const floorVal = document.getElementById("slider-floor-val");
    const biasIndicator = document.getElementById("bias-risk-indicator");
    if (floorVal) floorVal.innerText = `${floor}% Guaranteed`;
    if (biasIndicator) {
      if (floor < 15) {
        biasIndicator.innerHTML = `<span style="color: #dc2626; font-weight: 700;">⚠️ HIGH BIAS RISK: Dangerous feedback loop! Low-risk beats receive 0 patrols, reinforcing old data.</span>`;
      } else {
        biasIndicator.innerHTML = `<span style="color: #059669; font-weight: 700;">✅ SAFE & ETHICAL: Slide 16 baseline floor active. All beats get regular patrols.</span>`;
      }
    }

    // Update SVG Map Elements
    const outerHalo = document.getElementById("map-risk-halo-outer");
    const innerHalo = document.getElementById("map-risk-halo-inner");
    if (outerHalo && innerHalo) {
      const scaleFactor = Math.min(2.0, Math.max(0.5, totalRisk / 3.0));
      const rOuter = (radius * 0.38) * scaleFactor;
      const rInner = (radius * 0.20) * scaleFactor;
      outerHalo.setAttribute("r", rOuter);
      innerHalo.setAttribute("r", rInner);
      outerHalo.setAttribute("fill", `rgba(239, 68, 68, ${Math.min(0.35, 0.05 + totalRisk * 0.04)})`);
    }

    // Toggle Hazard Layers on SVG Map
    const svgAtm = document.getElementById("map-hazard-atm");
    if (svgAtm && layerAtm) svgAtm.style.display = layerAtm.checked ? "block" : "none";
    const svgLight = document.getElementById("map-hazard-lighting");
    if (svgLight && layerLighting) svgLight.style.display = layerLighting.checked ? "block" : "none";
    const svgLiquor = document.getElementById("map-hazard-liquor");
    if (svgLiquor && layerLiquor) svgLiquor.style.display = layerLiquor.checked ? "block" : "none";

    // PAI metric calculation
    const paiVal = Math.max(1.1, (totalRisk * 0.88)).toFixed(1);
    const livePai = document.getElementById("live-pai-metric");
    if (livePai) livePai.innerText = `${paiVal}x (Effective)`;

    // Stats
    const winDays = document.getElementById("stat-window-days");
    if (winDays) winDays.innerText = `${Math.max(0, 21 - days)} Days Left`;
    const houseRisk = document.getElementById("stat-house-risk");
    if (houseRisk) houseRisk.innerText = `${totalRisk}x Elevated`;
    const peiVal = document.getElementById("stat-pei-val");
    if (peiVal) {
      const peiScore = Math.min(0.95, (0.65 + totalRisk * 0.05)).toFixed(2);
      peiVal.innerText = `${peiScore} (Optimal)`;
    }
  }

  if (daysSlider) daysSlider.addEventListener("input", updateRiskSliders);
  if (radiusSlider) radiusSlider.addEventListener("input", updateRiskSliders);
  if (floorSlider) floorSlider.addEventListener("input", updateRiskSliders);
  if (layerAtm) layerAtm.addEventListener("change", updateRiskSliders);
  if (layerLighting) layerLighting.addEventListener("change", updateRiskSliders);
  if (layerLiquor) layerLiquor.addEventListener("change", updateRiskSliders);

  // --- Step 4: Agentic Briefing & Reasoning ---
  function renderAgenticBriefing() {
    const sc = scenarioData[currentScenario];
    const card = document.getElementById("printable-briefing-card");
    if (!card) return;

    let modelName = "Police-Llama-8B (Patrol Tactician)";
    if (selectedAirgapModel === "mistral") modelName = "Mistral-7B Edge (MO Detective)";
    if (selectedAirgapModel === "deepseek") modelName = "DeepSeek-R1 Local (Safeguards Auditor)";

    const titleEl = card.querySelector("div:first-child");
    if (titleEl) titleEl.innerText = `Patrol Directives: ${sc.locationName}`;

    const subEl = card.children[1];
    if (subEl) subEl.innerText = `Issued by ${modelName} · Station Duty Ledger Approved`;

    const cells = card.querySelectorAll(".briefing-cell .cell-value");
    if (cells.length >= 4) {
      cells[0].innerText = sc.briefing.where;
      cells[1].innerText = sc.briefing.when;
      cells[2].innerText = sc.briefing.tactic;
      cells[3].innerText = sc.briefing.radius;
    }

    const publicP = card.querySelector("p");
    if (publicP) publicP.innerText = `"${sc.briefing.publicText}"`;
  }

  const regenBtn = document.getElementById("regenerate-thought-btn");
  if (regenBtn) {
    const thoughtBox = document.getElementById("agent-thought-box");
    regenBtn.addEventListener("click", () => {
      if (!thoughtBox) return;
      thoughtBox.style.opacity = "0.3";
      setTimeout(() => {
        thoughtBox.style.opacity = "1";
      }, 400);
    });
  }

  const printBtn = document.getElementById("print-briefing-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // --- Step 5: Human Officer Decision & Ledger ---
  const acceptBtn = document.getElementById("accept-briefing-btn");
  const overrideBtn = document.getElementById("override-briefing-btn");
  const overrideContainer = document.getElementById("override-input-container");
  const overrideInput = document.getElementById("override-reason-input");
  const submitOverrideBtn = document.getElementById("submit-override-btn");
  const auditTableBody = document.querySelector("#audit-log-table tbody");

  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      const sc = scenarioData[currentScenario];
      const now = new Date();
      const timeStr = `Today ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      let modelLabel = selectedAirgapModel === "llama" ? "Police-Llama-8B" : (selectedAirgapModel === "mistral" ? "Mistral-7B" : "DeepSeek-R1");

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight: 600;">${timeStr}</td>
        <td>${sc.id}</td>
        <td>${modelLabel}</td>
        <td>${sc.locationName}</td>
        <td><span class="status-tag safe" style="font-size: 0.75rem;">Approved</span></td>
        <td style="color: var(--color-text-muted);">Standard 12-min Koper Patrol accepted</td>
        <td><span class="status-tag safe" style="font-size: 0.75rem;">Place Only</span></td>
      `;
      if (auditTableBody) auditTableBody.prepend(row);
      alert(`✅ Briefing for ${sc.id} approved and logged to station audit ledger.`);
    });
  }

  if (overrideBtn) {
    overrideBtn.addEventListener("click", () => {
      if (overrideContainer) {
        overrideContainer.style.display = overrideContainer.style.display === "none" ? "block" : "none";
      }
    });
  }

  if (submitOverrideBtn) {
    submitOverrideBtn.addEventListener("click", () => {
      const reason = overrideInput.value.trim() || "Diverted by officer discretion";
      const sc = scenarioData[currentScenario];
      const now = new Date();
      const timeStr = `Today ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      let modelLabel = selectedAirgapModel === "llama" ? "Police-Llama-8B" : (selectedAirgapModel === "mistral" ? "Mistral-7B" : "DeepSeek-R1");

      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight: 600;">${timeStr}</td>
        <td>${sc.id}</td>
        <td>${modelLabel}</td>
        <td>${sc.locationName}</td>
        <td><span class="status-tag warning" style="font-size: 0.75rem;">Overridden</span></td>
        <td style="color: #92400e; font-weight: 600;">${reason}</td>
        <td><span class="status-tag safe" style="font-size: 0.75rem;">Human Logged</span></td>
      `;
      if (auditTableBody) auditTableBody.prepend(row);
      overrideInput.value = "";
      if (overrideContainer) overrideContainer.style.display = "none";
      alert("⚠️ Officer override recorded with mandatory justification.");
    });
  }

  // --- Interactive Multi-LLM "Ask the Police AI" Plain-English Sandbox ---
  const promptChips = document.querySelectorAll(".prompt-chip");
  const aiInput = document.getElementById("ai-chat-input");
  const aiSendBtn = document.getElementById("ai-chat-send-btn");
  const aiResponseText = document.getElementById("ai-response-text");
  const aiModelName = document.getElementById("ai-response-model-name");

  const answersMap = {
    "Explain Near-Repeat like I am 10 years old":
      "Imagine a burglar found an easy balcony latch in a quiet street on Monday. The burglar now knows there are no barking dogs and the escape alley is pitch dark. For the next 2 to 3 weeks, that same house and the 5 neighboring houses face a 3 TIMES higher chance of being broken into! After about a month, the burglar moves away and risk goes back to normal. That temporary danger ripple is called 'Near-Repeat'!",
    "Why can't police upload FIRs into ChatGPT or public AI?":
      "Police FIRs contain real citizen telephone numbers, home flat numbers, and private witness allegations. When you paste that into public cloud AI like ChatGPT, the text travels across the public internet to commercial servers and can leak into public datasets. With our Air-Gapped Local Model, everything runs 100% inside your station computer without an internet cable. Zero citizen data leaves your desk!",
    "What is the 10-15 minute Koper patrol rule?":
      "Criminologist Christopher Koper proved that police cars do NOT need to sit at one corner for 2 hours. A short, highly visible 10 to 15 minute stationary visit with roof lights blinking creates a 'residual deterrence bubble' that keeps crime down for up to 2 hours after the patrol leaves. It lets a single police vehicle protect 4 to 6 different hotspots in one evening shift!",
    "What does PAI score 3.2 mean in plain English?":
      "PAI stands for Predictive Accuracy Index. A score of 1.0 means your computer model is no better than rolling a dice or flipping a coin. A score of 3.2 means your small flagged hotspot zone captured 3.2 TIMES more crime than random chance! It proves the patrol car was sent to a genuinely high-risk location.",
    "Why did PredPol fail in the United States?":
      "PredPol got trapped in a Feedback Loop! It was fed drug arrest logs rather than real citizen crime reports. So it sent police back to the same already over-policed neighborhoods every day. Because police were only looking there, they only arrested people there, and the computer wrongly believed its forecast was 100% accurate. That is why Slide 16 requires a baseline patrol floor everywhere and place-not-person rules.",
    "Can a computer model predict WHO will commit a crime?":
      "NO, and professional police ethics strictly ban it! Trying to score individual citizens as 'future offenders' creates unfair bias and false accusations (like the failed LASER program in Los Angeles). Our system ONLY predicts PLACES and TIMES (weather forecasting for crime), never individual human beings."
  };

  function handleAiQuestion(question) {
    if (!aiResponseText) return;
    let modelLabel = selectedAirgapModel === "llama" ? "Police-Llama-8B (Patrol Tactician)" : (selectedAirgapModel === "mistral" ? "Mistral-7B Edge (MO Detective)" : "DeepSeek-R1 Local (Ethics Auditor)");
    if (aiModelName) aiModelName.innerText = `${modelLabel}:`;

    aiResponseText.style.opacity = "0.4";
    aiResponseText.innerText = "Thinking locally on station GPU...";

    setTimeout(() => {
      aiResponseText.style.opacity = "1";
      if (answersMap[question]) {
        aiResponseText.innerText = answersMap[question];
      } else {
        const qLower = question.toLowerCase();
        if (qLower.includes("qgis") || qLower.includes("heatmap")) {
          aiResponseText.innerText = "QGIS is free software! You load a spreadsheet of incident GPS coordinates, click 'Processing ➔ Heatmap (KDE)', set the search radius to 200-300 metres, and it automatically paints blue-to-red density clouds where crime clusters.";
        } else if (qLower.includes("excel") || qLower.includes("forecast")) {
          aiResponseText.innerText = "In Excel, you don't need any coding! Just put your dates in Column A and monthly crime counts in Column B. Select both columns, click Data Tab ➔ 'Forecast Sheet', and Excel automatically draws future projections with 95% confidence bands!";
        } else if (qLower.includes("feedback") || qLower.includes("floor")) {
          aiResponseText.innerText = "The feedback loop happens when police only patrol where the model says, finding crime only there, and making the model think it was 100% right. We prevent this by keeping a 20-30% minimum baseline patrol floor in all beats, even quiet ones.";
        } else {
          aiResponseText.innerText = `As your local ${modelLabel}, here is the simple rule: Always focus on Places and Times (like rain forecasts), never score people. Keep your patrols short (10-15 minutes), knock on neighbor doors after a burglary (Near-Repeat), and ensure every beat gets baseline coverage!`;
        }
      }
    }, 400);
  }

  promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const p = chip.getAttribute("data-prompt");
      if (aiInput) aiInput.value = p;
      handleAiQuestion(p);
    });
  });

  if (aiSendBtn) {
    aiSendBtn.addEventListener("click", () => {
      const q = aiInput.value.trim();
      if (q) handleAiQuestion(q);
    });
  }
}

// --- 11. 6 FACTOR DATASETS & GUIDES ---
const factorFilesData = {
  "01_location": {
    title: "01. Area & Location Hotspots (Spatial KDE)",
    badge: "Factor 1: Spatial Hotspots",
    badgeColor: "#e0e7ff",
    badgeTextColor: "#4338ca",
    summary: "Why do crimes cluster at specific street corners? Criminals look for easy escape routes, crowded bottlenecks, and blind spots. Smoothing incident pins into 200m-300m heat bubbles shows commanders where risk concentrates without guessing.",
    keyConcept: "Kernel Density Estimation (KDE): Blending individual incident points into a smooth surface of probability. A moving hotspot from month to month is more actionable than a static one.",
    tools: "QGIS (Free), CrimeStat (US DOJ), ArcGIS",
    nonTechTakeaway: "Never spread police thinly everywhere like butter. Concentrating 10-15 minute stops on the top 5% hotspot corners deters up to 50% of opportunistic street crime.",
    tableData: [
      { id: "LOC-101", place: "Central Metro North Exit", type: "Phone Snatching", risk: "92 (Extreme)", cause: "Transit rush bottleneck + narrow lane" },
      { id: "LOC-102", place: "Sector 18 Market Alley", type: "Two-Wheeler Theft", risk: "85 (High)", cause: "Unmonitored open parking, no CCTV" },
      { id: "LOC-103", place: "Ring Road Underpass", type: "Mugging / Robbery", risk: "78 (High)", cause: "Broken streetlights after 9 PM" },
      { id: "LOC-104", place: "Service Road Truck Staging", type: "Cargo Snatching", risk: "64 (Moderate)", cause: "Isolated road shoulder, freight queue" }
    ]
  },
  "02_time": {
    title: "02. Time & Temporal Trends (Hours, Days, Paydays & Seasons)",
    badge: "Factor 2: Temporal Trends",
    badgeColor: "#fef3c7",
    badgeTextColor: "#b45309",
    summary: "Crime follows human rhythms: Burglaries spike when residents are away at work or on summer holidays. Street robberies spike on payday weekends and late Friday nights. Excel FORECAST.ETS projects future counts from historical weekly rhythms without coding.",
    keyConcept: "Moving Averages & 95% Confidence Bounds: Never treat a computer projection as a single hard guarantee. Always brief commanders with the shaded error band to show uncertainty.",
    tools: "Excel FORECAST.ETS (Built-in), Meta Prophet",
    nonTechTakeaway: "Forecasts get shaky beyond 4-6 weeks out. Refresh monthly and align shift changes so cars are on the street during the 20:00 - 23:30 surge rather than idling at the station.",
    tableData: [
      { id: "TIME-W48", window: "Friday Night 21:00-01:00", forecast: "16 Incidents", range: "12 to 20 (95% CI)", factor: "Month-end salary payout + bar rush" },
      { id: "TIME-W49", window: "Sunday Afternoon 14:00-17:00", forecast: "6 Incidents", range: "3 to 9 (95% CI)", factor: "Baseline quiet residential period" },
      { id: "TIME-W50", window: "Festival Week 18:00-22:00", forecast: "25 Incidents", range: "19 to 31 (95% CI)", factor: "Crowded markets & jewelry shops" },
      { id: "TIME-W52", window: "New Year Eve 22:00-04:00", forecast: "38 Incidents", range: "30 to 46 (95% CI)", factor: "City-wide gatherings & alcohol disorder" }
    ]
  },
  "03_near_repeat": {
    title: "03. Near-Repeat Contagion (The 2-4 Week Vulnerability Window)",
    badge: "Factor 3: Near-Repeat Contagion",
    badgeColor: "#fee2e2",
    badgeTextColor: "#b91c1c",
    summary: "The single most reliable pattern in criminology: If a home is broken into, the burglar is now familiar with the access lanes and neighborhood alarms. For the next 2-4 weeks, the SAME house and its neighbors within 200m face sharply higher risk.",
    keyConcept: "Spatio-Temporal Contagion: Criminal risk radiates outward like ripples in a pond immediately after an incident and naturally decays back to baseline after 28 days.",
    tools: "Near-Repeat Calculator, Station FIR Ledger",
    nonTechTakeaway: "Within 48 hours of any break-in, dispatch officers to knock on the 10 closest doors with crime prevention leaflets. This simple operational act is one of the best-proven deterrents in policing.",
    tableData: [
      { id: "NR-01", target: "House 42 (Hit)", window: "Day 0", mult: "4.5x baseline", status: "Original Target (Repeat Risk)" },
      { id: "NR-02", target: "House 40 & 44 (Adjacent)", window: "Day 1 to 7", mult: "3.8x baseline", status: "Critical Near-Repeat Ring" },
      { id: "NR-03", target: "Opposite Row (House 51-55)", window: "Day 8 to 14", mult: "2.4x baseline", status: "Moderate Near-Repeat Ring" },
      { id: "NR-04", target: "Outer Block Perimeter", window: "Day 15 to 28", mult: "1.4x baseline", status: "Fading Risk Ring" }
    ]
  },
  "04_environmental": {
    title: "04. Risk Terrain Modeling (RTM) - Environmental Attractors",
    badge: "Factor 4: Environmental Features",
    badgeColor: "#e0f2fe",
    badgeTextColor: "#0369a1",
    summary: "What if a neighborhood is brand new (like a newly built transit hub or shopping mall) with zero past crime logs? Risk Terrain looks at the physical features that attract crime: cash points, dark unlit streets, late-night alcohol outlets, and vacant lots.",
    keyConcept: "Layer Stacking: Each physical feature is like a colored plastic sheet. Where 3 or 4 sheets overlap, the composite color is deepest red—flagging high vulnerability before any crime occurs.",
    tools: "QGIS Risk Stacking, Rutgers RTM Diagnostic Tool",
    nonTechTakeaway: "Problem-Oriented Policing (POP): Fixing the broken street bulb or trimming an overgrown bush often stops more crimes than driving a patrol car past once a night.",
    tableData: [
      { id: "RTM-01", place: "Station Plaza West", overlap: "4 Features Overlap", risk: "Extreme Risk", crime: "Violent Robbery & Snatching" },
      { id: "RTM-02", place: "Commercial Block B", overlap: "1 Feature Overlap", risk: "Low Risk", crime: "Opportunistic Pickpocketing" },
      { id: "RTM-03", place: "Old Warehouse Perimeter", overlap: "3 Features Overlap", risk: "High Risk", crime: "Illicit Substance & Staged Robbery" },
      { id: "RTM-04", place: "Highway Petrol Station", overlap: "3 Features Overlap", risk: "High Risk", crime: "Vehicle Theft & Heists" }
    ]
  },
  "05_privacy_airgap": {
    title: "05. Confidential FIRs & Air-Gap Privacy Firewall",
    badge: "Factor 5: Privacy & Air-Gap",
    badgeColor: "#dcfce7",
    badgeTextColor: "#15803d",
    summary: "Police FIRs contain confidential complainant names, phone numbers, and victim allegations. Uploading these into commercial cloud LLMs violates statutory privacy acts. This module shows how on-premise local models operate 100% offline inside police hardware.",
    keyConcept: "Local Regex Scrubbing + Offline Pre-trained Models: Citizen PII is converted to anonymized tokens ([PROTECTED_CITIZEN]) right on the workstation screen before local model inference.",
    tools: "Local Regex Redactor, On-Station Llama/Mistral",
    nonTechTakeaway: "Zero bytes leave your station. The model acts like an intelligent officer reading sanitized files on an offline screen, generating briefings without internet dependency.",
    tableData: [
      { id: "FIR-00892", original: "Ramesh Gupta, Flat 304, Green Palms", token: "[PROTECTED_CITIZEN_01], Sector 4 Grid [D4]", status: "100% Sanitized" },
      { id: "FIR-00898", original: "Sunita Kumari, Metro Gate 2, Ph: 99554", token: "[PROTECTED_CITIZEN_02], Metro North Exit [D5]", status: "100% Sanitized" },
      { id: "FIR-00912", original: "Secret Informant: 3 vehicle theft suspects", token: "[CONFIDENTIAL_INTEL], Ring Road [C4]", status: "100% Sanitized" }
    ]
  },
  "06_safeguards": {
    title: "06. Model Judging (PAI/PEI) & Ethics Safeguards Guide",
    badge: "Factor 6: Model Judging & Ethics",
    badgeColor: "#f3e8ff",
    badgeTextColor: "#7e22ce",
    summary: "A computer model can look very flashy and still be totally useless. Two simple scores tell commanders if a model is genuinely helping or just guessing: PAI (is it better than chance?) and PEI (how close is it to perfection?).",
    keyConcept: "PAI > 1.0 means the flagged zone captured more crime than random chance. PEI near 1.0 means optimal theoretical efficiency. Keep a baseline floor in unpredicted beats to prevent feedback loop traps.",
    tools: "PAI Calculator, PEI Formula, Safeguards Audit Checklist",
    nonTechTakeaway: "Predict places and times, never people. A good model informs human judgment; it never replaces the officer on the beat.",
    tableData: [
      { id: "MODEL-KDE", test: "Hotspot KDE (200m)", area: "3.5% Area", captured: "28.0% Crimes", pai: "8.0x", pei: "0.74", verdict: "Highly Actionable Hotspot" },
      { id: "MODEL-NR", test: "Near-Repeat 14-Day Ring", area: "1.2% Area", captured: "12.5% Crimes", pai: "10.4x", pei: "0.88", verdict: "Extremely Accurate Short-Window" },
      { id: "MODEL-RND", test: "Random Chance Patrol", area: "10.0% Area", captured: "10.0% Crimes", pai: "1.0x", pei: "0.10", verdict: "Useless (Coin Flip)" },
      { id: "MODEL-TRAP", test: "Overfitted Arrest Loop", area: "5.0% Area", captured: "40.0% Arrests", pai: "8.0x", pei: "0.65", verdict: "Trap: Patrols created their own data" }
    ]
  }
};

function initFactorFiles() {
  const previewBtns = document.querySelectorAll(".preview-file-btn");
  const loadBtns = document.querySelectorAll(".load-file-btn");
  const previewCard = document.getElementById("file-preview-card");
  const previewTitle = document.getElementById("preview-file-title");
  const previewContent = document.getElementById("preview-file-content");
  const closePreviewBtn = document.getElementById("close-file-preview-btn");

  previewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const fileKey = btn.getAttribute("data-file");
      const f = factorFilesData[fileKey];
      if (!f || !previewCard) return;

      if (previewTitle) previewTitle.innerText = f.title;

      let tableHtml = "";
      if (f.tableData && f.tableData.length > 0) {
        const keys = Object.keys(f.tableData[0]);
        tableHtml = `
          <div class="table-container" style="max-height: 250px; overflow-y: auto; margin-top: 14px;">
            <table class="custom-table">
              <thead>
                <tr>${keys.map(k => `<th>${k.toUpperCase()}</th>`).join("")}</tr>
              </thead>
              <tbody>
                ${f.tableData.map(row => `
                  <tr>${keys.map(k => `<td>${row[k]}</td>`).join("")}</tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      if (previewContent) {
        previewContent.innerHTML = `
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
            <span class="file-factor-badge" style="background: ${f.badgeColor}; color: ${f.badgeTextColor}; font-size: 0.85rem; padding: 4px 10px;">${f.badge}</span>
            <span style="font-size: 0.82rem; color: #64748b;">Tools: <strong>${f.tools}</strong></span>
          </div>

          <p style="font-size: 0.92rem; line-height: 1.6; color: var(--color-text);">
            <strong>Simple Summary:</strong> ${f.summary}
          </p>

          <div class="alert-box info" style="margin-top: 14px;">
            <strong>Core Concept:</strong> ${f.keyConcept}
          </div>

          ${tableHtml}

          <div class="alert-box warning" style="margin-top: 14px;">
            <strong>💡 Non-Tech Takeaway:</strong> ${f.nonTechTakeaway}
          </div>

          <div style="display: flex; gap: 10px; margin-top: 18px;">
            <button class="btn btn-primary" onclick="loadFactorDirectly('${fileKey}')" style="flex: 1;">
              🚀 Load this Factor into Air-Gapped Model Lab
            </button>
            <button class="btn btn-outline" onclick="downloadFactorCSV('${fileKey}')" style="flex: 1;">
              ⬇️ Download Dataset (CSV)
            </button>
          </div>
        `;
      }

      previewCard.style.display = "block";
      previewCard.scrollIntoView({ behavior: "smooth" });
    });
  });

  loadBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const fileKey = btn.getAttribute("data-file");
      loadFactorDirectly(fileKey);
    });
  });

  if (closePreviewBtn && previewCard) {
    closePreviewBtn.addEventListener("click", () => {
      previewCard.style.display = "none";
    });
  }
}

// Global functions for factor file actions
window.loadFactorDirectly = function(fileKey) {
  // Navigate to airgap-lab-section
  const airgapTab = document.querySelector('.nav-item[data-target="airgap-lab-section"]');
  if (airgapTab) airgapTab.click();

  // If near-repeat, set scenario and jump to step 3
  if (fileKey === "03_near_repeat") {
    currentScenario = "burglary";
    const bBtn = document.querySelector('.fir-scenario-btn[data-scenario="burglary"]');
    if (bBtn) bBtn.click();
    const s3Btn = document.querySelector('.flow-step-btn[data-step="3"]');
    if (s3Btn) s3Btn.click();
  } else if (fileKey === "04_environmental") {
    const sBtn = document.querySelector('.fir-scenario-btn[data-scenario="snatching"]');
    if (sBtn) sBtn.click();
    const s3Btn = document.querySelector('.flow-step-btn[data-step="3"]');
    if (s3Btn) s3Btn.click();
  } else {
    const s1Btn = document.querySelector('.flow-step-btn[data-step="1"]');
    if (s1Btn) s1Btn.click();
  }
};

window.downloadFactorCSV = function(fileKey) {
  const f = factorFilesData[fileKey];
  if (!f || !f.tableData || f.tableData.length === 0) return;

  const keys = Object.keys(f.tableData[0]);
  let csvContent = "data:text/csv;charset=utf-8," + keys.join(",") + "\n";
  f.tableData.forEach(row => {
    const line = keys.map(k => `"${(row[k] || "").toString().replace(/"/g, '""')}"`).join(",");
    csvContent += line + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${fileKey}_crime_prediction_data.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

