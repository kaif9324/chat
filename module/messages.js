const mongoose= require('mongoose');
const message_schema= new mongoose.Schema({
    sender:{
        type:String,
        required:true
    },
    receiver:{
        type:String,
        required:true
    },
    msg:{
        type:String,
        required:true
    },
    deletedFor: [], 
 
},{ timestamps: true })
module.exports = mongoose.model('msg',message_schema);