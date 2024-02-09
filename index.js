const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const { connectToDatabase } = require("./config/dbConn.js");
const { ObjectId } = require("mongodb");
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection("Users");
  if (!req?.body?.username) {
    return res.json({ message: "No username provided" });
  }
  const duplicate = await collection.findOne({ username: req.body.username });
  if (duplicate) {
    return res.json({
      username: req.body.username,
      _id: duplicate._id,
    });
  } else {
    const result = await collection.insertOne({
      username: req.body.username,
    });
    return res.json({
      username: req.body.username,
      _id: result.insertedId.toString(),
    });
  }
});

app.get("/api/users", async (req, res) => {
  const db = await connectToDatabase();
  const collection = db.collection("Users");
  const users = await collection.find().toArray();
  return res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const db = await connectToDatabase();
  const user = db.collection("Users");
  if (!req?.params?._id || !req?.body?.description || !req?.body?.duration) {
    return res.status(400).json({ message: "Form data needed" });
  }
  const result = await user.findOne({
    _id: new ObjectId(req.params._id),
  });
  if (result) {
    const date = !req?.body?.date ? new Date() : new Date(req.body.date);

    if (user) {
      const newExercise = user.updateOne(
        {
          _id: new ObjectId(req.params._id),
        },
        {
          $inc: {
            count: 1,
          },
          $push: {
            log: {
              $each: [
                {
                  description: req.body.description,
                  duration: Number(req.body.duration),
                  date,
                },
              ],
            },
          },
        }
      );

      return res.send({
        username: result.username,
        description: req.body.description,
        duration: Number(req.body.duration),
        date: date.toDateString(),
        _id: req.params._id,
      });
    }
  } else {
    return res
      .status(404)
      .json({ message: `No user with id: ${req.params.id}` });
  }
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const db = await connectToDatabase();
  const user = db.collection("Users");
  const log = db.collection("Log");
  let from = req.query.from || 0;
  let to = req.query.to || Date.now();
  let limit = Number(req.query.limit) || 0;
  if (!req?.params?._id) {
    return res.status(400).json({ message: "User id needed" });
  } else {
    const resultUser = await user.findOne({
      _id: new ObjectId(req.params._id),
    });
    if (resultUser) {
      var filteredLog = resultUser.log.filter((entry) => {
        return entry.date >= new Date(from) && entry.date <= new Date(to);
      });
      if (limit) {
        filteredLog = filteredLog.slice(0, limit);
      }

      resultUser.log = filteredLog;
      return res.send(resultUser);
    } else {
      return res
        .status(404)
        .json({ message: `No user with id: ${req.params.id}` });
    }
  }
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
