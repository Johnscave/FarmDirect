// Application State
const state = {
    currentUser: null,
    products: [],
    cart: [],
    orders: [],
    conversations: [],
    currentConversation: null,
    messages: {},
    marketPrices: {},
    farmers: [],
    lang: 'en'
};

const API_BASE_URL = (window.location.port === '3000')
    ? window.location.origin
    : 'http://localhost:3000';

function getStoredLanguage() {
    return localStorage.getItem('farmdirect_lang') || 'en';
}

function saveLanguage(lang) {
    localStorage.setItem('farmdirect_lang', lang);
}

function getMarketPriceKey(productName) {
    const mapping = {
        'Organic Tomatoes': 'Tomatoes',
        'Farm Fresh Lettuce': 'Lettuce',
        'Sweet Corn': 'Corn',
        'Red Apples': 'Apples',
        'Yellow Bananas': 'Bananas',
        'Fresh Honey': 'Honey',
        'Wheat Flour': 'Wheat Flour',
        'Fresh Milk': 'Milk'
    };
    return mapping[productName] || productName;
}

function updateProductPricesFromMarket() {
    state.products.forEach(product => {
        const marketKey = getMarketPriceKey(product.name);
        const market = state.marketPrices[marketKey];

        // Ensure every product has a unit first
        if (!product.unit) {
            if (product.category === 'Vegetables' || product.category === 'Fruits' || product.category === 'Grains') product.unit = 'kg';
            else if (product.category === 'Dairy' || product.category === 'Honey') product.unit = 'litre';
            else product.unit = 'kg'; // Default everything else to kg as per request
        }

        // Standardize to KG if not already
        if (product.unit !== 'kg') {
            const originalQty = product.quantity;
            const originalUnit = product.unit;
            const originalPrice = product.price;

            const totalKg = convertToKg(originalQty, originalUnit, product.name);
            const pricePerKg = (originalPrice * originalQty) / totalKg;

            product.originalQuantity = originalQty;
            product.originalUnit = originalUnit;
            product.originalPrice = originalPrice * originalQty;
            product.quantity = totalKg;
            product.price = pricePerKg;
            product.unit = 'kg';
        }
    });
}

// ==================== UNIT CONVERSION LOGIC ====================
const CONVERSION_FACTORS = {
    'ton': 1000,
    'tons': 1000,
    'quintal': 100,
    'quintals': 100,
    'gram': 0.001,
    'grams': 0.001,
    'pound': 0.453592,
    'pounds': 0.453592,
    'kg': 1,
    'kgs': 1,
    'kilogram': 1,
    'kilograms': 1
};

const LIQUID_DENSITY = {
    'Milk': 1.03,
    'Oil': 0.92,
    'Honey': 1.42
};

function detectUnit(input) {
    if (typeof input !== 'string') return null;
    const text = input.toLowerCase().trim();
    // Match number followed by optional space and unit name
    const match = text.match(/^([\d.]+)\s*([a-z]+)$/);
    if (match) {
        const qty = parseFloat(match[1]);
        let unit = match[2];

        // Normalize unit
        if (unit === 'l' || unit === 'ltr' || unit === 'liters' || unit === 'litre') unit = 'litre';

        return { quantity: qty, unit: unit };
    }
    return null;
}

function convertToKg(quantity, unit, productName) {
    let q = parseFloat(quantity) || 0;
    const normalizedUnit = unit.toLowerCase();

    if (normalizedUnit === 'litre' || normalizedUnit === 'liter' || normalizedUnit === 'l') {
        // Find product density
        let density = 1; // Default to water density
        for (const [key, value] of Object.entries(LIQUID_DENSITY)) {
            if (productName.toLowerCase().includes(key.toLowerCase())) {
                density = value;
                break;
            }
        }
        return q * density;
    }

    const factor = CONVERSION_FACTORS[normalizedUnit] || 1;
    return q * factor;
}

function updateComparison() {
    const name = document.getElementById('product-name').value;
    const rawQuantity = document.getElementById('product-quantity').value;
    const unitSelect = document.getElementById('product-unit');
    const totalPrice = parseFloat(document.getElementById('product-price').value);
    const display = document.getElementById('price-comparison-display');

    if (!rawQuantity || !totalPrice) {
        display.style.display = 'none';
        return;
    }

    let quantity = parseFloat(rawQuantity);
    let unit = unitSelect.value;

    // Auto-detect unit if present in quantity field
    const detected = detectUnit(rawQuantity);
    if (detected) {
        quantity = detected.quantity;
        unit = detected.unit;
        // Update the select if it matches a known option
        const options = Array.from(unitSelect.options).map(o => o.value);
        if (options.includes(unit)) {
            unitSelect.value = unit;
        }
    }

    const totalKg = convertToKg(quantity, unit, name);
    const pricePerKg = totalPrice / totalKg;

    const marketKey = getMarketPriceKey(name);
    const market = state.marketPrices[marketKey];
    const marketPrice = market ? market.today : null;

    let marketPriceInfo = '';
    let diffInfo = '';

    if (marketPrice) {
        const diff = pricePerKg - marketPrice;
        const diffPercent = (diff / marketPrice) * 100;
        const isProfit = diff <= 0;
        const color = isProfit ? '#27ae60' : '#e74c3c';
        const label = isProfit ? 'Potential Profit (Below Market)' : 'Potential Loss (Above Market)';
        const icon = isProfit ? '📈' : '📉';

        marketPriceInfo = `
            <div class="detail-row">
                <strong>Today's APMC Market Price:</strong> ₹${marketPrice.toFixed(2)}/KG 
                <span class="live-badge">Live Source</span>
            </div>
            <div style="margin: 5px 0; font-size: 0.85rem;">
                <a href="https://krishimaratavahini.karnataka.gov.in/en" target="_blank" style="color: #2980b9; text-decoration: underline;">Verify on Official Website</a>
            </div>
        `;
        diffInfo = `<div class="detail-row" style="color: ${color}; font-weight: bold; background: ${isProfit ? '#eafaf1' : '#fdedec'}; padding: 10px; border-radius: 5px; margin-top: 10px; border: 1px solid ${color};">
            ${icon} <strong>${label}:</strong> ₹${Math.abs(diff).toFixed(2)}/KG (${Math.abs(diffPercent).toFixed(1)}%)
        </div>`;
    } else {
        marketPriceInfo = `
            <div class="detail-row"><em>Market price data not available for this product.</em></div>
            <div style="margin: 5px 0; font-size: 0.85rem;">
                <a href="https://krishimaratavahini.karnataka.gov.in/en" target="_blank" style="color: #2980b9; text-decoration: underline;">Check manually on Krishi Marata Vahini</a>
            </div>
        `;
    }

    display.innerHTML = `
        <div style="border-bottom: 2px solid #eee; margin-bottom: 10px; padding-bottom: 5px;">
            <h4 style="margin: 0; color: #2c3e50;">Calculation Summary</h4>
        </div>
        <div class="detail-row"><strong>Product:</strong> ${name || 'Product'}</div>
        <div class="detail-row"><strong>Original Quantity:</strong> ${quantity} ${unit.toUpperCase()}</div>
        <div class="detail-row"><strong>Converted Weight:</strong> ${totalKg.toFixed(2)} KG</div>
        <div class="detail-row" style="font-size: 1.2rem; color: #2980b9; margin-top: 5px;"><strong>Your Price per KG:</strong> ₹${pricePerKg.toFixed(2)}/KG</div>
        <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
            ${marketPriceInfo}
            ${diffInfo}
        </div>
    `;
    display.style.display = 'block';
}

