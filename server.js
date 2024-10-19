const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;
const saltRounds = 10;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/helpdesk")
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log("MongoDB connection error:", error));

const guideSchema = new mongoose.Schema({
    titel: String,
    tag: String,
    overskrift: Array,
    beskrivelse: Array,
    imgFile: Array
});



const brukerSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", brukerSchema);
const Guide = mongoose.model("Guide", guideSchema);

app.set('view engine', 'ejs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.post("/signUp", async (req, res) => {
    try {
        const { brukernavn, password, repeatPassword } = req.body;

        if (password !== repeatPassword) {
            return res.status(400).send("Passwords do not match");
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({ email: brukernavn, password: hashedPassword });
        const result = await newUser.save();

        const token = jwt.sign({ id: result._id, email: result.email }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
        res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


app.post("/login", async (req, res) => {
    try {
        const { brukernavn, password } = req.body;
        const user = await User.findOne({ email: brukernavn });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
        res.redirect("/");
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/login");
});

app.get("/newGuide", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    res.render("newGuide");
});

app.post("/newGuide", upload.array("bilde"), async (req, res) => {
    try {
        const { tittel, tag, overskrift, beskrivelse } = req.body;
        const imgFiles = req.files.map(file => file.filename);

        const newGuide = new Guide({
            titel: tittel,
            tag: tag,
            overskrift: Array.isArray(overskrift) ? overskrift : [overskrift],
            beskrivelse: Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse],
            imgFile: imgFiles
        });

        await newGuide.save();
        res.redirect("/");
    } catch (error) {
        console.error("Error saving guide:", error);
        res.status(500).send("Server error");
    }
});

app.get("/editGuide/:id", async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.redirect("/login");
    try {
        const guide = await Guide.findById(req.params.id);
        if (!guide) return res.status(404).send("Guide not found");
        res.render("editGuide", { guide });
    } catch (error) {
        console.error("Error fetching guide:", error);
        res.status(500).send("Server error");
    }
});

app.post("/editGuide/:id", upload.array("bilde"), async (req, res) => {
    try {
        const { tittel, tag, overskrift, beskrivelse } = req.body;
        const imgFiles = req.files.length > 0 ? req.files.map(file => file.filename) : undefined;

        const updatedGuide = await Guide.findByIdAndUpdate(
            req.params.id,
            {
                titel: tittel,
                tag: tag,
                overskrift: Array.isArray(overskrift) ? overskrift : [overskrift],
                beskrivelse: Array.isArray(beskrivelse) ? beskrivelse : [beskrivelse],
                ...(imgFiles && { imgFile: imgFiles })
            },
            { new: true }
        );

        if (!updatedGuide) return res.status(404).send("Guide not found");
        res.redirect("/guide/" + updatedGuide._id);
    } catch (error) {
        console.error("Error updating guide:", error);
        res.status(500).send("Server error");
    }
});

app.get("/", async (req, res) => {

    try {
        const guides = await Guide.find();
        res.render("index", { guides });
    } catch (error) {
        console.error("Error fetching guides:", error);
        res.status(500).send("Server error");
    }
});

app.get("/guide/:id", async (req, res) => {


    try {
        const guide = await Guide.findById(req.params.id);
        if (!guide) return res.status(404).send("Guide not found");
        res.render("guide", { guide });
    } catch (error) {
        console.error("Error fetching guide:", error);
        res.status(500).send("Server error");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/signUp", (req, res) => {
    res.render("signUp");
});

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server running on port ${process.env.PORT || 4000}`);
});
