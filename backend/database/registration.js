//config
const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const mailer = require('./mailer.js');

//sqlite db
const db = new sqlite3('./database/database.db');

//local functions

//regex functions
function isValidEmail(email) {
    if (typeof email !== 'string' || email.length > 254) return false;
    const rfc5322Regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return rfc5322Regex.test(email);
}

function isValidName(name) {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 40) return false;
    const nameRegex = /^[a-zA-ZàèéìòùÀÈÉÌÒÙ\s'-]+$/;
    return nameRegex.test(trimmed);
}

function isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    const digits = phone.replace(/\D/g, ''); // solo numeri
    return digits.length >= 7 && digits.length <= 15;
}

function isValidPassword(password) {
    if (typeof password !== 'string') return false;
    if (password.length < 8 || password.length > 128) return false;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^()[\]{}<>])[A-Za-z\d@$!%*#?&^()[\]{}<>]+$/;
    return passwordRegex.test(password);
}

//public functions

//preregister in pendingUsers
function preRegister(req, res){
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;

    //non existing data
    if(!name || !email || !phone || !password ){
        return res.status(400).json({ message: 'Completare i campi obbligatori' });
    }

    //are data valid
    if(!isValidEmail(email) || !isValidName(name) || !isValidPassword(password) || !isValidPhone(phone)){
        console.log(isValidEmail(email));
        console.log(isValidName(name));
        console.log(isValidPassword(password));
        console.log(isValidPhone(phone));
        return res.status(400).json({ message: 'Uno o più campi non validi' });
    }

    //registration date for pending user
    const createdAt = new Date().toISOString();

    //hashing password
    const hashPassword = bcrypt.hashSync(password, 10);

    //is email already register in users or pendingUsers
    const checkPendingUserStmt = db.prepare("SELECT COUNT(*) as count FROM pendingUsers WHERE email = ?");
    const pendingUserExists = checkPendingUserStmt.get(email).count > 0;
    const checkUserStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE email = ?');
    const userExists = checkUserStmt.get(email).count > 0;

    if (userExists) {
        return res.status(409).json({ message: 'Email già registrata stronzo' });
    }

    if (pendingUserExists) {
        try {
            console.log(email);
            const stmt = db.prepare('DELETE FROM pendingUsers WHERE email = ?');
            stmt.run(email);
        } 
        catch(err) {
            console.log(err);
        }
    }

    console.log(pendingUserExists);

    try {
        //save pending user in database
        const stmt = db.prepare(`
            INSERT INTO pendingUsers (name, email, phone, hashPassword, createdAt)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(name, email, phone, hashPassword, createdAt);

        //id of user
        const getPendingUserStmt = db.prepare("SELECT id FROM pendingUsers WHERE email = ?");
        const pendingUser = getPendingUserStmt.get(email);

        if (!pendingUser) {
            return res.status(500).json({ message: 'Errore nel recupero dell\'utente registrato' });
        }

        //send email for verification
        mailer.sendVerificationEmail(pendingUser.id, email)
        .then(() => {
            res.status(200).json({ message: 'Utente registrato correttamente. Verifica la tua email per continuare.' });
        })
        .catch(error => {
            console.error(error);
            res.status(500).json({ message: 'Errore nell\'invio dell\'email' });
        });
    }

    catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(409).json({ message: 'Email già registrata' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Errore del server' });
        }
    }
}

module.exports = {preRegister};