const translations = {
    en: {
        home: 'Home',
        products: 'Products',
        marketPrices: 'Market Prices',
        messages: 'Messages',
        orders: 'Orders',
        cart: 'Cart',
        profile: 'Profile',
        login: 'Login',
        logout: 'Logout',
        loginHeading: 'Login to FarmDirect',
        emailPhone: 'Email/Phone No',
        username: 'Username',
        password: 'Password',
        loginButton: 'Login / Register',
        heroTitle: 'Welcome to FarmDirect',
        heroSubtitle: 'Connecting Farmers with Buyers - Fair Prices in Indian Rupees (₹)',
        startShopping: 'Start Shopping',
        searchProducts: 'Search products...',
        voiceSearch: '🎙️ Voice Search',
        thProduct: 'Product',
        thMarket: 'Market Name',
        thUnit: 'Unit',
        thMin: 'Min Price',
        thMax: 'Max Price',
        thModal: 'Modal Price',
        thUpdated: 'Last Updated'
    },
    hi: {
        home: 'होम',
        products: 'उत्पाद',
        marketPrices: 'बाजार दरें',
        messages: 'संदेश',
        orders: 'ऑर्डर',
        cart: 'कार्ट',
        profile: 'प्रोफ़ाइल',
        login: 'लॉग इन',
        logout: 'लॉग आउट',
        loginHeading: 'FarmDirect में लॉगिन करें',
        emailPhone: 'ईमेल/फ़ोन नंबर',
        username: 'उपयोगकर्ता नाम',
        password: 'पासवर्ड',
        loginButton: 'लॉगिन / रजिस्टर',
        heroTitle: 'FarmDirect में आपका स्वागत है',
        heroSubtitle: 'किसानों और खरीदारों को जोड़ना - भारतीय रुपये (₹) में उचित मूल्य',
        startShopping: 'खरीदारी शुरू करें',
        searchProducts: 'उत्पाद खोजें...',
        voiceSearch: '🎙️ वॉइस सर्च',
        thProduct: 'उत्पाद',
        thMarket: 'बाजार का नाम',
        thUnit: 'इकाई',
        thMin: 'न्यूनतम मूल्य',
        thMax: 'अधिकतम मूल्य',
        thModal: 'मोडल मूल्य',
        thUpdated: 'अंतिम अद्यतन'
    },
    kn: {
        home: 'ಮುಖಪುಟ',
        products: 'ಉತ್ಪನ್ನಗಳು',
        marketPrices: 'ಬಜಾರ್ ಬೆಲೆ',
        messages: 'ಸಂದೇಶಗಳು',
        orders: 'ಆರ್ಡర్లు',
        cart: 'ಕಾರ್ಟ್',
        profile: 'ಪ್ರೊಫೈಲ್',
        login: 'ಲಾಗಿನ್',
        logout: 'ಲಾಗೌಟ್',
        loginHeading: 'FarmDirect ಗೆ ಲಾಗಿನ್ ಮಾಡಿ',
        emailPhone: 'ಇಮೇಲ್/ಫೋನ್ ಸಂಖ್ಯೆ',
        username: 'ಬಳಕೆದಾರ ಹೆಸರು',
        password: 'ಗುಪ್ತಪದ',
        loginButton: 'ಲಾಗಿನ್ / ನೋಂದಾಯಿಸಿಕೊಳ್ಳಿ',
        heroTitle: 'FarmDirect ಗೆ ಸ್ವಾಗತ',
        heroSubtitle: 'ಕೃಷಕರನ್ನು ಖರೀದಿದಾರರೊಂದಿಗೆ ಜೋಡಿಸುವುದು - ಭಾರತೀಯ ರುಪಾಯಿ (₹) ನಲ್ಲಿ ನ್ಯಾಯಸಮ್ಮತ ಬೆಲೆ',
        startShopping: 'ಶಾಪಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
        searchProducts: 'ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...',
        voiceSearch: '🎙️ ವಾಯ್ಸ್ ಹುಡುಕಾಟ',
        thProduct: 'ಉತ್ಪನ್ನ',
        thMarket: 'ಮಾರುಕಟ್ಟೆ ಹೆಸರು',
        thUnit: 'ಘಟಕ',
        thMin: 'ಕನಿಷ್ಠ ಬೆಲೆ',
        thMax: 'ಗರಿಷ್ಠ ಬೆಲೆ',
        thModal: 'ಮಾದರಿ ಬೆಲೆ',
        thUpdated: 'ಕೊನೆಯದಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ'
    }
};

