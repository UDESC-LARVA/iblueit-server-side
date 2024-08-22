const mongoose = require('mongoose');

const GameParameterSchema = mongoose.Schema({
    stageId: { type: Number, min: 1 },
    phase: { type: Number, min: 1, max: 4 },
    level: { type: Number, min: 1 },
    pacientId: { type: String },
    ObjectSpeedFactor: { type: Number, min: 1.0, max: 3.0 },
    Loops: { type: Number, min: 1, max: 99 },
    HeightIncrement: { type: Number, min: 0.0, max: 1.0 },
    HeightUpThreshold: { type: Number, min: 0, max: 6 },
    HeightDownThreshold: { type: Number, min: 0, max: 3 },
    SizeIncrement: { type: Number, min: 0.0, max: 1.0 },
    SizeUpThreshold: { type: Number, min: 0, max: 6 },
    SizeDownThreshold: { type: Number, min: 0, max: 3 }
},
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('GameParameter', GameParameterSchema);