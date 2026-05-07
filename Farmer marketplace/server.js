const express = require('express');
const path = require('path');
const cors = require('cors');
const cron = require('node-cron');
const axios = require('axios');
const dbHandler = require('./database');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.json());
app.use(express.static(__dirname));

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'your-secret-key'; // In production, use environment variables

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
    const { fullName, email, phone, password, address, role } = req.body;

    try {
        const existingUser = await dbHandler.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await dbHandler.createUser({
            fullName,
            email,
            phone,
            password: hashedPassword,
            address,
            role
        });

        const token = jwt.sign({ id: userId, email, role }, JWT_SECRET, { expiresIn: '24h' });
        const user = { id: userId, fullName, email, role };

        res.json({ success: true, token, user });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await dbHandler.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const user = await dbHandler.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
});

// Products API (Public)
app.get('/api/products', async (req, res) => {
    try {
        const products = await dbHandler.getAllProducts();
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
});

// Farmer Products API (Protected)
app.get('/api/farmer/products', authenticateToken, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const products = await dbHandler.getFarmerProducts(req.user.id);
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch farmer products' });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ success: false, message: 'Only farmers can add products' });
    }

    const { name, category, price, quantity, unit, description, icon } = req.body;

    try {
        const productId = await dbHandler.createProduct({
            name,
            category,
            price,
            quantity,
            unit,
            farmerId: req.user.id,
            description,
            icon
        });
        res.json({ success: true, id: productId });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create product' });
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'farmer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const result = await dbHandler.deleteProduct(req.params.id, req.user.id);
        if (result === 0) {
            return res.status(404).json({ success: false, message: 'Product not found or access denied' });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete product' });
    }
});

app.post('/api/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (token && sessions[token]) {
        delete sessions[token];
    }

    res.json({ success: true });
});

// Products API
app.get('/api/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
});

// Sample products data (in production, this would come from a database)
const products = [
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
        rating: 4.8,
        reviewCount: 24,
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
        rating: 4.7,
        reviewCount: 18,
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
        rating: 4.9,
        reviewCount: 31,
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
        rating: 4.8,
        reviewCount: 45,
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
        rating: 4.6,
        reviewCount: 67,
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
        rating: 4.9,
        reviewCount: 52,
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
        rating: 4.8,
        reviewCount: 22,
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
        rating: 4.7,
        reviewCount: 15,
        badges: ['Fresh', 'Organic'],
        tags: ['Cabbage', 'Vegetable'],
        images: ['https://via.placeholder.com/400x400?text=Cabbage']
    }
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== APMC Market Prices Logic ====================

// Simulate fetching from APMC API and store in database
async function fetchAndStoreMarketPrices() {
    try {
        console.log('Fetching daily APMC market prices...');
        // In a production environment, this would be an actual API call to Agmarknet:
        // const response = await axios.get('https://api.data.gov.in/resource/...&api-key=YOUR_KEY');

        // Simulating the data structure returned by the API
        const basePrices = [
            { product: 'Tomatoes', market_name: 'Kolar APMC', base: 22, unit: 'kg' },
            { product: 'Onions', market_name: 'Lasalgaon APMC', base: 20, unit: 'kg' },
            { product: 'Rice', market_name: 'Bengaluru APMC', base: 50, unit: 'kg' },
            { product: 'Wheat', market_name: 'Gulbarga APMC', base: 28, unit: 'kg' },
            { product: 'Milk', market_name: 'KMF Dairy', base: 48, unit: 'litre' },
            { product: 'Oil', market_name: 'Hubballi APMC', base: 110, unit: 'litre' },
            { product: 'Apples', market_name: 'Shimla Market', base: 150, unit: 'kg' },
            { product: 'Bananas', market_name: 'Sirsi APMC', base: 40, unit: 'kg' },
            { product: 'Potatoes', market_name: 'Hassan APMC', base: 18, unit: 'kg' }
        ];

        const today = new Date().toISOString().split('T')[0];

        for (const item of basePrices) {
            const variance = (Math.random() - 0.5) * 20; // Random daily variance up to +/- 10
            const modal = Math.round((item.base + variance) * 100) / 100;
            const min = Math.round((modal * 0.9) * 100) / 100;
            const max = Math.round((modal * 1.1) * 100) / 100;

            const priceData = {
                product: item.product,
                market_name: item.market_name,
                min_price: min,
                max_price: max,
                modal_price: modal,
                arrival_date: today,
                unit: item.unit
            };

            await dbHandler.insertMarketPrice(priceData);
        }

        console.log('Successfully updated daily market prices in database.');
    } catch (error) {
        console.error('Failed to fetch/store APMC market prices. Retaining previous data.', error.message);
    }
}

// Schedule market price fetching daily at 09:00 AM
cron.schedule('0 9 * * *', () => {
    fetchAndStoreMarketPrices();
});

// Run it once on startup if the database is empty for today
fetchAndStoreMarketPrices();

app.get('/api/market-prices', async (req, res) => {
    try {
        const latestPrices = await dbHandler.getLatestPrices();
        res.json({ success: true, data: latestPrices });
    } catch (error) {
        console.error('Error fetching latest prices:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch market prices' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`FarmDirect backend running at http://localhost:${PORT}`);
});
