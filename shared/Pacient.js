const mongoose = require('mongoose');

const PacientSchema = mongoose.Schema({
    _gameToken: { type: String },
    name: { type: String, require: true },
    sex: { type: String },
    birthday: { type: Date },
    capacitiesPitaco: {
        insPeakFlow: { type: Number },
        expPeakFlow: { type: Number },
        insFlowDuration: { type: Number },
        expFlowDuration: { type: Number },
        respiratoryRate: { type: Number },
    },
    capacitiesMano: {
        insPeakFlow: { type: Number },
        expPeakFlow: { type: Number },
        insFlowDuration: { type: Number },
        expFlowDuration: { type: Number },
        respiratoryRate: { type: Number },
    },
    capacitiesCinta: {
        insPeakFlow: { type: Number },
        expPeakFlow: { type: Number },
        insFlowDuration: { type: Number },
        expFlowDuration: { type: Number },
        respiratoryRate: { type: Number },
    },
    observations: { type: String },
    condition: { type: String },
    unlockedLevels: { type: Number },
    accumulatedScore: { type: Number },
    playSessionsDone: { type: Number },
    currentPerformance: { type: Number },
    currentBorgScale: { type: Number },
    calibrationPitacoDone: { type: Boolean },
    calibrationManoDone: { type: Boolean },
    calibrationCintaDone: { type: Boolean },
    howToPlayDone: { type: Boolean },
    weight: { type: Number },
    height: { type: Number },
    pitacoThreshold: { type: Number },
    manoThreshold: { type: Number },
    cintaThreshold: { type: Number },
    ethnicity: { type: String },
},
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Pacient', PacientSchema);