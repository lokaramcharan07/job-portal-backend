import exp from "express";
import {UserModel} from "../models/userModel.js";
import {JobModel} from "../models/jobModel.js";
import {ApplicationModel} from "../models/applicationModel.js";
import {verifyToken,allowRoles} from "../middleware/authMiddleware.js";

export const adminRouter=exp.Router();

adminRouter.use(verifyToken,allowRoles("admin"));

// View all users
adminRouter.get("/users",async(req,res)=>{
  let users=await UserModel.find().select("-password");
  res.status(200).json({ success: true,message:"All users",data:users});
});

// View user by id
adminRouter.get("/users/:userId",async(req,res)=>{
  let user=await UserModel.findById(req.params.userId).select("-password");
  if (!user){
    return res.status(404).json({success:false,message:"User not found"});
  }
  res.status(200).json({success:true,message:"User details",data:user});
});

// Update user status
adminRouter.put("/users/:userId/status",async(req,res)=>{
  let {status}=req.body;
  if (!["active", "blocked"].includes(status)){
    return res.status(400).json({ success:false,message:"Invalid user status"});
  }
  let updatedUser=await UserModel.findByIdAndUpdate(
    req.params.userId,
    {$set:{status}},
    {new:true,runValidators:true}
  ).select("-password");
  if (!updatedUser){
    return res.status(404).json({success:false,message:"User not found"});
  }
  res.status(200).json({success:true,message:"User status updated",data:updatedUser});
});

// Delete user
adminRouter.delete("/users/:userId",async(req,res)=>{
  let deletedUser=await UserModel.findByIdAndDelete(req.params.userId);
  if (!deletedUser){
    return res.status(404).json({success:false,message:"User not found"});
  }
  await JobModel.deleteMany({employer:req.params.userId});
  await ApplicationModel.deleteMany({jobSeeker:req.params.userId});
  res.status(200).json({success:true,message:"User deleted"});
});

// View all jobs
adminRouter.get("/jobs",async(req,res)=>{
  let jobs=await JobModel.find().populate("employer","name email");
  res.status(200).json({success:true,message:"All jobs",data:jobs});
});

// View job by id
adminRouter.get("/jobs/:jobId",async(req,res)=>{
  let job=await JobModel.findById(req.params.jobId).populate("employer","name email");
  if(!job){
    return res.status(404).json({success:false,message:"Job not found"});
  }
  res.status(200).json({success:true,message:"Job details",data: job});
});

// Remove inappropriate job
adminRouter.delete("/jobs/:jobId",async(req,res)=>{
  let deletedJob=await JobModel.findByIdAndDelete(req.params.jobId);
  if (!deletedJob) {
    return res.status(404).json({success:false,message:"Job not found"});
  }
  await ApplicationModel.deleteMany({job:req.params.jobId});
  res.status(200).json({success:true,message:"Job removed by admin"});
});

// Platform data summary
adminRouter.get("/summary",async(req,res)=>{
  let totalUsers=await UserModel.countDocuments();
  let totalJobs=await JobModel.countDocuments();
  let totalApplications=await ApplicationModel.countDocuments();
  res.status(200).json({
    success:true,
    message:"Platform summary",
    data: {totalUsers,totalJobs,totalApplications}
  });
});
