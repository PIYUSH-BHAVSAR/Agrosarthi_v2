// Use the same language function as in script.js
function getGlobalLanguage() {
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('language='));
    return cookieLang ? cookieLang.split('=')[1] : (localStorage.getItem('language') || 'en');
}

// Keys for localStorage
const LOCAL_STORAGE_FORM_DATA_KEY = 'lastFormData';
const LOCAL_STORAGE_PREDICTION_RESPONSE_KEY = 'lastCropPredictionResponse';
const LOCAL_STORAGE_ACTIVE_FORM_KEY = 'activeForm';
// Function to clear all stored data on refresh (using sessionStorage as a flag)

function clearStoredDataOnRefresh() {
    // Define a session flag key
    const SESSION_FLAG_KEY = 'cropPageSessionActive';

    // Check if a session flag exists in sessionStorage.
    // If it doesn't exist, it means this is either a new tab/window,
    // or the previous session was closed (e.g., browser restart),
    // or it's the very first load.
    const sessionActive = sessionStorage.getItem(SESSION_FLAG_KEY);

    if (!sessionActive) {
        // If no session flag, clear localStorage items
        console.log("New session detected or full refresh. Clearing localStorage.");
        localStorage.removeItem('lastFormData');
        localStorage.removeItem('lastCropPredictionResponse');
        localStorage.removeItem('activeForm');

        // Set the session flag to indicate that a session has started
        sessionStorage.setItem(SESSION_FLAG_KEY, 'true');
    } else {
        // If the session flag exists, it means it's a navigation within the same tab
        console.log("Existing session. Not clearing localStorage.");
    }
}
document.addEventListener('DOMContentLoaded', function () {
    clearStoredDataOnRefresh()
    initCropPage();
});

function initCropPage() {
    initFormToggle();
    initLocationDetection();
    initRecommendButton();
    loadLanguageStrings();
    initFormLanguageSelectors();
    
    // Load previously filled form data and active form state
    loadStoredFormData();
    
    // Load last prediction results if available (after form is potentially filled)
    loadLastPrediction(); 
    
    // Initialize clear button
    initClearButton();

    document.addEventListener('languageChanged', function (e) {
        const newLang = e.detail.lang;
        updateFormLanguageSelectors(newLang);
        loadLanguageStrings(); // Reload visible text in new language
    });

    initCropPlanButton();
}

// NEW: Function to load and display the last prediction from local storage
function loadLastPrediction() {
    const storedPrediction = localStorage.getItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY);
    if (storedPrediction) {
        try {
            const apiData = JSON.parse(storedPrediction);
            const recommendations = transformAPIResponse(apiData);
            displayRecommendations(recommendations);

            // Also, ensure the results section is visible
            document.querySelector('.results-section').classList.add('active');
            showNotification('info', 'Loaded previous crop recommendations.');
        } catch (error) {
            console.error('Error parsing stored prediction data:', error);
            localStorage.removeItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY); // Clear corrupt data
            showNotification('error', 'Failed to load previous recommendations due to data corruption. Please predict again.');
        }
    }
}

// NEW: Function to load stored form data
function loadStoredFormData() {
    const storedFormData = localStorage.getItem(LOCAL_STORAGE_FORM_DATA_KEY);
    const storedActiveForm = localStorage.getItem(LOCAL_STORAGE_ACTIVE_FORM_KEY);

    if (storedActiveForm) {
        // Activate the correct form button and form
        const toggleButton = document.querySelector(`.toggle-btn[data-form="${storedActiveForm}"]`);
        if (toggleButton) {
            document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.input-form').forEach(form => form.classList.remove('active'));
            toggleButton.classList.add('active');
            document.querySelector(`.${storedActiveForm}`).classList.add('active');
        }
    }

    if (storedFormData) {
        try {
            const formData = JSON.parse(storedFormData);
            const prefix = storedActiveForm === 'location-form' ? 'auto-' : 'manual-';

            // Fill the form fields based on the stored data and active form
            document.getElementById(`${prefix}nitrogen`).value = formData.nitrogen || '';
            document.getElementById(`${prefix}phosphorus`).value = formData.phosphorus || '';
            document.getElementById(`${prefix}potassium`).value = formData.potassium || '';
            document.getElementById(`${prefix}rainfall`).value = formData.rainfall || '';
            document.getElementById(`${prefix}temperature`).value = formData.temperature || '';
            document.getElementById(`${prefix}humidity`).value = formData.humidity || '';
            document.getElementById(`${prefix}ph`).value = formData.ph || '';
            document.getElementById(`${prefix}language`).value = formData.language || getGlobalLanguage();

            showNotification('info', 'Loaded previous form data.');
        } catch (error) {
            console.error('Error parsing stored form data:', error);
            localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY); // Clear corrupt data
            showNotification('error', 'Failed to load previous form data due to corruption. Please re-enter.');
        }
    }
}

