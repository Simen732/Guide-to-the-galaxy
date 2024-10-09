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



const diskStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,"./uploads")
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originalname)
        console.log("ext",ext)
    
        // if(ext !== ".png" || ext !== ".jpng"){
        //     return cb(new Error("only png files are allowed, Martin kom deg ut av nettsiden min"))
        // }

        const filename = file.originalname + ".png"

        cb(null,filename)
    }
})


const uploads = multer({
    storage: diskStorage,
})

dotenv.config();

app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://127.0.0.1:27017/helpdesk")
    .then(() => console.log("connected!"))
    .catch((error) => console.log("error",error)) 


const guideSchema = new Schema({
    titel: String,
    tag: String,    
    overskrift: Array,
    beskrivelse: Array,    
    imgFile: Array    


})

const brukerSchema = new Schema({
    email: String,
    password: String    
})


const User = mongoose.model("U", brukerSchema)
    
const Guide = mongoose.model("Guide", guideSchema);


  

app.get("/", async (req, res) => {
    try {
        const guides = await Guide.find(); // Fetch all guides
        res.render("index", { guides });
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Server error");
    }
});


app.get("/guide", async (req, res) => {
    try {
        // Fetch all guides from the database
        const guides = await Guide.find();
        
        // Pass the guides to the 'guide' EJS template
        res.render("guide", { guides });
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Server error");
    }
});

app.get("/guide/:id", async (req, res) => {
    try {
        const guide = await Guide.findById(req.params.id); // Fetch guide by ID
        res.render("guide", { guide });
    } catch (error) {
        console.error("Error fetching guide:", error);
        res.status(500).send("Server error");
    }
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

app.post("/newGuide", uploads.array("bilde"), async (req, res) => {
    try {
        // Extract form data
        const { tittel, tag, overskrift, beskrivelse } = req.body;
        
        // If there's only one section, overskrift and beskrivelse might not be arrays. Normalize them to arrays.
        const overskriftsArray = Array.isArray(overskrift) ? overskrift : [overskrift];
        const beskrivelsesArray = Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse];
        
        // Extract filenames of uploaded images
        const imgFiles = req.files.map(file => file.filename);

        // Create a new guide instance
        const newGuide = new Guide({
            titel: tittel,
            tag: tag,
            overskrift: overskriftsArray,
            beskrivelse: beskrivelsesArray,
            imgFile: imgFiles
        });

        // Save the guide to the database
        const savedGuide = await newGuide.save();
        console.log("Guide saved:", savedGuide);

        // Send a success response or redirect
        res.status(200).json({ message: "Guide saved successfully!" });

    } catch (error) {
        console.error("Error saving guide:", error);
        res.status(500).json({ message: "Server error while saving guide." });
    }
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
    const { brukernavn, password } = req.body;

    User.findOne({ email: brukernavn }).then((user) => {
        if (!user) {
            // If no user is found, return an error
            console.log("User not found");
            return res.status(404).json({ message: "User not found" });
        }

        // If user is found, compare the password
        bcrypt.compare(password, user.password).then((result) => {
            if (result) {
                console.log("Password match");
                res.status(200).redirect("/dashboard");
            } else {
                console.log("Password does not match");
                res.status(401).json({ message: "Invalid password" });
            }
        }).catch((error) => {
            console.log("Error comparing passwords", error);
            res.status(500).json({ message: "Server error" });
        });

    }).catch((error) => {
        console.log("Error finding user", error);
        res.status(500).json({ message: "Server error" });
    });
});






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