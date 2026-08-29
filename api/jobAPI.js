import exp from"express";
import{JobModel}from"../models/jobModel.js";
import{ApplicationModel}from"../models/applicationModel.js";
import{verifyToken,allowRoles}from"../middleware/authMiddleware.js";

export const jobRouter=exp.Router();

// View all available jobs - public
jobRouter.get("/jobs",async(req,res)=>{
  let jobs=await JobModel.find({status:"open"}).populate("employer","name email");
  res.status(200).json({success:true,message:"Available jobs",data:jobs});
});

// View a single job - public
jobRouter.get("/jobs/:jobId",async(req,res)=>{
  let job=await JobModel.findById(req.params.jobId).populate("employer","name email");
  if(!job)return res.status(404).json({success:false,message:"Job not found"});
  res.status(200).json({success:true,message:"Job details",data:job});
});

// Employer creates job
jobRouter.post("/jobs",verifyToken,allowRoles("employer"),async(req,res)=>{
  let jobObj=req.body;
  if(!jobObj.title||!jobObj.companyName||!jobObj.description||!jobObj.location||!jobObj.employmentType||jobObj.salaryMin===undefined||jobObj.salaryMax===undefined||jobObj.experienceRequirement===undefined||!jobObj.applicationDeadline){
    return res.status(400).json({success:false,message:"Required job fields are missing"});
  }
  let newJobDoc=await JobModel.create({...jobObj,employer:req.user._id});
  res.status(201).json({success:true,message:"Job created",data:newJobDoc});
});

// Employer views own jobs
jobRouter.get("/my-jobs",verifyToken,allowRoles("employer"),async(req,res)=>{
  let jobs=await JobModel.find({employer:req.user._id});
  res.status(200).json({success:true,message:"Your jobs",data:jobs});
});

// Employer views a specific own job
jobRouter.get("/my-jobs/:jobId",verifyToken,allowRoles("employer"),async(req,res)=>{
  let job=await JobModel.findOne({_id:req.params.jobId,employer:req.user._id});
  if(!job)return res.status(404).json({success:false,message:"Job not found or not owned by you"});
  res.status(200).json({success:true,message:"Job details",data:job});
});

// Employer updates own job
jobRouter.put("/jobs/:jobId",verifyToken,allowRoles("employer"),async(req,res)=>{
  let job=await JobModel.findOne({_id:req.params.jobId,employer:req.user._id});
  if(!job)return res.status(404).json({success:false,message:"Job not found or not owned by you"});
  let modifiedJob=req.body;
  delete modifiedJob.employer;
  let updatedJobDoc=await JobModel.findByIdAndUpdate(req.params.jobId,{$set:{...modifiedJob}},{new:true,runValidators:true});
  res.status(200).json({success:true,message:"Job modified",data:updatedJobDoc});
});

// Employer deletes own job
jobRouter.delete("/jobs/:jobId",verifyToken,allowRoles("employer"),async(req,res)=>{
  let job=await JobModel.findOne({_id:req.params.jobId,employer:req.user._id});
  if(!job)return res.status(404).json({success:false,message:"Job not found or not owned by you"});
  await ApplicationModel.deleteMany({job:req.params.jobId});
  await JobModel.findByIdAndDelete(req.params.jobId);
  res.status(200).json({success:true,message:"Job deleted"});
});