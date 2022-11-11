const mongoose = require("mongoose");
const { Schema } = mongoose;

const User = require("./User");

const exerciseSchema = new Schema({
  userId: {
    type: mongoose.ObjectId,
    ref: "User",
  },
  description: String,
  duration: Number,
  date: String,
});

module.exports = mongoose.model("Exercise", exerciseSchema);
