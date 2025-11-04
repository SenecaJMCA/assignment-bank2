// A PROJECT CREATED BY JAIRO CALDERON for web322 assignment 2
const HTTP_PORT = process.env.PORT || 3000; //Setting up the port

const express = require("express"); // handle routes
const expresshbs = require("express-handlebars"); // handle the template
const path = require("path"); // handle the directory path fuctions
const fs = require("fs"); // handle the reading function

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // adjusting the path for the public folder

//creating connection between the frameworks
app.engine(
  ".hbs",
  expresshbs.engine({
    extname: ".hbs",
    defaultLayout: false,
    layoutsDir: path.join(__dirname, "/views"),
  })
);

app.set("view engine", ".hbs");

//Display the login template
app.get("/login", (req, res) => {
  res.render("login");
});

//Submitting the username and pwd from the form
app.post("/account", (req, res) => {
  //Getting the username and password from the user input and storing it into variables
  let userName = req.body.email;
  let pwd = req.body.password;

  //Checking if the username and the password is regitered in the user.json file
  //Reading the username and password from the file user.json and creatin a JS object
  //Reading the user.json file
  fs.readFile(
    path.join(__dirname, "./user.json"),
    "utf-8",
    function (err, data) {
      //handling the error in case the file can't be read
      if (err) {
        console.log("Unable to read the file!");
        return;
      }

      //storing the converted JSON object in to a JS obj
      data = JSON.parse(data);

      //using destructuring to loop over the object data and then compare the userName and pwd
      for (let [key, value] of Object.entries(data)) {
        if (key == userName && value == pwd) {
          // registeredAccount = true;
          //passing the username to the account's name on the account page
          let userData = { user: userName };
          //rendering the account page
          return res.render("account", {
            data: userData,
          });
        }
      }

      //Handling when the username or the password is incorrect
      //creating state variable for username and password
      let usernameFound = false;
      let pwdFound = false;
      //using destructuring to loop over the object data and set the state variable
      for (let [key, value] of Object.entries(data)) {
        if (key == userName) {
          usernameFound = true;
        }
        if (value == pwd) {
          pwdFound = true;
        }
      }
      //loading the msg for an incorrect password based on the states variables
      if (usernameFound && pwdFound == false) {
        let msg = { credentials: "Invalid password!" };
        return res.render("login", {
          data: msg,
        });
      }
      //loading the msg for a not registered username (states variable)
      if (usernameFound == false) {
        let msg = { credentials: "Not a registered username!" };
        return res.render("login", {
          data: msg,
        });
      }
    }
  );
});

//adding the functionality to the log out button to return to the login page
app.get("/logout", (req, res) => {
  res.render("login");
});

app.post("/transaction", (req, res) => {
  if (req.body.action === "balance") {
    res.render("balancepg");
  } else if (req.body.action === "deposit") {
    res.render("depositpg");
  } else if (req.body.action === "withdraw") {
    res.render("withdrawpg");
  }
});

//listenign to the dedicated port
let server = app.listen(HTTP_PORT, function () {
  console.log(`Listening to port ${HTTP_PORT}`);
});