function initLanguage() {
    state.lang = getStoredLanguage();
    const select = document.getElementById('language-select');
    if (select) {
        select.value = state.lang;
        select.addEventListener('change', function () {
            saveLanguage(this.value);
            setLanguage(this.value);
            updateAuthButton();
        });
    }
    setLanguage(state.lang);
    updateAuthButton();
}

function setLanguage(lang) {
    saveLanguage(lang);
    state.lang = lang;
    document.documentElement.lang = lang;
    const texts = translations[lang] || translations.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (texts[key]) {
            el.placeholder = texts[key];
        }
    });

    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        if (state.currentUser) {
            const logoutLabel = texts.logout || 'Logout';
            authBtn.textContent = `${logoutLabel} (${state.currentUser.username})`;
        } else {
            authBtn.textContent = texts.login;
        }
    }

    const cartLink = document.getElementById('nav-cart');
    if (cartLink) {
        const count = document.getElementById('cart-count').textContent;
        cartLink.innerHTML = `${texts.cart} (<span id="cart-count">${count}</span>)`;
    }
}

function getStoredToken() {
    return localStorage.getItem('farmdirect_token');
}

function saveToken(token) {
    localStorage.setItem('farmdirect_token', token);
}

function clearToken() {
    localStorage.removeItem('farmdirect_token');
    localStorage.removeItem('farmdirect_user');
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    const profileBtn = document.getElementById('nav-profile');
    if (!authBtn) return;

    if (state.currentUser) {
        const logoutLabel = translations[state.lang]?.logout || 'Logout';
        authBtn.textContent = `${logoutLabel} (${state.currentUser.fullName})`;
        authBtn.onclick = logout;
        authBtn.href = '#';

        if (profileBtn) {
            profileBtn.style.display = 'inline-block';
            profileBtn.href = state.currentUser.role === 'farmer' ? 'farmer-profile.html' : 'buyer-profile.html';
        }
    } else {
        const loginLabel = translations[state.lang]?.login || 'Login';
        authBtn.textContent = loginLabel;
        authBtn.onclick = null;
        authBtn.href = 'login.html';

        if (profileBtn) {
            profileBtn.style.display = 'none';
        }
    }
}

async function loadUserFromStorage() {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) return;

    try {
        state.currentUser = JSON.parse(storedUser);
        updateAuthButton();
    } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}

function detectLanguageFromTranscript(text) {
    if (/[-\u007F]/.test(text)) {
        return 'en';
    }
    if (/[\u0900-\u097F]/.test(text)) {
        return 'hi';
    }
    if (/[\u0C80-\u0CFF]/.test(text)) {
        return 'kn';
    }
    return 'en';
}

function getRecognitionLanguage() {
    if (state.lang === 'hi') return 'hi-IN';
    if (state.lang === 'kn') return 'kn-IN';
    return 'en-IN';
}

function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Your browser does not support voice search.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = getRecognitionLanguage();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const voiceButton = document.getElementById('voice-search-button');
    if (voiceButton) {
        voiceButton.disabled = true;
        voiceButton.textContent = 'Listening...';
    }

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript.trim();
        if (!transcript) return;

        const detectedLang = detectLanguageFromTranscript(transcript);
        if (detectedLang && detectedLang !== state.lang) {
            const select = document.getElementById('language-select');
            if (select) {
                select.value = detectedLang;
            }
            setLanguage(detectedLang);
        }

        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.value = transcript;
            filterProducts();
        }
    };

    recognition.onerror = function (event) {
        console.error('Voice search error:', event.error);
        alert('Voice search failed: ' + event.error);
    };

    recognition.onend = function () {
        if (voiceButton) {
            const texts = translations[state.lang] || translations.en;
            voiceButton.disabled = false;
            voiceButton.textContent = texts.voiceSearch || '🎙️ Voice Search';
        }
    };

    recognition.start();
}

// Initialize App
document.addEventListener('DOMContentLoaded', async function () {
    await loadSampleData();
    await loadUserFromStorage();
    displayProducts();
    displayMarketPrices();
    updateCartCount();
    initLanguage();
});

// ==================== AUTHENTICATION ====================
function toggleAuth() {
    window.location.href = 'login.html';
}

function closeAuth() {
    // No modal on the main page anymore; login is handled on login.html.
}

function login() {
    // Login is handled by login.html and the backend API.
    toggleAuth();
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthButton();
    state.cart = [];
    updateCartCount();
    showNotification('You have been logged out', 'info');
    window.location.href = 'index.html';
}

function showFarmerOptions() {
    const addBtn = document.createElement('a');
    addBtn.textContent = 'Add Product';
    addBtn.href = '#';
    addBtn.onclick = openAddProductModal;
    if (!document.querySelector('.add-product-link')) {
        addBtn.className = 'add-product-link';
        document.querySelector('.nav-menu').appendChild(addBtn);
    }
}

function displayProfile() {
    if (!state.currentUser) {
        alert('Please login first');
        toggleAuth();
        return;
    }

    document.getElementById('profile-username').textContent = state.currentUser.username;
    document.getElementById('profile-email').textContent = state.currentUser.email;
    document.getElementById('profile-password').textContent = state.currentUser.password;
    document.getElementById('profile-role').textContent = state.currentUser.role;
    document.getElementById('profile-login-time').textContent = state.currentUser.loginTime.toLocaleString();
}

