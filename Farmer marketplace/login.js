const translations = {
    en: {
        chooseLogin: 'Choose Your Login',
        selectAccountType: 'Select the account type to continue.',
        buyerLoginTitle: 'Buyer Login',
        farmerLoginTitle: 'Farmer Login',
        adminLoginTitle: 'Admin Login',
        emailPhone: 'Email / Phone No',
        username: 'Username',
        password: 'Password',
        buyerLoginButton: 'Login / Register as Buyer',
        farmerLoginButton: 'Login / Register as Farmer',
        adminLoginButton: 'Login as Admin',
        backToLoginOptions: 'Back to Login Options',
        backToMarketplace: 'Back to Marketplace',
        marketplace: 'Marketplace',
        loginOptions: 'Login Options',
        loginFailed: 'Login failed',
        fillAllFields: 'Please fill in all fields',
        unableConnect: 'Unable to connect to the backend server.'
    },
    hi: {
        chooseLogin: 'अपना लॉगिन चुनें',
        selectAccountType: 'जारी रखने के लिए खाता प्रकार चुनें।',
        buyerLoginTitle: 'खरीदार लॉगिन',
        farmerLoginTitle: 'किसान लॉगिन',
        adminLoginTitle: 'एडमिन लॉगिन',
        emailPhone: 'ईमेल / फ़ोन नंबर',
        username: 'उपयोगकर्ता नाम',
        password: 'पासवर्ड',
        buyerLoginButton: 'खरीदार के रूप में लॉगिन / रजिस्टर करें',
        farmerLoginButton: 'किसान के रूप में लॉगिन / रजिस्टर करें',
        adminLoginButton: 'एडमिन के रूप में लॉगिन करें',
        backToLoginOptions: 'लॉगिन विकल्प पर वापस जाएं',
        backToMarketplace: 'मार्केटप्लेस पर वापस जाएं',
        marketplace: 'मार्केटप्लेस',
        loginOptions: 'लॉगिन विकल्प',
        loginFailed: 'लॉगिन विफल रहा',
        fillAllFields: 'कृपया सभी फ़ील्ड भरें',
        unableConnect: 'बैकएंड सर्वर से कनेक्ट करने में असमर्थ।'
    },
    kn: {
        chooseLogin: 'ನಿಮ್ಮ ಲಾಗಿನ್ ಆಯ್ಕೆಮಾಡಿ',
        selectAccountType: 'ಮುಂದುವರಿಯಲು ಖಾತೆ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
        buyerLoginTitle: 'ಖರೀದಿದಾರ ಲಾಗಿನ್',
        farmerLoginTitle: 'ಕೃಷಿಕ ಲಾಗಿನ್',
        adminLoginTitle: 'ಆಡ್ಮಿನ್ ಲಾಗಿನ್',
        emailPhone: 'ಇಮೇಲ್ / ಫೋನ್ ಸಂಖ್ಯೆ',
        username: 'ಬಳಕೆದಾರ ಹೆಸರು',
        password: 'ಗುಪ್ತಪದ',
        buyerLoginButton: 'ಖರೀದಿದಾರರಾಗಿ ಲಾಗಿನ್ / ನೋಂದಾಯಿಸಿಕೊಳ್ಳಿ',
        farmerLoginButton: 'ಕೃಷಿಕನಾಗಿ ಲಾಗಿನ್ / ನೋಂದಾಯಿಸಿಕೊಳ್ಳಿ',
        adminLoginButton: 'ಆಡ್ಮಿನ್‌ರಾಗಿ ಲಾಗಿನ್ ಮಾಡಿ',
        backToLoginOptions: 'ಲಾಗಿನ್ ಆಯ್ಕೆಗಳಿಗೆ ಹಿಂದಿರುಗಿ',
        backToMarketplace: 'ಮಾರ್ಕೆಟ್ಪ್ಲೇಸ್‌ಗೆ ಹಿಂದಿರುಗಿ',
        marketplace: 'ಮಾರ್ಕೆಟ್ಪ್ಲೇಸ್',
        loginOptions: 'ಲಾಗಿನ್ ಆಯ್ಕೆಗಳು',
        loginFailed: 'ಲಾಗಿನ್ ವಿಫಲ',
        fillAllFields: 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ',
        unableConnect: 'ಬ್ಯಾಕ್‌ಎಂಡ್ ಸರ್ವರ್‌ಗೆ ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.'
    }
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

document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function initLanguage() {
    const lang = getStoredLanguage();
    const select = document.getElementById('language-select');
    if (select) {
        select.value = lang;
        select.addEventListener('change', function() {
            saveLanguage(this.value);
            setLanguage(this.value);
        });
    }
    setLanguage(lang);
}

function setLanguage(lang) {
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
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('role').value;

    if (!email || !username || !password || !role) {
        alert(translations[getStoredLanguage()].fillAllFields);
        return;
    }

    try {
        // Mocking the backend login successful response
        const mockToken = 'mock_token_' + Date.now();
        const mockUser = {
            id: Date.now(),
            email: email,
            username: username,
            role: role,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('farmdirect_token', mockToken);
        localStorage.setItem('farmdirect_user', JSON.stringify(mockUser));
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Login error:', error);
        alert(translations[getStoredLanguage()].unableConnect);
    }
}
