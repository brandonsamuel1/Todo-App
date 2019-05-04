require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/todoDB', {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    todos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'List' }]
});

const listSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    description: String,
    list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
});

const todoSchema = new mongoose.Schema({
    todos: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);
const List = mongoose.model('List', listSchema);
const Todo = mongoose.model('Todo', todoSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    Todo.findById(id, function(err, user) {
        done(err, user);
    });
});

app.get('/', (req, res) => {
    res.send('HOME PAGE');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.post('/register', (req, res) => {
    User.register({username: req.body.username, email: req.body.email}, req.body.password, function(err, user) {
        if(err) {
            console.log(err)
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/dashboard');
            });
        };
    });
});

app.post('/login', (req, res) => {
    const user = new Todo({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    req.login(user, (err) => {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/dashboard');
            });
        };
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.get('/create', (req, res) => {
    res.render('create');
});

app.listen(8080, (req, res) => {
    console.log('Server started on port 8080..');
});