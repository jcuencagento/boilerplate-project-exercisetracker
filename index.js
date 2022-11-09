const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require("body-parser")

app.use(cors())
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://root:root@dbtest.8ug0z9v.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

let exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: String, required: true },
  date: { type: String }
});

let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema],
  count: { type: Number }
});

let User = mongoose.model("User", userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);


//Recollect every user
app.get("/api/users", (req, res) => {
  User.find()
    .then((result) => res.status(200).json(result))
    .then((error) => res.status(400).json(error))
});

//Post an user
app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  let user = await User.findOne({
    username: req.body.username
  });
  if (!user) {
    user = new User({ username: username });
    await user.save();
    res.status(200).json(user);
  } else {
    res.status(400).send("This username already exists!")
  }
});

//Post an exercise for a given user
app.post("/api/users/:_id/exercises", async (req, res) => {

  const { description, duration } = req.body;
  let date = req.body.date || new Date().toUTCString;
  let exercise = new Exercise({
    description: description,
    duration: duration,
    date: date
  })
  await exercise.save();

  User.findByIdAndUpdate(
    req.params._id,
    { $push: { log: exercise } },
    { new: true }
  ).then((result) => {
    let resObj = {};
    resObj["_id"] = result._id;
    resObj["username"] = result.username;
    resObj["date"] = exercise.date;
    resObj["duration"] = exercise.duration;
    resObj["description"] = exercise.description;
    res.json(resObj);
  }).catch((error) => res.status(400).send(error));
});

//Recollect exercises of a given user
app.get("/api/users/:_id/logs", (req, res) => {
  User.findById(req.params._id).then((result) => {
    result["count"] = result.log.length;
    res.json(result);
  }).catch((error) => res.status(400).send(error));
});


const listener = app.listen(process.env.PORT || 8080, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
