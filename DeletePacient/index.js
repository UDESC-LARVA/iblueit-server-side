const { db } = require('../shared/Pacient');
const { resolveContent } = require('nodemailer/lib/shared');

module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //MinigameOverview Schema
    require('../shared/Pacient');
    require('../shared/PlataformOverview');
    require('../shared/CalibrationOverview');
    require('../shared/MinigameOverview');
    require('../shared/UserAccount');
    require('../shared/PlaySession');
    const PacientModel = mongoose.model('Pacient');
    const PlataformOverviewModel = mongoose.model('PlataformOverview');
    const CalibrationOverviewModel = mongoose.model('CalibrationOverview');
    const MinigameOverviewModel = mongoose.model('MinigameOverview');
    const UserAccountModel = mongoose.model('UserAccount');
    const PlaySessionModel = mongoose.model('PlaySession');

    const utils = require('../shared/utils');

    var isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);

    if (!isVerifiedGameToken) {
        context.res = {
            status: 403,
            body: utils.createResponse(false,
                false,
                "Chave de acesso inválida.",
                null,
                1)
        }
        context.done();
        return;
    }

    let isValidPacientId = /^[a-fA-F0-9]{24}$/.test(req.params.pacientId);
    if (!isValidPacientId) {
        context.res = {
            status: 404,
            body: utils.createResponse(false,
                false,
                "Parâmetros de inválidos.",
                null,
                300)
        }
        context.done();
        return;
    }

    let session = null;
    try {
        if (req.query.allData === "0") {
            const removedPacient = await PacientModel.deleteOne({ _id: req.params.pacientId });
            context.log("[DB DELETE] - Pacient Deleted: ", removedPacient);
        } else {
            db.startSession()
                .then(_session => {
                    session = _session;
                    session.startTransaction();
                    return;
                })
                .then(async () => { return await PacientModel.deleteOne({ _id: mongoose.Types.ObjectId(req.params.pacientId) }).session(session) })
                .then(async () => { return await PlataformOverviewModel.deleteMany({ pacientId: req.params.pacientId }).session(session) })
                .then(async () => { return await CalibrationOverviewModel.deleteMany({ pacientId: req.params.pacientId }).session(session) })
                .then(async () => { return await MinigameOverviewModel.deleteMany({ pacientId: req.params.pacientId }).session(session) })
                .then(async () => { return await UserAccountModel.deleteOne({ pacientId: req.params.pacientId }).session(session) })
                .then(async () => { return await PlaySessionModel.deleteOne({ pacientId: req.params.pacientId }).session(session) })
                .then(async () => { return await session.commitTransaction() })
                .then(async () => { return await session.endSession() });
        }
        context.res = {
            status: 200,
            body: utils.createResponse(true, true, "Exclusão realizada com sucesso.", null, null)
        }
    } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        context.log("[DB DELETE] - ERROR: ", err);
        context.res = {
            status: 500,
            body: err
        }
    }

    context.done();
};
