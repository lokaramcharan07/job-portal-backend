import jwt from"jsonwebtoken";
import{UserModel}from"../models/userModel.js";

export async function verifyToken(req,res,next){
  try{
    let token=req.cookies.token;
    if(!token){
      return res.status(401).json({success:false,message:"Login required"});
    }
    let decoded=jwt.verify(token,process.env.JWT_SECRET);
    let user=await UserModel.findById(decoded.userId);
    if(!user){
      return res.status(401).json({success:false,message:"User not found"});
    }
    if(user.status!=="active"){
      return res.status(403).json({success:false,message:"User account is blocked"});
    }
    req.user=user;
    next();
  }catch(err){
    return res.status(401).json({success:false,message:"Invalid or expired token"});
  }
}

export function allowRoles(...roles){
  return(req,res,next)=>{
    if(!roles.includes(req.user.role)){
      return res.status(403).json({success:false,message:"Access denied"});
    }
    next();
  };
}