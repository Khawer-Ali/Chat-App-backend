const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
   username : {type : String , unique : true},
   password : String,
},{timestamps : true});

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;