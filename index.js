const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const {
  MongoClient,
  ServerApiVersion,
  serialize,
  ObjectId,
} = require("mongodb");

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
    const allJobsCollection = client.db("JobNestDB").collection("AllJobs");

    //! Get All Jobs
    app.get("/all-jobs", async (req, res) => {
      let query = {};
      if (req.query?.category) {
        const category = req.query.category;
        const categoryValue = category.split(" ").join("").toLowerCase();
        query = { jobCategory: categoryValue };
      } else if (req.query?.search) {
        const search = req.query.search;
        query = { jobTitle: { $regex: new RegExp(search, "i") } };
      } else if (req.query?.email) {
        const email = req.query.email;
        query = { authorEmail: email };
      }
      const result = await allJobsCollection.find(query).toArray();
      res.send(result);
    });

    //! Get One Job
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      const target = { _id: new ObjectId(id) };
      const result = await allJobsCollection.findOne(target);
      res.send(result);
    });

    //! Update Applihcants Count in a job
    app.patch("/applicants-count/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const target = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedJob = {
        $set: {
          applicants: parseInt(data.previousCount) + 1,
        },
      };
      const result = await allJobsCollection.updateOne(
        target,
        updatedJob,
        options
      );
      res.send(result);
    });

    //! Add a Job
    app.post("/add-a-job", async (req, res) => {
      const data = req.body;
      const result = await allJobsCollection.insertOne(data);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

//! App listener
app.listen(port, () => {
  console.log(`JobNest is running on port: ${port}`);
});
