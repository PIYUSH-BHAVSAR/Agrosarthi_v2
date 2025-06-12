document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('yield-prediction-form');
  const resultsSection = document.getElementById('yield-results');
  const errorMessage = document.getElementById('error-message');

  const totalYieldElem = document.getElementById('total-yield');
  const yieldTonsElem = document.getElementById('yield-tons');
  const perHectareYieldElem = document.getElementById('per-hectare-yield');
  const yieldInsightText = document.getElementById('yield-insight-text'); // Note: Ensure this element exists in HTML!

  // Lists of states, districts, and commodities
  const statesAndDistricts = {
    "Maharashtra":['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal', 'latur']
    // Add all states and their districts here
  };

  const commodities = ['Ajwain (Carom Seeds)', 'Aloe Vera', 'Arecanut (Betelnut)', 'Arhar/tur', 'Ashwagandha', 'Bajra', 'Bajra (Pearl Millet)', 'Banana', 'Barley', 'Ber (Indian Jujube)', 'Berseem', 'Bitter Gourd', 'Black Pepper', 'Bottle Gourd', 'Brinjal (Eggplant)', 'Cabbage', 'Carrot', 'Cashew Nut', 'Castor Seed', 'Castor seed', 'Cauliflower', 'Chana (Bengal Gram)', 'Chikoo (Sapota)', 'Chilli', 'Cluster Beans (Gavar)', 'Coconut', 'Coffee', 'Coriander', 'Coriander Seeds', 'Cotton', 'Cotton(lint)', 'Cucumber', 'Cumin (Jeera)', 'Custard Apple', 'Dill Seeds', 'Drumstick', 'Fennel (Saunf)', 'Fenugreek (Methi)', 'Fig (Anjeer)', 'French Beans', 'Garlic', 'Ginger', 'Gram', 'Grapes', 'Green Peas', 'Groundnut', 'Guava', 'Hybrid Napier Grass', 'Jackfruit', 'Jamun', 'Jowar', 'Jowar (Sorghum)', 'Kulthi (Horse Gram)', 'Lady Finger (Bhindi)', 'Lemon', 'Lemongrass', 'Linseed', 'Lobia (Cowpea)', 'Lucerne', 'Maize', 'Maize (For Fodder)', 'Mango', 'Masoor (Lentil)', 'Moong (Green Gram)', 'Moong(green gram)', 'Muskmelon', 'Mustard', 'Mustard Seeds', 'Neem', 'Niger (Ramtil)', 'Niger seed', 'Onion', 'Orange', 'Papaya', 'Pineapple', 'Pomegranate', 'Potato', 'Pumpkin', 'Radish', 'Ragi', 'Ragi (Finger Millet)', 'Rajma (Kidney Beans)', 'Rapeseed & Mustard', 'Rice', 'Safflower', 'Safflower (Kardi)', 'Sarpagandha', 'Sesame (Til)', 'Sesamum', 'Sorghum (For Fodder)', 'Soyabean', 'Soybean', 'Spinach', 'Sugarcane', 'Sunflower', 'Sweet Lime (Mosambi)', 'Tea', 'Tobacco', 'Tomato', 'Tulsi (Holy Basil)', 'Tur (Arhar/Red Gram)', 'Turmeric', 'Urad', 'Urad (Black Gram)', 'Watermelon', 'Wheat'];

  // Elements
  const stateSelect = form.state;
  const districtSelect = form.district;
  const commoditySelect = form.commodity;

  // Populate state dropdown
  function populateStates() {
    // Clear existing options except placeholder
    stateSelect.innerHTML = `<option value="">Choose a state</option>`;
    Object.keys(statesAndDistricts).forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });
  }

  // Populate district dropdown based on selected state
  function populateDistricts(state) {
    districtSelect.innerHTML = `<option value="">Choose a district</option>`;
    if (statesAndDistricts[state]) {
      statesAndDistricts[state].forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
      });
      districtSelect.disabled = false;
    } else {
      districtSelect.disabled = true;
    }
  }

  // Populate commodities dropdown
  function populateCommodities() {
    commoditySelect.innerHTML = `<option value="">Choose a crop</option>`;
    commodities.forEach(commodity => {
      const option = document.createElement('option');
      option.value = commodity;
      option.textContent = commodity;
      commoditySelect.appendChild(option);
    });
  }

  // Event listener to populate districts when state changes
  stateSelect.addEventListener('change', () => {
    populateDistricts(stateSelect.value);
    saveFormState();  // Save updated form state when state changes
  });

  // Populate initial dropdowns
  populateStates();
  populateCommodities();

  // Hide chart container (remove charts) - existing code
  const chartContainer = document.getElementById('yield-chart-container');
  if (chartContainer) {
    chartContainer.style.display = 'none';
    const chartTitle = chartContainer.previousElementSibling;
    if (chartTitle) chartTitle.style.display = 'none';
  }

  // Save form state to localStorage
  function saveFormState() {
    const formData = {
      state: form.state.value,
      district: form.district.value,
      commodity: form.commodity.value,
      season: form.season.value,
      area: form.area.value,
      soilType: form['soil-type'].value
    };
    localStorage.setItem('yieldFormState', JSON.stringify(formData));
  }

  // Load form state from localStorage
  function loadFormState() {
    const savedState = localStorage.getItem('yieldFormState');
    if (savedState) {
      const formData = JSON.parse(savedState);

      if (formData.state) {
        form.state.value = formData.state;
        populateDistricts(formData.state);
      }
      if (formData.district) {
        form.district.disabled = false; // Enable district if saved
        form.district.value = formData.district;
      }
      if (formData.commodity) form.commodity.value = formData.commodity;
      if (formData.season) form.season.value = formData.season;
      if (formData.area) form.area.value = formData.area;
      if (formData.soilType) form['soil-type'].value = formData.soilType;
    }
  }

  // Save form state on change for all inputs/selects
  form.addEventListener('change', saveFormState);

  // Submit form handler (existing code)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide error and results initially
    errorMessage.style.display = 'none';
    resultsSection.style.display = 'none';
    if (yieldInsightText) yieldInsightText.textContent = 'Analyzing yield patterns...';

    // Disable button during request
    const submitBtn = form.querySelector('.predict-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('i').classList.add('fa-spinner', 'fa-spin');

    // Prepare data
    const data = {
      state: form.state.value,
      district: form.district.value,
      commodity: form.commodity.value,
      season: form.season.value,
      area_hectare: parseFloat(form.area.value)
    };

    try {
      const response = await fetch('https://agrosarthi-backend-885337506715.asia-south1.run.app/predict-yield/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }

      const result = await response.json();

      // Calculate total predicted yield in kg (ton/ha * area * 1000)
      const predictedYieldKg = result.predicted_yield_ton_ha * result.area_hectare * 1000;
      const predictedYieldTons = predictedYieldKg / 1000;

      // Update results UI
      totalYieldElem.textContent = predictedYieldKg.toFixed(2);
      yieldTonsElem.textContent = `(${predictedYieldTons.toFixed(2)} tons)`;
      perHectareYieldElem.textContent = (result.predicted_yield_ton_ha * 1000).toFixed(2);

      if (yieldInsightText) {
        yieldInsightText.textContent = `The predicted yield for ${result.commodity} in ${result.district}, ${result.state} during ${result.season} season is approximately ${predictedYieldKg.toFixed(2)} kg over ${result.area_hectare} hectares.`;
      }

      // Show results section
      resultsSection.style.display = 'block';

    } catch (error) {
      console.error('Prediction API error:', error);
      errorMessage.style.display = 'flex';
    } finally {
      // Re-enable button and remove spinner
      submitBtn.disabled = false;
      submitBtn.querySelector('i').classList.remove('fa-spinner', 'fa-spin');
    }
  });

  // Load saved form state on page load and populate districts accordingly
  loadFormState();
});
