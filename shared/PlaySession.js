const mongoose = require('mongoose');

const PlaySessionSchema = mongoose.Schema({
    pacientId: { type: String },
    sessionNumber: { type: Number }
},
{ timestamps: { createdAt: 'created_at'}, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('PlaySession', PlaySessionSchema);