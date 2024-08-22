module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //MinigameOverview Schema
    require('../shared/CalibrationOverview');
    require('../shared/PlaySession');
    const CalibrationOverviewModel = mongoose.model('CalibrationOverview');
    const PlaySessionModel = mongoose.model('PlaySession');

    const utils = require('../shared/utils');
    const validations = require('../shared/Validators');

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

    const calibrationReq = req.body || {};

    if (Object.entries(calibrationReq).length === 0) {
        context.res = {
            status: 400,
            body: utils.createResponse(false,
                true,
                "Dados vazios!",
                null,
                2)
        }
        context.done();
        return;
    }

    let validationResult = validations.calibrationOverviewSaveValidator(calibrationReq);
    if(validationResult.errorCount !== 0){
        let response = utils.createResponse(false, true, "Erros de validação encontrados!", null, 2);
        response.errors = validationResult.errors.errors;
        context.res = {
            status: 400,
            body: response
        }
        context.done();
        return;
    }

    calibrationReq._gameToken = req.headers.gametoken;

    try {

        const pacientSession = await PlaySessionModel.findOne({ pacientId: calibrationReq.pacientId }, null, { sort: { sessionNumber: -1 } });

        if (!pacientSession) {
            await new PlaySessionModel({ pacientId: calibrationReq.pacientId, sessionNumber: 1 }).save();
        } else {
            let pacientSessionDate = new Date(pacientSession.created_at);
            pacientSessionDate.setHours(0, 0, 0, 0);

            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            if (pacientSessionDate.getTime() != currentDate.getTime())
                await new PlaySessionModel({ pacientId: calibrationReq.pacientId, sessionNumber: pacientSession.sessionNumber + 1 }).save()
        }

        const savedCalibrationOverview = await (new CalibrationOverviewModel(calibrationReq)).save();
        context.log("[OUTPUT] - Calibration Overview Saved: ", savedCalibrationOverview);
        context.res = {
            status: 201,
            body: utils.createResponse(true,
                true,
                "Calibração salva com sucesso.",
                savedCalibrationOverview,
                null)
        }
    } catch (err) {
        context.log("[DB SAVING] - ERROR: ", err);
        context.res = {
            status: 500,
            body: utils.createResponse(false,
                true,
                "Ocorreu um erro interno ao realizar a operação.",
                null,
                0)
        }
    }

    context.done();
};