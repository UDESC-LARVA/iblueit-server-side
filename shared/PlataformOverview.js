const mongoose = require('mongoose');

const PlataformOverviewSchema = mongoose.Schema({
    _gameToken: { type: String },
    pacientId: { type: String },
    gameDevice: { type: String },
    devices: [String],
    flowDataDevicesId: { type: mongoose.Schema.Types.ObjectId, ref: 'FlowDataDevice' },
    flowDataDevicesValues: [{ deviceName: { type: String }, maxFlowValue: { type: Number }, minFlowValue: { type: Number }, meanFlowValue: { type: Number } }],
    playStart: { type: Date },
    playFinish: { type: Date },
    duration: { type: Number },
    result: { type: String },
    stageId: { type: Number },
    phase: { type: Number },
    level: { type: Number },
    relaxTimeSpawned: { type: Boolean },
    score: { type: Number },
    maxScore: { type: Number },
    scoreRatio: { type: Number },
    TargetsSpawned: { type: Number },
    TargetsSuccess: { type: Number },
    TargetsInsSuccess: { type: Number },
    TargetsExpSuccess: { type: Number },
    TargetsFails: { type: Number },
    TargetsInsFail: { type: Number },
    TargetsExpFail: { type: Number },
    ObstaclesSpawned: { type: Number },
    ObstaclesSuccess: { type: Number },
    ObstaclesInsSuccess: { type: Number },
    ObstaclesExpSuccess: { type: Number },
    ObstaclesFail: { type: Number },
    ObstaclesInsFail: { type: Number },
    ObstaclesExpFail: { type: Number },
    PlayerHp: { type: Number },
    BorgScale: { type: Number }
},
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('PlataformOverview', PlataformOverviewSchema);