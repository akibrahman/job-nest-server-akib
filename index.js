const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const job = require("./job");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const {
  MongoClient,
  ServerApiVersion,
  serialize,
  ObjectId,
} = require("mongodb");

//! Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://jobnest-akib.web.app",
      "https://jobnest-akib.firebaseapp.com",
    ],
    // origin: "http://localhost:5176",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

app.use(cookieParser());

//! Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    req.data = decoded;
    next();
  });
};

//! Creating MongoDB Environment
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfs9yhw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bfs9yhw.mongodb.net/?retryWrites=true&w=majority`,
  { dbName: "JobNestDB" }
);

const testSchema = new mongoose.Schema({
  name: { type: String },
  age: Number,
  createdAt: { type: Date, default: () => Date.now() },
  bestFriend: { type: [mongoose.SchemaTypes.ObjectId], ref: "alljob" },
});

const testModel = mongoose.model("test", testSchema);

app.post("/test-schema", async (req, res) => {
  try {
    //! Another Way
    // const testCreator = new testModel({ name: "Sakib", age: 40 });
    // const result = await testCreator.save();
    //! Creating
    // const result = await testModel.create({ name: "AfrojaR.", age: 25 });
    // await result.save();
    // res.send(result);
    //! Updating
    // const abbu = await testModel.exists({ name: "AkibR." });
    const abbu = await testModel
      .where("name")
      .equals("ZillurR.")
      .populate("bestFriend");
    // abbu[0].bestFriend = [
    //   "6549db3c36b91290397468a1",
    //   "654a02e336b91290397468a3",
    // ];
    // await abbu[0].save();

    console.log(abbu);
    res.send(abbu);
  } catch (error) {
    res.send(error.message);
  }
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

    const usersCollection = client.db("JobNestDB").collection("AllUsers");
    const allJobsCollection = client.db("JobNestDB").collection("alljobs");
    const appliedJobsCollection = client
      .db("JobNestDB")
      .collection("AppliedJobs");

    //! Create Token
    app.post("/create-jwt", async (req, res) => {
      const user = await req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    //! Remove Token
    app.post("/remove-jwt", async (req, res) => {
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });
    //! Save User to DB
    app.put("/all-users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const isExist = await usersCollection.findOne(query);
      console.log("User found?----->", isExist);
      if (isExist) {
        await usersCollection.updateOne(
          query,
          {
            $set: { name: user.name, timestampNow: Date.now() },
          },
          options
        );
        return res.send(isExist);
      }
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now(), timestampNow: Date.now() },
        },
        options
      );
      res.send(result);
    });

    //! Get one user - User
    app.get("/user", verifyToken, async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    //! Get Role
    app.get("/get-role", async (req, res) => {
      const email = req.query.email;
      const result = await usersCollection.findOne({ email });
      res.send(result.role);
    });

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

    //! Get My Jobs
    app.get("/my-jobs", verifyToken, async (req, res) => {
      let query = {};
      if (req.query?.email) {
        const email = req.query.email;
        if (email !== req.data.email) {
          return res.status(401).send({ Message: "Forbidden" });
        }
        query = { authorEmail: email };
      }
      const result = await allJobsCollection.find(query).toArray();
      res.send(result);
    });

    //! Delete My Job
    app.delete("/delete-my-job/:id", async (req, res) => {
      const id = req.params.id;
      const target = { _id: new ObjectId(id) };
      const result = await allJobsCollection.deleteOne(target);
      res.send(result);
    });
    //todo Delete my job from applied job too
    app.delete("/delete-my-job-from-applied-job/:id", async (req, res) => {
      const id = req.params.id;
      const target = { jobID: id };
      const result = await appliedJobsCollection.deleteMany(target);
      res.send(result);
    });

    //! Get One Job
    app.get("/job-details/:id", async (req, res) => {
      const id = req.params.id;
      const target = { _id: new ObjectId(id) };
      const result = await allJobsCollection.findOne(target);
      res.send(result);
    });

    //! Update Applicants Count in a job
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
      try {
        const data = req.body;
        // console.log(data);
        const result = await job.create(data);
        // await result.save();
        // const result = await allJobsCollection.insertOne(data);
        res.send(result);
      } catch (e) {
        res.send(e.message);
      }
    });

    //! Update a job
    app.patch("/update-a-job/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const target = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJob = {
        $set: {
          jobTitle: data.jobTitle,
          companyImgURL: data.companyImgURL,
          bannerImgURL: data.bannerImgURL,
          jobCategory: data.jobCategory,
          jobDescription: data.jobDescription,
          applicationDeadline: data.applicationDeadline,
          salaryRangeStart: data.salaryRangeStart,
          salaryRangeEnd: data.salaryRangeEnd,
        },
      };
      const result = await allJobsCollection.updateOne(
        target,
        updateJob,
        options
      );
      res.send(result);
    });
    //todo Update Jobs from Applied Jobs too
    app.put("/update-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const target = { jobID: id };
      const options = { upsert: false };
      const updateJob = {
        $set: {
          jobTitle: data.jobTitle,
          companyImgURL: data.companyImgURL,
          bannerImgURL: data.bannerImgURL,
          jobCategory: data.jobCategory,
          applicationDeadline: data.applicationDeadline,
          salaryRangeStart: data.salaryRangeStart,
          salaryRangeEnd: data.salaryRangeEnd,
        },
      };
      const result = await appliedJobsCollection.updateMany(
        target,
        updateJob,
        options
      );
      res.send(result);
    });

    //! Add Applied Job
    app.post("/add-a-applied-job", async (req, res) => {
      const data = req.body;
      const result = await appliedJobsCollection.insertOne(data);
      res.send(result);
    });

    //! Get user wise Applied Jobs
    app.get("/applied-jobs", verifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicantEmail: email };
      const result = await appliedJobsCollection.find(query).toArray();
      res.send(result);
    });

    //! Find from appliedJobs to prevent two application on a same Job
    app.post("/get-a-applied-job", async (req, res) => {
      const { email, id } = await req.body;
      const result = await appliedJobsCollection.findOne({
        $and: [{ jobID: id }, { applicantEmail: email }],
      });
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
