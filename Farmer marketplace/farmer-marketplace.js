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

const API_BASE_URL = window.location.origin && window.location.origin !== 'null'
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
        if (market && typeof market.today === 'number') {
            product.price = market.today;
        }
    });
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
        voiceSearch: '🎙️ Voice Search'
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
        voiceSearch: '🎙️ वॉइस सर्च'
    },
    kn: {
        home: 'ಮುಖಪುಟ',
        products: 'ಉತ್ಪನ್ನಗಳು',
        marketPrices: 'ಬಜಾರ್ ಬೆಲೆ',
        messages: 'ಸಂದೇಶಗಳು',
        orders: 'ಆರ್ಡರ್ಲು',
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
        voiceSearch: '🎙️ ವಾಯ್ಸ್ ಹುಡುಕಾಟ'
    }
};

function initLanguage() {
    state.lang = getStoredLanguage();
    const select = document.getElementById('language-select');
    if (select) {
        select.value = state.lang;
        select.addEventListener('change', function() {
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
}

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn');
    if (!authBtn) return;

    if (state.currentUser) {
        const logoutLabel = translations[state.lang]?.logout || 'Logout';
        authBtn.textContent = `${logoutLabel} (${state.currentUser.username})`;
        authBtn.onclick = logout;
        authBtn.href = '#';
    } else {
        const loginLabel = translations[state.lang]?.login || 'Login';
        authBtn.textContent = loginLabel;
        authBtn.onclick = null;
        authBtn.href = 'login.html';
    }
}

async function loadUserFromStorage() {
    const token = getStoredToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            clearToken();
            return;
        }

        const data = await response.json();
        state.currentUser = data.user;
        if (state.currentUser && state.currentUser.role === 'farmer') {
            showFarmerOptions();
        }
        updateAuthButton();
    } catch (error) {
        console.error('Error loading user:', error);
        clearToken();
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

    recognition.onresult = function(event) {
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

    recognition.onerror = function(event) {
        console.error('Voice search error:', event.error);
        alert('Voice search failed: ' + event.error);
    };

    recognition.onend = function() {
        if (voiceButton) {
            const texts = translations[state.lang] || translations.en;
            voiceButton.disabled = false;
            voiceButton.textContent = texts.voiceSearch || '🎙️ Voice Search';
        }
    };

    recognition.npmstart();
}

// Initialize App
document.addEventListener('DOMContentLoaded', async function() {
    loadSampleData();
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
    clearToken();
    setLanguage(state.lang);
    updateAuthButton();
    state.cart = [];
    updateCartCount();
    alert('You have been logged out');
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
function loadSampleData() {
    state.products = [
        {
            id: 1,
            name: 'Organic Tomatoes',
            category: 'Vegetables',
            price: 291.05, // 3.50 * 83
            quantity: 50,
            farmer: 'John Smith',
            farmerId: 101,
            description: 'Fresh organic tomatoes, locally grown',
            icon: '🍅'
        },
        {
            id: 2,
            name: 'Farm Fresh Lettuce',
            category: 'Vegetables',
            price: 166.00, // 2.00 * 83
            quantity: 30,
            farmer: 'Sarah Johnson',
            farmerId: 102,
            description: 'Crisp and fresh lettuce, no pesticides',
            icon: '🥬'
        },
        {
            id: 3,
            name: 'Sweet Corn',
            category: 'Vegetables',
            price: 124.50, // 1.50 * 83
            quantity: 75,
            farmer: 'Mike Brown',
            farmerId: 103,
            description: 'Sweet and tender corn on the cob',
            icon: '🌽'
        },
        {
            id: 4,
            name: 'Red Apples',
            category: 'Fruits',
            price: 332.00, // 4.00 * 83
            quantity: 100,
            farmer: 'Emily Davis',
            farmerId: 104,
            description: 'Crisp red apples, perfect for snacking',
            icon: '🍎'
        },
        {
            id: 5,
            name: 'Yellow Bananas',
            category: 'Fruits',
            price: 62.25, // 0.75 * 83
            quantity: 200,
            farmer: 'Carlos Martinez',
            farmerId: 105,
            description: 'Ripe yellow bananas, perfect ripeness',
            icon: '🍌'
        },
        {
            id: 6,
            name: 'Fresh Honey',
            category: 'Honey',
            price: 996.00, // 12.00 * 83
            quantity: 20,
            farmer: 'Robert Wilson',
            farmerId: 106,
            description: 'Pure raw honey from wildflower hives',
            icon: '🍯'
        },
        {
            id: 7,
            name: 'Wheat Flour',
            category: 'Grains',
            price: 415.00, // 5.00 * 83
            quantity: 40,
            farmer: 'David Anderson',
            farmerId: 107,
            description: 'Whole wheat flour, stone-ground',
            icon: '🌾'
        },
        {
            id: 8,
            name: 'Fresh Milk',
            category: 'Dairy',
            price: 311.25, // 3.75 * 83
            quantity: 60,
            farmer: 'Jessica Taylor',
            farmerId: 108,
            description: 'Fresh dairy milk from grass-fed cows',
            icon: '🥛'
        }
    ];

    // Base market prices
    const basePrices = {
        'Tomatoes': { today: 291.05, yesterday: 286.35, week: 282.20, trend: 'up' },
        'Lettuce': { today: 166.00, yesterday: 170.15, week: 174.30, trend: 'down' },
        'Corn': { today: 124.50, yesterday: 124.50, week: 128.65, trend: 'stable' },
        'Apples': { today: 332.00, yesterday: 327.85, week: 323.70, trend: 'up' },
        'Bananas': { today: 62.25, yesterday: 62.25, week: 66.40, trend: 'stable' },
        'Honey': { today: 996.00, yesterday: 1037.50, week: 1079.00, trend: 'down' },
        'Wheat Flour': { today: 415.00, yesterday: 415.00, week: 423.30, trend: 'stable' },
        'Milk': { today: 311.25, yesterday: 307.10, week: 303.45, trend: 'up' }
    };

    // Load or generate daily APMC prices
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('apmc_date');
    let storedPrices = localStorage.getItem('apmc_prices');

    if (storedDate === today && storedPrices) {
        state.marketPrices = JSON.parse(storedPrices);
    } else {
        // Daily APMC upload simulation (prices change by up to 5% daily)
        state.marketPrices = {};
        Object.keys(basePrices).forEach(product => {
            if (storedPrices) {
                const prev = JSON.parse(storedPrices)[product];
                if (prev) basePrices[product] = prev;
            }
            
            const changePercent = (Math.random() - 0.5) * 0.10; // +/- 5% change
            const oldPrice = basePrices[product].today;
            const newPrice = oldPrice + (oldPrice * changePercent);
            state.marketPrices[product] = {
                today: Math.max(1, newPrice),
                yesterday: oldPrice,
                week: basePrices[product].yesterday,
                trend: changePercent > 0.01 ? 'up' : changePercent < -0.01 ? 'down' : 'stable'
            };
        });
        localStorage.setItem('apmc_date', today);
        localStorage.setItem('apmc_prices', JSON.stringify(state.marketPrices));
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
            experience: '15 years',
            bio: 'Organic farmer specializing in tomatoes and vegetables'
        },
        {
            id: 102,
            name: 'Sarah Johnson',
            location: 'Bangalore, Karnataka',
            phone: '+91 98765 43211',
            email: 'sarah.farm@farmdirect.in',
            rating: 4.9,
            experience: '12 years',
            bio: 'Sustainable farming with focus on leafy greens'
        },
        {
            id: 103,
            name: 'Mike Brown',
            location: 'Hyderabad, Telangana',
            phone: '+91 98765 43212',
            email: 'mike.farm@farmdirect.in',
            rating: 4.7,
            experience: '18 years',
            bio: 'Corn and grain specialist with modern farming techniques'
        },
        {
            id: 104,
            name: 'Emily Davis',
            location: 'Chennai, Tamil Nadu',
            phone: '+91 98765 43213',
            email: 'emily.farm@farmdirect.in',
            rating: 4.6,
            experience: '10 years',
            bio: 'Fruit orchard owner with premium quality produce'
        },
        {
            id: 105,
            name: 'Carlos Martinez',
            location: 'Mumbai, Maharashtra',
            phone: '+91 98765 43214',
            email: 'carlos.farm@farmdirect.in',
            rating: 4.5,
            experience: '8 years',
            bio: 'Banana plantation with fair trade practices'
        },
        {
            id: 106,
            name: 'Robert Wilson',
            location: 'Delhi, Delhi',
            phone: '+91 98765 43215',
            email: 'robert.farm@farmdirect.in',
            rating: 4.9,
            experience: '20 years',
            bio: 'Beekeeper producing pure, raw honey'
        },
        {
            id: 107,
            name: 'David Anderson',
            location: 'Kolkata, West Bengal',
            phone: '+91 98765 43216',
            email: 'david.farm@farmdirect.in',
            rating: 4.4,
            experience: '14 years',
            bio: 'Wheat farmer with traditional stone-grinding methods'
        },
        {
            id: 108,
            name: 'Jessica Taylor',
            location: 'Ahmedabad, Gujarat',
            phone: '+91 98765 43217',
            email: 'jessica.farm@farmdirect.in',
            rating: 4.8,
            experience: '11 years',
            bio: 'Dairy farmer with grass-fed cattle'
        }
    ];
}

function displayProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const filteredProducts = state.products.filter(product => {
        const searchTerm = document.getElementById('search-products')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';

        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                             product.description.toLowerCase().includes(searchTerm) ||
                             product.farmer.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-header">${product.icon}</div>
            <div class="product-body">
                <div class="product-name">${product.name}</div>
                <div class="product-farmer">by ${product.farmer}</div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                <div class="product-quantity">Available: ${product.quantity} units</div>
                <div class="product-description">${product.description}</div>
                <div class="product-actions">
                    <button onclick="window.location.href='product.html?id=${product.id}'" class="btn-secondary">View Details</button>
                    <button onclick="addToCart(${product.id})" class="btn-primary">Add to Cart</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterProducts() {
    displayProducts();
}

function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            farmer: product.farmer,
            icon: product.icon
        });
    }

    updateCartCount();
    alert(`${product.name} added to cart!`);
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
                    <th>Product</th>
                    <th>Today</th>
                    <th>Yesterday</th>
                    <th>Weekly</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody id="prices-body">
            </tbody>
        </table>
    `;

        const tbody = document.getElementById('prices-body');
    Object.entries(state.marketPrices).forEach(([product, prices]) => {
        const trendIcon = prices.trend === 'up' ? '📈' : prices.trend === 'down' ? '📉' : '➡️';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product}</td>
            <td>₹${prices.today.toFixed(2)}</td>
            <td>₹${prices.yesterday.toFixed(2)}</td>
            <td>₹${prices.week.toFixed(2)}</td>
            <td>${trendIcon} ${prices.trend}</td>
        `;
        tbody.appendChild(row);
    });
}

