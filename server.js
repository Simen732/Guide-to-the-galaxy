const express = require("express");
const app = express();
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

app.use(express.static(path.join(__dirname, 'public')));

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get("/", (req, res) => {
    res.render("index");

});

app.get("/guide", (req, res) => {
    res.render("guide");

});

app.get("/login", (req, res) => {
    res.render("login");

});

app.post("/login", (req, res) => {
    console.log("Logger ut her", req.body)
    const {brukernavn, password} = req.body
});

app.get("/signUp", (req, res) => {
    res.render("signUp");

});

app.listen(process.env.PORT);