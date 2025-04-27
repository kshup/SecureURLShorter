const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  referrer: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Stats', StatsSchema); 