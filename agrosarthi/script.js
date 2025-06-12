// AgroSarthi - Cleaned & Optimized JavaScript

document.addEventListener('DOMContentLoaded', function () {
    initNavbar();
    loadLanguageStrings();
    generateFeatureCards();
    initScrollAnimations();
});

// --- Feature Data ---
const features = [
    {
        icon: 'fa-seedling',
        title: 'Crop Recommender',
        titleKey: 'feature_crop_title',
        description: 'Get AI-powered recommendations on which crops to plant based on soil, climate, and market conditions.',
        descriptionKey: 'feature_crop_desc',
        link: 'crop.html'
    },
    {
        icon: 'fa-bug',
        title: 'Disease Identifier',
        titleKey: 'feature_disease_title',
        description: 'Upload images of plant leaves to instantly identify diseases and get treatment advice.',
        descriptionKey: 'feature_disease_desc',
        link: 'disease.html'
    },
    {
        icon: 'fa-comments',
        title: 'AgroSarthi Assistant',
        titleKey: 'feature_chatbot_title',
        description: 'Chat with our AI assistant for farming advice, weather updates, and more.',
        descriptionKey: 'feature_chatbot_desc',
        link: 'chatbot.html'
    },
    {
        icon: 'fa-cloud-sun-rain',
        title: 'Smart Weather',
        titleKey: 'feature_weather_title',
        description: 'Access hyperlocal weather forecasts and receive alerts for adverse conditions.',
        descriptionKey: 'feature_weather_desc',
        link: 'weather.html'
    },
    {
        icon: 'fa-chart-line',
        title: 'Price Estimator',
        titleKey: 'feature_price_title',
        description: 'Predict future crop prices using historical data and market trends to maximize profits.',
        descriptionKey: 'feature_price_desc',
        link: '#'
    },
    {
        icon: 'fa-tractor',
        title: 'Yield Predictor',
        titleKey: 'feature_yield_title',
        description: 'Estimate your harvest yield based on current conditions and farming practices.',
        descriptionKey: 'feature_yield_desc',
        link: 'yield.html'
    },
    {
    icon: 'fa-phone-volume',
    title: 'Voice Call Assistant',
    titleKey: 'feature_call_title',
    description: 'Ask agricultural doubts anytime through a voice call in your preferred language whenever necessary.',
    descriptionKey: 'feature_call_desc',
    link: '#'

    }
];

// --- Init Navbar + Language Selector ---
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const languageSelector = document.querySelector('.language-selector');
    const selectedLangDisplay = document.querySelector('.selected-lang span');
    const langDropdown = document.querySelector('.lang-dropdown');

    // Hamburger menu
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Language selection
    if (languageSelector && selectedLangDisplay && langDropdown) {
        selectedLangDisplay.parentElement.addEventListener('click', function (e) {
            e.stopPropagation();
            languageSelector.classList.toggle('active');
        });

        document.addEventListener('click', function () {
            languageSelector.classList.remove('active');
        });

        langDropdown.querySelectorAll('li').forEach(option => {
            option.addEventListener('click', function (e) {
                e.stopPropagation();
                const lang = this.getAttribute('data-lang');
                setGlobalLanguage(lang);
                languageSelector.classList.remove('active');
                loadLanguageStrings(); // Reload text
                const event = new CustomEvent('languageChanged', { detail: { lang } });
                document.dispatchEvent(event);
            });
        });
    }

    // Highlight active nav link
    const currentPath = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function () {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
}

// --- Generate Feature Cards ---
function generateFeatureCards() {
    const featuresGrid = document.querySelector('.features-grid');
    if (!featuresGrid) return;

    featuresGrid.innerHTML = '';
    features.forEach((feature, index) => {
        const card = document.createElement('div');
        card.className = 'feature-card';
        card.style.transitionDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="feature-icon">
                <i class="fas ${feature.icon}"></i>
            </div>
            <div class="feature-content">
                <h3 class="feature-title" data-lang-key="${feature.titleKey}">${feature.title}</h3>
                <p class="feature-description" data-lang-key="${feature.descriptionKey}">${feature.description}</p>
                <a href="${feature.link}" class="feature-link" data-lang-key="learn_more">Learn More <i class="fas fa-arrow-right"></i></a>
            </div>
        `;
        featuresGrid.appendChild(card);
    });

    if (window.languageStrings) {
        updateTextContent(window.languageStrings, getGlobalLanguage());
    }
}

// --- Load Language Strings ---
async function loadLanguageStrings() {
    const lang = getGlobalLanguage();
    try {
        const response = await fetch('lang.json');
        const data = await response.json();
        window.languageStrings = data;
        updateTextContent(data, lang);
        updateNavbarLangDisplay(lang);
    } catch (error) {
        console.error("Could not load language strings:", error);
    }
}

// --- Update UI Texts ---
function updateTextContent(langData, lang) {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        const translated = langData[lang]?.[key];
        if (translated) {
            if (el.placeholder !== undefined) {
                el.placeholder = translated;
            } else {
                el.textContent = translated;
            }
        }
    });
}

function updateNavbarLangDisplay(lang) {
    const display = document.querySelector('.selected-lang span');
    const option = document.querySelector(`.lang-dropdown li[data-lang="${lang}"]`);
    if (display && option) {
        display.textContent = option.textContent;
    }
}

// --- Scroll Animation ---
function initScrollAnimations() {
    const elementsToReveal = document.querySelectorAll('.feature-card, .hero h1, .hero p, .section-title');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (entry.target.matches('.hero h1, .hero p')) {
                    entry.target.classList.add('animate-on-load');
                }
            }
        });
    }, { threshold: 0.1 });

    elementsToReveal.forEach(el => observer.observe(el));
}

// --- Global Language Storage ---
function setGlobalLanguage(lang) {
    localStorage.setItem('language', lang);
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
}

function getGlobalLanguage() {
    const cookieLang = document.cookie.split('; ').find(row => row.startsWith('language='));
    return cookieLang ? cookieLang.split('=')[1] : (localStorage.getItem('language') || 'en');
}