function refreshPrices() {
    const btn = document.querySelector('#prices .btn-secondary');
    if (btn) {
        btn.textContent = "Fetching APMC Daily Data...";
        btn.disabled = true;
    }

    setTimeout(() => {
        // Force a new daily update simulation
        Object.keys(state.marketPrices).forEach(product => {
            const changePercent = (Math.random() - 0.5) * 0.10; // +/- 5% change
            const oldPrice = state.marketPrices[product].today;
            const newPrice = oldPrice + (oldPrice * changePercent);
            
            state.marketPrices[product].week = state.marketPrices[product].yesterday;
            state.marketPrices[product].yesterday = state.marketPrices[product].today;
            state.marketPrices[product].today = Math.max(1, newPrice);
            
            // Determine trend
            if (changePercent > 0.01) state.marketPrices[product].trend = 'up';
            else if (changePercent < -0.01) state.marketPrices[product].trend = 'down';
            else state.marketPrices[product].trend = 'stable';
        });

        const today = new Date().toDateString();
        localStorage.setItem('apmc_date', today);
        localStorage.setItem('apmc_prices', JSON.stringify(state.marketPrices));

        updateProductPricesFromMarket();
        displayMarketPrices();
        displayProducts();
        
        if (btn) {
            btn.textContent = "Force Refresh APMC Data";
            btn.disabled = false;
        }
        alert('Daily APMC Market Prices successfully uploaded/refreshed!');
    }, 800);
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

    if (!state.messages[convId]) {
        state.messages[convId] = [];
    }

    state.messages[convId].forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sent ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div class="message-bubble">${msg.text}</div>
        `;
        display.appendChild(messageDiv);
    });

    display.scrollTop = display.scrollHeight;
}

function handleMessageKeypress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !state.currentConversation) return;

    if (!state.messages[state.currentConversation]) {
        state.messages[state.currentConversation] = [];
    }

    state.messages[state.currentConversation].push({
        text: text,
        sent: true,
        timestamp: new Date()
    });

    input.value = '';
    displayMessages(state.currentConversation);

    // Simulate response
    setTimeout(() => {
        const responses = [
            "Thank you for your message. I'll get back to you soon.",
            "I appreciate your interest in our products.",
            "Let me check the availability for you.",
            "Great! I'll prepare your order.",
            "Thank you for choosing FarmDirect."
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];

        state.messages[state.currentConversation].push({
            text: response,
            sent: false,
            timestamp: new Date()
        });

        displayMessages(state.currentConversation);

        // Update conversation list
        const conv = state.conversations.find(c => c.id === state.currentConversation);
        if (conv) {
            conv.lastMessage = response;
            displayConversations();
        }
    }, 1000 + Math.random() * 2000);
}

// ==================== CART ====================
function displayCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    if (state.cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-state">Your cart is empty</div>';
        updateCartSummary();
        return;
    }

    state.cart.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        itemDiv.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-icon">${item.icon}</div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-farmer">by ${item.farmer}</div>
                    <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
                </div>
            </div>
            <div class="cart-item-controls">
                <button onclick="updateCartItem(${item.id}, -1)" class="btn-secondary">-</button>
                <span class="cart-item-quantity">${item.quantity}</span>
                <button onclick="updateCartItem(${item.id}, 1)" class="btn-secondary">+</button>
                <button onclick="removeFromCart(${item.id})" class="btn-danger">Remove</button>
            </div>
        `;
        cartItems.appendChild(itemDiv);
    });

    updateCartSummary();
}

