module.exports = async function (context, req) {
    const mongoose = require('mongoose');
    const DATABASE = process.env.MongoDbAtlas;
    mongoose.connect(DATABASE);
    mongoose.Promise = global.Promise;

    require('../shared/Pacient');
    const PacientModel = mongoose.model('Pacient');

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

    let maxSessions = Number.MAX_SAFE_INTEGER;
    let devices;
    let minigameName = 'WaterGame';

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

    if (req.query.minigameName)
        minigameName = req.query.minigameName

    if (req.query.devices) devices = [req.query.devices];
    else devices = ['Pitaco'];

    let minigameFlowOperator = minigameName == 'WaterGame' ? { $min: '$flow' } : { $max: '$flow' }

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
        from: 'minigameoverviews',
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
                                $eq: [
                                    '$minigameName',
                                    minigameName
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
                    devices: 1,
                    flowDataRounds: {
                        $map: {
                            "input": "$flowDataRounds", "as": "ar", "in": "$$ar.roundFlowScore"
                        }
                    },
                    created_at: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$created_at'
                        }
                    }
                }
            }
        ],
        as: 'minigameoverviews'
    });

    aggregate.unwind({ path: '$minigameoverviews' });
    aggregate.project({
        created_at: "$minigameoverviews.created_at",
        minigameoverviews: 1,
        devices: "$minigameoverviews.devices",
        flow: { $max: "$minigameoverviews.flowDataRounds" },
        session: {
            $arrayElemAt: [{
                $filter: {
                    input: "$playsessions",
                    as: "playSessions",
                    cond: { $eq: ['$$playSessions.created_at', '$minigameoverviews.created_at'] }
                }
            }, 0]
        }
    })
    aggregate.project({
        created_at: 1,
        devices: 1,
        flow: 1,
        sessionNumber: '$session.sessionNumber'
    });
    aggregate.match({
        "devices": {
            $in: devices
        }
    })

    aggregate.sort({ sessionNumber: 1 })

    aggregate.group({
        _id: { pacientId: '$_id', date: '$created_at', sessionNumber: '$sessionNumber' },
        maxFlow: minigameFlowOperator
    });
    aggregate.group({
        _id: { pacientId: '$_id.pacientId' },
        maxFlows: {
            $push: {
                flow: '$maxFlow',
                created_at: '$_id.date',
                sessionNumber: '$_id.sessionNumber'
            }
        },
        
    });
    aggregate.project({
        pacientId: "$_id.pacientId",
        maxFlows: 1,
        _id: 0
    })


    try {
        const minigamesStatistics = await aggregate.exec();
        context.log("[DB QUERYING] - Minigame Overview Statistics");
        context.res = {
            status: 200,
            body: utils.createResponse(true,
                true,
                "Consulta realizada com sucesso.",
                minigamesStatistics,
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



