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
  const exercise = db.collection("Exercise");
  const user = db.collection("Users");
  if (!req?.params?._id || !req?.body?.description || !req?.body?.duration) {
    return res.status(400).json({ message: "Form data needed" });
  }
  const result = await user.findOne({
    _id: new ObjectId(req.params._id),
  });
  if (result) {
    const date = !req?.body?.date
      ? new Date().toISOString().split("T")[0]
      : new Date(req.body.date).toISOString().split("T");
    const newExercise = exercise.insertOne({
      username: result.username,
      description: req.body.description,
      duration: req.body.duration,
      date,
    });
    res.status(200).json({
      message: `Exercise with id ${newExercise._id} created successfully`,
    });
  } else {
    return res
      .status(404)
      .json({ message: `No user with id: ${req.params.id}` });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