// ==================== SECTION MANAGEMENT ====================
function showSection(sectionId) {
    if (!state.currentUser && sectionId !== 'home' && sectionId !== 'products' && sectionId !== 'prices') {
        alert('Please login first');
        toggleAuth();
        return;
    }

    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
        window.scrollTo(0, 0);

        // Load data when section is shown
        if (sectionId === 'products') {
            displayProducts();
        } else if (sectionId === 'prices') {
            displayMarketPrices();
        } else if (sectionId === 'messages') {
            displayConversations();
        } else if (sectionId === 'orders') {
            displayOrders();
        } else if (sectionId === 'cart') {
            displayCart();
        } else if (sectionId === 'profile') {
            displayProfile();
        }
    }
}

// ==================== PRODUCTS ====================
async function loadSampleData() {
    state.products = [
        {
            id: 1,
            name: 'Organic Tomatoes',
            category: 'Vegetables',
            price: 25.00,
            quantity: 500,
            unit: 'kg',
            farmer: 'John Smith',
            farmerId: 101,
            description: 'Fresh organic tomatoes from Kolar farms.',
            icon: '🍅',
            badges: ['Organic', 'Fresh Harvest'],
            tags: ['Chemical Free', 'Naturally Grown'],
            images: ['https://via.placeholder.com/400x400?text=Tomatoes']
        },
        {
            id: 2,
            name: 'Red Onions',
            category: 'Vegetables',
            price: 22.00,
            quantity: 1000,
            unit: 'kg',
            farmer: 'Sarah Johnson',
            farmerId: 102,
            description: 'Premium red onions from Lasalgaon.',
            icon: '🧅',
            badges: ['Premium', 'Fresh'],
            tags: ['Red Onion', 'Fresh'],
            images: ['https://via.placeholder.com/400x400?text=Onions']
        },
        {
            id: 3,
            name: 'Sona Masuri Rice',
            category: 'Grains',
            price: 55.00,
            quantity: 2000,
            unit: 'kg',
            farmer: 'Mike Brown',
            farmerId: 103,
            description: 'Aromatic Sona Masuri rice, aged for 12 months.',
            icon: '🌾',
            badges: ['Aged', 'Pure'],
            tags: ['Rice', 'Sona Masuri'],
            images: ['https://via.placeholder.com/400x400?text=Rice']
        },
        {
            id: 4,
            name: 'Whole Wheat',
            category: 'Grains',
            price: 32.00,
            quantity: 1500,
            unit: 'kg',
            farmer: 'Emily Davis',
            farmerId: 104,
            description: 'Nutritious whole wheat grains from Punjab.',
            icon: '🍞',
            badges: ['Nutritious', 'Whole Grain'],
            tags: ['Wheat', 'Grain'],
            images: ['https://via.placeholder.com/400x400?text=Wheat']
        },
        {
            id: 5,
            name: 'Fresh Cow Milk',
            category: 'Dairy',
            price: 52.00,
            quantity: 200,
            unit: 'kg',
            farmer: 'Carlos Martinez',
            farmerId: 105,
            description: 'Pure cow milk, high fat content.',
            icon: '🥛',
            badges: ['Pure', 'Fresh'],
            tags: ['Milk', 'Dairy'],
            images: ['https://via.placeholder.com/400x400?text=Milk']
        },
        {
            id: 6,
            name: 'Sunflower Oil',
            category: 'Oil',
            price: 115.00,
            quantity: 300,
            unit: 'kg',
            farmer: 'Robert Wilson',
            farmerId: 106,
            description: 'Refined sunflower oil for healthy cooking.',
            icon: '🌻',
            badges: ['Healthy', 'Refined'],
            tags: ['Oil', 'Sunflower'],
            images: ['https://via.placeholder.com/400x400?text=Oil']
        },
        {
            id: 7,
            name: 'Red Apples',
            category: 'Fruits',
            price: 160.00,
            quantity: 400,
            unit: 'kg',
            farmer: 'David Anderson',
            farmerId: 107,
            description: 'Sweet and crunchy apples from Shimla.',
            icon: '🍎',
            badges: ['Sweet', 'Crunchy'],
            tags: ['Apples', 'Fruit'],
            images: ['https://via.placeholder.com/400x400?text=Apples']
        },
        {
            id: 8,
            name: 'Green Cabbage',
            category: 'Vegetables',
            price: 15.00,
            quantity: 600,
            unit: 'kg',
            farmer: 'Jessica Taylor',
            farmerId: 108,
            description: 'Fresh green cabbage from Ooty.',
            icon: '🥬',
            badges: ['Fresh', 'Organic'],
            tags: ['Cabbage', 'Vegetable'],
            images: ['https://via.placeholder.com/400x400?text=Cabbage']
        }
    ];

    // Attempt to fetch fresh products from the backend
    try {
        const prodResponse = await fetch(`${API_BASE_URL}/api/products`);
        if (prodResponse.ok) {
            const prodData = await prodResponse.json();
            if (prodData.success && prodData.data && prodData.data.length > 0) {
                state.products = prodData.data;
            }
        }
    } catch (err) {
        console.warn('Backend API not reachable, using hardcoded fallback products.');
    }

    // Fallback market prices (based on Krishi Marata Vahini data)
    const todayStr = new Date().toISOString().split('T')[0];
    state.marketPrices = {
        'Organic Tomatoes': { market_name: 'Kolar APMC', min: 20, max: 25, today: 22, date: todayStr, unit: 'kg' },
        'Red Onions': { market_name: 'Lasalgaon APMC', min: 18, max: 24, today: 20, date: todayStr, unit: 'kg' },
        'Sona Masuri Rice': { market_name: 'Bengaluru APMC', min: 45, max: 55, today: 50, date: todayStr, unit: 'kg' },
        'Whole Wheat': { market_name: 'Gulbarga APMC', min: 25, max: 32, today: 28, date: todayStr, unit: 'kg' },
        'Fresh Cow Milk': { market_name: 'KMF Dairy', min: 45, max: 50, today: 48, date: todayStr, unit: 'litre' },
        'Sunflower Oil': { market_name: 'Hubballi APMC', min: 105, max: 120, today: 110, date: todayStr, unit: 'litre' },
        'Red Apples': { market_name: 'Shimla Market', min: 120, max: 180, today: 150, date: todayStr, unit: 'kg' },
        'Green Cabbage': { market_name: 'Ooty APMC', min: 12, max: 20, today: 18, date: todayStr, unit: 'kg' }
    };

    // Attempt to fetch fresh APMC prices from the backend
    try {
        const response = await fetch(`${API_BASE_URL}/api/market-prices`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
                // Merge or overwrite with fresh data
                data.data.forEach(item => {
                    state.marketPrices[item.product] = {
                        market_name: item.market_name,
                        min: item.min_price,
                        max: item.max_price,
                        today: item.modal_price,
                        date: item.arrival_date,
                        unit: item.unit
                    };
                });
            }
        }
    } catch (error) {
        console.warn('Backend API not reachable, using fallback market data from Krishi Marata Vahini.');
    }

    updateProductPricesFromMarket();

    state.farmers = [
        {
            id: 101,
            name: 'John Smith',
            location: 'Pune, Maharashtra',
            phone: '+91 98765 43210',
            email: 'john.farm@farmdirect.in',
            rating: 4.8,
            experience: '12 years',
            bio: 'Organic vegetable grower with a focus on sustainable farming and local delivery.'
        },
        {
            id: 102,
            name: 'Sarah Johnson',
            location: 'Ahmedabad, Gujarat',
            phone: '+91 91234 56789',
            email: 'sarah.grow@farmdirect.in',
            rating: 4.7,
            experience: '8 years',
            bio: 'Specializes in fresh leafy greens and pesticide-free produce.'
        },
        {
            id: 103,
            name: 'Mike Brown',
            location: 'Bengaluru, Karnataka',
            phone: '+91 99876 54321',
            email: 'mike.corn@farmdirect.in',
            rating: 4.6,
            experience: '10 years',
            bio: 'Experienced farmer producing sweet corn and seasonal vegetables.'
        },
        {
            id: 104,
            name: 'Emily Davis',
            location: 'Delhi',
            phone: '+91 90123 45678',
            email: 'emily.apple@farmdirect.in',
            rating: 4.9,
            experience: '9 years',
            bio: 'Apple grower committed to natural farming practices and freshness.'
        },
        {
            id: 105,
            name: 'Carlos Martinez',
            location: 'Kochi, Kerala',
            phone: '+91 97654 32109',
            email: 'carlos.banana@farmdirect.in',
            rating: 4.5,
            experience: '7 years',
            bio: 'Banana specialist with expertise in seasonal harvesting and quality control.'
        },
        {
            id: 106,
            name: 'Robert Wilson',
            location: 'Nashik, Maharashtra',
            phone: '+91 98987 65432',
            email: 'robert.honey@farmdirect.in',
            rating: 4.8,
            experience: '15 years',
            bio: 'Producer of raw honey from eco-friendly beehives and wildflower fields.'
        },
        {
            id: 107,
            name: 'David Anderson',
            location: 'Jaipur, Rajasthan',
            phone: '+91 93456 78901',
            email: 'david.wheat@farmdirect.in',
            rating: 4.7,
            experience: '11 years',
            bio: 'Stone-ground flour expert with a focus on whole-grain nutrition.'
        },
        {
            id: 108,
            name: 'Jessica Taylor',
            location: 'Chennai, Tamil Nadu',
            phone: '+91 94567 89012',
            email: 'jessica.milk@farmdirect.in',
            rating: 4.6,
            experience: '10 years',
            bio: 'Fresh dairy supplier from grass-fed cows and hygienic delivery.'
        }
    ];

    // Sample orders (converted to INR)
    state.orders = [
        {
            id: 'ORD-001',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            status: 'delivered',
            items: ['Organic Tomatoes (5 kg)', 'Farm Fresh Lettuce (2 bundle)'],
            total: 2111.50, // 25.50 * 83
            farmer: 'John Smith',
            steps: ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered']
        },
        {
            id: 'ORD-002',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            status: 'shipped',
            items: ['Red Apples (10 kg)'],
            total: 3320.00, // 40.00 * 83
            farmer: 'Emily Davis',
            steps: ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Pending Delivery']
        },
        {
            id: 'ORD-003',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            status: 'pending',
            items: ['Fresh Honey (1 litre)', 'Wheat Flour (5 kg)'],
            total: 1411.00, // 17.00 * 83
            farmer: 'Robert Wilson',
            steps: ['Order Placed', 'Processing', 'Pending Packing', 'Pending Shipment', 'Pending Delivery']
        }
    ];

    // Sample conversations
    state.conversations = [
        {
            id: 1,
            with: 'John Smith',
            userId: 101,
            lastMessage: 'Thanks for your order!',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
            id: 2,
            with: 'Emily Davis',
            userId: 104,
            lastMessage: 'Are the apples organic?',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
            id: 3,
            with: 'Robert Wilson',
            userId: 106,
            lastMessage: 'When will the order arrive?',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
        }
    ];

    // Initialize message storage
    state.conversations.forEach(conv => {
        state.messages[conv.id] = [
            {
                from: 'You',
                text: 'Hi, I\'m interested in your products',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                type: 'sent'
            },
            {
                from: conv.with,
                text: 'Great! What would you like to know?',
                timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
                type: 'received'
            }
        ];
    });
}

