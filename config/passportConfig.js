const passport = require('passport');
const userSchema = require('../module/userSchema');
const passport_local = require('passport-local').Strategy;

passport.use(new passport_local(async(username,password,done)=>{
console.log('receive credential',username,password);
try{
    const user = await userSchema.findOne({username:username});
    if(!user) return done(null,false,{error:'invalid user'});
    const iPasswordMatch = await user.comparePassword(password);
    if(iPasswordMatch){
     return  done(null,user)
    }else{
        return done(null,false,{error:"invalid password"})
    }


}catch(err){
    console.log(err)
    done(err)
}
}))

module.exports = passport;

