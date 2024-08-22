const mongoose = require('mongoose');

const FlowDataDeviceSchema = mongoose.Schema({
    _gameToken: { type: String },
    flowDataDevices: [{ deviceName: { type: String }, flowData: [{ flowValue: Number, timestamp: Date }] }]
},
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('FlowDataDevice', FlowDataDeviceSchema);