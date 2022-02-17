const mongoose = require('mongoose');

// instantiate a mongoose schema
const ExersiseSchema = new mongoose.Schema({
  username: { type: String, required: true},
  description: { type: String, required: true },
  duration: { type: String, required: true },
  date: { type: Date },
});

// create a model from schema and export it
module.exports = mongoose.model('Exersise', ExersiseSchema,'exersises');
