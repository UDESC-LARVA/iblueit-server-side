/*
 * Exporta os dados brutos do MongoDB (pacients, plataformoverviews,
 * flowdatadevices, gameparameters) para um arquivo .json local, pra inspeção
 * manual ou validação da geração de relatório clínico.
 *
 * Uso: node export-patient-data.js [pacientId1,pacientId2,...]
 * Sem argumento, exporta os 5 pacientes de teste semeados nesta sessão.
 */

const mongoose = require('mongoose');
const fs = require('fs');

const DATABASE = process.env.MongoDbAtlas || require('./local.settings.json').Values.MongoDbAtlas;

const DEFAULT_PACIENT_IDS = [
  '6a74c33b4357101641488d10', // NetRunner_Jhessica_TCC
  '6a74c6d4316686259eef109a', // Paciente_Ana_Melhora
  '6a74c6da316686259eef1153', // Paciente_Bruno_Alerta
  '6a74c6e1316686259eef120c', // Paciente_Carla_Estavel
  '6a74c6e7316686259eef12c5', // Paciente_Diego_Novo
];

async function main() {
  const pacientIds = process.argv[2] ? process.argv[2].split(',') : DEFAULT_PACIENT_IDS;

  await mongoose.connect(DATABASE);

  require('./shared/Pacient');
  require('./shared/PlataformOverview');
  require('./shared/FlowDataDevice');
  require('./shared/GameParameter');
  const PacientModel = mongoose.model('Pacient');
  const PlataformOverviewModel = mongoose.model('PlataformOverview');
  const GameParameterModel = mongoose.model('GameParameter');

  const output = {};

  for (const pacientId of pacientIds) {
    const pacient = await PacientModel.findById(pacientId);
    const plataformOverviews = await PlataformOverviewModel
      .find({ pacientId })
      .populate('flowDataDevicesId')
      .sort({ created_at: 1 });
    const gameParameters = await GameParameterModel.find({ pacientId }).sort({ created_at: 1 });

    output[pacientId] = {
      pacient,
      plataformOverviews,
      gameParameters,
    };

    console.log(`${pacientId} — ${pacient ? pacient.name : '(não encontrado)'}: ${plataformOverviews.length} sessões, ${gameParameters.length} game parameters`);
  }

  const outPath = './export-patient-data.json';
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nExportado para ${outPath}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Erro na exportação:', err);
  process.exit(1);
});
