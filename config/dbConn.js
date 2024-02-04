const { MongoClient } = require("mongodb");

const connectionString =
  "mongodb+srv://juliosspz:LXrWBBVsHI0Tv0V6@cluster0.gqa8tyr.mongodb.net/?retryWrites=true&w=majority";

let _db;

const client = new MongoClient(connectionString);

const connectToDatabase = async () => {
  if (_db) {
    return _db;
  }

  try {
    await client.connect();
    _db = client.db("Exercise tracker");
    console.log("MongoDB connection established");
  } catch (e) {
    console.error(e);
    throw e;
  }

  return _db;
};

module.exports = { connectToDatabase };
