const mongoose = require('mongoose');

const UserAccountSchema = mongoose.Schema({
    fullname: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    pacientId: { type: String },
    gameToken: {
        token: { type: String },
        description: { type: String },
        createdAt: { type: Date }
    }
},
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_At' }, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('UserAccount', UserAccountSchema);