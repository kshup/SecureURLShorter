const mongoose = require('mongoose');

const BlacklistIpSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true
  },
  reason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BlacklistIp', BlacklistIpSchema); 