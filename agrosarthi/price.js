document.addEventListener('DOMContentLoaded', function () {
    initPriceEstimation();
});

// Define arrays for all options - you can replace these with your actual lists
const DISTRICTS = districts =['Ahmednagar', 'Akola', 'Amarawati', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Chattrapati Sambhajinagar', 'Dharashiv(Usmanabad)', 'Dhule', 'Gadchiroli', 'Hingoli', 'Jalana', 'Jalgaon', 'Kolhapur', 'Latur', 'Mumbai', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sholapur', 'Thane', 'Vashim', 'Wardha', 'Yavatmal']; // Replace with your district list
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];
const MARKETS = ['ACF Agro Marketing', 'Aarni', 'Aatpadi', 'Achalpur', 'Aheri', 'Ahmednagar', 'Ahmedpur', 'Akhadabalapur', 'Akkalkot', 'Akkalkuwa', 'Akluj', 'Akola', 'Akole', 'Akot', 'Alibagh', 'Amalner', 'Amarawati', 'Ambad (Vadigodri)', 'Ambejaogai', 'Amrawati(Frui & Veg. Market)', 'Anajngaon', 'Armori(Desaiganj)', 'Arvi', 'Ashti', 'Ashti(Jalna)', 'Ashti(Karanja)', 'Aurad Shahajani', 'Ausa', 'BSK Krishi Bazar Private Ltd', 'Babhulgaon', 'Balapur', 'Baramati', 'Barshi', 'Barshi Takli', 'Barshi(Vairag)', 'Basmat', 'Basmat(Kurunda)', 'Beed', 'Bhadrawati', 'Bhagyoday Cotton and Agri Market', 'Bhandara', 'Bhivandi', 'Bhiwapur', 'Bhokar', 'Bhokardan', 'Bhokardan(Pimpalgaon Renu)', 'Bhusaval', 'Bodwad', 'Bori', 'Bori Arab', 'Buldhana', 'Buldhana(Dhad)', 'Chakur', 'Chalisgaon', 'Chandrapur', 'Chandrapur(Ganjwad)', 'Chandur Bazar', 'Chandur Railway', 'Chandvad', 'Chattrapati Sambhajinagar', 'Chikali', 'Chimur', 'Chopada', 'Cottoncity Agro Foods Private Ltd', 'Darwha', 'Daryapur', 'Deglur', 'Deoulgaon Raja', 'Deulgaon Raja Balaji Agro Marketing Private Market', 'Devala', 'Devani', 'Dhadgaon', 'Dhamngaon-Railway', 'Dharangaon', 'Dharashiv', 'Dharmabad', 'Dharni', 'Dhule', 'Digras', 'Dindori', 'Dindori(Vani)', 'Dondaicha', 'Dondaicha(Sindhkheda)', 'Dound', 'Dudhani', 'Fulmbri', 'Gadhinglaj', 'Gajanan Krushi Utpanna Bazar (India) Pvt Ltd', 'Gangakhed', 'Gangapur', 'Gevrai', 'Ghansawangi', 'Ghatanji', 'Ghoti', 'Gondpimpri', 'Gopal Krishna Agro', 'Hadgaon', 'Hadgaon(Tamsa)', 'Hari Har Khajagi Bazar Parisar', 'Higanghat Infrastructure Private Limited', 'Himalyatnagar', 'Hinganghat', 'Hingna', 'Hingoli', 'Hingoli(Kanegoan Naka)', 'Indapur', 'Indapur(Bhigwan)', 'Indapur(Nimgaon Ketki)', 'Islampur', 'J S K Agro Market', 'Jafrabad', 'Jagdamba Agrocare', 'Jai Gajanan Krishi Bazar', 'Jalana', 'Jalgaon', 'Jalgaon Jamod(Aasalgaon)', 'Jalgaon(Masawat)', 'Jalkot', 'Jalna(Badnapur)', 'Jamkhed', 'Jamner', 'Jamner(Neri)', 'Janata Agri Market (DLS Agro Infrastructure Pvt Lt', 'Jawala-Bajar', 'Jawali', 'Jaykissan Krushi Uttpan Khajgi Bazar', 'Jintur', 'Junnar', 'Junnar(Alephata)', 'Junnar(Narayangaon)', 'Junnar(Otur)', 'Kada', 'Kada(Ashti)', 'Kai Madhavrao Pawar Khajgi Krushi Utappan Bazar Sa', 'Kaij', 'Kalamb', 'Kalamb (Dharashiv)', 'Kalamnuri', 'Kalmeshwar', 'Kalvan', 'Kalyan', 'Kamthi', 'Kandhar', 'Kannad', 'Karad', 'Karanja', 'Karjat', 'Karjat(Raigad)', 'Karmala', 'Katol', 'Khamgaon', 'Khed', 'Khed(Chakan)', 'Khultabad', 'Kille Dharur', 'Kinwat', 'Kisan Market Yard', 'Kolhapur', 'Kolhapur(Malkapur)', 'Kopargaon', 'Koregaon', 'Korpana', 'Krushna Krishi Bazar', 'Kurdwadi', 'Kurdwadi(Modnimb)', 'Lakhandur', 'Lasalgaon', 'Lasalgaon(Niphad)', 'Lasalgaon(Vinchur)', 'Lasur Station', 'Late Vasantraoji Dandale Khajgi Krushi Bazar', 'Latur', 'Latur(Murud)', 'Laxmi Sopan Agriculture Produce Marketing Co Ltd', 'Loha', 'Lonand', 'Lonar', 'MS Kalpana Agri Commodities Marketing', 'Mahagaon', 'Maharaja Agresen Private Krushi Utappan Bazar Sama', 'Mahavir Agri Market', 'Mahavira Agricare', 'Mahesh Krushi Utpanna Bazar, Digras', 'Mahur', 'Majalgaon', 'Malegaon', 'Malegaon(Vashim)', 'Malharshree Farmers Producer Co Ltd', 'Malkapur', 'Manchar', 'Mandhal', 'Mangal Wedha', 'Mangaon', 'Mangrulpeer', 'Mankamneshwar Farmar Producer CoLtd Sanchalit Mank', 'Manmad', 'Manora', 'Mantha', 'Manwat', 'Marathawada Shetkari Khajgi Bazar Parisar', 'Maregoan', 'Mauda', 'Mehekar', 'Mohol', 'Morshi', 'Motala', 'Mudkhed', 'Mukhed', 'Mulshi', 'Mumbai', 'Mumbai- Fruit Market', 'Murbad', 'Murtizapur', 'Murud', 'Murum', 'N N Mundhada Agriculture Market Produce', 'Nagpur', 'Naigaon', 'Nampur', 'Nanded', 'Nandgaon', 'Nandgaon Khandeshwar', 'Nandura', 'Nandurbar', 'Narkhed', 'Nashik(Devlali)', 'Nasik', 'Navapur', 'Ner Parasopant', 'Newasa', 'Newasa(Ghodegaon)', 'Nilanga', 'Nira', 'Nira(Saswad)', 'Om Chaitanya Multistate Agro Purpose CoOp Society', 'Pachora', 'Pachora(Bhadgaon)', 'Paithan', 'Palam', 'Palghar', 'Palus', 'Pandhakawada', 'Pandharpur', 'Panvel', 'Parali Vaijyanath', 'Paranda', 'Parbhani', 'Parner', 'Parola', 'Parshiwani', 'Partur', 'Partur(Vatur)', 'Patan', 'Pathardi', 'Pathari', 'Patoda', 'Patur', 'Pavani', 'Pen', 'Perfect Krishi Market Yard Pvt Ltd', 'Phaltan', 'Pimpalgaon', 'Pimpalgaon Baswant(Saykheda)', 'Pombhurni', 'Pratap Nana Mahale Khajgi Bajar Samiti', 'Premium Krushi Utpanna Bazar', 'Pulgaon', 'Pune', 'Pune(Khadiki)', 'Pune(Manjri)', 'Pune(Moshi)', 'Pune(Pimpri)', 'Purna', 'Pusad', 'Rahata', 'Rahuri', 'Rahuri(Songaon)', 'Rahuri(Vambori)', 'Rajura', 'Ralegaon', 'Ramdev Krushi Bazaar', 'Ramtek', 'Rangrao Patil Krushi Utpanna Khajgi Bazar', 'Ratnagiri (Nachane)', 'Raver', 'Raver(Sauda)', 'Risod', 'Sakri', 'Samudrapur', 'Sangamner', 'Sangli', 'Sangli(Phale, Bhajipura Market)', 'Sangola', 'Sangrampur(Varvatbakal)', 'Sant Namdev Krushi Bazar,', 'Satana', 'Satara', 'Savner', 'Selu', 'Sengoan', 'Shahada', 'Shahapur', 'Shantilal Jain Agro', 'Shegaon', 'Shekari Krushi Khajgi Bazar', 'Shetkari Khajgi Bajar', 'Shetkari Khushi Bazar', 'Shevgaon', 'Shevgaon(Bodhegaon)', 'Shirpur', 'Shirur', 'Shivsiddha Govind Producer Company Limited Sanchal', 'Shree Rameshwar Krushi Market', 'Shree Sairaj Krushi Market', 'Shree Salasar Krushi Bazar', 'Shri Gajanan Maharaj Khajagi Krushi Utpanna Bazar', 'Shrigonda', 'Shrigonda(Gogargaon)', 'Shrirampur', 'Shrirampur(Belapur)', 'Sillod', 'Sillod(Bharadi)', 'Sindi', 'Sindi(Selu)', 'Sindkhed Raja', 'Sinner', 'Sironcha', 'Solapur', 'Sonpeth', 'Suragana', 'Tadkalas', 'Taloda', 'Tasgaon', 'Telhara', 'Tiwasa', 'Tuljapur', 'Tumsar', 'Udgir', 'Ulhasnagar', 'Umared', 'Umarga', 'Umari', 'Umarked(Danki)', 'Umarkhed', 'Umrane', 'Vadgaonpeth', 'Vaduj', 'Vadvani', 'Vai', 'Vaijpur', 'Vani', 'Varora', 'Varud', 'Varud(Rajura Bazar)', 'Vasai', 'Vashi New Mumbai', 'Vita', 'Vitthal Krushi Utpanna Bazar', 'Wardha', 'Washi (Dharashiv)', 'Washim', 'Washim(Ansing)', 'Yashika Agro Marketing', 'Yawal', 'Yeola', 'Yeotmal', 'ZariZamini']; // Replace with your market list
const COMMODITIES =['Ajwan', 'Arecanut(Betelnut/Supari)', 'Arhar (Tur/Red Gram)(Whole)', 'Arhar Dal(Tur Dal)', 'Bajra(Pearl Millet/Cumbu)', 'Banana', 'Bengal Gram Dal (Chana Dal)', 'Bengal Gram(Gram)(Whole)', 'Bhindi(Ladies Finger)', 'Bitter gourd', 'Black Gram (Urd Beans)(Whole)', 'Black Gram Dal (Urd Dal)', 'Black pepper', 'Bottle gourd', 'Brinjal', 'Cabbage', 'Carrot', 'Cashewnuts', 'Castor Seed', 'Cauliflower', 'Chikoos(Sapota)', 'Chili Red', 'Chilly Capsicum', 'Coconut', 'Coriander(Leaves)', 'Corriander seed', 'Cotton', 'Cowpea (Lobia/Karamani)', 'Cucumbar(Kheera)', 'Cummin Seed(Jeera)', 'Drumstick', 'French Beans (Frasbean)', 'Garlic', 'Ginger(Dry)', 'Ginger(Green)', 'Grapes', 'Green Gram (Moong)(Whole)', 'Green Gram Dal (Moong Dal)', 'Green Peas', 'Guava', 'Jack Fruit', 'Jamun(Narale Hannu)', 'Jowar(Sorghum)', 'Kulthi(Horse Gram)', 'Lentil (Masur)(Whole)', 'Lime', 'Linseed', 'Maize', 'Mango', 'Methi(Leaves)', 'Mustard', 'Neem Seed', 'Niger Seed (Ramtil)', 'Onion', 'Orange', 'Papaya', 'Pineapple', 'Pomegranate', 'Potato', 'Pumpkin', 'Raddish', 'Ragi (Finger Millet)', 'Rice', 'Safflower', 'Sesamum(Sesame,Gingelly,Til)', 'Soanf', 'Soyabean', 'Spinach', 'Sugarcane', 'Sunflower', 'Tomato', 'Turmeric', 'Water Melon', 'Wheat']; // Replace with your commodity list
const VARIETIES =['1009 Kar', '147 Average', '1st Sort', '2nd Sort', 'Average (Whole)', 'Bansi', 'Black', 'Bold', 'DCH-32(Unginned)', 'Deshi Red', 'Deshi White', 'Desi', 'F.A.Q. Bold', 'Full Green', 'Gajjar', 'Green (Whole)', 'H-4(A) 27mm FIne', 'Hapus(Alphaso)', 'Hybrid', 'Jalgaon', 'Jowar ( White)', 'Jowar (Yellow)', 'Kabul Small', 'Kalyan', 'Kesari', 'Khandesh', 'LH-900', 'LRA', 'Local', 'Maharashtra 2189', 'Mogan Medium', 'N-44', 'Niger Seed', 'Other', 'Pole', 'RCH-2', 'Rajapuri', 'Red', 'Sharbati', 'Totapuri', 'Varalaxmi', 'White', 'White Fozi', 'Yellow', 'Yellow (Black)']; // Replace with your variety list
const AGRI_SEASONS = ['Kharif', 'Rabi', 'Zaid'];
const CLIMATE_SEASONS = ["Monsoon", "Post-Monsoon", "Summer", "Winter"];
// State persistence functions
function saveFormState() {
    const form = document.getElementById('price-estimation-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const state = {};
    
    for (let [key, value] of formData.entries()) {
        state[key] = value;
    }
    
    // Save to sessionStorage (persists during browser session)
    sessionStorage.setItem('priceEstimationState', JSON.stringify(state));
}

function loadFormState() {
    const savedState = sessionStorage.getItem('priceEstimationState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        
        // Restore form values
        Object.keys(state).forEach(key => {
            const element = document.getElementById(key);
            if (element && state[key]) {
                element.value = state[key];
                
                // Trigger change event to update dependent fields
                if (key === 'district') {
                    const marketSelect = document.getElementById('market');
                    if (marketSelect && state[key] !== '') {
                        marketSelect.disabled = false;
                    }
                }
            }
        });
        
        console.log('Form state restored');
    } catch (error) {
        console.error('Error loading form state:', error);
    }
}

function clearFormState() {
    sessionStorage.removeItem('priceEstimationState');
}

// Enhanced state persistence with URL parameters (alternative approach)
function saveStateToURL() {
    const form = document.getElementById('price-estimation-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const params = new URLSearchParams();
    
    for (let [key, value] of formData.entries()) {
        if (value) {
            params.set(key, value);
        }
    }
    
    // Update URL without reloading page
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState({}, '', newURL);
}

function loadStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    params.forEach((value, key) => {
        const element = document.getElementById(key);
        if (element) {
            element.value = value;
            
            // Handle district change to enable markets
            if (key === 'district' && value !== '') {
                const marketSelect = document.getElementById('market');
                if (marketSelect) {
                    marketSelect.disabled = false;
                }
            }
        }
    });
}

function initPriceEstimation() {
    const form = document.getElementById('price-estimation-form');
    const districtSelect = document.getElementById('district');
    const marketSelect = document.getElementById('market');
    const monthSelect = document.getElementById('month');
    const commoditySelect = document.getElementById('commodity');
    const varietySelect = document.getElementById('variety');
    const resultsSection = document.getElementById('price-results');
    const errorMessage = document.getElementById('error-message');

    populateDistricts();
    populateMonths();
    populateCommodities();
    populateVarieties();
    populateAgriSeasons();
    populateClimateSeasons();
    populateMarkets();

    // Load saved state after populating dropdowns
    setTimeout(() => {
        loadFormState(); // Using sessionStorage approach
        // loadStateFromURL(); // Alternative: using URL parameters
    }, 100);

    districtSelect.addEventListener('change', function () {
        const selectedDistrict = this.value;
        if (selectedDistrict !== '') {
            marketSelect.disabled = false;
        } else {
            marketSelect.disabled = true;
            marketSelect.selectedIndex = 0;
        }
        
        // Save state on change
        saveFormState();
        // saveStateToURL(); // Alternative approach
    });

    // Add event listeners to save state on all form changes
    form.addEventListener('change', function() {
        saveFormState();
        // saveStateToURL(); // Alternative approach
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        estimatePrice();
    });

    form.addEventListener('reset', function () {
        hideResults();
        hideError();
        marketSelect.disabled = true;
        clearFormState(); // Clear saved state on reset
        
        // Clear URL parameters (if using URL approach)
        // window.history.replaceState({}, '', window.location.pathname);
    });

    // Save state before page unload
    window.addEventListener('beforeunload', function() {
        saveFormState();
    });
}

// Auto-save functionality with debouncing
let saveTimeout;
function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveFormState();
    }, 500); // Save 500ms after user stops typing/selecting
}

