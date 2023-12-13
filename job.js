const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  authorName: String,
  authorEmail: String,
  jobTitle: String,
  companyImgURL: String,
  bannerImgURL: String,
  jobCategory: String,
  jobDescription: String,
  jobPostingDate: String,
  applicationDeadline: String,
  applicants: Number,
  salaryRangeStart: String,
  salaryRangeEnd: String,
});

module.exports = mongoose.model("alljob", jobSchema);
