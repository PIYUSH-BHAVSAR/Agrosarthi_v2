// schedule.js content

// Use the same language function as in script.js (if it exists globally, otherwise you might need to import or duplicate)
// For now, assuming getGlobalLanguage is available or define a placeholder if not.
function getGlobalLanguage() {
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('language='));
    return cookieLang ? cookieLang.split('=')[1] : (localStorage.getItem('language') || 'en');
}

// Keys for localStorage
const LOCAL_STORAGE_FORM_DATA_KEY = 'lastFormData';
const LOCAL_STORAGE_PREDICTION_RESPONSE_KEY = 'lastCropPredictionResponse';
const LOCAL_STORAGE_ACTIVE_FORM_KEY = 'activeForm';
const LOCAL_STORAGE_LANGUAGE_KEY = 'language'; 

// Global variables to hold parsed data for easy access
let globalLastFormData = null;
let globalLastPredictionResponse = null;
let currentCropPlanDataForPdf = null; // Stores the active crop plan for PDF generation

document.addEventListener('DOMContentLoaded', initSchedulePage);

function initSchedulePage() {
    loadGlobalDataFromLocalStorage();
    displayCropRecommendationCards(); // Directly display cards

    // Dummy buttons are for testing purposes, can be removed in production
    const setDummyBtn = document.getElementById('setDummyDataBtn');
    if (setDummyBtn) setDummyBtn.addEventListener('click', setDummyData);

    const clearStorageBtn = document.getElementById('clearLocalStorageBtn');
    if (clearStorageBtn) clearStorageBtn.addEventListener('click', clearAllLocalStorage);

    document.getElementById('download-pdf').addEventListener('click', downloadCropPlanPdf);

    // Initial message if no crops are loaded (for the cards section)
    const noRecsElement = document.getElementById('noCropRecommendations');
    const infoMessageElement = document.getElementById('infoMessage'); // Assuming this exists for general info
    
    if (!globalLastPredictionResponse || !globalLastPredictionResponse.top_crops || globalLastPredictionResponse.top_crops.length === 0) {
        if (infoMessageElement) infoMessageElement.classList.remove('hidden');
        if (noRecsElement) noRecsElement.classList.remove('hidden'); // Show message if no recommendations
    } else {
        if (infoMessageElement) infoMessageElement.classList.add('hidden');
        if (noRecsElement) noRecsElement.classList.add('hidden'); // Hide if there are recommendations
    }

    // Initialize reminder modal functionality
    initReminderModal();
}

function initReminderModal() {
    const reminderToggle = document.getElementById('reminder-toggle');
    const setReminderBtn = document.getElementById('set-reminder-btn');
    const reminderModal = document.getElementById('reminder-modal');
    const closeModalBtn = reminderModal ? reminderModal.querySelector('.close-modal') : null;
    const reminderForm = document.getElementById('reminder-form');

    if (reminderToggle && setReminderBtn) {
        reminderToggle.addEventListener('change', function() {
            setReminderBtn.disabled = !this.checked;
        });

        setReminderBtn.addEventListener('click', function() {
            if (reminderModal) {
                reminderModal.style.display = 'block';
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            reminderModal.style.display = 'none';
        });
    }

    if (window && reminderModal) {
        window.addEventListener('click', function(event) {
            if (event.target == reminderModal) {
                reminderModal.style.display = 'none';
            }
        });
    }

    if (reminderForm) {
        reminderForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const phone = document.getElementById('phone').value;
            const language = document.getElementById('language').value;

            // Basic validation
            if (!phone || phone.length !== 10 || isNaN(phone)) {
                alert('Please enter a valid 10-digit phone number.');
                return;
            }

            if (!currentCropPlanDataForPdf || !currentCropPlanDataForPdf.steps || currentCropPlanDataForPdf.steps.length === 0) {
                alert('No crop plan selected to set reminders for. Please view a crop plan first.');
                return;
            }

            const loadingModal = showLoadingModal('Setting up call reminders...');

            try {
                const reminderPayload = {
                    phone_number: phone,
                    language: language,
                    crop_name: currentCropPlanDataForPdf.name,
                    plan_steps: currentCropPlanDataForPdf.steps.map(step => ({
                        title: step.title,
                        timeframe: step.timeframe,
                        description: step.description,
                        tasks: step.tasks
                    }))
                };

                const response = await fetch('http://127.0.0.1:8000/set-crop-reminders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reminderPayload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                alert(result.message || 'Reminders set successfully!');
                reminderModal.style.display = 'none';

            } catch (error) {
                console.error('Error setting reminders:', error);
                alert(`Failed to set reminders: ${error.message}. Please try again.`);
            } finally {
                closeLoadingModal(loadingModal);
            }
        });
    }
}