function getFarmerDetails(farmerId) {
    const farmer = state.farmers.find(item => item.id === parseInt(farmerId));
    if (farmer) return farmer;

    return {
        id: farmerId,
        name: 'Unknown Farmer',
        location: 'N/A',
        phone: 'N/A',
        email: 'N/A',
        rating: 'N/A',
        experience: 'N/A',
        bio: 'No additional information is available for this farmer.'
    };
}

function openProductDetails(productId) {
    const product = state.products.find(item => item.id === productId);
    if (!product) return;

    const farmer = getFarmerDetails(product.farmerId);
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;

    const totalKg = product.unit === 'kg' ? product.quantity : convertToKg(product.quantity, product.unit, product.name);
    const pricePerKg = product.unit === 'kg' ? product.price : (product.price * product.quantity) / totalKg;

    const marketKey = getMarketPriceKey(product.name);
    const market = state.marketPrices[marketKey];
    const marketPrice = market ? market.today : null;

    let marketComparisonHTML = '';
    if (marketPrice) {
        const diff = pricePerKg - marketPrice;
        const color = diff <= 0 ? '#27ae60' : '#e74c3c';
        const label = diff <= 0 ? 'Below Market' : 'Above Market';
        marketComparisonHTML = `
            <div class="detail-row"><strong>Market Price:</strong> ₹${marketPrice.toFixed(2)}/KG</div>
            <div class="detail-row" style="color: ${color}; font-weight: bold;">
                <strong>Comparison:</strong> ₹${Math.abs(diff).toFixed(2)} ${label}
            </div>
        `;
    }

    modal.querySelector('#detail-title').textContent = product.name;
    modal.querySelector('#detail-icon').textContent = product.icon;
    modal.querySelector('#detail-name').textContent = product.name;
    modal.querySelector('#detail-category').textContent = product.category;

    // Display based on whether we have original data
    const originalInfo = product.originalQuantity
        ? `${product.originalQuantity} ${product.originalUnit.toUpperCase()}`
        : `${product.quantity} ${product.unit}`;

    modal.querySelector('#detail-price').innerHTML = `
        <div>₹${pricePerKg.toFixed(2)} per KG</div>
        <div style="font-size: 0.9rem; color: #666;">(Original: ${originalInfo} for ₹${(product.originalPrice || (product.price * product.quantity)).toFixed(2)})</div>
    `;

    modal.querySelector('#detail-quantity').innerHTML = `
        <div>${totalKg.toFixed(2)} KG available</div>
        ${marketComparisonHTML}
    `;
    modal.querySelector('#detail-description').textContent = product.description;
    modal.querySelector('#detail-farmer-name').textContent = farmer.name;
    modal.querySelector('#detail-farmer-location').textContent = farmer.location;
    modal.querySelector('#detail-farmer-phone').textContent = farmer.phone;
    modal.querySelector('#detail-farmer-email').textContent = farmer.email;
    modal.querySelector('#detail-farmer-rating').textContent = farmer.rating;
    modal.querySelector('#detail-farmer-experience').textContent = farmer.experience;
    modal.querySelector('#detail-farmer-bio').textContent = farmer.bio;

    modal.querySelector('#detail-add-button').setAttribute('onclick', `addToCart(${product.id})`);
    modal.querySelector('#detail-message-button').setAttribute('onclick', `messageJavaScript(${product.farmerId}, '${product.farmer}')`);

    modal.classList.add('active');
}

