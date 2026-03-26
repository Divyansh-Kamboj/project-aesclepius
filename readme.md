# Project Aesclepius: 2026 Healthcare Simulator
### 🏆 Built for the DubsTech Datathon

## 🏥 Overview
Project Aesclepius is a predictive simulation engine designed to model healthcare resource allocation in a post-crisis economy. By 2026, healthcare demand is projected to outpace supply. This tool allows policymakers and hospital administrators to test "Safety Net" strategies, balancing the competing goals of economic efficiency and human compassion.

## 🚀 Quick Start
1.  **Read the docs*: [Technical Explainer Notebook](tech_explainer.ipynb)
2.  **Run the Simulation**: [Launch Streamlit App](https://project-aesclepius.streamlit.app)

## 🧠 The Technology
* **Triage Engine**: XGBoost Classifier trained to predict patient mortality risk.
* **Empathy Engine**: Survival Analysis (Cox Proportional Hazards) to visualize wait times.
* **Optimization**: Linear Programming (PuLP) to solve the budget Knapsack problem.

## 📊 Data Sources
* **Clinical Training Data**: NY SPARCS 2022 (Statewide Planning and Research Cooperative System), containing 100,000+ real patient records.
* **Population Forecasts**: Based on trends from the **National Health Interview Survey (NHIS)** and CBO population projections.

## ⚠️ Key Definitions
* **Risk Factor**: A prediction of how likely a patient is to face a critical outcome if care is delayed.

## 📉 Model Accuracy & Performance
*Metrics calculated on a 20% hold-out test set from the NY SPARCS 2022 dataset.*

| Model | Metric | Value | Margin of Error (95% CI) |
| :--- | :--- | :--- | :--- |
| **XGBoost Triage** | Classification Accuracy | **49.1%** | +/- 0.3% |
| **Cox Survival (Avg)** | Concordance Index | **0.662** | N/A |
| *Mental Health Sub-Model* | *Concordance Index* | *0.752* | *High Predictive Power* |
| *Oncology Sub-Model* | *Concordance Index* | *0.705* | *High Predictive Power* |

*Note: The XGBoost accuracy reflects the difficulty of predicting exact mortality levels (4 classes) in a highly complex, noisy real-world dataset.*

## 💻 Installation
```bash
pip install -r requirements.txt
streamlit run app.py
```

## 🧩 Frontend + API Dev Setup
The project now has:
- Root backend API: `api.py` (FastAPI), which reads `2026_forecast.csv` and `models/` from the project root.
- Standalone frontend app: `/interface` (Next.js), which calls the backend `/simulate` endpoint.

### Run in two terminals
```bash
# Terminal 1 (root)
uvicorn api:app --reload --port 8000

# Terminal 2
cd interface
npm run dev
```

### Run both via Procfile (Foreman/Hivemind style)
```bash
foreman start
```

If your frontend is not using the default backend URL, set:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```
