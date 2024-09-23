const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const { error } = require("console");
const Schema = mongoose.Schema
const bcrypt = require('bcrypt');
const multer = require('multer');
const password = 'userPassword123';




dotenv.config();

app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/helpdesk")
    .then(() => console.log("connected!"))
    .catch((error) => console.log("error",error)) 


const userSchema = new Schema({
    email: String,
    password: String    
})

const User = mongoose.model("USer", userSchema)
    


app.get("/", (req, res) => {
    res.render("index");

});

app.get("/guide", (req, res) => {
    res.render("guide");

});

app.get("/dashboard", (req, res) => {
    res.render("dashboard");

});


app.get("/login", (req, res) => {
    res.render("login");

});

app.get("/signUp", (req, res) => {
    res.render("signUp");

});

app.get("/newGuide", (req, res) => {
    res.render("newGuide");

});


app.post("/signUp", async (req, res) => {
    try {
        console.log("Logger ut her", req.body);
        const { brukernavn, password, repeatPassword } = req.body;

        // Check if passwords match
        if (password === repeatPassword) {
            // Hash the password before saving it to the database
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Create a new user instance with the hashed password
            const newUser = new User({
                email: brukernavn,
                password: hashedPassword // Store the hashed password
            });
            
            // Save the new user to the database
            const result = await newUser.save();
            console.log(result);

            // Check if the user was successfully created
            if (result._id) {
                console.log(result)
                res.redirect("/dashboard");
            }
        } else {
            console.log("Passwords do not match");
            res.status(400).send("Passwords do not match");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post("/login", (req, res) => {
    console.log("Logging in", req.body);
    const {brukernavn, password} = req.body;

    User.findOne({email: brukernavn}).then((user) => {
        console.log("results", user)

        bcrypt.compare(password, user.password).then((result) => {
            console.log(result);
            if(result) {
                res.status(200).redirect("/dashboard");
            } else {
                res.status(500).json({message: "lalala"})
            }
        })

    }).catch((error) => {
        console.log("error", error)
    })
})





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Specify the directory to save uploaded files
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname); // Save with unique name
    }
  });
  
  const upload = multer({ storage: storage });
  
  // Ensure the 'uploads' directory exists in your project
  
  // POST /newGuide route using multer to handle file uploads
  app.post("/newGuide", upload.single(), (req, res) => {
      console.log(req.body);  // Form fields without files
      console.log(req.files); // Uploaded files
  
  
      // Handle the form data and save information to the database as needed
  
      res.status(200).json({ message: "Guide received successfully" });
  });
  
  // Serve uploaded files if necessary
  app.use('/uploads', express.static('uploads'));

app.listen(process.env.PORT);