module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //GameParameterModel Schema
    require('../shared/GameParameter');
    const GameParameterModel = mongoose.model('GameParameter');

    const utils = require('../shared/utils');

    var isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);

    if (!isVerifiedGameToken) {
        context.res = {
            status: 403,
            body: utils.createResponse(false, false, "Chave de acesso inválida.", null, 1)
        }
        context.done();
        return;
    }

    const pacientReq = req.body || {};

    if (req.params.pacientId === undefined || req.params.pacientId == null) {
        context.res = {
            status: 400,
            body: utils.createResponse(false,
                false,
                "Parâmetros de consulta inexistentes.",
                null,
                300)
        }
        context.done();
        return;
    }

    pacientReq._gameToken = req.headers.gametoken;

    try {
        const updatedGameParameter = await GameParameterModel.updateOne(
            { pacientId: req.params.pacientId, _gameToken: req.headers.gametoken },
            {
                $set:
                {
                    pacientId: req.body.pacientId,
                    stageId: req.body.stageId,
                    phase:  req.body.phase,
                    level: req.body.level,
                    ObjectSpeedFactor: req.body.ObjectSpeedFactor,
                    Loops: req.body.Loops,
                    HeightIncrement: req.body.HeightIncrement,
                    HeightUpThreshold: req.body.HeightUpThreshold,
                    HeightDownThreshold: req.body.HeightDownThreshold,
                    SizeIncrement: req.body.SizeIncrement,
                    SizeUpThreshold: req.body.SizeUpThreshold,
                    SizeDownThreshold: req.body.SizeDownThreshold,
                }
            });
        context.log("[DB UPDATE] - Game Parameter Updated: ", updatedGameParameter);
        context.res = {
            status: 200,
            body: utils.createResponse(true, true, "Registro atualizado com sucesso.", updatedGameParameter, null)
        }
    } catch (err) {
        context.log("[DB DELETE] - ERROR: ", err);
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