const mongoose = require('mongoose');

const  mongoURL =  process.env.MONGO_URL ;
// Connect to MongoDB
mongoose.connect(mongoURL,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
// Get the connection object
const db = mongoose.connection;
// Event listeners:
db.on('connected',()=>{
    console.log('connected to mongodb')
});
db.on('disconnected',()=>{
    console.log('database disconnected')
})
db.on('error',(error)=>{
    console.log('error',error)
})
module.exports  = db;