// NEW: Function to save current form data to local storage
function saveCurrentFormData() {
    const activeFormElement = document.querySelector('.input-form.active');
    if (!activeFormElement) return;

    const isLocationForm = activeFormElement.classList.contains('location-form');
    const prefix = isLocationForm ? 'auto-' : 'manual-';

    const formData = {
        nitrogen: document.getElementById(`${prefix}nitrogen`).value,
        phosphorus: document.getElementById(`${prefix}phosphorus`).value,
        potassium: document.getElementById(`${prefix}potassium`).value,
        rainfall: document.getElementById(`${prefix}rainfall`).value,
        temperature: document.getElementById(`${prefix}temperature`).value,
        humidity: document.getElementById(`${prefix}humidity`).value,
        ph: document.getElementById(`${prefix}ph`).value,
        language: document.getElementById(`${prefix}language`).value
    };

    localStorage.setItem(LOCAL_STORAGE_FORM_DATA_KEY, JSON.stringify(formData));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_FORM_KEY, isLocationForm ? 'location-form' : 'manual-form');
}

// NEW: Initialize clear button functionality
function initClearButton() {
    const clearBtn = document.getElementById('clear-form-btn'); // Assuming you add a button with this ID
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // Clear relevant local storage items
            localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY);
            localStorage.removeItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY);
            localStorage.removeItem(LOCAL_STORAGE_ACTIVE_FORM_KEY);

            // Reset form fields
            const forms = document.querySelectorAll('.input-form input, .input-form select');
            forms.forEach(input => {
                if (input.type === 'text' || input.type === 'number') {
                    input.value = '';
                } else if (input.tagName === 'SELECT') {
                    input.value = getGlobalLanguage(); // Reset language selector
                }
            });

            // Hide results section
            document.querySelector('.results-section').classList.remove('active');

            // Reset 'Get Location' button
            const getLocationBtn = document.getElementById('get-location');
            if (getLocationBtn) {
                getLocationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> <span data-lang-key="get_location">Get Location Data</span>';
                getLocationBtn.disabled = false;
            }

            showNotification('success', 'Form and results cleared. Ready for new input!');
        });
    }
}


function initCropPlanButton() {
    const cropPlanBtn = document.getElementById('view-crop-plan');
    if (!cropPlanBtn) return;

    cropPlanBtn.addEventListener('click', function() {
        // Get the current crop prediction data from localStorage
        const cropDataString = localStorage.getItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY);
        let cropData = null;
        if (cropDataString) {
            try {
                cropData = JSON.parse(cropDataString);
            } catch (e) {
                console.error("Error parsing crop plan data from localStorage:", e);
                showNotification('error', 'Error loading crop plan data from storage.');
            }
        }
        
        if (!cropData) {
            showNotification('error', 'Please complete crop prediction first to view the crop plan.');
            return;
        }

        // Store the data in sessionStorage for the schedule page
        sessionStorage.setItem('cropPlanData', JSON.stringify(cropData));

        // Redirect to schedule page
        window.location.href = 'schedule.html';
    });
}

