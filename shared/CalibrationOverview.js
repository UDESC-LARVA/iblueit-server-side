const mongoose = require('mongoose');
const moment = require('moment-timezone');

const CalibrationOverviewSchema = mongoose.Schema({
    _gameToken: { type: String },
    pacientId: { type: String },
    gameDevice: { type: String },
    calibrationValue: { type: Number },
    calibrationExercise: { type: String },
},
    { timestamps: { createdAt: 'created_at' }, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('CalibrationOverview', CalibrationOverviewSchema);