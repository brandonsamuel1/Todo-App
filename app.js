require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(cookieParser('keyboard cat'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/todoDB', {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

const listSchema = new mongoose.Schema({
    author: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
    },
    title: String,
    description: String,
    todo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }]
});

const todoSchema = new mongoose.Schema({
    todo: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User'
        }
    }
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
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
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
    const user = new User({
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


app.get('/dashboard', (req, res) => {
    List.find({author: req.user._id}, function(err, foundList) {
        if(err) {
            console.log(err);
        } else {
            if(foundList) {
                res.render('dashboard', {list: foundList});
            ;}
        };
    })
});

app.get('/create', (req, res) => {
    res.render('create');
    console.log(req.user.username);
});

app.post('/create', (req, res) => {
    let title = req.body.title;
    let description = req.body.description;
    let author = req.user._id;
    let newList = {title: title, description: description, author: author}

    List.create(newList, function(err, newListCreated) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/dashboard');
        }
    })
});


app.get('/:listTitle', (req, res) => {
    const listTitle = _.capitalize(req.params.listTitle);
    res.send(listTitle);
});

app.listen(8080, (req, res) => {
    console.log('Server started on port 8080..');
});