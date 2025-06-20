# 🌾 AgroSarthi

**“A voice for every farmer — anytime, anywhere.”**

AgroSarthi is an inclusive, multilingual, AI-powered agricultural assistant that empowers India’s small and marginal farmers through voice and web interfaces — with or without a smartphone.

🔗 **Live MVP**: [agrosarthi-frontend.web.app](http://agrosarthi-frontend.web.app)  
🎥 **Demo Video**: [Watch 3-min Demo](https://www.loom.com/share/4d336fef58864698a3de0cedc2e65993?sid=952339f4-1580-4d65-ac8f-9c9140e33dc4)

---

## 🧠 Problem We Solve

> Every hour, a farmer in India dies by suicide — not because they’re weak, but because they are unheard and unsupported.

- No crop guidance tailored to their soil or location  
- No localized weather or disease alerts  
- No apps that work in their language or on their phones  
- No access to expert advice when it matters most  

---

## 🌱 Our Solution: AgroSarthi

AgroSarthi provides:

- 📱 Web-based access for smartphone users  
- 📞 Voice call access for feature phone users  
- 🌐 Support for **Hindi**, **Marathi**, and **English**  
- 🧠 AI-powered decisions based on location, weather, and soil  

---

## 🚀 Key Features

| Feature                     | Description                                                  |
|----------------------------|--------------------------------------------------------------|
| 📍 Crop Recommendation     | Based on soil + weather (auto/manual inputs)                |
| 📷 Disease Detection        | Upload image → get diagnosis + treatment                    |
| 🌦 Weather Forecast         | 7-day location-specific updates                             |
| 📊 Yield Prediction         | Estimates output by crop, region, area                      |
| 💰 Price Estimation         | Predict mandi price by crop + season                        |
| 🗓 Crop Schedule (PDF)      | Offline downloadable daily crop tasks                       |
| 💬 Multilingual AI Chatbot  | Supports Hindi, Marathi, English                            |
| 📞 Voice Access             | Call-based access for non-smartphone users                  |

---

## 🛠 Tech Stack

### 🌐 Frontend
- HTML, CSS, Vanilla JS, Tailwind CSS  
- Firebase Hosting  
- jsPDF for PDF download  

### 🔙 Backend
- Python + **FastAPI**  
- REST API with CORS/JSON  
- Deployed via Google Cloud Run  

### 🤖 Machine Learning
- Crop Recommendation (Scikit-learn – 88% accuracy)  
- Price Prediction (91% accuracy)  
- Yield Prediction (90% accuracy)  
- Disease Detection (CNN in TensorFlow)  
- Crop Schedule Generator (JSON-to-PDF)

### 📡 APIs
- WeatherAPI, Meteostat  
- Open Elevation API  
- Google Geocoding API  
- Gemini API (AI Assistant)

### 📞 Voice Assistant
- Twilio Programmable Voice  
- Google Cloud Functions (Webhook)  

---

## 🏗️ System Architecture

- **Frontend** → Firebase Hosted  
- **Backend** → Cloud Run FastAPI Server  
- **Voice Bot** → Twilio + Cloud Functions  
- **ML Services** → On-demand API Endpoints  
- **PDF Export** → jsPDF (client-side)

---

## 🔄 API Endpoints (Latency Benchmarked)

| Endpoint                  | Purpose                    | Avg Time |
|---------------------------|-----------------------------|----------|
| `/predict`                | Crop Recommendation         | ~10s     |
| `/predict-disease`        | Disease Diagnosis           | ~6s      |
| `/predict-price`          | Mandi Price Prediction      | ~3s      |
| `/predict-yield`          | Yield Prediction            | ~3s      |
| `/soil-estimate`          | NPK + pH Estimation         | ~7s      |
| `/weather-forecast`       | Weather Forecast            | ~8s      |
| `/generate-crop-plan`     | Full Schedule + PDF         | ~15s     |
| `/query`                  | Multilingual Chatbot        | ~5s      |

---

## 📈 Innovation Highlights

- **Voice + Web Hybrid**: Works even for farmers with only a feature phone  
- **Multilingual UX**: Hindi, Marathi, English — voice and text  
- **Offline Support**: Downloadable crop plan, SMS fallback coming soon  
- **End-to-End Journey**: From soil estimation to market price prediction  
- **Farmer-Centric Design**: Simple UI, big buttons, language-first flow  

---

## 🔮 Future Roadmap

- 🌐 Add more languages (Tamil, Telugu, Gujarati, Bengali)  
- 📲 WhatsApp + SMS Reminders (Crop tasks, price, rain)  
- 🧑‍🏫 Training Mode for farmer field officers  
- 🆚 Crop Comparison Tool  
- 📊 Admin Dashboard (track disease trends, crop demand)  
- 🤝 NGO & KVK Partnerships for outreach and support  

---

## 👥 Team — AlgoCraft

| Name             | Role                                                                 |
|------------------|----------------------------------------------------------------------|
| **Piyush Bhavsar**  | Team Leader, Backend Dev (FastAPI), ML Integration                  |
| **Arzaan**          | Frontend Developer (HTML, CSS, JS, UI/UX)                           |
| **Tanishqa Jagtap** | Documentation, Presentation, Idea Refinement & Research Assistance |

---

## 🔗 Useful Links

- 🔥 **Frontend Repo:** [Agrosarthi_v2](https://github.com/PIYUSH-BHAVSAR/Agrosarthi_v2)  
- 🧠 **Backend Repo:** [AgroSarthi_v2_backend](https://github.com/PIYUSH-BHAVSAR/AgroSarthi_v2_backend)  
- 🧪 **Live Backend API Docs:** [API Swagger UI](https://agrosarthi-backend-885337506715.asia-south1.run.app/docs)  
- 🌐 **Deployed Web App:** [Agrosarthi App](http://agrosarthi-frontend.web.app/)  
- ☎️ **Voice Webhook Endpoint:** [Twilio Function](https://agrosarthiwebhook-425474658725.us-central1.run.app/)  
- 📱 **Voice Bot Phone Number:** `+18557062307` *(ISD pack required for use in India)*  
- 🎥 **Demo Video (3 mins):** [Loom Demo](https://www.loom.com/share/4d336fef58864698a3de0cedc2e65993?sid=952339f4-1580-4d65-ac8f-9c9140e33dc4)

---

## 📄 License

This project is licensed under the **MIT License**.

---

> **AgroSarthi: Giving every farmer a voice — through AI, language, and love for the land.**
