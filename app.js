require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
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
app.use(methodOverride('_method'));
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
            ref: 'List'
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


app.get('/lists/:id', (req, res) => {
    const id = req.params._id;
    Todo.find({author: req.user._id}, function(err, foundTodo) {
        if(err) {
            console.log(err);
        } else {
            if(foundTodo) {
                res.render('list', {todo: foundTodo, id: id});
            };
        };
    });
});


app.post('/lists', (req, res) => {
    let todoItem = req.body.todoItem;
    // let author = List._id;
    let newTodo = {todo: todoItem};

    List.findOne({id: req.params._id}, function(err, list) {
        if(err) {
            console.log(err);
        } else {
            Todo.create(newTodo, function(err, todo) {
                if(err) {
                    console.log(err);
                } else {
                    todo.author.id = list._id;
                    todo.save();
                    list.todo.push(todo._id);
                    list.save();
                    res.redirect('/lists/' + list._id)
                };
            });
        };
    });
});


app.delete('/lists/:id', (req, res) => {
    const id = req.params._id;
    List.findOneAndDelete({id: id}, function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/dashboard');
        };
    });
});

app.listen(8080, (req, res) => {
    console.log('Server started on port 8080..');
});