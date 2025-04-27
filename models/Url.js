const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - can be anonymous
  },
  expirationDate: {
    type: Date,
    required: false // Optional expiration
  },
  allowedIps: {
    type: [String],
    required: false // Optional IP restriction
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Url', UrlSchema); 