// Modify the existing crop prediction success handler to store the data
async function handlePredictionSuccess(response) {
    // Fill the auto form with the API data (updated field names)
    document.getElementById('auto-nitrogen').value = Math.round(data.n || 0);
    document.getElementById('auto-phosphorus').value = Math.round(data.p || 0);
    document.getElementById('auto-potassium').value = Math.round(data.k || 0);
    document.getElementById('auto-rainfall').value = Math.round(data.rainfall || 0);
    document.getElementById('auto-temperature').value = Math.round(data.temperature || 0);
    document.getElementById('auto-humidity').value = Math.round(data.humidity || 0);
    document.getElementById('auto-ph').value = parseFloat(data.ph || 7).toFixed(1);
    
    // Set language to match the current page language
    const currentLang = getGlobalLanguage();

    updateFormLanguageSelectors(currentLang);
}

function initFormLanguageSelectors() {
    const currentLang = localStorage.getItem('language') || 'en';
    updateFormLanguageSelectors(currentLang);
}

function updateFormLanguageSelectors(lang) {
    const autoLanguageSelector = document.getElementById('auto-language');
    const manualLanguageSelector = document.getElementById('manual-language');

    if (autoLanguageSelector) {
        autoLanguageSelector.value = lang;
    }
    if (manualLanguageSelector) {
        manualLanguageSelector.value = lang;
    }
}

function initFormToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    const forms = document.querySelectorAll('.input-form');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and forms
            toggleButtons.forEach(btn => btn.classList.remove('active'));
            forms.forEach(form => form.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding form
            const formId = this.getAttribute('data-form');
            document.querySelector(`.${formId}`).classList.add('active');

            // NEW: Save the active form state
            localStorage.setItem(LOCAL_STORAGE_ACTIVE_FORM_KEY, formId);
        });
    });
}

// Updated function to detect location with automatic elevation detection (no block detection)
function initLocationDetection() {
    const getLocationBtn = document.getElementById('get-location');
    
    getLocationBtn.addEventListener('click', function() {
        // Show loading state
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span data-lang-key="detecting">Detecting...</span>';
        this.disabled = true;
        
        // Check if geolocation is available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                try {
                    // Get location data
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    
                    // Get elevation automatically
                    const elevation = await getElevation(latitude, longitude);
                    
                    // Fetch farm data from soil estimate API
                    await fetchFarmDataFromAPI(latitude, longitude, elevation);
                } catch (error) {
                    console.error('Geolocation or API error:', error);
                    getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span data-lang-key="api_error">API Error. Try again.</span>';
                    getLocationBtn.disabled = false;
                    showNotification('error', `Could not fetch farm data from server: ${error.message}. Please try again or enter details manually.`);
                }
            }, error => {
                // Handle geolocation error
                console.error('Geolocation error:', error);
                getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span data-lang-key="location_error">Location error. Try again.</span>';
                getLocationBtn.disabled = false;
                
                // Show error message
                let errorMessage = 'Could not detect your location. Please try again or enter details manually.';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location access denied. Please enable location services in your browser settings to use automatic detection.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = 'Location information is unavailable. Try again later.';
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = 'The request to get user location timed out.';
                }
                showNotification('error', errorMessage);
            });
        } else {
            // Geolocation not supported
            getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span data-lang-key="not_supported">Not supported</span>';
            showNotification('error', 'Geolocation is not supported by your browser. Please enter details manually.');
        }
    });
}


// Updated elevation function with multiple sources
async function getElevation(lat, lon) {
    try {
        // Option 1: Try Open Elevation API (free)
        // Note: Free APIs can have rate limits or downtime.
        const openElevationResponse = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        
        if (openElevationResponse.ok) {
            const data = await openElevationResponse.json();
            if (data.results && data.results.length > 0) {
                console.log('Elevation from Open Elevation API:', data.results[0].elevation);
                return Math.round(data.results[0].elevation);
            }
        }
        
        // Option 2: Fallback to coordinate-based elevation estimation if API fails
        console.warn('Open Elevation API failed or returned no data. Falling back to local estimation.');
        return estimateElevationByCoordinates(lat, lon);
        
    } catch (error) {
        console.error('Error getting elevation from API:', error);
        // Always fall back to estimation if API fails
        return estimateElevationByCoordinates(lat, lon);
    }
}

