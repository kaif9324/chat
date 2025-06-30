// const messages = require('../module/messages');
const Message = require('../module/messages');
const express=require('express');
const router=express.Router();

router.post('/history',async(req,resp)=>{
    const {senderId, receiverId}=req.body;
    try{
        const message = await Message.find({
                $or:[
                    {sender:senderId,receiver:receiverId},
                    {sender:receiverId,receiver:senderId},

                ],
                deletedFor: { $ne: senderId } //$ne is an operator tha means NOT EQUAL IF SENDER ID AVAILABLE IT WILL SKIP ITS DATA BCZ HE IS DELETED FROM FRONTEND AND HIS ID ADDED
        }).sort({createdAt:1});
    
        resp.json(message)

    }catch(error){
        console.log(error)
        resp.status(500).json({error:"internel server error"})
    }
})
// delete route 
router.delete('/delete/:id',async (req,resp)=>{
  try{
    const id = req.params.id;
    await Message.findByIdAndDelete(id);
    resp.status(200).json({eror:"message deleted"})
  }catch(err){
    console.log(err)
    resp.status(500).json({error:"internel server error"});
  }

})
module.exports = router;