function updateCartItem(productId, change) {
    const item = state.cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    updateCartCount();
    displayCart();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartCount();
    displayCart();
}

function updateCartSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 415.00 : 0;
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
    alert('Payment processing... (This is a demo)');

    // Create order
    const order = {
        id: Date.now(),
        items: [...state.cart],
        total: parseFloat(document.getElementById('total').textContent),
        date: new Date().toISOString(),
        status: 'Processing'
    };

    state.orders.push(order);
    state.cart = [];
    updateCartCount();

    alert('Payment successful! Your order has been placed.');
    showSection('orders');
}

// ==================== ORDERS ====================
function displayOrders() {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    if (state.orders.length === 0) {
        ordersList.innerHTML = '<div class="empty-state">No orders yet</div>';
        return;
    }

    state.orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-card';
        orderDiv.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                <div class="order-status">${order.status}</div>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.icon} ${item.name} x${item.quantity}</span>
                        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: ₹${order.total.toFixed(2)}</div>
        `;
        ordersList.appendChild(orderDiv);
    });
}

// ==================== MODALS ====================
function viewProductDetails(productId) {
    const product = state.products.find(p => p.id === productId);
    const farmer = state.farmers.find(f => f.id === product.farmerId);

    if (!product || !farmer) return;

    document.getElementById('detail-icon').textContent = product.icon;
    document.getElementById('detail-title').textContent = product.name;
    document.getElementById('detail-name').textContent = product.name;
    document.getElementById('detail-category').textContent = product.category;
    document.getElementById('detail-price').textContent = `₹${product.price.toFixed(2)}`;
    document.getElementById('detail-quantity').textContent = `${product.quantity} units`;
    document.getElementById('detail-description').textContent = product.description;

    document.getElementById('detail-farmer-name').textContent = farmer.name;
    document.getElementById('detail-farmer-location').textContent = farmer.location;
    document.getElementById('detail-farmer-phone').textContent = farmer.phone;
    document.getElementById('detail-farmer-email').textContent = farmer.email;
    document.getElementById('detail-farmer-rating').textContent = `${farmer.rating}/5`;
    document.getElementById('detail-farmer-experience').textContent = farmer.experience;
    document.getElementById('detail-farmer-bio').textContent = farmer.bio;

    document.getElementById('detail-add-button').onclick = () => {
        addToCart(productId);
        closeProductDetailsModal();
    };

    document.getElementById('detail-message-button').onclick = () => {
        startConversation(farmer.name, farmer.id);
        closeProductDetailsModal();
    };

    document.getElementById('product-detail-modal').style.display = 'block';
}

function closeProductDetailsModal() {
    document.getElementById('product-detail-modal').style.display = 'none';
}

function openAddProductModal() {
    document.getElementById('add-product-modal').style.display = 'block';
}

function closeAddProductModal() {
    document.getElementById('add-product-modal').style.display = 'none';
}

function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const description = document.getElementById('product-description').value.trim();

    if (!name || !category || !price || !quantity || !description) {
        alert('Please fill in all fields');
        return;
    }

    const newProduct = {
        id: state.products.length + 1,
        name,
        category,
        price,
        quantity,
        farmer: state.currentUser.username,
        farmerId: state.currentUser.id,
        description,
        icon: '🆕'
    };

    state.products.push(newProduct);
    displayProducts();
    closeAddProductModal();

    // Clear form
    document.getElementById('product-name').value = '';
    document.getElementById('product-category').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').value = '';
    document.getElementById('product-description').value = '';

    alert('Product added successfully!');
}

function startConversation(farmerName, farmerId) {
    let conversation = state.conversations.find(c => c.with === farmerName);
    if (!conversation) {
        conversation = {
            id: Date.now(),
            with: farmerName,
            farmerId: farmerId,
            lastMessage: 'Started conversation'
        };
        state.conversations.push(conversation);
    }

    selectConversation(conversation.id, farmerName);
    showSection('messages');
}