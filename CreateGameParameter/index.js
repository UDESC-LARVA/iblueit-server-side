module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //GameParameterModel Schema
    require('../shared/GameParameter');
    const GameParameterModel = mongoose.model('GameParameter');

    const utils = require('../shared/utils');
    const validations = require('../shared/Validators');

    var isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);

    if (!isVerifiedGameToken) {
        context.res = { status: 403, body: utils.createResponse(false, false, "Chave de acesso inválida.", null, 1) }
        context.done();
        return;
    }

    const gameParameterReq = req.body || {};

    if (Object.entries(gameParameterReq).length === 0) {
        context.res = { status: 400, body: utils.createResponse(false, true, "Dados vazios!", null, 2) }
        context.done();
        return;
    }

    let validationResult = validations.gameParameterValidator(gameParameterReq);
    if (validationResult.errorCount !== 0) {
        let response = utils.createResponse(false, true, "Erros de validação encontrados!", null, 2);
        response.errors = validationResult.errors.errors;
        context.res = { status: 400, body: response }
        context.done();
        return;
    }

    gameParameterReq._gameToken = req.headers.gametoken;

    try {
        const GameParameterModels = await GameParameterModel.findOne({ pacientId: gameParameterReq.pacientId }, null, { sort: { created_at: 1 } });
        if (GameParameterModels) {
            GameParameterModels.stageId = gameParameterReq.stageId,
            GameParameterModels.phase = gameParameterReq.phase,
            GameParameterModels.level = gameParameterReq.level,
            GameParameterModels.ObjectSpeedFactor = gameParameterReq.ObjectSpeedFactor,
            GameParameterModels.Loops = gameParameterReq.Loops,
            GameParameterModels.HeightIncrement = gameParameterReq.HeightIncrement,
            GameParameterModels.HeightUpThreshold = gameParameterReq.HeightUpThreshold,
            GameParameterModels.HeightDownThreshold = gameParameterReq.HeightDownThreshold,
            GameParameterModels.SizeIncrement = gameParameterReq.SizeIncrement,
            GameParameterModels.SizeUpThreshold = gameParameterReq.SizeUpThreshold,
            GameParameterModels.SizeDownThreshold = gameParameterReq.SizeDownThreshold
            const savedGameParameterReq = await GameParameterModels.save();
            context.log("[DB UPDATING] - Game Parameter: ", savedGameParameterReq);
            context.res = { status: 201, body: utils.createResponse(true, true, "Paciente salvo com sucesso.", savedGameParameterReq, null) }
        } else {
            const savedGameParameterReq = await (new GameParameterModel(gameParameterReq)).save();
            context.log("[DB SAVING] - Game Parameter Saved: ", savedGameParameterReq);
            context.res = { status: 201, body: utils.createResponse(true, true, "Paciente salvo com sucesso.", savedGameParameterReq, null) }
        }
    } catch (err) {
        context.log("[DB SAVING] - ERROR: ", err);
        context.res = { status: 500, body: utils.createResponse(false, true, "Ocorreu um erro interno ao realizar a operação.", null, 00) }
    }

    context.done();
};