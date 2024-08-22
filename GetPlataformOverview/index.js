module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //PlataformOverview Schema
    require('../shared/PlataformOverview');
    const PlataformOverviewModel = mongoose.model('PlataformOverview');

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

    // const findObj = {
    //     _gameToken: req.headers.gametoken
    // }

    const findObj = {}

    const findOptionsObj = { sort: { created_at: -1 } };

    if (req.query.plataformOverviewId)
        findObj._id = req.query.plataformOverviewId
    if (req.query.phase)
        findObj.phase = req.query.phase;
    if (req.query.level)
        findObj.level = req.query.level;
    if (req.query.gameDevice)
        findObj.gameDevice = req.query.gameDevice;
     if (req.query.dataIni)
        findObj.created_at = {
            $gte: new Date(req.query.dataIni).toISOString("yyyy-MM-ddThh:mm:ss.msZ")
        };
    if (req.query.dataIni && req.query.dataFim)
        findObj.created_at = {
            $gte: new Date(`${req.query.dataIni} 00:00:00:000 UTC`).toISOString("yyyy-MM-ddThh:mm:ss.msZ"),
            $lte: new Date(`${req.query.dataFim} 23:59:59:999 UTC`).toISOString("yyyy-MM-ddThh:mm:ss.msZ")
        };
    if (req.query.limit)
        findOptionsObj.limit = parseInt(req.query.limit);
    if (req.query.skip)
        findOptionsObj.skip = parseInt(req.query.skip);
    if (req.query.sort == "asc")
        findOptionsObj.sort = { created_at: 1 };

    try {

        const plataformOverviews = await PlataformOverviewModel.find(findObj, null, findOptionsObj);
        context.log("[DB QUERYING] - PlataformOverview Get");
        context.res = {
            status: 200,
            body: utils.createResponse(false,
                false,
                "Parâmetros de consulta inexistentes.",
                plataformOverviews,
                300)
        }
    } catch (err) {
        context.log("[DB QUERYING] - ERROR: ", err);
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



