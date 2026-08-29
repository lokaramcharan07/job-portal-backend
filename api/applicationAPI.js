import exp from "express";
import {ApplicationModel} from "../models/applicationModel.js";
import {JobModel} from "../models/jobModel.js";
import {verifyToken,allowRoles} from "../middleware/authMiddleware.js";

export const applicationRouter=exp.Router();

// Job Seeker applies for a job
applicationRouter.post("/applications",verifyToken,allowRoles("jobseeker"),async(req,res)=>{
  let {jobId,resume,coverLetter}=req.body;
  if (!jobId){
    return res.status(400).json({success:false,message:"jobId is required"});
  }
  let job=await JobModel.findOne({_id:jobId,status:"open"});
  if (!job){
    return res.status(404).json({success:false,message:"Open job not found"});
  }
  if (new Date(job.applicationDeadline)<new Date()){
    return res.status(400).json({success:false,message:"Application deadline has passed"});
  }
  let existingApplication=await ApplicationModel.findOne({
    job:jobId,
    jobSeeker:req.user._id
  });
  if (existingApplication){
    return res.status(409).json({success:false,message:"You already applied for this job"});
  }
  let applicationDoc=await ApplicationModel.create({
    job:jobId,
    jobSeeker:req.user._id,
    resume,
    coverLetter
  });
  res.status(201).json({success:true,message:"Application submitted",data:applicationDoc});
});

// Job Seeker views own applications
applicationRouter.get("/my-applications",verifyToken,allowRoles("jobseeker"),async(req,res)=>{
  let applications=await ApplicationModel.find({jobSeeker:req.user._id})
    .populate("job","title companyName location employmentType status applicationDeadline")
    .populate("jobSeeker","name email");
  res.status(200).json({success:true,message:"Your applications",data:applications});
});

// Job Seeker views status of one own application
applicationRouter.get("/my-applications/:applicationId",verifyToken,allowRoles("jobseeker"),async(req,res)=>{
  let application=await ApplicationModel.findOne({
    _id:req.params.applicationId,
    jobSeeker:req.user._id
  }).populate("job","title companyName status");
  if (!application){
    return res.status(404).json({success:false,message:"Application not found"});
  }
  res.status(200).json({success:true,message:"Application status",data:application});
});

// Employer views applications for own jobs
applicationRouter.get("/employer-applications",verifyToken,allowRoles("employer"),async(req,res)=>{
  let jobs=await JobModel.find({employer:req.user._id}).select("_id");
  let jobIds=jobs.map(job=>job._id);
  let applications=await ApplicationModel.find({job:{$in:jobIds}})
    .populate("job","title companyName")
    .populate("jobSeeker","name email skills experience education");
  res.status(200).json({success:true,message:"Applications received",data:applications});
});

// Employer updates application status for an application belonging to their job
applicationRouter.put("/applications/:applicationId/status",verifyToken,allowRoles("employer"),async(req,res)=>{
  let {status}=req.body;
  let allowedStatuses=["submitted","reviewing","shortlisted","rejected","hired"];
  if (!allowedStatuses.includes(status)){
    return res.status(400).json({success:false,message:"Invalid application status"});
  }
  let application=await ApplicationModel.findById(req.params.applicationId).populate("job","employer");
  if (!application){
    return res.status(404).json({success:false,message:"Application not found"});
  }
  if (application.job.employer.toString()!==req.user._id.toString()){
    return res.status(403).json({success:false,message:"You can manage only applications for your jobs"});
  }
  application.status=status;
  await application.save();
  res.status(200).json({success:true,message:"Application status updated",data:application});
});