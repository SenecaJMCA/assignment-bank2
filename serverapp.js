// A PROJECT CREATED BY JAIRO CALDERON for web322 assignment 2
const HTTP_PORT = process.env.PORT || 3000; //Setting up the port

const express = require("express"); // handle routes
const expresshbs = require("express-handlebars"); // handle the template
const path = require("path"); // handle the directory path fuctions
const fs = require("fs"); // handle the reading function
const session = require("client-sessions");
const randomStr = require("randomstring");

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

//provalemente sera aqui q eu irei inserir o codigo de sessao
let strRandom = randomStr.generate();
app.use(
  session({
    cookieName: "MySession",
    secret: strRandom,
    duration: 5 * 60 * 1000,
    activeDuration: 1 * 60 * 1000,
    httpOnly: true,
    secure: false /*setting it up to false allows the testing from local host*/,
    ephemeral: true,
  })
);

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
          //passing the username to the account's name on the account page
          let userData = { user: userName };
          req.MySession.user = userName;
          //rendering the account page with the information from userData
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
  req.MySession.reset();
  res.render("login");
});

//Handling the request submission for the options from the account menu (balance, deposit, withdraw, create account)
app.post("/transaction", (req, res) => {
  //retrieving and storing values from the request object that were sent by the form
  let accNumb = req.body.account;

  //handling the request for opening a new account since it does not requires an account number in the account input of the form
  if (req.body.action === "newAccount") {
    return res.render("registerAccpg", {
      data: { user: req.MySession.user },
    });
  }

  //Read accounts.json based on the accNumb
  fs.readFile(
    path.join(__dirname, "./accounts.json"),
    "utf-8",
    function (err, data) {
      //handling the error in case the file can't be read
      if (err) {
        console.log("Unable to read the file!");
        return;
      }

      //storing the converted JSON object in to a JS obj
      data = JSON.parse(data);

      // using destructuring to loop over the object data and then compare the account number and its key pairs values
      for (let [key, value] of Object.entries(data)) {
        //checkign the account number entered by the user against the existing ones on the file
        if (key == accNumb) {
          //if accNumb matchs the key value, loop over the js object to extract its values
          let accData = {
            accNumb: key,
            accType: value.accountType,
            accBal: value.accountBalance,
            user: req.MySession.user,
          };
          //Depending on the option submitted on the form the server app will render the page requested
          if (req.body.action === "balance") {
            return res.render("balancepg", {
              data: accData,
            });
          } else if (req.body.action === "deposit") {
            return res.render("depositpg", {
              data: accData,
            });
          } else if (req.body.action === "withdraw") {
            return res.render("withdrawpg", {
              data: accData,
            });
          }
        }
      }
    }
  );
});

//handles the cancel options in the transactions pages
app.post("/backToAccount", (req, res) => {
  let userData = { user: req.MySession.user };
  res.render("account", {
    data: userData,
  });
});

app.post("/deposit", (req, res) => {
  //retrieving and storing values from the request object that were sent by the form
  let accNumb = req.body.account;
  let amount = parseFloat(req.body.amount);

  //checking if the amount entered by the user is valid (greater than zero)
  if (amount < 0) {
    return res.render("depositpg", {
      data: { msg: "Invalid amount" },
    });
  }

  //reading file
  fs.readFile(
    path.join(__dirname, "./accounts.json"),
    "utf-8",
    (err, rawData) => {
      if (err) {
        console.log("Unable to read the file!");
        return;
      }

      //converting the JSON obj into a JS Object
      let data = JSON.parse(rawData);

      //using the destructor of object to loop over the account values
      for (let [key, value] of Object.entries(data)) {
        if (key == accNumb) {
          //if account exist then make sure the new amount + the existing balnace will be added correct
          let existingBal = parseFloat(value.accountBalance);
          let newBal = existingBal + amount;
          value.accountBalance = newBal;
        }
      }
      //writing in the file to update the account balance
      fs.writeFile(
        path.join(__dirname, "./accounts.json"),
        JSON.stringify(data, null, 2),
        () => {
          return res.render("account", {
            data: req.MySession.user,
          });
        }
      );
    }
  );
});

app.post("/withdraw", (req, res) => {
  //retrieving and storing values from the request object that were sent by the form
  let accNumb = req.body.account;
  let amount = parseFloat(req.body.amount);

  //setting up a msg for invalid amount
  let invalidMsgData = { msg: "Invalid amount", user: req.MySession.user };
  //checking if the amount if invalid and rendering a the invalid message if true
  if (amount < 0) {
    return res.render("withdrawpg", {
      data: invalidMsgData,
    });
  }

  fs.readFile(
    path.join(__dirname, "./accounts.json"),
    "utf-8",
    (err, rawData) => {
      if (err) {
        console.log("Unable to read the file!");
        return;
      }

      //converting the JSON obj into a JS Object
      let data = JSON.parse(rawData);

      //using the destructor of object to loop over the account values
      for (let [key, value] of Object.entries(data)) {
        //checking if the the account number entered by the user exist in the the file
        if (key == accNumb) {
          let existingBal = parseFloat(value.accountBalance);
          let newBal = existingBal - amount;
          //making sure the amount entered by the user won't leave the account balance in negative
          if (newBal < 0) {
            return res.render("account", {
              data: invalidMsgData,
            });
          } else {
            //if the end balance is still positive, then update the new balance in the account
            value.accountBalance = newBal;
          }
        }
      }

      //writing in the file the update balance of the account
      fs.writeFile(
        path.join(__dirname, "./accounts.json"),
        JSON.stringify(data, null, 2),
        () => {
          return res.render("account", {
            data: req.MySession.user,
          });
        }
      );
    }
  );
});

app.post("/newAccount", (req, res) => {
  //retrieving and storing values from the request object that were sent by the form
  let accType = req.body.action;

  fs.readFile(
    path.join(__dirname, "./accounts.json"),
    "utf-8",
    (err, rawData) => {
      if (err) {
        console.log("Unable to read the file!");
        return;
      }

      //converting the JSON obj into a JS Object
      let data = JSON.parse(rawData);

      //Assigning the value of element LastID to a variable (lastAccountNumb)
      let lastAccountNumb = Number(data.lastID);
      //Incrementing the value of the lastAccountNumb by one, and storing it into addedAccNumb
      let addedAccNumb = lastAccountNumb + 1;
      //Converting the type of addedAccNumb variable from number to String and addin trailing zeros to it
      let addedAccStr = String(addedAccNumb).padStart(7, "0");
      //updating the lastID value to the string number of the new account added
      data.lastID = addedAccStr;

      //Using the assign function to update and return a new data obj
      Object.assign(data, {
        [addedAccStr]: { accountType: accType, accountBalance: 0 },
      });

      //upodating (writing) the JSOn object from the worked JS object and redering the account added and the account page
      fs.writeFile(
        path.join(__dirname, "./accounts.json"),
        JSON.stringify(data, null, 2),
        () => {
          let accCreatedMsg = {
            msg: `Account ${addedAccStr} has been created`,
            user: req.MySession.user,
          };
          return res.render("account", {
            data: accCreatedMsg,
          });
        }
      );
    }
  );
});

//listenign to the dedicated port
let server = app.listen(HTTP_PORT, function () {
  console.log(`Listening to port ${HTTP_PORT}`);
});
