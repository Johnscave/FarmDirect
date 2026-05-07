const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'market.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    // Market Prices Table
    db.run(`CREATE TABLE IF NOT EXISTS market_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product TEXT NOT NULL,
        market_name TEXT NOT NULL,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        modal_price REAL NOT NULL,
        arrival_date TEXT NOT NULL,
        unit TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password TEXT NOT NULL,
        address TEXT,
        role TEXT NOT NULL,
        profilePhoto TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products Table
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL,
        farmerId INTEGER NOT NULL,
        description TEXT,
        icon TEXT,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (farmerId) REFERENCES users(id)
    )`);
});

// User Helper Functions
const createUser = (userData) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO users 
            (fullName, email, phone, password, address, role, profilePhoto) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(
            userData.fullName,
            userData.email,
            userData.phone,
            userData.password,
            userData.address,
            userData.role,
            userData.profilePhoto || null,
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
        stmt.finalize();
    });
};

const findUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const getUserById = (id) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT id, fullName, email, phone, address, role, profilePhoto FROM users WHERE id = ?`, [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

// Product Helper Functions
const createProduct = (productData) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO products 
            (name, category, price, quantity, unit, farmerId, description, icon, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(
            productData.name,
            productData.category,
            productData.price,
            productData.quantity,
            productData.unit,
            productData.farmerId,
            productData.description,
            productData.icon || '📦',
            productData.image || null,
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
        stmt.finalize();
    });
};

const getFarmerProducts = (farmerId) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM products WHERE farmerId = ?`, [farmerId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getAllProducts = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT p.*, u.fullName as farmerName FROM products p JOIN users u ON p.farmerId = u.id`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const deleteProduct = (id, farmerId) => {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM products WHERE id = ? AND farmerId = ?`, [id, farmerId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};

const insertMarketPrice = (priceData) => {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`INSERT INTO market_prices 
            (product, market_name, min_price, max_price, modal_price, arrival_date, unit) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`);
            
        stmt.run(
            priceData.product, 
            priceData.market_name, 
            priceData.min_price, 
            priceData.max_price, 
            priceData.modal_price, 
            priceData.arrival_date,
            priceData.unit,
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
        stmt.finalize();
    });
};

const getLatestPrices = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT mp.* 
            FROM market_prices mp
            INNER JOIN (
                SELECT product, MAX(arrival_date) as max_date
                FROM market_prices
                GROUP BY product
            ) latest ON mp.product = latest.product AND mp.arrival_date = latest.max_date
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getPriceHistory = (productName, limit = 7) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * FROM market_prices 
            WHERE product = ? 
            ORDER BY arrival_date DESC 
            LIMIT ?
        `;
        db.all(query, [productName, limit], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

module.exports = {
    db,
    insertMarketPrice,
    getLatestPrices,
    getPriceHistory,
    createUser,
    findUserByEmail,
    getUserById,
    createProduct,
    getFarmerProducts,
    getAllProducts,
    deleteProduct
};
