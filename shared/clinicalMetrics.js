/*
 * Extração das métricas clínicas (DJ, PJ, CGc, FR, PEmax, PImax, TEmax, TImax,
 * SpO2min, FLi, FLe, EB) a partir das collections MongoDB, para consumo pela
 * Azure Function GenerateClinicalReport.
 *
 * ATENÇÃO — mapeamentos marcados com "CONFIRMAR": o RFC exige essas métricas
 * "conforme Tabelas 26 e 27 de Dias (2024)", mas os schemas atuais do Mongo
 * não têm campos com esses nomes literais. Os mapeamentos abaixo são a melhor
 * aproximação disponível nos dados existentes e PRECISAM ser confirmados
 * contra a tese antes de qualquer validação com os fisioterapeutas parceiros.
 *
 * SpO2min não tem nenhuma fonte de dado no ecossistema atual (não há
 * integração com oxímetro) — é retornado como null e tratado pelo fluxo
 * alternativo FA02 (dados parcialmente ausentes) do RFC.
 */

async function extractMetricsForPeriod({ pacientId, device, start, end }, mongoose) {
    require('./PlataformOverview');
    require('./GameParameter');
    require('./FlowDataDevice');
    require('./Pacient');

    const PlataformOverviewModel = mongoose.model('PlataformOverview');
    const GameParameterModel = mongoose.model('GameParameter');
    const PacientModel = mongoose.model('Pacient');

    const dateFilter = { $gte: start, $lte: end };

    const plataformSessions = await PlataformOverviewModel.find({
        pacientId,
        created_at: dateFilter,
    }).populate('flowDataDevicesId');

    const gameParameters = await GameParameterModel.find({
        pacientId,
        created_at: dateFilter,
    });

    const pacient = await PacientModel.findById(pacientId);

    const sessionCount = plataformSessions.length;

    // DJ (Desempenho do Jogador) / PJ (Pontos da Jogada) / EB (Escala de Borg)
    // CONFIRMAR contra Tabela 27 de Dias (2024) — usando scoreRatio/score/BorgScale
    // como melhor aproximação disponível em plataformoverviews.
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const DJ = avg(plataformSessions.map((s) => s.scoreRatio).filter((v) => v != null));
    const PJ = avg(plataformSessions.map((s) => s.score).filter((v) => v != null));
    const EB = avg(plataformSessions.map((s) => s.BorgScale).filter((v) => v != null));

    // CGc (Carga Corrente) — CONFIRMAR contra Tabela 27. Usando ObjectSpeedFactor
    // de gameparameters como aproximação (não confirmado).
    const CGc = avg(gameParameters.map((g) => g.ObjectSpeedFactor).filter((v) => v != null));

    // FLi / FLe (fluxo inspiratório/expiratório) — derivados dos dados brutos de
    // flowdatadevices já vinculados a cada sessão da plataforma.
    let flowValues = [];
    plataformSessions.forEach((s) => {
        if (s.flowDataDevicesId && s.flowDataDevicesId.flowDataDevices) {
            s.flowDataDevicesId.flowDataDevices.forEach((d) => {
                d.flowData.forEach((f) => flowValues.push(f.flowValue));
            });
        }
    });
    const FLi = flowValues.length ? Math.min(...flowValues) : null;
    const FLe = flowValues.length ? Math.max(...flowValues) : null;

    // FR, PEmax, PImax, TEmax, TImax — CONFIRMAR contra Tabela 26. O RFC associa
    // essas métricas à collection calibrationoverviews, mas ela só guarda
    // calibrationValue/calibrationExercise. Usando o perfil de capacidades do
    // paciente (Pacient.capacities<Device>), que é o dado de calibração mais
    // próximo disponível hoje.
    const capacitiesKey = 'capacities' + device; // ex: capacitiesPitaco
    const capacities = pacient ? pacient[capacitiesKey] : null;

    const FR = capacities ? capacities.respiratoryRate : null;
    const PImax = capacities ? capacities.insPeakFlow : null;
    const PEmax = capacities ? capacities.expPeakFlow : null;
    const TImax = capacities ? capacities.insFlowDuration : null;
    const TEmax = capacities ? capacities.expFlowDuration : null;

    // SpO2min — sem fonte de dado no ecossistema atual (sem integração com oxímetro).
    const SpO2min = null;

    const metricSources = {
        DJ: 'plataformoverviews', PJ: 'plataformoverviews', EB: 'plataformoverviews',
        CGc: 'gameparameters',
        FLi: 'flowdatadevices', FLe: 'flowdatadevices',
        FR: 'pacients', PImax: 'pacients', PEmax: 'pacients', TImax: 'pacients', TEmax: 'pacients',
        SpO2min: null,
    };

    return {
        sessionCount,
        metrics: { DJ, PJ, CGc, FR, PEmax, PImax, TEmax, TImax, SpO2min, FLi, FLe, EB },
        metricSources,
    };
}

// RN02: dados mínimos obrigatórios pra gerar relatório. SpO2min é excluído
// dessa checagem porque não existe fonte de dado no sistema atual (ver FA02).
const REQUIRED_METRICS = ['FR', 'PEmax', 'PImax', 'TEmax', 'TImax', 'FLi', 'FLe', 'EB'];

function hasMinimumData({ sessionCount, metrics }) {
    if (sessionCount === 0) return false;
    const missing = REQUIRED_METRICS.filter((key) => metrics[key] == null);
    return missing.length === 0;
}

function missingFields({ metrics }) {
    return REQUIRED_METRICS.filter((key) => metrics[key] == null);
}

module.exports = { extractMetricsForPeriod, hasMinimumData, missingFields, REQUIRED_METRICS };