function loadGlobalDataFromLocalStorage() {
    function getParsedItem(key) {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                return JSON.parse(item);
            } catch (e) {
                console.error(`Error parsing localStorage key "${key}":`, e);
                return null;
            }
        }
        return null;
    }

    globalLastFormData = getParsedItem(LOCAL_STORAGE_FORM_DATA_KEY);
    globalLastPredictionResponse = getParsedItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY);

    // Show/hide info message based on whether there's data
    const infoMessage = document.getElementById('infoMessage');
    if (infoMessage) { // Check if the element exists
        if (globalLastFormData || globalLastPredictionResponse) {
            infoMessage.classList.add('hidden');
        } else {
            infoMessage.classList.remove('hidden');
        }
    }
}

function displayCropRecommendationCards() {
    const cropCardsContainer = document.getElementById('cropCardsContainer');
    const noRecsElement = document.getElementById('noCropRecommendations'); 

    if (cropCardsContainer) {
        cropCardsContainer.innerHTML = ''; // Clear previous cards
    }
    if (noRecsElement) {
        noRecsElement.classList.add('hidden'); // Hide no results msg
    }

    if (globalLastPredictionResponse && globalLastPredictionResponse.top_crops && globalLastPredictionResponse.top_crops.length > 0) {
        // Ensure globalLastFormData is available to get the input parameters for the plan
        if (!globalLastFormData || typeof globalLastFormData !== 'object') {
            if (cropCardsContainer) {
                cropCardsContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">Cannot generate crop plans: Last Form Data is missing or corrupt in LocalStorage.</p>`;
            }
            return;
        }

        // Display up to 3 recommended crops
        globalLastPredictionResponse.top_crops.slice(0, 3).forEach((cropName, index) => {
            const explanation = globalLastPredictionResponse.explanations[index] || "No detailed explanation available.";
            createCropCard(cropName, globalLastFormData, explanation);
        });
    } else {
        if (noRecsElement) {
            noRecsElement.classList.remove('hidden');
        }
    }
}

function createCropCard(cropName, formData, explanation) {
    const cropCardsContainer = document.getElementById('cropCardsContainer');
    if (!cropCardsContainer) return; // Exit if container doesn't exist

    const cropCard = document.createElement('div');
    cropCard.className = 'crop-card';

    const cardBody = `
        <div class="crop-card-header">${cropName}</div>
        <div class="crop-card-body">
            <p><strong>N:</strong> ${formData.nitrogen || 'N/A'}</p>
            <p><strong>P:</strong> ${formData.phosphorus || 'N/A'}</p>
            <p><strong>K:</strong> ${formData.potassium || 'N/A'}</p>
            <p><strong>pH:</strong> ${formData.ph || 'N/A'}</p>
            <p><strong>Temp:</strong> ${formData.temperature || 'N/A'} °C</p>
            <p><strong>Humidity:</strong> ${formData.humidity || 'N/A'} %</p>
            <p><strong>Rainfall:</strong> ${formData.rainfall || 'N/A'} mm</p>
            <div class="explanation-content" style="max-height: 70px; overflow: hidden;">
                <p class="mt-4 text-sm text-gray-500">${explanation}</p>
            </div>
            ${explanation.length > 200 ? `<button class="read-more-btn" data-action="expand">Read More</button>` : ''}
            <button class="crop-plan-button mt-4" data-crop-name="${cropName}">View Crop Plan</button>
        </div>
    `;
    cropCard.innerHTML = cardBody;
    
    // Add event listener for the Read More/Less button
    const readMoreBtn = cropCard.querySelector('.read-more-btn');
    if (readMoreBtn) {
        readMoreBtn.addEventListener('click', () => {
            const contentDiv = cropCard.querySelector('.explanation-content');
            const explanationParagraph = contentDiv.querySelector('p');
            const isExpanded = contentDiv.classList.contains('expanded');
            if (isExpanded) {
                contentDiv.classList.remove('expanded');
                contentDiv.style.maxHeight = '70px'; // Re-clamp
                readMoreBtn.textContent = 'Read More';
                readMoreBtn.setAttribute('data-action', 'expand');
            } else {
                contentDiv.classList.add('expanded');
                // Calculate full height, add a small buffer for spacing/padding
                contentDiv.style.maxHeight = (explanationParagraph.scrollHeight + 20) + 'px'; 
                readMoreBtn.textContent = 'Read Less';
                readMoreBtn.setAttribute('data-action', 'collapse');
            }
        });
    }

    // Add event listener to the View Crop Plan button
    cropCard.querySelector('.crop-plan-button').addEventListener('click', () => {
        handleViewCropPlan(cropName);
    });

    cropCardsContainer.appendChild(cropCard);
}

