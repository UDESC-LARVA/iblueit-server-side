module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/FlowDataDevice');
    const FlowDataDeviceModel = mongoose.model('FlowDataDevice');

    const utils = require('../shared/utils');

    utils.validateHeaders(req.headers, context);

    var isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);

    if(!isVerifiedGameToken){
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

    if (req.params.flowDataDeviceId === undefined || req.params.flowDataDeviceId == null) {
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
    //     _id: req.params.flowDataDeviceId,
    //     _gameToken: req.headers.gametoken 
    // }

    const findObj = {
        _id: req.params.flowDataDeviceId
    }

    try {
        const flowDataDevice = await FlowDataDeviceModel.find(findObj);
        context.log("[DB QUERYING] - FlowDataDevice Get by ID");
        context.res = {
            status: 200,
            body: utils.createResponse(true,
                true,
                "Consulta realizada com sucesso.",
                flowDataDevice,
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