
require('dotenv').config(); // ENVIRONMENT VARIABLE FOR STORING PRIVATE VALUES.
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// import encrypt from "mongoose-encryption";   // LEVEL 2
// import md5 from 'md5'; // LEVEL 3
// import bcrypt from "bcrypt"; // LEVEL 4
const session = require('express-session');  // LEVEL 5
const passport = require("passport");    // LEVEL 5
const passportLocalMongoose = require("passport-local-mongoose");  // LEVEL 5
const googleStrategy = require('passport-google-oauth20').Strategy;  // LEVEL 6
const findOrCreate = require('mongoose-findorcreate');

const saltRounds = 10;


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({  // INITIALIZING SESSION
    secret: "Our little secret.",
    resave: false,
    saveUninitialized : false
}))

app.use(passport.initialize());  // INITIALIZING PASSPORT
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret : String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]}); // process.env.SECRET: uses the value SECRET in .env file.

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());  // TO SETUP PASSPORT LOCAL MONGOOSE

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
});

passport.use(new googleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);    
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=> {
   res.render("home.ejs");
})

app.get("/auth/google", 
    passport.authenticate("google", { scope :["profile"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/login", (req, res)=> {
    res.render("login.ejs");
})

app.get("/register", (req, res)=> {
    res.render("register.ejs");
})

app.get("/secrets", async(req, res)=> {
   const foundUsers = await User.find({"secret": {$ne : null}});
   if(foundUsers){
    res.render("secrets.ejs", {usersWithSecret : foundUsers})
   }
})

app.get("/logout", (req, res)=>{
    req.logout(function(err){
        if(err){
            console.log(err);
        }else{
            res.redirect("/");
        }
    })
})

app.post("/register", async(req, res)=>{
    // passport-local-mongoose
    User.register({ username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
            })
        }  
    })
})

app.post("/login", async(req, res)=>{
    
    const newUser = new User({
        username : req.body.username,
        password : req.body.password
    })

    req.login(newUser, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.get("/submit", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit", async(req, res)=>{
    const submittedSecret = req.body.secret;
    // console.log(req.user);
    const foundUser = await User.findOne({_id : req.user.id });
    if(foundUser){
        foundUser.secret = submittedSecret;
        await foundUser.save().then(res.redirect("/secrets"));
    }
})

app.listen(3000, ()=>{
    console.log("server started running on port 3000. ");
})