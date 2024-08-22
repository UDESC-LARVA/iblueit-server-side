const verifyGameToken = async (token, mongoose) => {
    require('../shared/UserAccount');
    const UserAccountModel = mongoose.model('UserAccount');
    const user = await UserAccountModel.findOne({ "gameToken.token": token });
    if (!user) return false;
    return true;
}

const validateHeaders = async (headers, context) => {

    var result = {};

    if (headers.gametoken === undefined || headers.gametoken == null)
        result = { message: "Valor inválido!", header: "GameToken" }

    if (Object.entries(result).length > 0) {
        context.res = {
            status: 400,
            body: result
        }
        context.done();
        return;
    }
}

/**
 * @param {Boolean} success Successefull request?
 * @param {Boolean} authorized Authorized Request?
 * @param {String} message Error message
 * @param {Object} data Data object
 * @param {Number} errors Array of error codes
 */
const createResponse = function (success, authorized, message, data, errorCode) {
    let response = {
        success: success,
        authorized: authorized,
        message: message,
        data: data,
        errors: createErrorObj(errorCode)
    }
    return response;
}

function createErrorObj(errorCode) {
    if (errorCode == null) return null;
    var errorMessage = errorCodes[errorCode];
    var errorObj = [{
        code: errorCode,
        message: errorMessage
    }];
    return errorObj;
}

const errorCodes = {
    1: "Esta chave de acesso é inválida. Por favor, verifique-a novamente. Se o erro persistir, entre em contato com a equipe de suporte",
    2: "É necessário o envio dos dados para realizar esta operação.",
    0: "Erro interno ao realizar a operação. Por favor, entre em contato com a equipe de suporte.",
    300: "O ID do registro é necessário para realizar esta consulta/atualização."
}

const sendWelcomeEmail = function (fullname, username, password, userEmail) {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host: process.env.SMTP_Server_Hostname,
        port: 587,
        auth: {
            user: process.env.SMTP_Server_Username,
            pass: process.env.SMTP_Server_Password
        }
    });
    var mailOptions = {
        from: process.env.SMTP_FromEmail,
        to: userEmail,
        subject: 'Bem-vindo(a) ao I BLUE IT Service!',
        html: `
        <p>Olá` + fullname + `,</p>
        <p>Obrigado por se cadastrar no I BLUE IT Services!.</p>
        <p>A sua conta &eacute;:</p>
        <p><strong>Usu&aacute;rio</strong>: `+ username + `</p>
        <p><strong>Senha:&nbsp;</strong> `+ password + `</p>
        <p>Com esta conta ser&aacute; poss&iacute;vel visualizar os dados gerados pelo jogo I BLUE IT.&nbsp;</p>
        <p>Para começar a enviar dados do jogo para o sistema gere um <b>Token de Acesso</b>.<br>Com o <b>Token de Acesso</b>, insira-o nas configura&ccedil;&otilde;es do jogo I BLUE IT.</p>
        <p>Esperamos que goste!.</p>
        <p>---</p>
        <p>UDESC/CCT - Grupo LARVA</p>`
    };
    transporter.sendMail(mailOptions);
}

exports.verifyGameToken = verifyGameToken;
exports.validateHeaders = validateHeaders;
exports.createResponse = createResponse;
exports.sendWelcomeEmail = sendWelcomeEmail;