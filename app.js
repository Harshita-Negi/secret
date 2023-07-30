import 'dotenv/config' // ENVIRONMENT VARIABLE FOR STORING PRIVATE VALUES.
import  express  from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]}); // process.env.SECRET: uses the value SECRET in .env file.

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res)=> {
   res.render("home.ejs");
})

app.get("/login", (req, res)=> {
    res.render("login.ejs");
})

app.get("/register", (req, res)=> {
    res.render("register.ejs");
})

app.post("/register", async(req, res)=>{
   const newUser = new User({
    email : req.body.username,
    password : req.body.password
   })

   await newUser.save().then(res.render("secrets.ejs"));
})

app.post("/login", async(req, res)=>{
    try{
        const foundUser = await User.findOne({email : req.body.username});
        if(foundUser.password === req.body.password){
          res.render("secrets.ejs");
        }
        else{
          console.log("credentials dont match")
        }

    }catch(error){
        console.log(error.message);
    }
    
})

// app.get("/secrets", (req, res)=> {
//     res.render("home.ejs");
// })

// app.get("/submit", (req, res)=> {
//     res.render("home.ejs");
// })

app.listen(3000, ()=>{
    console.log("server started running on port 3000. ");
})