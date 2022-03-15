const express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    cors = require("cors"),
    bodyParser = require("body-parser"),
    axios = require("axios");



var Content = require("./model");
require("dotenv").config();
app.use(bodyParser.json());

const db = "mongodb+srv://" + process.env.USER + ":" + process.env.PASS + "@content.nrpz0.mongodb.net/" + process.env.DB + "?retryWrites=true&w=majority";

//Connection to database 
mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connection to Database Established');
}).catch((err) => {
    console.log('Cannot connect to the Database');
    console.log(err);
});

app.post('/addSeries', (req, res) => {
    var singleContent = req.body.body;
    var db1 = new Content(singleContent);
    db1.save().then((response) => {
        var userID = response._id;
        axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/all").then((response) => {
            for (var j = 0; j < response.data.length; j++) {
                var idObj = {
                    _id: response.data[j]._id
                }
                axios.post("https://pratilipi-microservices.herokuapp.com/dailypassService/add/" + idObj._id + "/" + userID + "/" + 4);
            }
        }).catch((err) => {
            if (err) {
                console.log("Cannot Fetch From the Daily Pass Service");
                console.log(err);
            }
        })
    }).catch((err) => {
        if (err) {
            console.log("Error in saving the data in the Database");
            console.log(err);
        }
    })
});

app.post('/bulkAdd', (req, res) => {
    var dataArr = req.body.body;
    var newID = {};
    var idObj = {};

    Content.insertMany(dataArr).then((docs) => {
        axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/all").then((response) => {
            for (var i = 0; i < dataArr.length; i++) {
                newID = {
                    _id: docs[i]._id
                }
                for (var j = 0; j < response.data.length; j++) {
                    var op = {
                        _id: newID._id
                    }
                    idObj = {
                        _id: response.data[j]._id
                    }
                    axios.post("https://pratilipi-microservices.herokuapp.com/dailypassService/add/" + idObj._id + "/" + op._id + "/" + 4);
                }
            }

        }).catch((err) => {
            if (err) {
                console.log("Error in fetching from Daily Pass Service");
                console.log(err);
            }
        })
    }).catch((err) => {
        if (err) {
            console.log("Error in saving the data in the Database");
            console.log(err);
        }
    })

return res.json("All the data is Successfully Added");

});

app.get("/allSeries", (req, res) => {
    Content.find({}, function (err, allSeries) {
        if (err) {
            console.log("Database is Empty");
            console.log(err);
        }
        else
            res.json(allSeries);
    })
});

app.get("/pickContent/:id", (req, res) => {
    Content.findById(req.params.id, function (err, pickedItem) {
        if (err) {
            console.log("Item not found!");
            console.log(err);
        }
        else
            res.json(pickedItem);
    })
});

app.get('/fetchSelective/:id/seriesIDs/', (req, res) => {
    var idArr = req.query.array;
    axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/scheduledUnlock");

    axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/dailydata/" + req.params.id).then((response) => {
        var val = (response.data);
        var obj = {
            _id: val._id,
            content: val.content
        }

        for (var j = 0; j < obj.content.length; j++) {
            var counter = 0;
            var size = idArr.length;
            if (idArr.includes(obj.content[j]._id)) {

                var unlockedContent = {
                    num: obj.content[j].NumChapUn
                }
                Content.findById(obj.content[j]._id).then((content) => {
                    if (content) {
                        res.write("Name of the Series: " + content.bookName + '\n');
                        res.write("Number of Chapter in the Series: " + content.numChap + '\n');
                        res.write("Number of Unlocked Chapter in the Series: " + unlockedContent.num + '\n');
                        for (var k = 0; k < content.data.length; k++) {
                            res.write("Chapter Number : " + content.data[k].chapNum + '\n');
                            res.write("Chapter Title  : " + content.data[k].chapName + '\n');
                            res.write(content.data[k].story + '\n');
                        }
                        counter++;
                        res.write('\n');
                        if (size == counter)
                            res.end();
                    }
                }).catch((err) => {
                    if (err) {
                        console.log("Error in Quering the database for Content");
                        console.log(err);
                    }
                })
            }
        }
    }).catch((err) => {
        console.log("Daily Pass Service Error")
        console.log(err);
    })
});

app.listen(process.env.PORT || 8001, () => {
    console.log("Started");
})