function closeProductDetailsModal() {
    const modal = document.getElementById('product-detail-modal');
    if (modal) modal.classList.remove('active');
}

function displayProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const category = document.getElementById('category-filter').value;

    let filtered = state.products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>No products found</div>';
        return;
    }

    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const shortDesc = product.description.length > 75
            ? product.description.slice(0, 75) + '...'
            : product.description;
        card.innerHTML = `
            <div class="product-header">${product.icon}</div>
            <div class="product-body">
                <div class="product-row">
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-farmer">👨‍🌾 ${product.farmer}</div>
                    </div>
                    <div class="product-price">₹${product.price.toFixed(2)}/${product.unit}</div>
                </div>
                <div class="product-quantity">Available: ${product.quantity} ${product.unit}</div>
                <div class="product-description">${shortDesc}</div>
                <div class="product-actions">
                    <button class="btn-secondary small-btn" onclick="window.location.href='product.html?id=${product.id}'">Details</button>
                    ${state.currentUser && state.currentUser.role === 'buyer' ? `<button class="btn-primary small-btn" onclick="addToCart(${product.id})">Add to Cart</button>` : ''}
                    ${state.currentUser && state.currentUser.role === 'farmer' && state.currentUser.id === product.farmerId ?
                `<button class="btn-danger small-btn" onclick="deleteProduct(${product.id})">Delete</button>` :
                `<button class="btn-secondary small-btn" onclick="messageJavaScript('${product.farmerId}', '${product.farmer}')">Message</button>`
            }
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts() {
    displayProducts();
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Product deleted successfully', 'success');
            await loadSampleData(); // Reload from backend
            displayProducts();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Failed to delete product', 'error');
    }
}

function getSpeechLang() {
    if (state.lang === 'hi') return 'hi-IN';
    if (state.lang === 'kn') return 'kn-IN';
    return 'en-IN';
}

function speakText(text) {
    if (!('speechSynthesis' in window)) {
        alert('Voice support is not available in this browser.');
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLang();

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()));
    if (preferred) {
        utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
}

function speakFarmer(productId) {
    const product = state.products.find(item => item.id === productId);
    if (!product) return;
    const response = `Farmer ${product.farmer} offers ${product.name}. ${product.description}. ` +
        `The price is ${product.price.toFixed(2)} rupees per ${product.unit}, and ${product.quantity} ${product.unit} are available.`;
    speakText(response);
}

function addToCart(productId) {
    if (!state.currentUser) {
        alert('Please login first');
        toggleAuth();
        return;
    }

    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCartCount();
    showNotification(`${product.name} added to cart!`, 'success');
}

function updateCartCount() {
    const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// ==================== MARKET PRICES ====================
function displayMarketPrices() {
    const table = document.getElementById('prices-table');
    table.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th data-i18n="thProduct">Product</th>
                    <th data-i18n="thMarket">Market Name</th>
                    <th data-i18n="thUnit">Unit</th>
                    <th data-i18n="thMin">Min Price</th>
                    <th data-i18n="thMax">Max Price</th>
                    <th data-i18n="thModal">Modal Price</th>
                    <th data-i18n="thUpdated">Last Updated</th>
                </tr>
            </thead>
            <tbody id="prices-body">
            </tbody>
        </table>
    `;

    const tbody = document.getElementById('prices-body');
    const today = new Date().toISOString().split('T')[0];

    Object.entries(state.marketPrices).forEach(([product, prices]) => {
        const isUpdatedToday = prices.date === today;
        const badgeHTML = isUpdatedToday ? ' <span style="background:#2ecc71; color:white; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">Updated Today</span>' : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product}</td>
            <td>${prices.market_name || 'APMC Market'}</td>
            <td>${prices.unit || 'unit'}</td>
            <td>₹${prices.min ? prices.min.toFixed(2) : '-'}</td>
            <td>₹${prices.max ? prices.max.toFixed(2) : '-'}</td>
            <td>₹${prices.today ? prices.today.toFixed(2) : '-'}</td>
            <td>${prices.date || 'N/A'} ${badgeHTML}</td>
        `;
        tbody.appendChild(row);
    });

    setLanguage(state.lang);
}

async function refreshPrices() {
    const btn = document.querySelector('#prices .btn-secondary');
    if (btn) {
        btn.textContent = "Fetching APMC Daily Data...";
        btn.disabled = true;
    }

    try {
        await loadSampleData();
        displayMarketPrices();
        displayProducts();
        showNotification('Daily APMC Market Prices successfully uploaded/refreshed!', 'success');
    } catch (err) {
        console.error(err);
        showNotification('Failed to refresh APMC Market Prices. Retaining previous data.', 'error');
    } finally {
        if (btn) {
            btn.textContent = "Force Refresh APMC Data";
            btn.disabled = false;
        }
    }
}

function showMarketView() {
    const container = document.getElementById('market-view-container');
    const iframe = document.getElementById('market-view-iframe');
    if (iframe) {
        iframe.src = 'https://apmc.gov.in/';
    }
    if (container) {
        container.style.display = 'block';
    }
}

function closeMarketView() {
    const container = document.getElementById('market-view-container');
    const iframe = document.getElementById('market-view-iframe');
    if (iframe) {
        iframe.src = '';
    }
    if (container) {
        container.style.display = 'none';
    }
}

function openApmcPrices() {
    window.open('https://apmc.gov.in/', '_blank');
}

// ==================== MESSAGING ====================
function displayConversations() {
    const list = document.getElementById('conversations-list');
    list.innerHTML = '';

    if (state.conversations.length === 0) {
        list.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
    }

    state.conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = `conversation-item ${state.currentConversation === conv.id ? 'active' : ''}`;
        item.innerHTML = `
            <div style="font-weight: bold;">${conv.with}</div>
            <div style="font-size: 0.85rem; color: #999;">${conv.lastMessage}</div>
        `;
        item.onclick = () => selectConversation(conv.id, conv.with);
        list.appendChild(item);
    });
}

function selectConversation(convId, name) {
    state.currentConversation = convId;
    document.getElementById('chat-header').textContent = `Chat with ${name}`;
    displayMessages(convId);
    displayConversations();
}

function displayMessages(convId) {
    const display = document.getElementById('messages-display');
    display.innerHTML = '';

    const messages = state.messages[convId] || [];

    messages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${msg.type}`;
        messageEl.innerHTML = `
            <div class="message-bubble">${msg.text}</div>
        `;
        display.appendChild(messageEl);
    });

    display.scrollTop = display.scrollHeight;
}

function handleMessageKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    if (!state.currentConversation) {
        alert('Please select a conversation');
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text) return;

    if (!state.messages[state.currentConversation]) {
        state.messages[state.currentConversation] = [];
    }

    state.messages[state.currentConversation].push({
        from: 'You',
        text: text,
        timestamp: new Date(),
        type: 'sent'
    });

    // Simulate response after a delay
    setTimeout(() => {
        const responses = [
            'That sounds great!',
            'Thanks for reaching out!',
            'I agree with that!',
            'Let me check and get back to you.',
            'When would you like it?',
            'Perfect, I can help with that!'
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const conv = state.conversations.find(c => c.id === state.currentConversation);

        state.messages[state.currentConversation].push({
            from: conv.with,
            text: randomResponse,
            timestamp: new Date(),
            type: 'received'
        });

        if (state.currentConversation !== null) {
            displayMessages(state.currentConversation);
        }
    }, 1000);

    input.value = '';
    displayMessages(state.currentConversation);
}

function messageJavaScript(farmerId, farmerName) {
    if (!state.currentUser) {
        alert('Please login first');
        toggleAuth();
        return;
    }

    // Check if conversation exists
    let conv = state.conversations.find(c => c.userId === parseInt(farmerId));
    if (!conv) {
        conv = {
            id: Math.random(),
            with: farmerName,
            userId: parseInt(farmerId),
            lastMessage: 'New conversation started',
            timestamp: new Date()
        };
        state.conversations.push(conv);
        state.messages[conv.id] = [];
    }

    showSection('messages');
    setTimeout(() => {
        selectConversation(conv.id, farmerName);
    }, 100);
}

