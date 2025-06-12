document.addEventListener('DOMContentLoaded', () => {
  // Clear sessionStorage data only on reload
  if (performance.getEntriesByType("navigation")[0].type === 'reload') {
    sessionStorage.removeItem('weatherData');
  }

  const fetchWeatherBtn = document.getElementById('fetchWeather');

  // If sessionStorage has saved weather data, load it on page load
  const savedData = sessionStorage.getItem('weatherData');
  if (savedData) {
    const data = JSON.parse(savedData);
    renderLocation(data.location);
    renderForecast(data.forecast);
    renderSummary(data.summary);
    document.getElementById('weatherResults').classList.add('active');
  }

  fetchWeatherBtn.addEventListener('click', async () => {
    await getWeather();
  });
});

// Enhanced location detection function (borrowed from paste-1)
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          // Get elevation automatically (optional for weather, but useful)
          const elevation = await getElevation(latitude, longitude);
          
          resolve({
            latitude,
            longitude,
            elevation,
            accuracy: position.coords.accuracy
          });
        } catch (error) {
          console.error('Error processing location:', error);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            elevation: null,
            accuracy: position.coords.accuracy
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Could not detect your location.';
        
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable location services.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.';
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  });
}

// Elevation function from paste-1 (adapted)
async function getElevation(lat, lon) {
  try {
    // Try Open Elevation API first
    const openElevationResponse = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    
    if (openElevationResponse.ok) {
      const data = await openElevationResponse.json();
      if (data.results && data.results.length > 0) {
        console.log('Elevation from Open Elevation API:', data.results[0].elevation);
        return Math.round(data.results[0].elevation);
      }
    }
    
    // Fallback to coordinate-based estimation
    console.warn('Open Elevation API failed. Using coordinate-based estimation.');
    return estimateElevationByCoordinates(lat, lon);
    
  } catch (error) {
    console.error('Error getting elevation:', error);
    return estimateElevationByCoordinates(lat, lon);
  }
}

