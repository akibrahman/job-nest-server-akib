const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

//! Middlewares
app.use(express.json());
app.use(cors());

//! Creating MongoDB Environment
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfs9yhw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//!First Responce
app.get("/", (req, res) => {
  res.send("JobNest is Running");
});

async function run() {
  try {
    // await client.connect();
    console.log("MongoDB Running");

    //! Collections
  } finally {
  }
}
run().catch(console.dir);

//! App listener
app.listen(port, () => {
  console.log(`JobNest is running on port: ${port}`);
});