async function handleViewCropPlan(cropName) {
    const timelineContainer = document.getElementById('timeline-container');
    const noCropPlanSelected = document.getElementById('noCropPlanSelected');
    const noCropPlanData = document.getElementById('noCropPlanData');
    const selectedCropPlanTitle = document.getElementById('selectedCropPlanTitle');

    if (noCropPlanSelected) noCropPlanSelected.classList.add('hidden');
    if (noCropPlanData) noCropPlanData.classList.add('hidden');
    if (timelineContainer) timelineContainer.innerHTML = ''; // Clear previous timeline

    // Update the title for the timeline section
    if (selectedCropPlanTitle) selectedCropPlanTitle.textContent = `Cultivation Plan for ${cropName}`;

    if (!globalLastFormData || typeof globalLastFormData !== 'object') {
        if (noCropPlanData) noCropPlanData.textContent = 'Cannot generate crop plan: Form data is missing or corrupt.';
        if (noCropPlanData) noCropPlanData.classList.remove('hidden');
        return;
    }

    const formData = globalLastFormData;

    const payload = {
        crop: cropName.toLowerCase(),
        n: parseInt(formData.nitrogen),
        p: parseInt(formData.phosphorus),
        k: parseInt(formData.potassium),
        soil_ph: parseFloat(formData.ph),
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
        rainfall: parseFloat(formData.rainfall),
        language: formData.language || getGlobalLanguage() // Use language from form data or current global
    };

    if (Object.values(payload).some(val => val === undefined || (typeof val === 'number' && isNaN(val)) && typeof val !== 'string')) {
        if (noCropPlanData) noCropPlanData.textContent = 'Invalid form data for generating crop plan. Please ensure all numeric fields are valid.';
        if (noCropPlanData) noCropPlanData.classList.remove('hidden');
        console.error("Payload validation failed:", payload);
        return;
    }

    const loadingModal = showLoadingModal(`Generating crop plan for ${cropName}...`);

    try {
        const response = await fetch('https://agrosarthi-backend-885337506715.asia-south1.run.app/generate-crop-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const cropPlanData = await response.json();
        closeLoadingModal(loadingModal);
        displayCropPlanTimeline(cropPlanData);
        currentCropPlanDataForPdf = cropPlanData; // Store the data for PDF generation

    } catch (error) {
        console.error('Error generating crop plan:', error);
        closeLoadingModal(loadingModal);
        if (noCropPlanData) noCropPlanData.textContent = `Failed to get crop plan: ${error.message}. Please try again.`;
        if (noCropPlanData) noCropPlanData.classList.remove('hidden');
    }
}

function displayCropPlanTimeline(cropPlanData) {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    timelineContainer.innerHTML = ''; // Clear previous timeline

    if (!cropPlanData.steps || cropPlanData.steps.length === 0) {
        timelineContainer.innerHTML = `<p class="text-center text-gray-600">No detailed steps available for this crop plan.</p>`;
    } else {
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline'; // Create a timeline wrapper for styling
        
        cropPlanData.steps.forEach(step => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'timeline-item';
            itemDiv.innerHTML = `
                <div class="timeline-item-icon"><i class="fas ${step.icon || 'fa-info'}"></i></div>
                <div class="timeline-header">${step.title}</div>
                <div class="timeline-timeframe">${step.timeframe}</div>
                <div class="timeline-body">
                    <p>${step.description}</p>
                    ${step.tasks && step.tasks.length > 0 ? `
                        <ul class="task-list">
                            ${step.tasks.map(task => `<li><strong>${task.title}:</strong> ${task.description}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `;
            timelineDiv.appendChild(itemDiv);
        });
        timelineContainer.appendChild(timelineDiv);
    }
}

// Translations for PDF content (extend as needed, ensuring all static strings are covered)
const pdfTranslations = {
    'en': {
        'Cultivation Plan for': 'Cultivation Plan for',
        'Cultivation Plan': 'Cultivation Plan',
        'Timeframe': 'Timeframe',
        'Tasks': 'Tasks',
        'No crop plan to download. Please generate a plan first by clicking \'View Crop Plan\' on a card.': 'No crop plan to download. Please generate a plan first by clicking \'View Crop Plan\' on a card.',
        'Generating PDF for': 'Generating PDF for',
        'plan': 'plan',
        'Failed to generate PDF. Please try again. Check console for details.': 'Failed to generate PDF. Please try again. Check console for details.',
        'Generated by AgroSarthi': 'Generated by AgroSarthi'
        // Add any other static strings that appear ONLY in the PDF here
    },
    'hi': {
        'Cultivation Plan for': 'के लिए खेती की योजना',
        'Cultivation Plan': 'खेती की योजना',
        'Timeframe': 'समय-सीमा',
        'Tasks': 'कार्य',
        'No crop plan to download. Please generate a plan first by clicking \'View Crop Plan\' on a card.': 'डाउनलोड करने के लिए कोई फसल योजना नहीं है। कृपया कार्ड पर \'फसल योजना देखें\' पर क्लिक करके पहले एक योजना बनाएं।',
        'Generating PDF for': 'के लिए पीडीएफ बना रहा है',
        'plan': 'योजना',
        'Failed to generate PDF. Please try again. Check console for details.': 'पीडीएफ बनाने में विफल। कृपया पुनः प्रयास करें। विवरण के लिए कंसोल जांचें।',
        'Generated by AgroSarthi': 'एग्रोसारथी द्वारा निर्मित'
    },
    'mr': {
        'Cultivation Plan for': 'साठी लागवडीची योजना',
        'Cultivation Plan': 'लागवडीची योजना',
        'Timeframe': 'वेळेची मर्यादा',
        'Tasks': 'कार्य',
        'No crop plan to download. Please generate a plan first by clicking \'View Crop Plan\' on a card.': 'डाउनलोड करण्यासाठी कोणतीही पीक योजना नाही. कृपया कार्डवरील \'पीक योजना पहा\' वर क्लिक करून प्रथम एक योजना तयार करा.',
        'Generating PDF for': 'साठी पीडीएफ तयार करत आहे',
        'plan': 'योजना',
        'Failed to generate PDF. Please try again. Check console for details.': 'पीडीएफ तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा. तपशीलांसाठी कन्सोल तपासा.',
        'Generated by AgroSarthi': 'ॲग्रोसारथीद्वारे निर्मित'
    }
};

function getTranslatedText(key) {
    const currentLang = getGlobalLanguage();
    return pdfTranslations[currentLang] && pdfTranslations[currentLang][key] ? pdfTranslations[currentLang][key] : key;
}

// Dummy showLoadingModal and closeLoadingModal for demonstration if not provided
function showLoadingModal(message) {
    const modalOverlay = document.getElementById('loading-modal');
    const modalText = modalOverlay ? modalOverlay.querySelector('p') : null;

    if (modalOverlay) {
        modalOverlay.classList.add('active');
        if (modalText) modalText.textContent = message;
    }
    return modalOverlay; // Return the modal element for closeLoadingModal
}

function closeLoadingModal(modalElement) {
    if (modalElement) {
        modalElement.classList.remove('active');
    }
}

// Function to set dummy data for testing purposes (remove in production)
function setDummyData() {
    const dummyFormData = {
        nitrogen: 60,
        phosphorus: 40,
        potassium: 30,
        ph: 6.5,
        temperature: 25,
        humidity: 70,
        rainfall: 150,
        language: 'en' // or 'hi', 'mr' for testing localization
    };
    const dummyPredictionResponse = {
        top_crops: ["Rice", "Maize", "Wheat"],
        explanations: [
            "Rice is a staple food crop cultivated extensively in various regions globally. Its growth requires substantial water, warm temperatures, and fertile soil. Key steps include transplanting, water management, nutrient application, and pest control. Ideal conditions for rice include high rainfall and humidity.",
            "Maize, or corn, is a versatile cereal grain grown worldwide. It adapts to diverse climates but thrives in warm, well-drained soils with moderate rainfall. The cultivation process involves proper soil preparation, timely sowing, fertilization, and protection against common pests and diseases.",
            "Wheat is a global staple, crucial for bread and other food products. It prefers temperate climates with moderate rainfall. Successful wheat farming involves precise seedbed preparation, timely sowing, balanced fertilization, and effective weed and pest management throughout its growth cycle."
        ]
    };

    localStorage.setItem(LOCAL_STORAGE_FORM_DATA_KEY, JSON.stringify(dummyFormData));
    localStorage.setItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY, JSON.stringify(dummyPredictionResponse));

    loadGlobalDataFromLocalStorage();
    displayCropRecommendationCards();
    alert('Dummy data set!');
}

// Function to clear all relevant local storage data (for testing purposes)
function clearAllLocalStorage() {
    localStorage.removeItem(LOCAL_STORAGE_FORM_DATA_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PREDICTION_RESPONSE_KEY);
    currentCropPlanDataForPdf = null;
    displayCropRecommendationCards(); // Refresh cards display
    document.getElementById('timeline-container').innerHTML = ''; // Clear timeline
    document.getElementById('noCropPlanSelected').classList.remove('hidden');
    document.getElementById('noCropPlanData').classList.add('hidden');
    document.getElementById('selectedCropPlanTitle').textContent = '';
    const infoMessage = document.getElementById('infoMessage');
    if (infoMessage) infoMessage.classList.remove('hidden');
    alert('All local storage data cleared!');
}


/**
 * Downloads the current crop plan as a PDF, supporting multiple languages.
 * Assumes currentCropPlanDataForPdf already contains localized text for steps and tasks
 * if the API was called with Hindi/Marathi language.
 */
/**
 * Enhanced PDF Generation using html2canvas + jsPDF
 * This approach renders the timeline HTML as images, avoiding font issues
 */

// Add this script tag to your HTML head section:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

async function downloadCropPlanPdf() {
    if (!currentCropPlanDataForPdf || !currentCropPlanDataForPdf.steps || currentCropPlanDataForPdf.steps.length === 0) {
        alert(getTranslatedText('No crop plan to download. Please generate a plan first by clicking \'View Crop Plan\' on a card.'));
        return;
    }

    const loadingPdfModal = showLoadingModal(`${getTranslatedText('Generating PDF for')} ${currentCropPlanDataForPdf.name || 'Crop'} ${getTranslatedText('plan')}...`);

    try {
        // Method 1: Using html2canvas (Recommended)
        await generatePdfWithHtml2Canvas();
        
        // Alternative Method 2: Using browser's print functionality
        // await generatePdfWithPrint();
        
        // Alternative Method 3: Using simplified jsPDF with UTF-8 support
        // await generateSimplifiedPdf();
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(getTranslatedText('Failed to generate PDF. Please try again. Check console for details.'));
    } finally {
        closeLoadingModal(loadingPdfModal);
    }
}

/**
 * Method 1: Generate PDF using html2canvas
 * Renders the timeline as images and creates PDF
 */
async function generatePdfWithHtml2Canvas() {
    const { jsPDF } = window.jspdf;
    
    // Create a temporary container for PDF content
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 794px;
        background: white;
        padding: 40px;
        font-family: 'Poppins', sans-serif;
        box-sizing: border-box;
    `;
    
    // Generate HTML content for PDF
    pdfContainer.innerHTML = generatePdfHtmlContent();
    document.body.appendChild(pdfContainer);
    
    try {
        // Convert HTML to canvas
        const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: pdfContainer.scrollHeight
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Save PDF
        const filename = `${(currentCropPlanDataForPdf.name || 'crop').replace(/\s/g, '_')}_cultivation_plan.pdf`;
        pdf.save(filename);
        
    } finally {
        // Clean up
        document.body.removeChild(pdfContainer);
    }
}

/**
 * Method 2: Generate PDF using browser's print functionality
 * Opens a new window with formatted content for printing/saving as PDF
 */
async function generatePdfWithPrint() {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${currentCropPlanDataForPdf.name} - ${getTranslatedText('Cultivation Plan')}</title>
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Noto+Sans+Devanagari:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            <style>
                ${getPrintStyles()}
            </style>
        </head>
        <body>
            ${generatePdfHtmlContent()}
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        window.close();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

/**
 * Method 3: Simplified jsPDF with better Unicode support
 * Uses jsPDF's built-in Unicode support (limited but works for basic text)
 */
async function generateSimplifiedPdf() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Use default font with Unicode support
    pdf.setFont("helvetica");
    pdf.setFontSize(20);
    
    let y = 20;
    const margin = 15;
    const maxWidth = pdf.internal.pageSize.width - (2 * margin);
    
    // Title
    const title = `${currentCropPlanDataForPdf.name} - ${getTranslatedText('Cultivation Plan')}`;
    pdf.text(title, pdf.internal.pageSize.width / 2, y, { align: 'center' });
    y += 20;
    
    // Steps
    currentCropPlanDataForPdf.steps.forEach((step, index) => {
        // Check if we need a new page
        if (y > 250) {
            pdf.addPage();
            y = 20;
        }
        
        // Step number and title
        pdf.setFontSize(14);
        pdf.setTextColor(0, 100, 0);
        const stepTitle = `${index + 1}. ${step.title}`;
        pdf.text(stepTitle, margin, y);
        y += 10;
        
        // Timeframe
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`${getTranslatedText('Timeframe')}: ${step.timeframe}`, margin, y);
        y += 8;
        
        // Description
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        const descLines = pdf.splitTextToSize(step.description, maxWidth);
        pdf.text(descLines, margin, y);
        y += descLines.length * 5 + 5;
        
        // Tasks
        if (step.tasks && step.tasks.length > 0) {
            pdf.setFontSize(10);
            pdf.text(`${getTranslatedText('Tasks')}:`, margin, y);
            y += 6;
            
            step.tasks.forEach(task => {
                const taskText = `• ${task.title}: ${task.description}`;
                const taskLines = pdf.splitTextToSize(taskText, maxWidth - 10);
                pdf.text(taskLines, margin + 5, y);
                y += taskLines.length * 4 + 2;
            });
        }
        
        y += 10; // Space between steps
    });
    
    // Save
    const filename = `${(currentCropPlanDataForPdf.name || 'crop').replace(/\s/g, '_')}_cultivation_plan.pdf`;
    pdf.save(filename);
}

/**
 * Generate HTML content for PDF
 */
function generatePdfHtmlContent() {
    const currentLanguage = getGlobalLanguage();
    const isDevanagari = currentLanguage === 'hi' || currentLanguage === 'mr';
    
    let html = `
        <div class="pdf-header">
            <h1>${currentCropPlanDataForPdf.name} - ${getTranslatedText('Cultivation Plan')}</h1>
            <p class="subtitle">${getTranslatedText('Generated by AgroSarthi')}</p>
        </div>
    `;
    
    currentCropPlanDataForPdf.steps.forEach((step, index) => {
        html += `
            <div class="step-section">
                <div class="step-header">
                    <h2>${index + 1}. ${step.title}</h2>
                    <p class="timeframe">${getTranslatedText('Timeframe')}: ${step.timeframe}</p>
                </div>
                <div class="step-content">
                    <p class="description">${step.description}</p>
                    ${step.tasks && step.tasks.length > 0 ? `
                        <div class="tasks-section">
                            <h3>${getTranslatedText('Tasks')}:</h3>
                            <ul class="tasks-list">
                                ${step.tasks.map(task => `
                                    <li><strong>${task.title}:</strong> ${task.description}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    return html;
}

/**
 * CSS styles for print/PDF
 */
function getPrintStyles() {
    const currentLanguage = getGlobalLanguage();
    const fontFamily = (currentLanguage === 'hi' || currentLanguage === 'mr') 
        ? "'Noto Sans Devanagari', 'Poppins', sans-serif" 
        : "'Poppins', sans-serif";
    
    return `
        @page {
            margin: 20mm;
            size: A4;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: ${fontFamily};
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .pdf-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #22c55e;
        }
        
        .pdf-header h1 {
            font-size: 24px;
            color: #166534;
            margin-bottom: 10px;
        }
        
        .pdf-header .subtitle {
            font-size: 12px;
            color: #6b7280;
        }
        
        .step-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .step-header h2 {
            font-size: 18px;
            color: #166534;
            margin-bottom: 8px;
        }
        
        .timeframe {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 15px;
        }
        
        .description {
            font-size: 14px;
            margin-bottom: 15px;
            text-align: justify;
        }
        
        .tasks-section h3 {
            font-size: 14px;
            color: #166534;
            margin-bottom: 10px;
        }
        
        .tasks-list {
            list-style: none;
            padding-left: 0;
        }
        
        .tasks-list li {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
            font-size: 12px;
        }
        
        .tasks-list li:before {
            content: "•";
            color: #22c55e;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .tasks-list li strong {
            color: #166534;
        }
        
        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
        }
    `;
}
