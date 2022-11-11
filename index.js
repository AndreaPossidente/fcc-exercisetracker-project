const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");

// apply middlewares
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

// connect to database
let conn = mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// async function clearCollections() {
//   const collections = mongoose.connection.collections;

//   await Promise.all(Object.values(collections).map(async (collection) => {
//       await collection.deleteMany({}); // an empty mongodb selector object ({}) must be passed as the filter argument
//   }));
// }

// clearCollections();

// import models
const User = require("./models/User");
const Exercise = require("./models/Exercise");

// routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// API Routes
// ------------
// POST /api/users - Create a New User
app.post("/api/users", async (req, res) => {
  const username = req.body?.username;
  if (username) {
    // await User.create({ username })
    await User.findOneAndUpdate(
      { username },
      { $set: { username } },
      { upsert: true, new: true }
    ).then((user) => {
      res.json({
        _id: user._id,
        username: user.username,
      });
      return;
    });
  }
});
// GET /api/users - Get a list of all users
app.get("/api/users", async (req, res) => {
  let users = await User.find().then((users) => {
    res.json(users);
    return;
  });
});
// POST /api/users/:_id/exercises - Add a user's exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
  const _id = req.params?._id;
  const date = new Date(req.body?.date || Date.now()).toDateString();
  const duration = Number(req.body?.duration) || 0;
  const description = req.body?.description;

  if (_id) {
    await Exercise.create({
      userId: _id,
      date,
      duration,
      description,
    })
      .then(async (exercise) => {
        let user = await User.findOne({ _id });
        res.json({
          _id,
          username: user.username,
          date,
          duration,
          description,
        });
        return;
      })
      .catch((err) => console.log(err));
  } else {
    res.json({ error: "exercise not found" });
    return;
  }
});
// GET /api/users/:_id/logs - Full exercise log of any user
app.get("/api/users/:_id/logs", async (req, res) => {
  let from = req.query.from !== undefined ? new Date(req.query.from) : null;
  let to = req.query.to !== undefined ? new Date(req.query.to) : null;
  let limit = req.query.limit !== undefined ? req.query.limit : null;
  const _id = req.params?._id;
  from = Date.parse(new Date(from)) || undefined;
  to = Date.parse(new Date(to)) || undefined;
  const username = await User.findOne({ _id }).then((user) => user.username);
  const count = await Exercise.countDocuments({ userId: _id });
  const exercises = await Exercise.find({ userId: _id });

  let log = [];

  exercises.forEach((ex) => {
    let test = false;
    let exDate = Date.parse(ex.date);

    if (from && to) {
      if (exDate >= from && exDate <= to) {
        test = true;
      }
    } else if (from && !to) {
      if (exDate >= from) {
        test = true;
      }
    } else if (!from && to) {
      if (exDate <= to) {
        test = true;
      }
    } else {
      test = true;
    }

    if (test == true) {
      log.push({
        description: String(ex.description),
        duration: Number(ex.duration),
        date: String(ex.date),
      });
    }
  });

  res.json({
    _id,
    username,
    count: limit && limit <= log.length ? parseInt(limit) : log.length,
    log: log.slice(
      0,
      limit && limit <= log.length ? parseInt(limit) : log.length
    ),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
