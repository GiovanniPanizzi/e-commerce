//config
const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//.env
require('dotenv/config');
const tokenPassword = process.env.TOKEN_PASSWORD;

//sqlite db
const db = new sqlite3('./database/database.db');

//local functions

//regex function
function isValidPassword(password) {
    if (typeof password !== 'string') return false;
    if (password.length < 8 || password.length > 128) return false;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^()[\]{}<>])[A-Za-z\d@$!%*#?&^()[\]{}<>]+$/;
    return passwordRegex.test(password);
}

function isValidEmail(email) {
    if (typeof email !== 'string' || email.length > 254) return false;
    const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return rfc5322Regex.test(email);
}

//public functions

//login function
function login(req, res){
    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password){
        return res.status(401).json({ message: 'Email o password errati!' });
    }

    if(!isValidEmail(email) || !isValidPassword(password)){
        return res.status(401).json({ message: 'Email o password errati' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user || !bcrypt.compareSync(password, user.hashPassword)) {
        return res.status(401).json({ message: 'Email o password errati!'});
    }

    const payload = {
        id: user.id,
        email: user.email
    };

    const token = jwt.sign(payload, tokenPassword, {expiresIn: '1h'});

    return res.status(200).json({ message: 'Log in effettuato correttamente!', token: token});
}

module.exports = {login};