import exp from "express";
import {usersSchema} from "../models/usersSchema.js";
import {jobSchema} from "../models/jobSchema.js";
import {applSchema} from "../models/applSchema.js";
import {verifyToken,allowRoles} from "../middleware/authorizationMiddleware.js";
export const adminRouter = exp.Router();
adminRouter.use(verifyToken, allowRoles("admin"));
// View all users
adminRouter.get("/users",async(req, res)=>{
  const users=await usersSchema.find().select("-password");
  res.status(200).json({
    success:true,
    message:"All users",
    data:users
  });
});
// View user by ID
adminRouter.get("/users/:userId",async(req, res)=>{
  const user=await usersSchema
    .findById(req.params.userId)
    .select("-password");
  if (!user){
    return res.status(404).json({
      success:false,
      message:"User not found"
    });
  }
  res.status(200).json({
    success:true,
    message:"User details",
    data: user
  });
});
// Update user status
adminRouter.put("/users/:userId/status",async(req, res)=>{
  const {status}=req.body;
  if (!["active","blocked"].includes(status)){
    return res.status(400).json({
      success:false,
      message:"Invalid user status"
    });
  }
  const updatedUser=await usersSchema
    .findByIdAndUpdate(
      req.params.userId,
      {$set:{status}},
      {
        new:true,
        runValidators:true
      }
    )
    .select("-password");
  if (!updatedUser){
    return res.status(404).json({
      success:false,
      message:"User not found"
    });
  }
  res.status(200).json({
    success:true,
    message:"User status updated",
    data:updatedUser
  });
});

// Delete user
adminRouter.delete("/users/:userId",async(req, res) => {
  const deletedUser=await usersSchema.findByIdAndDelete(
    req.params.userId
  );
  if (!deletedUser) {
    return res.status(404).json({
      success:false,
      message:"User not found"
    });
  }
  // Delete jobs posted by the user
  await jobSchema.deleteMany({
    employer:req.params.userId
  });
  // Delete applications submitted by the user
  await applSchema.deleteMany({
    jobSeeker:req.params.userId
  });
  res.status(200).json({
    success:true,
    message:"User deleted"
  });
});
// View all jobs
adminRouter.get("/jobs",async(req, res)=>{
  const jobs=await jobSchema
    .find()
    .populate("employer","name email");
  res.status(200).json({
    success:true,
    message:"All jobs",
    data: jobs
  });
});

// View job by ID
adminRouter.get("/jobs/:jobId",async(req, res)=>{
  const job=await jobSchema
    .findById(req.params.jobId)
    .populate("employer", "name email");
  if (!job){
    return res.status(404).json({
      success:false,
      message:"Job not found"
    });
  }
  res.status(200).json({
    success:true,
    message:"Job details",
    data:job
  });
});

// Remove inappropriate job
adminRouter.delete("/jobs/:jobId",async(req, res)=>{
  const deletedJob=await jobSchema.findByIdAndDelete(
    req.params.jobId
  );
  if (!deletedJob){
    return res.status(404).json({
      success: false,
      message: "Job not found"
    });
  }
  // Delete applications related to the deleted job
  await applSchema.deleteMany({
    job:req.params.jobId
  });
  res.status(200).json({
    success:true,
    message:"Job removed by admin"
  });
});

// Platform data summary
adminRouter.get("/summary",async(req, res)=>{
  const totalUsers=await usersSchema.countDocuments();
  const totalJobs=await jobSchema.countDocuments();
  const totalApplications=await applSchema.countDocuments();
  res.status(200).json({
    success:true,
    message:"Platform summary",
    data:{
      totalUsers,
      totalJobs,
      totalApplications
    }
  });
});
