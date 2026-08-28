module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/ClinicalReport');
    const ClinicalReportModel = mongoose.model('ClinicalReport');

    const utils = require('../shared/utils');

    const isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);
    if (!isVerifiedGameToken) {
        context.res = { status: 403, body: utils.createResponse(false, false, "Chave de acesso inválida.", null, 1) };
        context.done();
        return;
    }

    const pacientId = req.params.pacientId;
    if (!pacientId) {
        context.res = { status: 400, body: utils.createResponse(false, true, "Parâmetros de consulta inexistentes.", null, 300) };
        context.done();
        return;
    }

    const filter = { pacientId, archived: false };
    if (req.query.dataIni) {
        filter.created_at = { $gte: new Date(`${req.query.dataIni} 00:00:00:000`) };
    }
    if (req.query.dataIni && req.query.dataFim) {
        filter.created_at = {
            $gte: new Date(`${req.query.dataIni} 00:00:00:000`),
            $lte: new Date(`${req.query.dataFim} 23:59:59:999`),
        };
    }

    try {
        // RF11: histórico completo, mais recente primeiro
        const reports = await ClinicalReportModel.find(filter).sort({ created_at: -1 });
        context.res = {
            status: 200,
            body: utils.createResponse(true, true, "Consulta realizada com sucesso.", reports, null),
        };
    } catch (err) {
        context.log("[GetClinicalReports] - ERROR: ", err);
        context.res = { status: 500, body: utils.createResponse(false, true, "Ocorreu um erro interno ao realizar a operação.", null, 0) };
    }

    context.done();
};
