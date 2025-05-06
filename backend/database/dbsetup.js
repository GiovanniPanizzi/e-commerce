const Database = require('better-sqlite3');
const db = new Database('./database/database.db');

// Funzione per creare una tabella con query SQL
function createTable(query) {
    try {
        db.exec(query);
        console.log('✓ Tabella creata.');
    } catch (err) {
        console.error('Errore durante la creazione tabella:', err.message);
    }
}

// Array di tutte le CREATE TABLE
const tableDefinitions = [

`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    hashPassword TEXT NOT NULL,
    admin BOOLEAN NOT NULL DEFAULT 0
);`,

`CREATE TABLE IF NOT EXISTS address (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    street TEXT NOT NULL,
    apartment TEXT,
    description TEXT,
    isDefault BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
);`,

`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    imagesURL TEXT, -- stringa JSON
    price REAL NOT NULL,
    countInStock INTEGER NOT NULL
);`,

`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adressId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    totalPrice REAL NOT NULL,
    FOREIGN KEY (adressId) REFERENCES adress(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);`,

`CREATE TABLE IF NOT EXISTS orderedProducts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);`,

`CREATE TABLE IF NOT EXISTS pendingUsers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    hashPassword TEXT NOT NULL,
    createdAt TEXT NOT NULL
);`,

`CREATE TABLE IF NOT EXISTS emailVerificationTokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pendingUserId INTEGER NOT NULL,
    token TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (pendingUserId) REFERENCES pendingUsers(id) ON DELETE CASCADE
);`
];

// Esecuzione delle CREATE TABLE
function createTables(){
    tableDefinitions.forEach(createTable);
    db.close();
}

module.exports = { createTables };