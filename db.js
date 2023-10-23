const mongoose = require('mongoose');
require('dotenv').config()


const mongoURI = process.env.MongoURI;

console.log('this2',process.env.MongoURI);


const connectToMongo = () => {
    mongoose.connect(mongoURI, { useNewUrlParser: true,useUnifiedTopology: true });

};

module.exports = connectToMongo;