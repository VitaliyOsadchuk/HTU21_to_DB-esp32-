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