// Elevation estimation function from paste-1
function estimateElevationByCoordinates(latitude, longitude) {
  let estimatedElevation;
  
  // For Maharashtra region estimation
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

// Enhanced weather fetching function
async function getWeather() {
  setLoading(true);
  clearError();

  try {
    let lat, lon, locationInfo = null;

    try {
      // Use enhanced location detection
      locationInfo = await getCurrentLocation();
      lat = locationInfo.latitude;
      lon = locationInfo.longitude;
      
      console.log(`Location detected: ${lat.toFixed(4)}, ${lon.toFixed(4)} (accuracy: ${locationInfo.accuracy}m, elevation: ${locationInfo.elevation}m)`);
      
      // Show location detection success
      showLocationStatus('success', `Location detected with ${Math.round(locationInfo.accuracy)}m accuracy`);
      
    } catch (locationError) {
      console.warn('Location detection failed:', locationError.message);
      
      // Show location detection failure
      showLocationStatus('warning', `${locationError.message} Using default location (Pune).`);
      
      // Fallback to default location (Pune)
      lat = 18.5204;
      lon = 73.8567;
    }

    const language = getGlobalLanguage(); // Use global language from script.js

    const url = `https://agrosarthi-backend-885337506715.asia-south1.run.app/weather-forecast?lat=${lat}&lon=${lon}&language=${language}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Failed to fetch weather data');

    const data = await response.json();

    // Add location metadata if available
    if (locationInfo) {
      data.locationMetadata = {
        accuracy: locationInfo.accuracy,
        elevation: locationInfo.elevation,
        detectionMethod: 'GPS'
      };
    } else {
      data.locationMetadata = {
        detectionMethod: 'Default'
      };
    }

    renderLocation(data.location, data.locationMetadata);
    renderForecast(data.forecast);
    renderSummary(data.summary);

    document.getElementById('weatherResults').classList.add('active');
    sessionStorage.setItem('weatherData', JSON.stringify(data));
    
    // Clear location status after successful weather fetch
    setTimeout(() => clearLocationStatus(), 3000);
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    
    // Get error message based on current language
    const currentLang = getGlobalLanguage();
    let errorMessage = 'Unable to get weather data. Please check your connection or location permissions.';
    
    if (currentLang === 'hindi') {
      errorMessage = 'मौसम डेटा प्राप्त करने में असमर्थ। कृपया अपना कनेक्शन या स्थान अनुमतियां जांचें।';
    } else if (currentLang === 'marathi') {
      errorMessage = 'हवामान डेटा मिळवण्यात अक्षम. कृपया आपले कनेक्शन किंवा स्थान परवानग्या तपासा.';
    }
    
    showError(errorMessage);
  } finally {
    setLoading(false);
  }
}

// Enhanced location rendering with metadata
function renderLocation(location, metadata = null) {
  const locDiv = document.querySelector('.location-header');
  const currentLang = getGlobalLanguage();
  
  // Get localized labels
  let localTimeLabel = 'Local Time';
  let accuracyLabel = 'Location Accuracy';
  let elevationLabel = 'Elevation';
  
  if (currentLang === 'hindi') {
    localTimeLabel = 'स्थानीय समय';
    accuracyLabel = 'स्थान सटीकता';
    elevationLabel = 'ऊंचाई';
  } else if (currentLang === 'marathi') {
    localTimeLabel = 'स्थानिक वेळ';
    accuracyLabel = 'स्थान अचूकता';
    elevationLabel = 'उंची';
  }
  
  let metadataHtml = '';
  if (metadata) {
    if (metadata.accuracy) {
      metadataHtml += `<small style="color: #666; display: block;">${accuracyLabel}: ${Math.round(metadata.accuracy)}m</small>`;
    }
    if (metadata.elevation) {
      metadataHtml += `<small style="color: #666; display: block;">${elevationLabel}: ${metadata.elevation}m</small>`;
    }
  }
  
  locDiv.innerHTML = `
    <h3>${location.name}, ${location.region}, ${location.country}</h3>
    <p>${localTimeLabel}: ${location.localtime}</p>
    ${metadataHtml}
  `;
}

// Location status notification function
function showLocationStatus(type, message) {
  // Remove existing status
  clearLocationStatus();
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'location-status';
  statusDiv.className = `location-status ${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = '<i class="fas fa-check-circle"></i>';
  } else if (type === 'warning') {
    icon = '<i class="fas fa-exclamation-triangle"></i>';
  } else if (type === 'info') {
    icon = '<i class="fas fa-info-circle"></i>';
  }
  
  statusDiv.innerHTML = `${icon} ${message}`;
  
  // Insert before weather results
  const weatherPanel = document.querySelector('.weather-panel');
  const weatherResults = document.getElementById('weatherResults');
  weatherPanel.insertBefore(statusDiv, weatherResults);
  
  // Add styles if not already present
  if (!document.getElementById('location-status-styles')) {
    const style = document.createElement('style');
    style.id = 'location-status-styles';
    style.textContent = `
      .location-status {
        padding: 10px 15px;
        margin: 10px 0;
        border-radius: 5px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .location-status.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      .location-status.warning {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      .location-status.info {
        background-color: #cce7ff;
        color: #004085;
        border: 1px solid #7fb3d3;
      }
    `;
    document.head.appendChild(style);
  }
}

function clearLocationStatus() {
  const statusDiv = document.getElementById('location-status');
  if (statusDiv) {
    statusDiv.remove();
  }
}

function renderForecast(forecast) {
  const grid = document.querySelector('.forecast-grid');
  grid.innerHTML = '';
  const currentLang = getGlobalLanguage();
  
  // Get localized labels
  let labels = {
    maxTemp: 'Max Temp',
    minTemp: 'Min Temp', 
    avgTemp: 'Avg Temp',
    maxWind: 'Max Wind',
    precipitation: 'Precipitation',
    humidity: 'Humidity'
  };
  
  if (currentLang === 'hindi') {
    labels = {
      maxTemp: 'अधिकतम तापमान',
      minTemp: 'न्यूनतम तापमान',
      avgTemp: 'औसत तापमान', 
      maxWind: 'अधिकतम हवा',
      precipitation: 'वर्षा',
      humidity: 'आर्द्रता'
    };
  } else if (currentLang === 'marathi') {
    labels = {
      maxTemp: 'कमाल तापमान',
      minTemp: 'किमान तापमान',
      avgTemp: 'सरासरी तापमान',
      maxWind: 'कमाल वारा', 
      precipitation: 'पाऊस',
      humidity: 'आर्द्रता'
    };
  }

  forecast.forEach(day => {
    const card = document.createElement('div');
    card.classList.add('weather-card');
    
    // Format date based on language
    const date = new Date(day.date);
    let formattedDate = day.date;
    
    if (currentLang === 'hindi' || currentLang === 'marathi') {
      formattedDate = date.toLocaleDateString('hi-IN', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
    } else {
      formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Translate weather condition
    const translatedCondition = translateWeatherCondition(day.condition.text, currentLang);
    
    card.innerHTML = `
      <h4>${formattedDate}</h4>
      <img src="https:${day.condition.icon}" alt="${translatedCondition}">
      <p><strong>${translatedCondition}</strong></p>
      <p>${labels.maxTemp}: ${day.maxtemp_c}°C</p>
      <p>${labels.minTemp}: ${day.mintemp_c}°C</p>
      <p>${labels.avgTemp}: ${day.avgtemp_c}°C</p>
      <p>${labels.maxWind}: ${day.maxwind_kph} ${currentLang === 'hindi' ? 'कि.मी./घंटा' : currentLang === 'marathi' ? 'कि.मी./तास' : 'kph'}</p>
      <p>${labels.precipitation}: ${day.totalprecip_mm} ${currentLang === 'hindi' ? 'मि.मी.' : currentLang === 'marathi' ? 'मि.मी.' : 'mm'}</p>
      <p>${labels.humidity}: ${day.avghumidity}%</p>
    `;
    grid.appendChild(card);
  });
}

function renderSummary(summary) {
  const summaryBox = document.querySelector('.summary-box');
  
  // The summary comes from API already translated, so we can use it directly
  summaryBox.innerHTML = summary;
}

function setLoading(isLoading) {
  const btn = document.getElementById('fetchWeather');
  const spinner = btn.querySelector('.spinner');

  if (isLoading) {
    btn.classList.add('loading');
    if (spinner) spinner.style.display = 'block';
    btn.disabled = true;
    
    // Update button text to show location detection
    const buttonText = btn.querySelector('span:not(.spinner)');
    if (buttonText) {
      const currentLang = getGlobalLanguage();
      if (currentLang === 'hindi') {
        buttonText.textContent = 'स्थान खोजा जा रहा है...';
      } else if (currentLang === 'marathi') {
        buttonText.textContent = 'स्थान शोधत आहे...';
      } else {
        buttonText.textContent = 'Detecting Location...';
      }
    }
  } else {
    btn.classList.remove('loading');
    if (spinner) spinner.style.display = 'none';
    btn.disabled = false;
    
    // Reset button text
    const buttonText = btn.querySelector('span:not(.spinner)');
    if (buttonText) {
      const currentLang = getGlobalLanguage();
      if (currentLang === 'hindi') {
        buttonText.textContent = 'मौसम जानकारी प्राप्त करें';
      } else if (currentLang === 'marathi') {
        buttonText.textContent = 'हवामान माहिती मिळवा';
      } else {
        buttonText.textContent = 'Get Weather';
      }
    }
  }
}

function showError(message) {
  let errorDiv = document.querySelector('.error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.classList.add('error-message');
    const weatherPanel = document.querySelector('.weather-panel');
    weatherPanel.insertBefore(errorDiv, weatherPanel.firstChild);
  }
  errorDiv.textContent = message;
}

function clearError() {
  const errorDiv = document.querySelector('.error-message');
  if (errorDiv) errorDiv.remove();
}

// Function to format numbers based on language
function formatNumber(number, language) {
  if (language === 'hindi') {
    return number.toLocaleString('hi-IN');
  } else if (language === 'marathi') {
    return number.toLocaleString('mr-IN');
  }
  return number.toString();
}

// Function to get localized unit labels
function getUnitLabel(unit, language) {
  const units = {
    celsius: {
      english: '°C',
      hindi: '°सेल्सियस', 
      marathi: '°सेल्सियस'
    },
    kph: {
      english: 'kph',
      hindi: 'कि.मी./घंटा',
      marathi: 'कि.मी./तास'
    },
    mm: {
      english: 'mm',
      hindi: 'मि.मी.',
      marathi: 'मि.मी.'
    },
    percent: {
      english: '%',
      hindi: '%',
      marathi: '%'
    }
  };
  
  return units[unit] ? units[unit][language] || units[unit].english : unit;
}

// Function to translate weather conditions
function translateWeatherCondition(condition, language) {
  if (!condition || !language) return condition;

  const normalizedCondition = condition.trim().toLowerCase();

  const weatherTranslations = {
    // Clear/Sunny
    'sunny': {
      hindi: 'धूप निकलेगी',
      marathi: 'सूर्य चमकणार',
    },
    'clear': {
      hindi: 'आसमान साफ रहेगा',
      marathi: 'आकाश स्वच्छ राहील',
    },

    // Cloudy
    'partly cloudy': {
      hindi: 'थोड़े बादल रहेंगे',
      marathi: 'थोडेसे ढग असतील',
    },
    'cloudy': {
      hindi: 'बादल छाए रहेंगे',
      marathi: 'ढगाळ राहील',
    },
    'overcast': {
      hindi: 'आसमान पूरी तरह बादलों से ढका रहेगा',
      marathi: 'आकाश पूर्णपणे ढगांनी झाकलेलं राहील',
    },

    // Rain
    'patchy rain nearby': {
      hindi: 'कहीं-कहीं बारिश हो सकती है',
      marathi: 'कुठेतरी पाऊस पडू शकतो',
    },
    'patchy rain possible': {
      hindi: 'बारिश के कुछ धब्बे हो सकते हैं',
      marathi: 'तुरळक पाऊस पडू शकतो',
    },
    'light rain': {
      hindi: 'हल्की बारिश होगी',
      marathi: 'हलका पाऊस पडेल',
    },
    'moderate rain': {
      hindi: 'मध्यम बारिश होगी',
      marathi: 'मध्यम पाऊस पडेल',
    },
    'heavy rain': {
      hindi: 'मूसलाधार बारिश होगी',
      marathi: 'मूसळधार पाऊस पडेल',
    },
    'rain': {
      hindi: 'बारिश होगी',
      marathi: 'पाऊस पडेल',
    },
    'drizzle': {
      hindi: 'बूंदाबांदी होगी',
      marathi: 'बुंदाबांदी होईल',
    },

    // Thunderstorm
    'thundery outbreaks possible': {
      hindi: 'गरज के साथ बारिश हो सकती है',
      marathi: 'गर्जना होऊन पाऊस पडू शकतो',
    },
    'thunderstorm': {
      hindi: 'तेज गरज और बारिश होगी',
      marathi: 'गरजेसह जोरदार पाऊस पडेल',
    },

    // Mist/Fog
    'mist': {
      hindi: 'हल्का कोहरा रहेगा',
      marathi: 'हळूवार धुके असेल',
    },
    'fog': {
      hindi: 'घना कोहरा रहेगा',
      marathi: 'घनधुके असेल',
    },
    'haze': {
      hindi: 'धुंध छाएगी',
      marathi: 'धुंदळपणा असेल',
    },

    // Wind
    'windy': {
      hindi: 'हवा तेज चलेगी',
      marathi: 'वारा जोरात वाऱ्याचा असेल',
    },

    // Snow
    'snow': {
      hindi: 'बर्फ गिर सकती है',
      marathi: 'बर्फ पडू शकते',
    },
    'light snow': {
      hindi: 'हल्की बर्फबारी हो सकती है',
      marathi: 'हलकी बर्फवृष्टी होऊ शकते',
    },

    // Default fallback
    'unknown': {
      hindi: 'मौसम की जानकारी नहीं मिली',
      marathi: 'हवामानाची माहिती उपलब्ध नाही',
    }
  };

  const lang = language.toLowerCase();

  if (lang === 'english' || !weatherTranslations[normalizedCondition]) {
    return condition;
  }

  return weatherTranslations[normalizedCondition][lang] || condition;
}