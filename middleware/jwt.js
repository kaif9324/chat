const jwt = require('jsonwebtoken');
const jwtMiddleware =  (req,resp,next)=>{
    const authorization = req.headers.authorization;
    if(!authorization) return resp.status(401).json({error:"token not found"});
    const token = authorization.split(' ')[1];
    if(!token) return resp.status(404).json({error:'invalid token'});
    try{
        const decode =  jwt.verify(token,process.env.SECRATE_KEY);
        req.user= decode.userdata
        next(); 

    }catch(err){
        console.log(err);
        resp.status(500).json({error:"internel server error"})
    }

}
// gen token 
const genToken = (userdata)=>{
    return jwt.sign({userdata},process.env.SECRATE_KEY,{expiresIn:30000})
}
module.exports=({jwtMiddleware,genToken});
