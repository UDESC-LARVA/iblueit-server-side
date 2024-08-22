const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const minigameOverviewSchema = mongoose.Schema({
    _gameToken: { type: String },
    pacientId: { type: String },
    gameDevice: { type: String },
    respiratoryExercise: { type: String },
    minigameName: { type: String },
    devices: [String],
    flowDataRounds: [
        {
            minigameRound: { type: Number },
            roundScore: { type: Number },
            roundFlowScore: { type: Number },
            flowDataDevicesId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlowDataDevice' },
        }
    ],
},
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('MinigameOverview', minigameOverviewSchema);