function populateDistricts() {
    const districtSelect = document.getElementById('district');
    districtSelect.innerHTML = '<option value="">Choose a district</option>';
    
    DISTRICTS.forEach((district, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

function populateMonths() {
    const monthSelect = document.getElementById('month');
    monthSelect.innerHTML = '<option value="">Choose a month</option>';
    
    MONTHS.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

function populateMarkets() {
    const marketSelect = document.getElementById('market');
    marketSelect.innerHTML = '<option value="">Choose a market</option>';
    
    MARKETS.forEach((market, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = market;
        marketSelect.appendChild(option);
    });
}

function populateCommodities() {
    const commoditySelect = document.getElementById('commodity');
    commoditySelect.innerHTML = '<option value="">Choose a crop</option>';
    
    COMMODITIES.forEach((commodity, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = commodity;
        commoditySelect.appendChild(option);
    });
}

function populateVarieties() {
    const varietySelect = document.getElementById('variety');
    varietySelect.innerHTML = '<option value="">Choose a variety</option>';
    
    VARIETIES.forEach((variety, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = variety;
        varietySelect.appendChild(option);
    });
}

function populateAgriSeasons() {
    const agriSeasonSelect = document.getElementById('agri-season');
    agriSeasonSelect.innerHTML = '<option value="">Choose a season</option>';
    
    AGRI_SEASONS.forEach((season, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = season;
        agriSeasonSelect.appendChild(option);
    });
}

function populateClimateSeasons() {
    const climateSeasonSelect = document.getElementById('climate-season');
    climateSeasonSelect.innerHTML = '<option value="">Choose a climate season</option>';
    
    CLIMATE_SEASONS.forEach((season, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = season;
        climateSeasonSelect.appendChild(option);
    });
}

async function estimatePrice() {
    const form = document.getElementById('price-estimation-form');
    const formData = new FormData(form);
    
    // Get the selected indices
    const district = parseInt(formData.get('district'));
    const month = parseInt(formData.get('month'));
    const market = parseInt(formData.get('market'));
    const commodity = parseInt(formData.get('commodity'));
    const variety = parseInt(formData.get('variety'));
    const agri_season = parseInt(formData.get('agri-season'));
    const climate_season = parseInt(formData.get('climate-season'));

    // Validate that all fields are selected
    if (isNaN(district) || isNaN(month) || isNaN(market) || isNaN(commodity) || 
        isNaN(variety) || isNaN(agri_season) || isNaN(climate_season)) {
        showError('Please select all required fields.');
        return;
    }

    const requestData = {
        district: district,
        month: month,
        market: market,
        commodity: commodity,
        variety: variety,
        agri_season: agri_season,
        climate_season: climate_season
    };

    try {
        showLoading();
        const response = await fetch('https://agrosarthi-backend-885337506715.asia-south1.run.app/predict-price/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        hideLoading();

        if (response.ok) {
            // Save successful result state
            const resultState = {
                ...Object.fromEntries(new FormData(form)),
                lastResult: result,
                timestamp: Date.now()
            };
            sessionStorage.setItem('priceEstimationState', JSON.stringify(resultState));
            
            showResults({
                price_range: {
                    min: result.min_price || result.predicted_price - 500,
                    max: result.max_price || result.predicted_price + 500
                },
                insight: result.insight || result.message || 'Prediction based on historical price data.',
                predicted_price: result.predicted_price
            });
        } else {
            showError(result.detail || result.error || 'Failed to estimate price.');
        }
    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError('An error occurred while estimating price. Please check your connection and try again.');
    }
}

function showResults(result) {
    const resultsSection = document.getElementById('price-results');
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const insightText = document.getElementById('market-insight-text');

    // Use predicted price if available, otherwise use range
    if (result.predicted_price) {
        priceMin.textContent = Math.round(result.predicted_price);
        priceMax.textContent = Math.round(result.predicted_price);
    } else {
        priceMin.textContent = Math.round(result.price_range.min);
        priceMax.textContent = Math.round(result.price_range.max);
    }
    
    insightText.textContent = result.insight;

    hideError();
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function showLoading() {
    const submitButton = document.querySelector('.estimate-btn');
    const buttonText = submitButton.querySelector('span');
    const buttonIcon = submitButton.querySelector('i');
    
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    buttonText.textContent = 'Estimating...';
    buttonIcon.className = 'fas fa-spinner fa-spin';
}

function hideLoading() {
    const submitButton = document.querySelector('.estimate-btn');
    const buttonText = submitButton.querySelector('span');
    const buttonIcon = submitButton.querySelector('i');
    
    submitButton.classList.remove('loading');
    submitButton.disabled = false;
    buttonText.textContent = 'Estimate Price';
    buttonIcon.className = 'fas fa-calculator';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const errorText = errorDiv.querySelector('p');
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    hideResults();
    errorDiv.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
}

function hideResults() {
    const resultsSection = document.getElementById('price-results');
    resultsSection.style.display = 'none';
}

// Enhanced version: Restore results if they exist and are recent (within 30 minutes)
function restoreResultsIfRecent() {
    const savedState = sessionStorage.getItem('priceEstimationState');
    if (!savedState) return;
    
    try {
        const state = JSON.parse(savedState);
        if (state.lastResult && state.timestamp) {
            const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
            if (Date.now() - state.timestamp < thirtyMinutes) {
                showResults({
                    price_range: {
                        min: state.lastResult.min_price || state.lastResult.predicted_price - 500,
                        max: state.lastResult.max_price || state.lastResult.predicted_price + 500
                    },
                    insight: state.lastResult.insight || state.lastResult.message || 'Prediction based on historical price data.',
                    predicted_price: state.lastResult.predicted_price
                });
            }
        }
    } catch (error) {
        console.error('Error restoring results:', error);
    }
}

// Call this after form state is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        restoreResultsIfRecent();
    }, 200);
});