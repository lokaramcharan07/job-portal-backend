import exp from"express";
import bcrypt from"bcryptjs";
import jwt from"jsonwebtoken";
import{UserModel}from"../models/userModel.js";
import{verifyToken,allowRoles}from"../middleware/authMiddleware.js";

export const userRouter=exp.Router();

// Register as Job Seeker or Employer
userRouter.post("/register",async(req,res)=>{
  let{name,email,password,role,skills,experience,education}=req.body;
  if(!name||!email||!password){
    return res.status(400).json({success:false,message:"name, email and password are required"});
  }
  if(role==="admin"){
    return res.status(403).json({success:false,message:"Admin registration is not allowed"});
  }
  role=role||"jobseeker";
  let existingUser=await UserModel.findOne({email});
  if(existingUser){
    return res.status(409).json({success:false,message:"Email already registered"});
  }
  let hashedPassword=await bcrypt.hash(password,10);
  let newUserDoc=await UserModel.create({
    name,
    email,
    password:hashedPassword,
    role,
    skills:skills||[],
    experience:experience||0,
    education:education||[]
  });
  let userResponse=newUserDoc.toObject();
  delete userResponse.password;
  res.status(201).json({success:true,message:"User registered",data:userResponse});
});

// Login
userRouter.post("/login",async(req,res)=>{
  let{email,password}=req.body;
  let user=await UserModel.findOne({email}).select("+password");
  if(!user){
    return res.status(401).json({success:false,message:"Invalid email or password"});
  }
  if(user.status!=="active"){
    return res.status(403).json({success:false,message:"User account is blocked"});
  }
  let passwordMatched=await bcrypt.compare(password,user.password);
  if(!passwordMatched){
    return res.status(401).json({success:false,message:"Invalid email or password"});
  }
  let token=jwt.sign({userId:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||"1d"});
  res.cookie("token",token,{
    httpOnly:true,
    secure:process.env.NODE_ENV==="production",
    sameSite:"lax",
    maxAge:24*60*60*1000
  });
  let userResponse=user.toObject();
  delete userResponse.password;
  res.status(200).json({success:true,message:"Login successful",data:userResponse});
});

// View own profile
userRouter.get("/profile",verifyToken,async(req,res)=>{
  res.status(200).json({success:true,message:"Profile details",data:req.user});
});

// Update own profile
userRouter.put("/profile",verifyToken,async(req,res)=>{
  let modifiedProfile=req.body;
  delete modifiedProfile.password;
  delete modifiedProfile.role;
  delete modifiedProfile.status;
  delete modifiedProfile.email;
  let updatedUser=await UserModel.findByIdAndUpdate(req.user._id,{$set:{...modifiedProfile}},{new:true,runValidators:true});
  res.status(200).json({success:true,message:"Profile modified",data:updatedUser});
});

// Logout
userRouter.post("/logout",verifyToken,async(req,res)=>{
  res.clearCookie("token");
  res.status(200).json({success:true,message:"Logout successful"});
});

// Protected route accessible only to authenticated Job Seekers
userRouter.get("/jobseeker-only",verifyToken,allowRoles("jobseeker"),(req,res)=>{
  res.json({success:true,message:"Job Seeker protected route"});
});