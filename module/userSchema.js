const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const userSchema = new mongoose.Schema({
    username:{
         type:String,
         required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    online:{
        type:Boolean,
        default:false
    },
    lastSeen:{
        type:Date,
        default: Date.now
    },
    typing:{
        type:Boolean,
        default:false
    }

})



userSchema.pre('save', async function(next){
    const person = this;
    if(!person.isModified('password')) return next();
    try{
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(person.password,salt);
        person.password=hashPassword;
        next();
    }catch(err){
        console.log(err)
        return next()
    }
})

userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        const isMatch = await bcrypt.compare(candidatePassword,this.password);
        return isMatch;
        

    }catch(err){
        console.log(err)
        throw err
    }

}

module.exports = mongoose.model('user',userSchema);