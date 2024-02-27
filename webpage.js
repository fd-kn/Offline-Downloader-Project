const mongoose = require('mongoose');

const WebpageSchema = new mongoose.Schema({
    webpageId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    htmlContent: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Webpage = mongoose.model('Webpage', WebpageSchema);

module.exports = Webpage;
