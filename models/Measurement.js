// const mongoose = require('mongoose');

// const measurementSchema = new mongoose.Schema({
//   temperature: Number,
//   humidity: Number,
//   pressure: Number,
//   timestamp: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Measurement', measurementSchema);

const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  time: {
    type: Date,
    required: true
  },
  htuT: Number,
  htuH: Number,
  bmeT: Number,
  bmeH: Number,
  bmeP: Number
});

module.exports = mongoose.model('Measurement', measurementSchema);

