const Validator = require('validatorjs');

exports.plataformOverviewSaveValidator = (plataformOverviewReq) => {
    let rules = {
        pacientId: ['required', 'regex:/^[0-9a-fA-F]{24}$/i'],
        'flowDataDevices.*.deviceName': ['required', { 'in': ['Pitaco', 'Manovacuômetro', 'Cinta'] }],
        'flowDataDevices.*.flowData.*.flowValue': 'required|numeric',
        'flowDataDevices.*.flowData.*.timestamp': 'required|date',
        playStart: 'required|date',
        playFinish: 'required|date',
        duration: 'required|numeric',
        result: 'required|string',
        stageId: 'required|integer',
        phase: 'required|integer',
        level: 'required|numeric',
        relaxTimeSpawned: 'required|boolean',
        score: 'required|numeric',
        maxScore: 'required|numeric',
        scoreRatio: 'required|numeric',
        TargetsSpawned: 'required|integer',
        TargetsSuccess: 'required|integer',
        TargetsInsSuccess: 'required|integer',
        TargetsExpSuccess: 'required|integer',
        TargetsFails: 'required|integer',
        TargetsInsFail: 'required|integer',
        TargetsExpFail: 'required|integer',
        ObstaclesSpawned: 'required|integer',
        ObstaclesSuccess: 'required|integer',
        ObstaclesInsSuccess: 'required|integer',
        ObstaclesExpSuccess: 'required|integer',
        ObstaclesFail: 'required|integer',
        ObstaclesInsFail: 'required|integer',
        ObstaclesExpFail: 'required|integer',
        PlayerHp: 'required|numeric',
        BorgScale: 'required|integer',
    };

    let validation = new Validator(plataformOverviewReq, rules);
    validation.check();
    return validation;
}

exports.gameParameterValidator = (gameParameterReq) => {
    let rules = {
        stageId: 'required|integer',
        phase: 'required|integer',
        level: 'required|integer',
        pacientId: ['required', 'regex:/^[0-9a-fA-F]{24}$/i'],
        ObjectSpeedFactor: 'required|numeric',
        Loops: 'required|integer',
        HeightIncrement: 'required|numeric',
        HeightUpThreshold: 'required|numeric',
        HeightDownThreshold: 'required|numeric',
        SizeIncrement: 'required|numeric',
        SizeUpThreshold: 'required|numeric',
        SizeDownThreshold: 'required|numeric'
    };
    
    let validation = new Validator(gameParameterReq, rules);
    validation.check();
    return validation;
}

exports.pacientSaveValidator = (pacientReq) => {

    pacientReq.birthday = pacientReq.birthday.replace(new RegExp('/', 'g'), '-');

    let rules = {
        name: 'required|string',
        sex: ['required', 'string', { 'in': ["Male", "Female"] }],
        birthday: 'required|date',
        capacitiesPitaco: {
            insPeakFlow: 'required|integer',
            expPeakFlow: 'required|integer',
            insFlowDuration: 'required|integer',
            expFlowDuration: 'required|integer',
            respiratoryRate: 'required|integer',
        },
        capacitiesMano: {
            insPeakFlow: 'required|integer',
            expPeakFlow: 'required|integer',
            insFlowDuration: 'required|integer',
            expFlowDuration: 'required|integer',
            respiratoryRate: 'required|integer',
        },
        capacitiesCinta: {
            insPeakFlow: 'required|integer',
            expPeakFlow: 'required|integer',
            insFlowDuration: 'required|integer',
            expFlowDuration: 'required|integer',
            respiratoryRate: 'required|integer',
        },
        condition: ['required', 'string', { 'in': ["Healthy", "Obstructive", "Restrictive"] }],
        unlockedLevels: 'required|integer',
        accumulatedScore: 'required|integer',
        playSessionsDone: 'required|integer',
        currentPerformance: 'required|numeric',
        currentBorgScale: 'required|numeric',
        calibrationPitacoDone: 'required|boolean',
        calibrationManoDone: 'required|boolean',
        calibrationCintaDone: 'required|boolean',
        howToPlayDone: 'required|boolean',
        weight: 'required|integer',
        height: 'required|integer',
        pitacoThreshold: 'required|numeric',
        manoThreshold: 'required|numeric',
        cintaThreshold: 'required|numeric',
        ethnicity: 'required|string',
    };

    let validation = new Validator(pacientReq, rules);
    validation.check();

    return validation;
}

exports.minigameOverviewSaveValidator = (minigameOverviewReq) => {

    let rules = {
        pacientId: ['required', 'regex:/^[0-9a-fA-F]{24}$/i'],
        minigameName: ['required', { 'in': ['CakeGame', 'WaterGame'] }],
        respiratoryExercise: ['required', { 'in': ['ExpiratoryPeak', 'InspiratoryPeak'] }],
        'flowDataRounds.*.minigameRound': 'required|integer',
        'flowDataRounds.*.roundScore': 'required|integer',
        'flowDataRounds.*.roundFlowScore': 'required|numeric',
        'flowDataRounds.*.flowDataDevices.*.deviceName': ['required', { 'in': ['Pitaco', 'Manovacuômetro', 'Cinta'] }],
        'flowDataRounds.*.flowDataDevices.*.flowData.*.flowValue': 'required|numeric',
        'flowDataRounds.*.flowDataDevices.*.flowData.*.timestamp': 'required|date',
    };

    let validation = new Validator(minigameOverviewReq, rules);
    validation.check();

    return validation;
}

exports.calibrationOverviewSaveValidator = (calibrationOverviewReq) => {

    let rules = {
        pacientId: ['required', 'regex:/^[0-9a-fA-F]{24}$/i'],
        gameDevice: ['required', { 'in': ['Pitaco', 'Manovacuômetro', 'Cinta'] }],
        calibrationExercise: ['required', { 'in': ['ExpiratoryPeak', 'InspiratoryPeak', 'ExpiratoryDuration', 'InspiratoryDuration', 'RespiratoryFrequency'] }],
        calibrationValue: 'required|integer'
    };

    let validation = new Validator(calibrationOverviewReq, rules);
    validation.check();

    return validation;
}

exports.createTokenValidator = (createTokenReq) => {

    let rules = {
        userId: ['required', 'regex:/^[0-9a-fA-F]{24}$/i']
    };

    let validation = new Validator(createTokenReq, rules);
    validation.check();

    return validation;
}

exports.createUserValidator = (createTokenReq) => {

    let rules = {
        fullname: 'required|string',
        username: 'required|string',
        password: 'required|string',
        email: 'required|email',
        role: ['required', { 'in': ['Administrator', 'User'] }],
        pacientId: [{ required_if: ['role', 'User'] }, 'regex:/^[0-9a-fA-F]{24}$/i'],
    };

    let validation = new Validator(createTokenReq, rules);
    validation.check();

    return validation;
}

exports.authenticateValidator = (authenticateReq) => {

    let rules = {
        username: 'required|string',
        password: 'required|string'
    };

    let validation = new Validator(authenticateReq, rules);
    validation.check();

    return validation;
}
