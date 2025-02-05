import asynchandler from "../utils/asynchandler.js"
import{ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asynchandler(async(req,res,next)=>{
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
  
  if (!token) {
      throw new ApiError(401,"unauthorized access");
      
  }
  
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  
  const user=await User.findById(decodedToken?._id).select("-password, -refreshToken")
  
  if (!user) {
      throw new ApiError("invalid access token");
      
  }
  
  req.user = user
  next()
  } catch (error) {
    throw new ApiError(401,error?.message||"invalid access token");
    
  }

})