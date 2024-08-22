module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //PlataformOverview Schema
    require('../shared/Pacient');
    const PacientModel = mongoose.model('Pacient');

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

    // const findObj = {
    //     _id: req.params.pacientId,
    //     _gameToken: req.headers.gametoken
    // }

    const findObj = {
        _id: req.params.pacientId
    }

    const aggregate = PacientModel.aggregate();
    aggregate.match({ _id: mongoose.Types.ObjectId(req.params.pacientId), _gameToken: req.headers.gametoken });

    aggregate.lookup({
        from: "playsessions",
        let: { "pacientId": "$_id" },
        pipeline:
            [
                { "$addFields": { "pacientId": { "$toObjectId": "$pacientId" } } },
                { "$match": { "$expr": { "$eq": ["$pacientId", "$$pacientId"] } } }
            ],
        as: "playSessions"
    });

    try {
        const pacients = await aggregate.exec();
        context.log("[DB QUERYING] - Pacient Get by ID");
        context.res = {
            status: 200,
            body: utils.createResponse(true,
                true,
                "Consulta realizada com sucesso.",
                pacients[0],
                null)
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