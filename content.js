const express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    cors = require("cors"),
    bodyParser = require("body-parser"),
    axios = require("axios");
app.use(cors());




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
                axios.post("https://pratilipi-microservices.herokuapp.com/dailypassService/add/" + idObj._id + "/" + userID);
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
                    axios.post("https://pratilipi-microservices.herokuapp.com/dailypassService/add/" + idObj._id + "/" + op._id).then(()=>{
                        console.log("New data added to the user");
                    });
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
    var size = idArr.length;
    var counter = 0;
    axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/scheduledUnlock").then(() => {
        for (var i = 0; i < size; i++) {

            axios.get("https://pratilipi-microservices.herokuapp.com/dailypassService/pickseries/" + req.params.id + "/" + idArr[i]).then((response) => {
                var contentData = {
                    id: response.data._id,
                    num: response.data.NumChapUn
                }
                Content.findById(contentData.id).then((content) => {
                    res.write("Name of the Series: " + content.bookName + '\n');
                    res.write("Number of Chapter in the Series: " + content.numChap + '\n');
                    res.write("Number of Unlocked Chapter in the Series: " + contentData.num + '\n');
                    for (var k = 0; k < contentData.num; k++) {
                        res.write("Chapter Number : " + content.data[k].chapNum + '\n');
                        res.write("Chapter Title  : " + content.data[k].chapName + '\n');
                        res.write(content.data[k].story + '\n');
                    }
                    counter++;
                    res.write('\n');
                    if (size == counter)
                        res.end();
                }).catch((err) => {
                    if (err) {
                        console.log("Error in Quering the database for Content");
                        console.log(err);
                    }
                })


            }).catch((err) => {
                console.log("Daily Pass Service Error")
                console.log(err);
            })
        }
    })

});

app.listen(process.env.PORT || 8001, () => {
    console.log("Started");
})