// Fallback elevation estimation for Maharashtra region (approximate)
function estimateElevationByCoordinates(latitude, longitude) {
    // These are very rough estimates based on general topography.
    // Real elevation varies greatly.
    // Maharashtra coordinates: ~15.6 N to 22.0 N latitude, ~72.6 E to 80.9 E longitude

    let estimatedElevation;
    // Example: Pimpri-Chinchwad is near Pune, which is on the Deccan Plateau.
    // Longitude for Pune is around 73.8 E.
    // Coastal areas are lower, Western Ghats higher, central plateau moderate.

    if (longitude < 73.0) { // Closer to coast
        estimatedElevation = 50 + Math.random() * 200; // 50-250m
    } else if (longitude >= 73.0 && longitude < 75.0) { // Western Ghats and Deccan Plateau
        estimatedElevation = 500 + Math.random() * 400; // 500-900m
    } else { // Eastern Maharashtra plains
        estimatedElevation = 300 + Math.random() * 300; // 300-600m
    }
    
    console.log(`Estimated elevation for ${latitude.toFixed(2)}, ${longitude.toFixed(2)}: ${Math.round(estimatedElevation)}m`);
    return Math.round(estimatedElevation);
}


// Updated API call function with simplified parameters (no block)
async function fetchFarmDataFromAPI(latitude, longitude, elevation) {
    const getLocationBtn = document.getElementById('get-location');
    
    try {
        // Construct query parameters for GET request (only lat, lon, elevation)
        const queryParams = new URLSearchParams({
            lat: latitude.toFixed(4),
            lon: longitude.toFixed(4),
            elevation: elevation
        });
        
        // Call soil estimate API with GET request
        const response = await fetch(`https://agrosarthi-backend-885337506715.asia-south1.run.app/soil-estimate?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text(); // Get error response text
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const farmData = await response.json();
        
        // Reset location button
        getLocationBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span data-lang-key="location_detected">Location Detected</span>';
        getLocationBtn.disabled = false;
        
        // Fill the auto form with the API data
        fillAutoForm(farmData);
        
        // NEW: Save this auto-filled data to local storage
        saveCurrentFormData();
        
        // Show success message with detected location info
        showNotification('success', `Location detected! Elevation: ${elevation}m. Farm data filled automatically.`);
        
    } catch (error) {
        console.error('Error calling soil estimate API:', error);
        getLocationBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span data-lang-key="api_error">API Error. Try again.</span>';
        getLocationBtn.disabled = false;
        showNotification('error', `Could not fetch farm data from server: ${error.message}. Please try again or enter details manually.`);
        throw error; // Re-throw to propagate the error
    }
}

// Updated fillAutoForm to match the new API response structure
function fillAutoForm(data) {
    // Ensure the auto form is active when filling it
    document.querySelector('.toggle-btn[data-form="location-form"]').classList.add('active');
    document.querySelector('.toggle-btn[data-form="manual-form"]').classList.remove('active');
    document.querySelector('.location-form').classList.add('active');
    document.querySelector('.manual-form').classList.remove('active');

    document.getElementById('auto-nitrogen').value = Math.round(data.n || 0);
    document.getElementById('auto-phosphorus').value = Math.round(data.p || 0);
    document.getElementById('auto-potassium').value = Math.round(data.k || 0);
    document.getElementById('auto-rainfall').value = Math.round(data.rainfall || 0);
    document.getElementById('auto-temperature').value = Math.round(data.temperature || 0);
    document.getElementById('auto-humidity').value = Math.round(data.humidity || 0);
    document.getElementById('auto-ph').value = parseFloat(data.ph || 7).toFixed(1);
    
    // Set language to match the current page language
    const currentLang = getGlobalLanguage();
    updateFormLanguageSelectors(currentLang);
}

function initRecommendButton() {
    const recommendBtn = document.getElementById('recommend-btn');
    
    recommendBtn.addEventListener('click', async function() {
        // Validate form data
        if (!validateFormData()) {
            return;
        }
        
        // NEW: Save the form data right before making the prediction,
        // so it persists even if the prediction API fails.
        saveCurrentFormData();

        // Show loading state
        this.classList.add('loading');
        document.querySelector('.loading-placeholder').classList.add('active');
        document.querySelector('.results-section').classList.remove('active');
        
        try {
            // Get form data based on active form
            const formData = getFormData();
            
            // Call crop prediction API
            const recommendations = await getCropRecommendationsFromAPI(formData);
            
            // Display recommendations
            displayRecommendations(recommendations);
            
            // Hide loading state
            recommendBtn.classList.remove('loading');
            document.querySelector('.loading-placeholder').classList.remove('active');
            document.querySelector('.results-section').classList.add('active');
            
            // Scroll to results
            document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            console.error('Error getting crop recommendations:', error);
            recommendBtn.classList.remove('loading');
            document.querySelector('.loading-placeholder').classList.remove('active');
            
            // More informative error message for the user
            showNotification('error', `Failed to get crop recommendations: ${error.message}. Please check your inputs and try again.`);
        }
    });
}

async function getCropRecommendationsFromAPI(formData) {
    try {
        // Prepare API request data
        const apiData = {
            N: parseInt(formData.nitrogen),
            P: parseInt(formData.phosphorus),
            K: parseInt(formData.potassium),
            temperature: parseFloat(formData.temperature),
            humidity: parseFloat(formData.humidity),
            ph: parseFloat(formData.ph),
            rainfall: parseFloat(formData.rainfall),
            // Ensure the language from formData is used here
            language:getGlobalLanguage()
        };

        // Call crop prediction API
        const response = await fetch('https://agrosarthi-backend-885337506715.asia-south1.run.app/predict/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(apiData)
        });

        if (!response.ok) {
            const errorDetails = await response.text(); // Get specific error from API
            throw new Error(`HTTP error! status: ${response.status}. Details: ${errorDetails}`);
        }

        const data = await response.json();

        // Store the raw API response in local storage only if successful
        localStorage.setItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY, JSON.stringify(data));

        // Transform API response to our format
        return transformAPIResponse(data);

    } catch (error) {
        console.error('Error calling crop prediction API:', error);
        throw error; // Re-throw the error to be caught by the recommend button handler
    }
}

function getLanguageName(langCode) {
    const languageMap = {
        'en': 'English',
        'hi': 'Hindi',
        'mr': 'Marathi'
    };
    return languageMap[langCode] || 'English';
}

function transformAPIResponse(apiData) {
    const cropIcons = {
        'Rice': 'fa-seedling',
        'Wheat': 'fa-wheat-awn',
        'Cotton': 'fa-shirt',
        'Sugarcane': 'fa-candy-cane',
        'Maize': 'fa-corn',
        'Soybean': 'fa-leaf',
        'Jute': 'fa-spa',
        'Chili Pepper': 'fa-pepper-hot',
        'Tomato': 'fa-apple-alt',
        'Potato': 'fa-seedling',
        'Onion': 'fa-circle',
        'Cabbage': 'fa-leaf',
        'Cauliflower': 'fa-cloud',
        'Carrot': 'fa-carrot',
        'Bean': 'fa-seedling',
        'Pea': 'fa-seedling',
        'Groundnut': 'fa-seedling',
        'Sunflower': 'fa-sun',
        'Mustard': 'fa-seedling',
        'Sesame': 'fa-seedling'
    };
    
    const cropTags = {
        'Rice': ['Staple Food', 'High Demand', 'Water Intensive'],
        'Wheat': ['Winter Crop', 'Staple Food', 'Drought Resistant'],
        'Cotton': ['Cash Crop', 'Textile Industry', 'Moderate Water'],
        'Sugarcane': ['Cash Crop', 'Sugar Industry', 'Water Intensive'],
        'Maize': ['Versatile', 'Animal Feed', 'Moderate Water'],
        'Soybean': ['Oil Crop', 'Protein Rich', 'Nitrogen Fixing'],
        'Jute': ['Fiber Crop', 'Industrial Use', 'High Humidity'],
        'Chili Pepper': ['Spice Crop', 'High Value', 'Disease Resistant'],
        'Tomato': ['Vegetable', 'High Demand', 'Greenhouse Suitable'],
        'Potato': ['Staple Vegetable', 'Storage Crop', 'Cool Season'],
        'Onion': ['Essential Vegetable', 'Long Storage', 'Market Stable'],
        'Cabbage': ['Leafy Vegetable', 'Cool Season', 'Nutritious'],
        'Cauliflower': ['Premium Vegetable', 'Cool Season', 'High Value'],
        'Carrot': ['Root Vegetable', 'Nutritious', 'Long Storage'],
        'Bean': ['Legume', 'Protein Rich', 'Nitrogen Fixing'],
        'Pea': ['Legume', 'Cool Season', 'Quick Harvest'],
        'Groundnut': ['Oil Crop', 'Cash Crop', 'Drought Tolerant'],
        'Sunflower': ['Oil Crop', 'Long Season', 'Bee Friendly'],
        'Mustard': ['Oil Crop', 'Cool Season', 'Quick Growing'],
        'Sesame': ['Oil Crop', 'Drought Tolerant', 'High Value']
    };
    
    // Transform the API response to match our display format
    const recommendations = apiData.top_crops.map((crop, index) => {
        // Calculate confidence based on position (first crop gets highest confidence)
        const baseConfidence = 95 - (index * 10);
        const confidence = Math.max(baseConfidence + Math.floor(Math.random() * 10), 70);
        
        return {
            name: crop,
            icon: cropIcons[crop] || 'fa-seedling',
            tags: cropTags[crop] || ['Recommended Crop', 'Suitable', 'Good Choice'],
            confidence: confidence,
            explanation: apiData.explanations[index] || `${crop} is recommended based on your soil and weather conditions.`
        };
    });
    
    return recommendations;
}

function validateFormData() {
    // Determine which form is active
    const activeForm = document.querySelector('.input-form.active');
    const isLocationForm = activeForm.classList.contains('location-form');
    
    // Get form fields based on active form
    const prefix = isLocationForm ? 'auto-' : 'manual-';
    const fields = ['nitrogen', 'phosphorus', 'potassium', 'rainfall', 'temperature', 'humidity', 'ph', 'language'];
    
    // Check required fields
    let isValid = true;
    fields.forEach(field => {
        const input = document.getElementById(`${prefix}${field}`);
        if (!input || !input.value || (input.type === 'number' && isNaN(parseFloat(input.value)))) {
            isValid = false;
            if (input) {
                input.classList.add('error');
                
                // Add error event listener to remove error class on input
                input.addEventListener('input', function() {
                    this.classList.remove('error');
                }, { once: true });
            }
        }
    });
    
    if (!isValid) {
        showNotification('error', 'Please fill in all required fields with valid numbers.');
    }
    
    return isValid;
}

function getFormData() {
    // Determine which form is active
    const activeForm = document.querySelector('.input-form.active');
    const isLocationForm = activeForm.classList.contains('location-form');
    
    // Get form fields based on active form
    const prefix = isLocationForm ? 'auto-' : 'manual-';
    
    return {
        nitrogen: document.getElementById(`${prefix}nitrogen`).value,
        phosphorus: document.getElementById(`${prefix}phosphorus`).value,
        potassium: document.getElementById(`${prefix}potassium`).value,
        rainfall: document.getElementById(`${prefix}rainfall`).value,
        temperature: document.getElementById(`${prefix}temperature`).value,
        humidity: document.getElementById(`${prefix}humidity`).value,
        ph: document.getElementById(`${prefix}ph`).value,
        language: document.getElementById(`${prefix}language`).value
    };
}

function displayRecommendations(recommendations) {
    const cropCardsContainer = document.querySelector('.crop-cards');
    cropCardsContainer.innerHTML = '';
    
    if (recommendations.length === 0) {
        // No recommendations found
        cropCardsContainer.innerHTML = `
            <div class="no-results" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #e74c3c; margin-bottom: 20px;"></i>
                <h3 data-lang-key="no_recommendations">No suitable crops found</h3>
                <p data-lang-key="try_different">Try different soil or weather parameters</p>
            </div>
        `;
        return;
    }
    
    // Create crop cards with detailed information
    recommendations.forEach((crop, index) => {
        const cropCard = document.createElement('div');
        cropCard.className = 'crop-card';
        
        cropCard.innerHTML = `
            <div class="crop-image">
                <i class="fas ${crop.icon}"></i>
            </div>
            <div class="crop-details">
                <h3 class="crop-name">${crop.name}</h3>
                <div class="crop-tags">
                    ${crop.tags.map(tag => `<span class="crop-tag">${tag}</span>`).join('')}
                </div>
                <div class="crop-confidence">
                    <span class="confidence-label" data-lang-key="suitability">Suitability:</span>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: 0%"></div>
                    </div>
                    <span class="confidence-value">${crop.confidence}%</span>
                </div>
                <div class="crop-explanation" style="margin-top: 15px; font-size: 0.9rem; color: #666; max-height: 100px; overflow-y: auto; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
                    ${crop.explanation}
                </div>
                <a href="#" class="crop-action" onclick="showCropDetails('${crop.name}', '${crop.explanation.replace(/'/g, "\\'")}'); return false;" data-lang-key="learn_more">Learn More</a>
            </div>
        `;
        
        cropCardsContainer.appendChild(cropCard);
    });
    
    // Animate confidence bars and cards after a short delay
    setTimeout(() => {
        document.querySelectorAll('.crop-card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('revealed');
            }, index * 200);
        });
        
        setTimeout(() => {
            document.querySelectorAll('.confidence-fill').forEach(fill => {
                // Parse the percentage value from the text content
                const value = parseFloat(fill.parentElement.nextElementSibling.textContent);
                fill.style.width = `${value}%`; // Set width as percentage
            });
        }, 600);
    }, 300);
}

function showCropDetails(cropName, explanation) {
    // Create modal for detailed crop information
    const existingModal = document.getElementById('crop-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'crop-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;
    
    modal.innerHTML = `
        <div style="background: white; max-width: 600px; width: 100%; border-radius: 10px; padding: 30px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #2e7d32;">${cropName} - Detailed Analysis</h2>
                <button onclick="document.getElementById('crop-details-modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
            </div>
            <div style="line-height: 1.6; color: #333;">
                ${explanation}
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="document.getElementById('crop-details-modal').remove()" style="background-color: #2e7d32; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showNotification(type, message) {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
        
        // Add styles if not already in CSS
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                .notification {
                    background-color: white;
                    border-radius: 5px;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    display: flex;
                    align-items: center;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                    max-width: 350px;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification.success {
                    border-left: 4px solid var(--primary-color, #2e7d32); /* Use primary color from CSS variable or fallback */
                }
                .notification.error {
                    border-left: 4px solid #e74c3c;
                }
                .notification.info {
                    border-left: 4px solid #3498db;
                }
                .notification i {
                    margin-right: 10px;
                    font-size: 1.2rem;
                }
                .notification.success i {
                    color: var(--primary-color, #2e7d32);
                }
                .notification.error i {
                    color: #e74c3c;
                }
                .notification.info i {
                    color: #3498db;
                }
                .notification-message {
                    flex-grow: 1;
                    font-size: 0.9rem;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    font-size: 1rem;
                    padding: 0;
                    margin-left: 10px;
                }
                .form-control.error {
                    border-color: #e74c3c;
                    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Set icon based on type
    let icon;
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
    } else if (type === 'info') {
        icon = 'fa-info-circle';
    } else {
        icon = 'fa-bell'; // Default icon
    }

    // Set notification content
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="notification-message">${message}</div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Add close button event
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function loadLanguageStrings() {
    const lang = getGlobalLanguage();

    fetch('lang.json')
        .then(res => res.json())
        .then(data => {
            updateTextContent(data, lang);
            const currentLangDisplay = document.querySelector('.selected-lang span');
            if (currentLangDisplay) {
                currentLangDisplay.textContent = data[lang]?.language_name || lang;
            }
        })
        .catch(err => console.error('Failed to load language strings:', err));
}
function updateTextContent(langData, lang) {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        const translation = langData[lang]?.[key];
        if (translation) {
            if (el.placeholder !== undefined && el.tagName === 'INPUT') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
}