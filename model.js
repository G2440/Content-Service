const mongoose = require("mongoose");

var contentSchema = new mongoose.Schema({
    bookName: String,
    numChap: Number,
    addedAt: {type: Date , default: Date.now()},
    data : [
        {
            chapNum : Number,
            chapName : String,
            story: String
        }
    ]
});

module.exports = mongoose.model("Content",contentSchema);