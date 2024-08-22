module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/UserAccount');
    const UserAccountModel = mongoose.model('UserAccount');

    const utils = require('../shared/utils');
    const validations = require('../shared/Validators');
    const { v4: uuidv4 } = require('uuid');

    const gameTokenReq = req.body || {};

    if (Object.entries(gameTokenReq).length === 0) {
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

    let validationResult = validations.createTokenValidator(gameTokenReq);
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

    try {

        const user = await UserAccountModel.findById(gameTokenReq.userId);

        if (!user) {
            context.res = {
                status: 404,
                body: utils.createResponse(true,
                    true,
                    "Usuário inexistente!.",
                    { userId: gameTokenReq.userId },
                    null)
            }
            context.done();
            return;
        }

        if (user.gameToken.token != "") {
            context.res = {
                status: 200,
                body: utils.createResponse(true,
                    true,
                    "Já existe um Token de Acesso gerado para este usuário!.",
                    { gameToken: user.gameToken.token },
                    null)
            }
            context.done();
            return;
        }

        user.gameToken.token = uuidv4();
        user.gameToken.description = gameTokenReq.description;
        user.gameToken.createdAt = new Date();

        const savedUser = await user.save();
        context.res = {
            status: 201,
            body: utils.createResponse(true,
                true,
                "Token de Acesso criado com sucesso!.",
                { gameToken: savedUser.gameToken.token },
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