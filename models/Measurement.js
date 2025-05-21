const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  pressure: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Measurement', measurementSchema);
