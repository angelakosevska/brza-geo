// const mongoose = require("mongoose");

// // Schema for storing an individual player's submission
// // This is separate from the Room model to allow querying submissions directly
// const submissionSchema = new mongoose.Schema({
//   // Reference to the room where the submission happened
//   room: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Room",
//     required: true,
//   },

//   // Reference to the user who submitted
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },

//   // Round number this submission belongs to
//   round: {
//     type: Number,
//     required: true,
//   },

//   // Starting letter for this round
//   letter: {
//     type: String,
//     required: true,
//   },

//   // Map of category → word 
//   words: {
//     type: Map,
//     of: String,
//   },

//   // Timestamp when the submission was made
//   submittedAt: {
//     type: Date,
//     default: Date.now,
//   },

//   // Total score awarded for this submission
//   score: {
//     type: Number,
//     default: 0,
//   },
// });

// // Export Submission model
// module.exports = mongoose.model("Submission", submissionSchema);
