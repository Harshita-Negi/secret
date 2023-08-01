import 'dotenv/config' // ENVIRONMENT VARIABLE FOR STORING PRIVATE VALUES.
import  express  from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";   // LEVEL 2
// import md5 from 'md5'; // LEVEL 3
// import bcrypt from "bcrypt"; // LEVEL 4
import session from 'express-session';  // LEVEL 5
import passport from 'passport';   // LEVEL 5
import passportLocalMongoose from "passport-local-mongoose";  // LEVEL 5

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
    password : String
});

userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]}); // process.env.SECRET: uses the value SECRET in .env file.

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());  // TO SETUP PASSPORT LOCAL MONGOOSE
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=> {
   res.render("home.ejs");
})

app.get("/login", (req, res)=> {
    res.render("login.ejs");
})

app.get("/register", (req, res)=> {
    res.render("register.ejs");
})

app.get("/secrets", (req, res)=> {
    if(req.isAuthenticated()){
        res.render("secrets.ejs");
    }else{
        res.redirect("/login");
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

app.listen(3000, ()=>{
    console.log("server started running on port 3000. ");
})