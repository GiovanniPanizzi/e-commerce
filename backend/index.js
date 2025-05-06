const port = 3000;

//express
const express = require('express');
const app = express();

//.env access
require('dotenv/config');
const api = process.env.API_URL;

//db create tables
const dbSetup = require('./database/dbsetup');
const registration = require('./database/registration');
const mailer = require('./database/mailer');
const login = require('./database/login');

dbSetup.createTables();

//middleware
app.use(express.json());

//log http requests
const morgan = require('morgan');
app.use(morgan('tiny'));
app.use(express.urlencoded({ extended: true }));

//frontEnd files deploy
app.use(express.static('../frontend/'));

/* APIS */

//mail verification API
app.get(api+'/verify-email', (req, res) => {
    mailer.verifyEmail(req, res);
});

//registration API
app.post(api+'/registration', (req, res) => {
    registration.preRegister(req, res);
});

//login API
app.post(api+'/login', (req, res) => {
    login.login(req, res);
});

//run server
app.listen(port, () => {
    console.log('server is running on http://localhost:'+ port);
});