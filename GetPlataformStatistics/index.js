module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/Pacient');
    require('../shared/PlataformOverview');
    const PacientModel = mongoose.model('Pacient');
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

    const aggregate = PacientModel.aggregate();

    const pacientsMatchOperators = { $match: {} };
    const plataformMathOperators = { $match: {} };
    let maxSessions = Number.MAX_SAFE_INTEGER;
    let deviceName = 'Pitaco';

    if (req.query.condition)
        pacientsMatchOperators.$match.condition = req.query.condition;
    if (req.query.sex)
        pacientsMatchOperators.$match.sex = req.query.sex;
    if (req.query.fromBirthday)
        pacientsMatchOperators.$match.birthday = {
            $gte: new Date(new Date(`${req.query.fromBirthday} 00:00:00:000`).toISOString())
        };
    if (req.query.fromBirthday && req.query.toBirthday)
        pacientsMatchOperators.$match.birthday = {
            $gte: new Date(new Date(`${req.query.fromBirthday} 00:00:00:000`).toISOString()),
            $lte: new Date(new Date(`${req.query.toBirthday} 23:59:59:999`).toISOString())
        };

    if (req.query.maxSessions)
        maxSessions = req.query.maxSessions;

    if (req.query.phase)
        plataformMathOperators.$match.phase = req.query.phase;
    if (req.query.level)
        plataformMathOperators.$match.level = req.query.level

    if (req.query.devices)
        deviceName = req.query.devices;

    aggregate.append(pacientsMatchOperators);
    aggregate.project({ "_id": 1 });
    aggregate.lookup({
        from: 'playsessions',
        'let': {
            id: '$_id'
        },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: [{ $toObjectId: '$pacientId' }, '$$id'] },
                            { $lte: ['$sessionNumber', maxSessions] }
                        ]
                    }
                }
            },
            {
                $project: {
                    day: { $dayOfMonth: { date: "$created_at" } },
                    month: { $month: { date: "$created_at" } },
                    year: { $year: { date: "$created_at" } },
                    created_at: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                    sessionNumber: 1
                }
            }
        ],
        as: 'playsessions'
    });

    aggregate.lookup({
        from: 'plataformoverviews',
        'let': {
            id: '$_id',
            startDate: {
                $arrayElemAt: [
                    '$playsessions',
                    0
                ]
            },
            endDate: {
                $arrayElemAt: [
                    '$playsessions',
                    -1
                ]
            }
        },
        pipeline: [
            {
                $addFields: {
                    p: {
                        $toObjectId: '$pacientId'
                    }
                }
            },
            {
                $match: {
                    $expr: {
                        $and: [
                            {
                                $eq: [
                                    '$p',
                                    '$$id'
                                ]
                            },
                            {
                                $gte: [
                                    '$created_at',
                                    { $dateFromParts: { 'year': '$$startDate.year', 'month': '$$startDate.month', 'day': '$$startDate.day', 'hour': 0, 'minute': 0, 'second': 0, 'millisecond': 0 } }
                                ]
                            },
                            {
                                $lte: [
                                    '$created_at',
                                    { $dateFromParts: { 'year': '$$endDate.year', 'month': '$$endDate.month', 'day': '$$endDate.day', 'hour': 23, 'minute': 59, 'second': 59, 'millisecond': 999 } }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $project: {
                    flowDataDevicesId: 1,
                    created_at: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$created_at'
                        }
                    },
                    maxScore: 1,
                    scoreRatio: 1
                }
            }
        ],
        as: 'plataform'
    });

    aggregate.unwind({ path: '$plataform' });
    aggregate.project({
        plataformId: '$plataform._id',
        flowDataDevicesId: '$plataform.flowDataDevicesId',
        created_at: '$plataform.created_at',
        session: {
            $arrayElemAt: [{
                $filter: {
                    input: "$playsessions",
                    as: "playSessions",
                    cond: { $eq: ['$$playSessions.created_at', '$plataform.created_at'] }
                }
            }, 0]
        },
        plataformScore: "$plataform.maxScore",
        plataformScoreRatio: "$plataform.scoreRatio"
    })
    aggregate.lookup({
        from: 'flowdatadevices',
        'let': {
            flowDataDeviceId: '$flowDataDevicesId'
        },
        localField: '',
        pipeline: [
            {
                $match: {
                    $expr: {
                        $eq: [
                            '$_id',
                            '$$flowDataDeviceId'
                        ]
                    }
                }
            },
            { $project: { flowDataDevices: 1 } }
        ],
        as: 'flowData'
    });

    aggregate.replaceRoot({ newRoot: { $mergeObjects: [{ $arrayElemAt: ["$flowData", 0] }, "$$ROOT"] } });
    aggregate.unwind("$newRoot");
    aggregate.project({ "newRoot.flowData": 0 });
    aggregate.unwind("$newRoot.flowDataDevices");
    aggregate.match({ 'newRoot.flowDataDevices.deviceName': deviceName });
    aggregate.project({
        "sessionNumber": "$newRoot.session.sessionNumber",
        "pacientId": "$newRoot._id",
        "created_at": "$newRoot.created_at",
        "maxInsFlow": {
            $min: {
                $map: {
                    input: '$newRoot.flowDataDevices.flowData',
                    as: 'flowData',
                    'in': '$$flowData.flowValue'
                }
            }
        },
        "maxExpFlow": {
            $max: {
                $map: {
                    input: '$newRoot.flowDataDevices.flowData',
                    as: 'flowData',
                    'in': '$$flowData.flowValue'
                }
            }
        },
        "plataformScore": "$newRoot.plataformScore",
        "plataformScoreRatio": "$newRoot.plataformScoreRatio"
    });
    aggregate.group({
        _id: { pacientId: '$pacientId', date: '$created_at', sessionNumber: '$sessionNumber' },
        maxExpFlow: { $max: '$maxExpFlow' },
        maxInsFlow: { $min: '$maxInsFlow' },
        maxScore: { $max: '$plataformScore' },
        maxScoreRatio: { $max: '$plataformScoreRatio' }
    });
    aggregate.group({
        _id: { pacientId: '$_id.pacientId' },
        maxFlows: {
            $push: {
                maxInsFlow: '$maxInsFlow',
                maxExpFlow: '$maxExpFlow',
                maxScore: '$maxScore',
                maxScoreRatio: '$maxScoreRatio',

                created_at: '$_id.date',
                sessionNumber: '$_id.sessionNumber'
            },
        }
    });
    aggregate.project({
        pacientId: "$_id.pacientId",
        maxFlowsPerSession: "$maxFlows",
        plataformInfoPerSession: 1,
        _id: 0
    })

    aggregate.sort({ 'maxFlows.created_at': 1 })

    try {
        const plataformStatistics = await aggregate.exec();
        let plataformStatisticsPacientsIds = plataformStatistics.map(x => x.pacientId.toString());
        let plataformInfos = await PlataformOverviewModel.find({ pacientId: { $in: plataformStatisticsPacientsIds } }, { pacientId: 1, maxScore: 1, scoreRatio: 1, phase: 1, level: 1 });
        plataformStatistics.forEach(element => {
            element.plataformInfo = plataformInfos.filter(x => x.pacientId == element.pacientId);
        });
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



