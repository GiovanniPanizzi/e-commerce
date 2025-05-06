//config
const sqlite3 = require('better-sqlite3');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const api = process.env.API_URL;

//sqlite db
const db = new sqlite3('./database/database.db');

//generate token for mail verification
function generateVerificationToken(pendingUserId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); 
    const stmt = db.prepare('INSERT INTO emailVerificationTokens (pendingUserId, token, expiresAt) VALUES (?, ?, ?)');
    stmt.run(pendingUserId, token, expiresAt);

    return token;
}

//send email verification
function sendVerificationEmail(pendingUserId, email) {

    const token = generateVerificationToken(pendingUserId);

    //url verification
    const verificationUrl = `http://localhost:3000` + api + `/verify-email?token=${token}`;

    //mail options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica la tua email',
        text: `Clicca sul seguente link per verificare la tua email: ${verificationUrl}`
    };

    //mail data
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    //send mail
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error);
            } else {
                resolve(info);
            }
        });
    });
}

//verify email
function verifyEmail(req, res){
    const token = req.query.token;

    //verify token and save pendingUser
    const stmt = db.prepare('SELECT pendingUserId, expiresAt FROM emailVerificationTokens WHERE token = ?');
    const row = stmt.get(token);

    //is token valid
    if (!row) {
        return res.status(400).send('Token non valido.');
    }

    //is token expired
    const now = new Date();
    const expiresAt = new Date(row.expiresAt);
    if (now > expiresAt) {
        return res.status(400).send('Il token è scaduto.');
    }

     //pending user data copy
    const pendingUserId = row.pendingUserId;
    const getPendingUser = db.prepare('SELECT * FROM pendingUsers WHERE id = ?');
    const pendingUser = getPendingUser.get(pendingUserId);

    if (!pendingUser) {
        return res.status(400).send('Utente in attesa non trovato.');
    }

    //create user
    const insertUser = db.prepare(`
        INSERT INTO users (name, email, phone, hashPassword)
        VALUES (?, ?, ?, ?)
    `);
    insertUser.run(
        pendingUser.name,
        pendingUser.email,
        pendingUser.phone,
        pendingUser.hashPassword
    );

    //delete pendinguser
    const deletePendingUser = db.prepare('DELETE FROM pendingUsers WHERE id = ?');
    deletePendingUser.run(pendingUserId);

    //delete token
    const deleteToken = db.prepare('DELETE FROM emailVerificationTokens WHERE token = ?');
    deleteToken.run(token);

    res.redirect('/index.html');
}

module.exports = {
    sendVerificationEmail, verifyEmail
};