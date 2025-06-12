// Use the same language function as in script.js
function getGlobalLanguage() {
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('language='));
    return cookieLang ? cookieLang.split('=')[1] : (localStorage.getItem('language') || 'english');
}

// Function to set global language (should match the one in script.js)
function setGlobalLanguage(lang) {
    localStorage.setItem('language', lang);
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
    
    // Trigger language change event for other parts of the site
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// Map global language values to form language values
function mapGlobalToFormLanguage(globalLang) {
    const languageMap = {
        'english': 'English',
        'hindi': 'Hindi', 
        'marathi': 'Marathi'
    };
    return languageMap[globalLang] || 'English';
}

// Map form language values to API language values
function mapFormToApiLanguage(formLang) {
    const apiLanguageMap = {
        'English': 'english',
        'Hindi': 'hindi',
        'Marathi': 'marathi'
    };
    return apiLanguageMap[formLang] || 'english';
}

document.addEventListener('DOMContentLoaded', function() {
    // Clear sessionStorage ONLY on page refresh/reload
    if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
        sessionStorage.clear();
    }

    // DOM Elements
    const cameraBtn = document.getElementById('camera-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const cameraContainer = document.getElementById('camera-container');
    const cameraFeed = document.getElementById('camera-feed');
    const captureBtn = document.getElementById('capture-btn');
    const cameraCancelBtn = document.getElementById('camera-cancel-btn');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const resetBtn = document.getElementById('reset-btn');
    const dragArea = document.getElementById('drag-area');
    const fileInput = document.getElementById('file-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsSection = document.getElementById('results-section');
    const diseaseResults = document.getElementById('disease-results');
    const diseaseSelect = document.getElementById('disease-select');

    const cropNameInput = document.getElementById('crop-name-input');
    const languageSelect = document.getElementById('language-select');

    let stream = null;
    let capturedImage = null;
    let isAnalyzing = false;

    function init() {
        // Set initial language from global language
        syncLanguageWithGlobal();
        setupEventListeners();
        restoreFromStorage();
        
        // Listen for global language changes
        window.addEventListener('languageChanged', syncLanguageWithGlobal);
    }

    function syncLanguageWithGlobal() {
        const globalLang = getGlobalLanguage();
        const formLang = mapGlobalToFormLanguage(globalLang);
        languageSelect.value = formLang;
        
        // Save to session storage
        sessionStorage.setItem('language', formLang);
    }

    function setupEventListeners() {
        cameraBtn.addEventListener('click', activateCamera);
        uploadBtn.addEventListener('click', () => {
            resetUI(false);
            dragArea.classList.add('active');
        });
        captureBtn.addEventListener('click', captureImage);
        cameraCancelBtn.addEventListener('click', () => {
            stopCamera();
            resetUI();
        });
        resetBtn.addEventListener('click', resetUI);
        fileInput.addEventListener('change', handleFileSelect);
        document.querySelector('.browse-btn').addEventListener('click', () => {
            fileInput.click();
        });
        dragArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragArea.classList.add('highlight');
        });
        dragArea.addEventListener('dragleave', () => {
            dragArea.classList.remove('highlight');
        });
        dragArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragArea.classList.remove('highlight');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });
        analyzeBtn.addEventListener('click', analyzeImage);

        cropNameInput.addEventListener('input', saveToStorage);
        
        // When user manually changes language in form, update global language
        languageSelect.addEventListener('change', (e) => {
            const formLang = e.target.value;
            const globalLang = mapFormToApiLanguage(formLang).toLowerCase();
            setGlobalLanguage(globalLang);
            saveToStorage();
        });
    }

    async function activateCamera() {
        resetUI(false);
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            cameraFeed.srcObject = stream;
            cameraContainer.classList.add('active');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access the camera. Please ensure you have granted camera permissions.');
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            cameraFeed.srcObject = null;
        }
        cameraContainer.classList.remove('active');
    }

    function captureImage() {
        const canvas = document.createElement('canvas');
        canvas.width = cameraFeed.videoWidth;
        canvas.height = cameraFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(cameraFeed, 0, 0, canvas.width, canvas.height);

        capturedImage = canvas.toDataURL('image/jpeg');
        imagePreview.src = capturedImage;

        stopCamera();
        previewContainer.classList.add('active');
        analyzeBtn.disabled = false;

        saveToStorage();
    }

    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    }

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            alert('Please select an image file (jpg, jpeg, png).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            capturedImage = e.target.result;
            imagePreview.src = capturedImage;
            dragArea.classList.remove('active');
            previewContainer.classList.add('active');
            analyzeBtn.disabled = false;

            saveToStorage();
        };
        reader.readAsDataURL(file);
    }

    function resetUI(clearStorage = true) {
        stopCamera();
        capturedImage = null;
        imagePreview.src = '';
        cameraContainer.classList.remove('active');
        previewContainer.classList.remove('active');
        dragArea.classList.remove('active');
        resultsSection.classList.remove('active');
        analyzeBtn.disabled = true;
        analyzeBtn.classList.remove('loading');
        diseaseResults.innerHTML = '';
        diseaseSelect.value = '';
        if (clearStorage) {
            sessionStorage.clear();
            cropNameInput.value = '';
            // Reset language to global language instead of hardcoded value
            syncLanguageWithGlobal();
        }
    }

    function saveToStorage() {
        if (cropNameInput.value) sessionStorage.setItem('cropName', cropNameInput.value);
        if (languageSelect.value) sessionStorage.setItem('language', languageSelect.value);
        if (capturedImage) sessionStorage.setItem('capturedImage', capturedImage);
    }

    function restoreFromStorage() {
        const savedCrop = sessionStorage.getItem('cropName');
        const savedLang = sessionStorage.getItem('language');
        const savedImage = sessionStorage.getItem('capturedImage');
        const savedResult = sessionStorage.getItem('analysisResult');

        if (savedCrop) cropNameInput.value = savedCrop;
        
        // If there's a saved language and it's different from global, use global instead
        if (savedLang) {
            languageSelect.value = savedLang;
        } else {
            syncLanguageWithGlobal();
        }
        
        if (savedImage) {
            capturedImage = savedImage;
            imagePreview.src = capturedImage;
            previewContainer.classList.add('active');
            analyzeBtn.disabled = false;
        }

        if (savedResult) {
            displayAnalysisResult(savedResult);
        }
    }

    async function analyzeImage() {
        if (!capturedImage || !cropNameInput.value.trim() || !languageSelect.value || isAnalyzing) {
            alert('Please provide crop name, select language and upload/capture an image.');
            return;
        }

        isAnalyzing = true;
        analyzeBtn.classList.add('loading');
        analyzeBtn.disabled = true;
        diseaseResults.innerHTML = '';
        resultsSection.classList.remove('active');

        try {
            const res = await fetch(capturedImage);
            const blob = await res.blob();

            const formData = new FormData();
            formData.append('crop_name', cropNameInput.value.trim().toLowerCase());
            
            // Use the mapped API language value
            const apiLanguage = mapFormToApiLanguage(languageSelect.value);
            formData.append('language', apiLanguage);
            formData.append('file', blob, 'image.jpg');

            const response = await fetch('https://agrosarthi-backend-885337506715.asia-south1.run.app/predict-disease/', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();

            sessionStorage.setItem('analysisResult', data.predicted_disease_and_remedies);

            displayAnalysisResult(data.predicted_disease_and_remedies);

        } catch (error) {
            console.error('Error analyzing disease:', error);
            alert('Failed to analyze disease. Please try again later.');
        } finally {
            isAnalyzing = false;
            analyzeBtn.classList.remove('loading');
            analyzeBtn.disabled = false;
        }
    }

    function displayAnalysisResult(htmlString) {
        diseaseResults.innerHTML = `
            <div class="analysis-result-card">
                <div class="disease-image">
                    <img src="${capturedImage || 'images/placeholder-leaf.svg'}" alt="Leaf Image">
                </div>
                <div class="disease-details">
                    ${htmlString}
                </div>
            </div>
        `;
        resultsSection.classList.add('active');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    init();
});