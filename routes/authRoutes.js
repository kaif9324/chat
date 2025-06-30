const express = require('express');
const router = express.Router();
const user = require('../module/userSchema')
const {register,login,Userlist,userstatus }= require('../controllers/authControlers')
const {jwtMiddleware,genToken} = require('../middleware/jwt');



router.post('/register',register);
router.post('/login',login);
router.get('/userlist',jwtMiddleware,Userlist)
router.get('/status/:userid',userstatus)
router.get('/',jwtMiddleware,(req,resp)=>{
    resp.send('welcom to chat app')
})

module.exports = router;
