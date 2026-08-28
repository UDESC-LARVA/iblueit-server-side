/*
 * Script de seed para popular o banco de testes local com vários pacientes
 * e sessões de jogo fictícias, sem precisar rodar o jogo em Unity.
 *
 * Uso: node seed-test-data.js
 * Requer o back-end rodando em http://localhost:7071 (func host start --cors "*")
 */

const axios = require("axios");

const BASE_URL = "http://localhost:7071/api";
const USER_ID = "6a72892a9048ea2c9e5e03a5"; // conta jhessica_tcc

const PATIENTS = [
  {
    name: "Paciente_Ana_Melhora",
    sex: "Female",
    condition: "Healthy",
    birthday: "1985-03-12",
    weight: 62,
    height: 165,
    ethnicity: "Branco",
    scores: [50, 54, 58, 60, 63, 66, 70, 73, 76, 80], // melhora constante
  },
  {
    name: "Paciente_Bruno_Alerta",
    sex: "Male",
    condition: "Obstructive",
    birthday: "1972-07-01",
    weight: 88,
    height: 178,
    ethnicity: "Pardo",
    scores: [68, 70, 72, 69, 65, 60, 55, 50, 45, 40], // queda consecutiva -> alerta
  },
  {
    name: "Paciente_Carla_Estavel",
    sex: "Female",
    condition: "Restrictive",
    birthday: "1990-11-23",
    weight: 58,
    height: 160,
    ethnicity: "Preto",
    scores: [62, 60, 63, 61, 64, 62, 63, 61, 62, 63], // oscila pouco, sem tendência
  },
  {
    name: "Paciente_Diego_Novo",
    sex: "Male",
    condition: "Healthy",
    birthday: "1998-05-30",
    weight: 75,
    height: 180,
    ethnicity: "Amarelo",
    scores: [58, 61], // só 2 sessões, paciente recém-cadastrado
  },
];

async function createPatient(headers, def) {
  const pacientPayload = {
    name: def.name,
    sex: def.sex,
    birthday: def.birthday,
    capacitiesPitaco: { insPeakFlow: 90, expPeakFlow: 90, insFlowDuration: 3, expFlowDuration: 3, respiratoryRate: 16 },
    capacitiesMano: { insPeakFlow: 90, expPeakFlow: 90, insFlowDuration: 3, expFlowDuration: 3, respiratoryRate: 16 },
    capacitiesCinta: { insPeakFlow: 90, expPeakFlow: 90, insFlowDuration: 3, expFlowDuration: 3, respiratoryRate: 16 },
    condition: def.condition,
    unlockedLevels: 3,
    accumulatedScore: 0,
    playSessionsDone: 0,
    currentPerformance: 0,
    currentBorgScale: 0,
    calibrationPitacoDone: true,
    calibrationManoDone: true,
    calibrationCintaDone: true,
    howToPlayDone: true,
    weight: def.weight,
    height: def.height,
    pitacoThreshold: 7.5,
    manoThreshold: 7.5,
    cintaThreshold: 7.5,
    ethnicity: def.ethnicity,
  };

  const res = await axios.post(`${BASE_URL}/pacients`, pacientPayload, { headers });
  return res.data.data._id;
}

async function sendSessions(headers, pacientId, scores) {
  const now = new Date();

  for (let i = 0; i < scores.length; i++) {
    const daysAgo = (scores.length - 1 - i) * 2;
    const playFinish = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    const playStart = new Date(playFinish.getTime() - 5 * 60 * 1000);

    const score = scores[i];
    const maxScore = 100;
    const scoreRatio = score / maxScore;

    const flowData = Array.from({ length: 10 }, (_, k) => ({
      flowValue: 40 + Math.round(Math.random() * 60) + (score - 55) * 0.3,
      timestamp: new Date(playStart.getTime() + k * 20000).toISOString(),
    }));

    const payload = {
      pacientId,
      gameDevice: "Pitaco",
      flowDataDevices: [{ deviceName: "Pitaco", flowData }],
      playStart: playStart.toISOString(),
      playFinish: playFinish.toISOString(),
      duration: 300,
      result: String(score),
      stageId: 1,
      phase: 1,
      level: 1,
      relaxTimeSpawned: false,
      score,
      maxScore,
      scoreRatio,
      TargetsSpawned: 20, TargetsSuccess: 15, TargetsInsSuccess: 8, TargetsExpSuccess: 7,
      TargetsFails: 5, TargetsInsFail: 2, TargetsExpFail: 3,
      ObstaclesSpawned: 10, ObstaclesSuccess: 8, ObstaclesInsSuccess: 4, ObstaclesExpSuccess: 4,
      ObstaclesFail: 2, ObstaclesInsFail: 1, ObstaclesExpFail: 1,
      PlayerHp: 80,
      BorgScale: 3,
    };

    await axios.post(`${BASE_URL}/plataforms`, payload, { headers });
  }
}

async function main() {
  const tokenRes = await axios.post(`${BASE_URL}/token`, { userId: USER_ID });
  const gameToken = tokenRes.data.data.gameToken;
  const headers = { gametoken: gameToken };
  console.log("gameToken:", gameToken);

  for (const def of PATIENTS) {
    const pacientId = await createPatient(headers, def);
    await sendSessions(headers, pacientId, def.scores);
    console.log(`${def.name} — pacientId: ${pacientId} — ${def.scores.length} sessões`);
  }

  console.log("\nSeed concluído.");
}

main().catch((err) => {
  console.error("Erro no seed:", err.response ? err.response.data : err.message);
  process.exit(1);
});
