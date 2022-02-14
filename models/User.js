const mongoose = require('mongoose');

// instantiate a mongoose schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
});

// create a model from schema and export it
module.exports = mongoose.model('User', UserSchema);
