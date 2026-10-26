# 🛡️ Predictive Crime Analytics & Prevention Hub (AI for Policing Toolkit)

> **Session 31: Simple Guide for Non-Techies — Predictive Policing, Air-Gapped Local Models, and Crime Prevention**

An interactive, plain-English educational platform and decision-support toolkit designed for civil police officers, criminal analysts, and non-technical trainees. Built without complex mathematical jargon, demonstrating how place-based and time-based predictive crime modeling works while strictly preserving civil liberties, citizen privacy, and air-gapped on-premise execution.

---

## 🌟 Key Highlights

- **🔒 Air-Gapped / On-Premise Local AI Execution**:
  - Live in-browser demonstration of offline LLMs (**Police-Llama-8B**, **Mistral-7B-Instruct**, **DeepSeek-R1-Distill**).
  - Demonstrates why confidential police records (FIRs, victim identities, phone numbers) must **never be sent to public commercial cloud LLMs** (complying with CJIS, GDPR, and India DPDP Act 2023).
  - Built-in regex PII sanitizer that redacts names, phone numbers, and exact addresses into anonymous grid codes before inference.

- **☁️ Interactive Modus Operandi (MO) Crime Word Cloud**:
  - Dynamic keyword cloud highlighting recurring crime signatures (`balcony latch`, `black pulsar`, `midnight 02:00-04:00`, `electricity bill SMS`, `remote screen APK`).
  - Interactive **Detective Intelligence Drawer**: Displays investigative deductions, peak time/area correlation, and actionable tactical countermeasures.
  - Interactive **Case Co-Occurrence SVG Link Diagram**: Visualizes shared vehicles, areas, and MOs connecting separate incidents.
  - **Live Custom FIR Parser**: Paste unclassified FIR text or click presets to dynamically generate crime keyword clouds in your browser.

- **📊 6 Factor Datasets & Method Guides**:
  1. `01_location_spatial_hotspots` — Kernel Density Estimation (KDE) and spatial clustering.
  2. `02_time_temporal_patterns` — Double Exponential Smoothing & diurnal shift patterns.
  3. `03_near_repeat_contagion` — 2–4 week contagion vulnerability windows.
  4. `04_environmental_risk_terrain` — Risk Terrain Modeling (RTM) environmental layer stacking.
  5. `file_05_privacy_airgap` — Air-gapped on-premise model deployment & PII redaction rules.
  6. `file_06_safeguards` — Patrol allocation fairness, feedback loop traps, and PAI/PEI metrics.

- **🎮 Interactive Simulators**:
  1. *KDE Heatmap Grid*: Click to place incidents and observe overlapping risk halos.
  2. *Near-Repeat Calculator*: Adjust days elapsed and contagion radius.
  3. *Risk Terrain Modeling (RTM)*: Toggle environmental hazard layers (liquor vends, dark alleys, ATMs).
  4. *Time-Series Trend Forecaster*: Interactive Holt-Winters trend projection.
  5. *4x4 Hotspot Grid Matrix Simulator*: Switch between Day/Evening/Night and Weekday/Weekend shifts.
  6. *Patrol Fleet Allocation Game*: Allocate 10 patrol cars to maintain a baseline patrol floor and prevent runaway bias loops.

- **🛠️ 5 Hands-on Labs & Offline Toolkit**:
  - Full hands-on interactive labs for crime hotspots, case-link charts, NotebookLM analysis, AI-assisted report writing, and private offline tools.

---

## 📁 Repository Structure

```text
├── index.html            # Visual Predictive Policing Hub (Main Portal & Simulators)
├── toolkit.html          # AI for Policing: Free Hands-on Toolkit (Interactive Labs & Word Cloud)
├── app.js                # Core interactive simulation, local model inference & word cloud logic
├── style.css             # Design system with modern glassmorphism, responsive tokens & dark mode
├── report.html           # Comprehensive Non-Techie Educational & Methodological Guide
├── README.md             # Project documentation and guide
└── files/                # Structured factor datasets and analytical guidelines
    ├── 01_location_spatial_hotspots.csv
    ├── file_01_location.json
    ├── 02_time_temporal_patterns.csv
    ├── file_02_time.json
    ├── 03_near_repeat_contagion.csv
    ├── file_03_near_repeat.json
    ├── 04_environmental_risk_terrain.csv
    ├── file_04_environmental.json
    ├── file_05_privacy_airgap.json
    └── file_06_safeguards.json
```

---

## 🚀 Getting Started

No external server or database required. Everything runs locally in your browser:

1. Clone this repository:
   ```bash
   git clone https://github.com/dixadholakiya/predictive-crime-analytics-hub.git
   cd predictive-crime-analytics-hub
   ```
2. Open directly in your browser:
   - Double-click `index.html` to open the Visual Hub.
   - Or start a local server:
     ```bash
     python3 -m http.server 8000
     ```
   - Visit `http://localhost:8000/` or `http://localhost:8000/toolkit.html`.

---

## ⚖️ Ethical Safeguards & Legal Principles

1. **Place and Time, Never Person**: Predict *where* and *when* incidents are probable, never label or score individual citizens.
2. **AI is a Lead, Not Evidence**: Algorithmic outputs are statistical flags for human review, never probable cause or court evidence.
3. **Preserve Baseline Patrol Floors**: Never deploy 100% of patrol units exclusively to predicted zones; maintain 20–30% random baseline coverage to avoid circular feedback bias.
4. **Strict Air-Gap Protection**: No sensitive citizen data or FIR narratives are ever uploaded to third-party public AI APIs.

---

## 📜 License

Educational and public safety training resource. Released under the MIT License.
