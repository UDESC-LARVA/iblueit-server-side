module.exports = async function (context, req) {
    var axios = require('axios');
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    const URL_API_IA = process.env.URL_API_IA;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //GameParameterModel Schema
    require('../shared/GameParameter');
    const GameParameterModel = mongoose.model('GameParameter');

    const utils = require('../shared/utils');

    utils.validateHeaders(req.headers, context);

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

    const pacientId = req.query.pacientId
    if (pacientId === undefined || pacientId == null) {
        context.res = {
            status: 400,
            body: utils.createResponse(false, false, "Parâmetros de consulta inexistentes.", null, 300)
        }
        context.done();
        return;
    } else {
        var config = {
            method: 'get',
            url: URL_API_IA + '/neighborsByPacient',
            headers: { 'Content-Type': 'application/json' },
            params: {
                pacientId: pacientId
            }
        };
        var neighborsPacientReturn;
        const functionResponse = await axios(config).then(function (response) {
            neighborsPacientReturn = response.data.neighborsPacientReturn
            if (!neighborsPacientReturn.length > 0) {
                context.res = {
                    status: 200,
                    body: utils.createResponse(false, false, "Não Foi encontrados Vizinhos", null, 1)
                }
                context.done();
            }
            return;
        }).catch(function (error) {
            console.log(error);
            context.res = {
                status: 400,
                body: utils.createResponse(false, false, "Erro na Requisição", null, 1)
            }
            context.done();
            return;
        });
        var neighborsPacientIds = neighborsPacientReturn.map((neighborsPacient) => neighborsPacient.pacientId)
        var arrayConfigurations = []
        const GameParameters = await GameParameterModel.find({ "pacientId": neighborsPacientIds });
        const GameParametersLength = GameParameters.length;
        GameParameters.forEach(function (GameParameter) {
            arrayConfigurations.push({
                "stageId": getFloat(GameParameter.stageId),
                "phase": getFloat(GameParameter.phase),
                "level": getFloat(GameParameter.phase),
                "pacientId": GameParameter.pacientId,
                "pacientName": neighborsPacientReturn.find(neighborsPacient => neighborsPacient.pacientId === GameParameter.pacientId).pacientName,
                "ObjectSpeedFactor": getFloat(GameParameter.ObjectSpeedFactor),
                "HeightIncrement": getFloat(GameParameter.HeightIncrement),
                "HeightUpThreshold": getFloat(GameParameter.HeightUpThreshold),
                "HeightDownThreshold": getFloat(GameParameter.HeightDownThreshold),
                "SizeIncrement": getFloat(GameParameter.SizeIncrement),
                "SizeUpThreshold": getFloat(GameParameter.SizeUpThreshold),
                "SizeDownThreshold": getFloat(GameParameter.SizeDownThreshold),
                "Loops": getFloat(GameParameter.Loops),
                "isAVG": false
            })
        })
        arrayConfigurations.push({
            "stageId": parseInt((arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["stageId"] }, 0)) / GameParametersLength),
            "phase": parseInt((arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["phase"] }, 0)) / GameParametersLength),
            "level": parseInt((arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["level"] }, 0)) / GameParametersLength),
            "pacientId": null,
            "pacientName": null,
            "ObjectSpeedFactor": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["ObjectSpeedFactor"] }, 0)) / GameParametersLength,
            "Loops": parseInt((arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["Loops"] }, 0)) / GameParametersLength),
            "HeightIncrement": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["HeightIncrement"] }, 0)) / GameParametersLength,
            "HeightUpThreshold": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["HeightUpThreshold"] }, 0)) / GameParametersLength,
            "HeightDownThreshold": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["HeightDownThreshold"] }, 0)) / GameParametersLength,
            "SizeIncrement": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["SizeIncrement"] }, 0)) / GameParametersLength,
            "SizeUpThreshold": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["SizeUpThreshold"] }, 0)) / GameParametersLength,
            "SizeDownThreshold": (arrayConfigurations.reduce((sum, configuration) => { return sum += configuration["SizeDownThreshold"] }, 0)) / GameParametersLength,            
            "isAVG": true
        })
        context.res = {
            status: 200,
            body: utils.createResponse(true, true, "Consulta realizada com sucesso.", arrayConfigurations, null)
        }
        context.done();
    }
};

function getFloat(value) {
    return value && parseFloat(value.toString()) ? parseFloat(value.toString()) : 0;
}