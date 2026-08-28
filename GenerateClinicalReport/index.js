module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const axios = require('axios');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/UserAccount');
    require('../shared/Pacient');
    require('../shared/PlataformOverview');
    require('../shared/FlowDataDevice');
    require('../shared/ClinicalReport');
    require('../shared/AlertRecord');

    const UserAccountModel = mongoose.model('UserAccount');
    const PacientModel = mongoose.model('Pacient');
    const PlataformOverviewModel = mongoose.model('PlataformOverview');
    const ClinicalReportModel = mongoose.model('ClinicalReport');
    const AlertRecordModel = mongoose.model('AlertRecord');

    const utils = require('../shared/utils');
    const validations = require('../shared/Validators');
    const clinicalMetrics = require('../shared/clinicalMetrics');

    // --- Autenticação (gameToken) ---
    const isVerifiedGameToken = await utils.verifyGameToken(req.headers.gametoken, mongoose);
    if (!isVerifiedGameToken) {
        context.res = { status: 403, body: utils.createResponse(false, false, "Chave de acesso inválida.", null, 1) };
        context.done();
        return;
    }

    // --- RN01: apenas Administrator/Therapist pode gerar relatório ---
    const requestingUser = await UserAccountModel.findOne({ "gameToken.token": req.headers.gametoken });
    if (!requestingUser || requestingUser.role !== "Administrator") {
        context.res = {
            status: 403,
            body: utils.createResponse(false, false, "Apenas profissionais autenticados podem gerar relatórios clínicos.", null, 1),
        };
        context.done();
        return;
    }

    const pacientId = req.params.pacientId;
    if (!pacientId) {
        context.res = { status: 400, body: utils.createResponse(false, true, "Parâmetros de consulta inexistentes.", null, 300) };
        context.done();
        return;
    }

    const body = req.body || {};
    if (Object.entries(body).length === 0) {
        context.res = { status: 400, body: utils.createResponse(false, true, "Dados vazios!", null, 2) };
        context.done();
        return;
    }

    let validationResult = validations.generateClinicalReportValidator(body);
    if (validationResult.errorCount !== 0) {
        let response = utils.createResponse(false, true, "Erros de validação encontrados!", null, 2);
        response.errors = validationResult.errors.errors;
        context.res = { status: 400, body: response };
        context.done();
        return;
    }

    const device = body.device;
    const period = body.period; // { start, end, label }

    const start = new Date(period.start);
    const end = new Date(period.end);

    try {
        const pacient = await PacientModel.findById(pacientId);
        if (!pacient) {
            context.res = { status: 404, body: utils.createResponse(false, true, "Paciente não encontrado.", null, null) };
            context.done();
            return;
        }

        // --- RF02: consulta as collections do período atual ---
        const current = await clinicalMetrics.extractMetricsForPeriod({ pacientId, device, start, end }, mongoose);

        // --- RF03 / FA01: valida dados mínimos antes de acionar a IA ---
        if (!clinicalMetrics.hasMinimumData(current)) {
            const missing = current.sessionCount === 0
                ? ["nenhuma sessão registrada no período selecionado"]
                : clinicalMetrics.missingFields(current);
            context.res = {
                status: 200,
                body: utils.createResponse(
                    false,
                    true,
                    "Dados insuficientes para gerar o relatório neste período. Campos/coleções ausentes: " + missing.join(", ") + ".",
                    { sufficientData: false, missing },
                    null
                ),
            };
            context.done();
            return;
        }

        // --- RN06: primeiro relatório do paciente? ---
        const priorReportsCount = await ClinicalReportModel.countDocuments({ pacientId, archived: false });
        const isFirstReport = priorReportsCount === 0;

        // --- período anterior, de mesma duração, para análise comparativa ---
        let previous = { metrics: {}, sessionCount: 0 };
        if (!isFirstReport) {
            const durationMs = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime());
            const prevStart = new Date(start.getTime() - durationMs);
            previous = await clinicalMetrics.extractMetricsForPeriod({ pacientId, device, start: prevStart, end: prevEnd }, mongoose);
        }

        // --- RNF03: contexto anonimizado (sem nome, sem CPF, sem patientId real) ---
        const sessionCode = "PAC-" + String(pacient._id).slice(-4).toUpperCase();
        const patientContext = {
            sessionCode,
            condition: pacient.condition,
            sex: pacient.sex,
            weight: pacient.weight,
            height: pacient.height,
        };

        const iaPayload = {
            device,
            period: { start: period.start, end: period.end },
            sessionCount: current.sessionCount,
            isFirstReport,
            currentMetrics: current.metrics,
            previousMetrics: isFirstReport ? null : previous.metrics,
            metricSources: current.metricSources,
            patientContext,
            alerts: [],
        };

        // --- RF05 / FA03: chamada à API de IA (URL_API_IA) ---
        let iaResponse;
        try {
            const apiRes = await axios.post(`${process.env.URL_API_IA}/generate-report`, iaPayload, { timeout: 25000 });
            iaResponse = apiRes.data;
        } catch (iaErr) {
            context.log("[URL_API_IA] - ERROR: ", iaErr.message);
            context.res = {
                status: 503,
                body: utils.createResponse(false, true, "O serviço de geração de relatório está indisponível. Tente novamente.", null, null),
            };
            context.done();
            return;
        }

        // --- RF09/RN04: alerta por deterioração consecutiva (critério padrão: DJ, 5 sessões) ---
        const alertsTriggered = await checkDefaultAlert(pacientId, PlataformOverviewModel);

        const savedReport = await new ClinicalReportModel({
            pacientId,
            device,
            period: { start, end, label: period.label },
            sessionCount: current.sessionCount,
            isFirstReport,
            currentMetrics: current.metrics,
            previousMetrics: isFirstReport ? null : previous.metrics,
            resumoSessao: iaResponse.resumoSessao,
            analiseComparativa: iaResponse.analiseComparativa,
            avisoRevisao: iaResponse.avisoRevisao,
            dadosBrutos: iaResponse.dadosBrutos,
            generatedBy: iaResponse.generatedBy,
            alerts: alertsTriggered,
            generatedByUserId: String(requestingUser._id),
        }).save();

        // --- RF12: log de auditoria ---
        context.log(`[AUDIT] ClinicalReport ${savedReport._id} gerado para paciente ${pacientId} por usuário ${requestingUser._id} em ${new Date().toISOString()}`);

        for (const alert of alertsTriggered) {
            await new AlertRecordModel({
                pacientId,
                clinicalReportId: savedReport._id,
                metric: alert.metric,
                condition: alert.condition,
                consecutiveSessions: alert.consecutiveSessions,
            }).save();
        }

        context.res = {
            status: 201,
            body: utils.createResponse(true, true, "Relatório clínico gerado com sucesso.", savedReport, null),
        };
    } catch (err) {
        context.log("[GenerateClinicalReport] - ERROR: ", err);
        context.res = { status: 500, body: utils.createResponse(false, true, "Ocorreu um erro interno ao realizar a operação.", null, 0) };
    }

    context.done();
};

// Critério padrão de alerta (RN04): 5 sessões consecutivas de queda em DJ (scoreRatio).
// TODO: substituir por critérios configuráveis por paciente (RF10) quando essa tela existir.
async function checkDefaultAlert(pacientId, PlataformOverviewModel) {
    const DEFAULT_CONSECUTIVE = 5;
    const lastSessions = await PlataformOverviewModel
        .find({ pacientId })
        .sort({ created_at: -1 })
        .limit(DEFAULT_CONSECUTIVE);

    if (lastSessions.length < DEFAULT_CONSECUTIVE) return [];

    const chronological = lastSessions.slice().reverse();
    let consecutiveDrops = 0;
    for (let i = 1; i < chronological.length; i++) {
        if (chronological[i].scoreRatio < chronological[i - 1].scoreRatio) {
            consecutiveDrops++;
        } else {
            consecutiveDrops = 0;
        }
    }

    if (consecutiveDrops >= DEFAULT_CONSECUTIVE - 1) {
        return [{ metric: "DJ", condition: "Deterioração consecutiva", consecutiveSessions: DEFAULT_CONSECUTIVE }];
    }
    return [];
}
