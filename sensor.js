const mongoose = require('mongoose');

module.exports = mongoose.model('Sensor', new mongoose.Schema({
    time: String,
    date: String,
    fix: Number,
    quality: Number,
    latitude: String,
    longitude: String,
    speed: Number,
    angle: Number,
    altitude: Number,
    satellites: Number,
    antennaStatus: Number,
}));
