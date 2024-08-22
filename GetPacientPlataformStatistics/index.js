module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    //PlataformOverview Schema
    require('../shared/PlataformOverview');
    require('../shared/FlowDataDevice');
    const PlataformOverviewModel = mongoose.model('PlataformOverview');

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

    const aggregate = PlataformOverviewModel.aggregate();
    const matchOperators = { $match: { pacientId: req.params.pacientId } }
    let deviceNameMatch = "";

    if (req.query.phase)
        matchOperators.$match.phase = req.query.phase;
    if (req.query.level)
        matchOperators.$match.level = req.query.level
    if (req.query.devices)
        deviceNameMatch = req.query.devices;
    if (req.query.dataIni)
        matchOperators.$match.created_at = {
            $gte: new Date(new Date(`${req.query.dataIni} 00:00:00:000`).toISOString())
        };
    if (req.query.dataIni && req.query.dataFim)
        matchOperators.$match.created_at = {
            $gte: new Date(new Date(`${req.query.dataIni} 00:00:00:000`).toISOString()),
            $lte: new Date(new Date(`${req.query.dataFim} 23:59:59:999`).toISOString())
        };

    aggregate.append(matchOperators);

    if (req.query.sort == "asc")
        aggregate.sort({ created_at: 1 })

    aggregate.lookup({
        from: 'flowdatadevices',
        let: { flowDataDeviceId: "$flowDataDevicesId" },
        localField: '',
        pipeline: [
            {
                $match:
                {
                    $expr: { $eq: ['$_id', '$$flowDataDeviceId'] }
                }
            },
            { $project: { flowDataDevices: 1 } }
        ],
        as: 'flowData'
    })

    aggregate.replaceRoot({ newRoot: { $mergeObjects: [{ $arrayElemAt: ["$flowData", 0] }, "$$ROOT"] } });
    aggregate.unwind("$newRoot");
    aggregate.project({ "newRoot.flowData": 0 });
    aggregate.unwind("$newRoot.flowDataDevices");
    if(deviceNameMatch != "")
        aggregate.match({"newRoot.flowDataDevices.deviceName": deviceNameMatch })
    aggregate.project({
        "created_at":
        {
            $dateToString:
            {
                format: "%d/%m/%Y", date: "$newRoot.created_at"
            }
        },
        "pacientId": "$newRoot.pacientId",
        "flowDataDevicesId": "$newRoot.flowDataDevicesId",
        "deviceName": "$newRoot.flowDataDevices.deviceName",
        "playStart": "$newRoot.playStart",
        "playFinish": "$newRoot.playFinish",
        "duration": "$newRoot.duration",
        "result": "$newRoot.result",
        "stageId": "$newRoot.stageId",
        "phase": "$newRoot.phase",
        "level": "$newRoot.level",
        "relaxTimeSpawned": "$newRoot.relaxTimeSpawned",
        "score": "$newRoot.score",
        "maxScore": "$newRoot.maxScore",
        "scoreRatio": "$newRoot.scoreRatio",
        "TargetsSpawned": "$newRoot.TargetsSpawned",
        "TargetsSuccess": "$newRoot.TargetsSuccess",
        "TargetsInsSuccess": "$newRoot.TargetsInsSuccess",
        "TargetsExpSuccess": "$newRoot.TargetsExpSuccess",
        "TargetsFails": "$newRoot.TargetsFails",
        "TargetsInsFail": "$newRoot.TargetsInsFail",
        "TargetsExpFail": "$newRoot.TargetsExpFail",
        "obstaclesSpawned": "$newRoot.ObstaclesSpawned",
        "obstaclesSuccess": "$newRoot.ObstaclesSuccess",
        "obstaclesFail": "$newRoot.ObstaclesFail",
        "obstaclesInsSuccess": "$newRoot.ObstaclesInsSuccess",
        "obstaclesExpSuccess": "$newRoot.ObstaclesExpSuccess",
        "obstaclesInsFail": "$newRoot.ObstaclesInsFail",
        "obstaclesExpFail": "$newRoot.ObstaclesExpFail",
        "PlayerHp": "$newRoot.PlayerHp",
        "BorgScale": "$newRoot.BorgScale",
        "maxInsFlow":
        {
            $min:
            {
                $map:
                {
                    input: "$newRoot.flowDataDevices.flowData",
                    as: "flowData",
                    in: "$$flowData.flowValue"
                }
            }

        },
        "maxExpFlow":
        {
            $max:
            {
                $map:
                {
                    input: "$newRoot.flowDataDevices.flowData",
                    as: "flowData",
                    in: "$$flowData.flowValue"
                }
            }

        }
    });

    if (req.query.limit)
        aggregate.limit(req.query.limit)
    if (req.query.skip)
        aggregate.skip(req.query.skip);


    try {
        const plataformStatistics = await aggregate.exec();
        context.log("[DB QUERYING] - PlataformOverviewStatistics Get by Pacient ID");
        context.res = {
            status: 200,
            body: utils.createResponse(true,
                true,
                "Consulta realizada com sucesso.",
                plataformStatistics,
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