// ==================== SHOPPING CART ====================
function displayCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '';

    if (state.cart.length === 0) {
        cartItemsDiv.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div>Your cart is empty</div>';
        document.getElementById('checkout-btn').disabled = true;
        updateCartTotals();
        return;
    }

    document.getElementById('checkout-btn').disabled = false;

    state.cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-farmer">From: ${item.farmer}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} per ${item.unit}</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${index}, 1)">+</button>
                <strong style="margin-left: 1rem;">₹${(item.price * item.quantity).toFixed(2)}</strong>
                <button class="btn-danger" style="margin-left: 1rem;" onclick="removeFromCart(${index})">Remove</button>
            </div>
        `;
        cartItemsDiv.appendChild(cartItem);
    });

    updateCartTotals();
}

function updateQuantity(index, change) {
    state.cart[index].quantity += change;
    if (state.cart[index].quantity <= 0) {
        removeFromCart(index);
    } else {
        displayCart();
    }
}

function removeFromCart(index) {
    state.cart.splice(index, 1);
    updateCartCount();
    displayCart();
}

function updateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 415.00; // 5.00 * 83
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('shipping').textContent = shipping.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

function proceedToPayment() {
    if (state.cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    showSection('payment');
}

// ==================== PAYMENT ====================
function processPayment() {
    const inputs = document.querySelectorAll('.payment-form input');
    let valid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            valid = false;
        }
    });

    if (!valid) {
        alert('Please fill in all payment details');
        return;
    }

    // Simulate payment processing
    alert('Processing payment...');

    // Create order
    const order = {
        id: `ORD-${String(state.orders.length + 1).padStart(3, '0')}`,
        date: new Date(),
        status: 'pending',
        items: state.cart.map(item => `${item.name} (${item.quantity} ${item.unit})`),
        total: parseFloat(document.getElementById('total').textContent),
        farmer: state.cart[0].farmer,
        steps: ['Order Placed', 'Processing', 'Pending Packing', 'Pending Shipment', 'Pending Delivery']
    };

    state.orders.push(order);

    // Clear cart and show confirmation
    state.cart = [];
    updateCartCount();

    alert(`Payment successful! Order ${order.id} has been placed.`);

    showSection('orders');
}

// ==================== ORDERS ====================
function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    if (state.orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div>No orders yet</div>';
        return;
    }

    state.orders.forEach(order => {
        const statusClass = `status-${order.status}`;
        const card = document.createElement('div');
        card.className = 'order-card';

        let completedSteps = 1;
        if (order.status === 'shipped') completedSteps = 4;
        else if (order.status === 'delivered') completedSteps = 5;
        else if (order.status === 'pending') completedSteps = 2;

        let trackingHTML = '<div class="tracking-progress">';
        for (let i = 0; i < order.steps.length; i++) {
            const stepClass = i < completedSteps ? 'completed' : 'pending';
            trackingHTML += `<div class="tracking-step ${stepClass}">${order.steps[i]}</div>`;
            if (i < order.steps.length - 1) {
                trackingHTML += `<div class="tracking-connector ${stepClass}"></div>`;
            }
        }
        trackingHTML += '</div>';

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-id">${order.id}</div>
                    <div class="order-date">${order.date.toLocaleDateString()}</div>
                </div>
                <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-items">
                <strong>Items:</strong>
                ${order.items.map(item => `<div class="order-item">✓ ${item}</div>`).join('')}
            </div>
            <div class="order-total">Total: ₹${order.total.toFixed(2)}</div>
            ${trackingHTML}
        `;
        ordersList.appendChild(card);
    });
}

// ==================== FARMER FEATURES ====================
function openAddProductModal() {
    document.getElementById('add-product-modal').classList.add('active');
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('active');
}

function addProduct() {
    const name = document.getElementById('product-name').value;
    const category = document.getElementById('product-category').value;
    const totalPrice = parseFloat(document.getElementById('product-price').value);
    const rawQuantity = document.getElementById('product-quantity').value;
    const unitSelect = document.getElementById('product-unit');
    const description = document.getElementById('product-description').value;

    let quantity = parseFloat(rawQuantity);
    let unit = unitSelect.value;

    const detected = detectUnit(rawQuantity);
    if (detected) {
        quantity = detected.quantity;
        unit = detected.unit;
    }

    if (!name || !category || isNaN(totalPrice) || isNaN(quantity) || !description) {
        alert('Please fill in all fields correctly');
        return;
    }

    const totalKg = convertToKg(quantity, unit, name);
    const pricePerKg = totalPrice / totalKg;

    const icons = {
        'Vegetables': '🥬',
        'Fruits': '🍎',
        'Grains': '🌾',
        'Dairy': '🥛',
        'Honey': '🍯'
    };

    const newProduct = {
        id: Date.now(), // More reliable ID
        name: name,
        category: category,
        price: pricePerKg,
        originalPrice: totalPrice,
        originalQuantity: quantity,
        originalUnit: unit,
        quantity: totalKg,
        unit: 'kg',
        farmer: state.currentUser.username,
        farmerId: state.currentUser.id,
        description: description,
        icon: icons[category] || '📦'
    };

    state.products.push(newProduct);
    closeAddProductModal();

    // Clear form
    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('price-comparison-display').style.display = 'none';

    alert('Product listed successfully!');
    displayProducts();
}

// Show home section on load
showSection('home');

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    if (type === 'error') {
        toast.style.backgroundColor = '#e74c3c';
    } else if (type === 'warning') {
        toast.style.backgroundColor = '#f39c12';
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}