module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //MinigameOverview Schema
    require('../shared/UserAccount');
    const UserAccountModel = mongoose.model('UserAccount');

    const utils = require('../shared/utils');
    const validations = require('../shared/Validators');

    const bcrypt = require("bcryptjs");

    const userAccountReq = req.body || {};

    if (Object.entries(userAccountReq).length === 0) {
        context.res = {
            status: 400,
            body: utils.createResponse(false,
                false,
                "Dados vazios!",
                null,
                2)
        }
        context.done();
        return;
    }

    let validationResult = validations.createUserValidator(userAccountReq);
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

        if (userAccountReq.role == "Administrator") {
            const existingUser = await UserAccountModel.findOne({ $or: [{ email: userAccountReq.email, role: "Administrator" }, { username: userAccountReq.username, role: "Administrator" }] });
            context.log("[DB FIND] - Find Existing User: ", existingUser);

            if (existingUser) {
                context.res = {
                    status: 400,
                    body: utils.createResponse(true,
                        false,
                        "Já existe um usuário cadastrado com este nome e/ou email.",
                        null,
                        null)
                }
                context.done();
                return;
            }
        }

        if (userAccountReq.role == "User") {
            const existingUser = await UserAccountModel.findOne({ username: userAccountReq.username, role: "User", "gameToken.token": userAccountReq.gameToken });
            context.log("[DB FIND] - Find Existing User: ", existingUser);

            if (existingUser) {
                context.res = {
                    status: 400,
                    body: utils.createResponse(false,
                        false,
                        "Já existe um usuário cadastrado com este nome.",
                        null,
                        null)
                }
                context.done();
                return;
            }
        }

        var newUser = new UserAccountModel({
            fullname: userAccountReq.fullname,
            username: userAccountReq.username,
            password: userAccountReq.role == "Administrator" ? bcrypt.hashSync(userAccountReq.password, 10) : userAccountReq.password, 
            email: userAccountReq.role == "Administrator" ? userAccountReq.email : userAccountReq.username,
            role: userAccountReq.role,
            pacientId: userAccountReq.role == "User" ? userAccountReq.pacientId : "",
            gameToken: {
                token: userAccountReq.role == "Administrator" ? "" : userAccountReq.gameToken,
                description: "",
                createdAt: null
            }
        });

        const savedUser = await newUser.save();
        context.log("[DB SAVING] - User Account Created: ", savedUser);

        if (savedUser.role == "Administrator") {
            utils.sendWelcomeEmail(savedUser.fullname, savedUser.username, userAccountReq.password, savedUser.email);
            context.res = {
                status: 201,
                body: utils.createResponse(true,
                    false,
                    "Usuário criado com sucesso.",
                    { redirectUrl: '/login' },
                    null)
            }
        }
        else {
            context.res = {
                status: 201,
                body: utils.createResponse(true,
                    false,
                    "Usuário criado com sucesso.",
                    null,
                    null)
            }
        }


    } catch (err) {
        context.log("[DB SAVING] - ERROR: ", err);
        context.res = {
            status: 500,
            body: utils.createResponse(false,
                false,
                "Ocorreu um erro interno ao realizar a operação.",
                null,
                0)
        }
    }
    context.done();
};