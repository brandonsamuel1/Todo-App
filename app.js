require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


app.get('/', (req, res) => {
    res.send('Hello');
});

app.get('/login', (req, res) => {
    res.send('LOGIN');
});

app.get('/register', (req, res) => {
    res.send('REGISTER');
});

app.listen(8080, (req, res) => {
    console.log('Server started on port 8080..');
});