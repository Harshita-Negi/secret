import 'dotenv/config' // ENVIRONMENT VARIABLE FOR STORING PRIVATE VALUES.
import  express  from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";   // LEVEL 2
// import md5 from 'md5'; // LEVEL 3
import bcrypt from "bcrypt"; // LEVEL 4

const saltRounds = 10;


const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields:["password"]}); // process.env.SECRET: uses the value SECRET in .env file.

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
    
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email : req.body.username,
            password : hash
            // password : md5(req.body.password) // level3 : converts user password into hash
           }) 
           console.log(newUser.password)
           newUser.save().then(res.render("secrets.ejs"));
        }); 
   
    // await newUser.save().then(res.render("secrets.ejs"));
})

app.post("/login", async(req, res)=>{
    try{
        const foundUser = await User.findOne({email : req.body.username});
        const typedPassword = req.body.password;

        await bcrypt.compare(typedPassword, foundUser.password).then(function(result) {
           if(result === true){
               res.render("secrets.ejs");
           }else{
            console.log("credentials dont match")
          }
        });
        
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