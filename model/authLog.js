const mongoose = require('mongoose');

const authLogSchema = new mongoose.Schema({
    requestIP: { type: String, required: true },
    requestTimestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const AuthLog = mongoose.model('AuthLog', authLogSchema);

module.exports = AuthLog;
