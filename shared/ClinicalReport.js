const mongoose = require('mongoose');

const ClinicalReportSchema = mongoose.Schema({
    pacientId: { type: String },
    device: { type: String },
    period: {
        start: { type: Date },
        end: { type: Date },
        label: { type: String },
    },
    sessionCount: { type: Number },
    isFirstReport: { type: Boolean },
    currentMetrics: { type: mongoose.Schema.Types.Mixed },
    previousMetrics: { type: mongoose.Schema.Types.Mixed },
    resumoSessao: { type: String },
    analiseComparativa: { type: String },
    avisoRevisao: { type: String },
    dadosBrutos: [{
        metrica: { type: String },
        sigla: { type: String },
        valor: { type: mongoose.Schema.Types.Mixed },
        unidade: { type: String },
        sourceCollection: { type: String },
    }],
    generatedBy: { type: String },
    alerts: [{
        metric: { type: String },
        condition: { type: String },
        consecutiveSessions: { type: Number },
    }],
    archived: { type: Boolean, default: false },
    generatedByUserId: { type: String },
},
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('ClinicalReport', ClinicalReportSchema);
