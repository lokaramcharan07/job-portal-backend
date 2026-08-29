import {Schema,model,Types} from "mongoose";

const applicationSchema=new Schema(
  {
    job: {
      type:Types.ObjectId,
      ref:"job",
      required:true
    },
    jobSeeker:{
      type:Types.ObjectId,
      ref:"user",
       required:true
    },
    resume:{
      type:String,
      trim:true
    },
    coverLetter:{
      type:String,
      trim:true
    },
    status:{
      type:String,
      enum:["submitted","reviewing","shortlisted","rejected","hired"],
      default:"submitted"
    }
  },
  { timestamps:true,
    versionKey:false,
    strict:"throw"
  }
);

applicationSchema.index({job:1,jobSeeker:1},{unique:true});

export const ApplicationModel=model("application",applicationSchema);
