import asynchandler from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asynchandler(async (req, res) => {

    // get details from frontend
    // validate the deatails
    // check if user already exists
    // check for avatars, check for images
    // upload them on cloudinary
    // create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    // return response

    const { username, email, fullname, password } = req.body
    console.log("email:", email);
    console.log("username:", username);

    if (
        [username, email, fullname, password].some((field) =>
            field ? trim() === "")
    ) {
        throw new ApiError("All fields are required");
    }

    const existedUser = User.findOne({
        $or:[{email},{username}]
    })

    if (existedUser) {
        throw new ApiError(409,"user with same username or email already exists");
        
    }

   const avatarLocalPath= req.files?.avatar[0]?.path
   const coverimageLocalPath= req.files?.coverimage[0]?.path

   if (!avatarLocalPath) {
    throw new ApiError(400,"avatar is required");
    
   }

   const avatar= await uploadOnCloudinary(avatarLocalPath)
   const coverimage= await uploadOnCloudinary(coverimageLocalPath)


   if (!avatar) {
    throw new ApiError(400,"avatar is required");
    
   }

const user =await User.create({
    fullname,
    email,
    password,
    username:username.toLowerCase(),
    coverimage:coverimage?.url || "",
    avatar: avatar.url
})

const createdUser = User.findById(user._id).select("-password -refreshToken")

if (!createdUser) {
    throw new ApiError("something went wrong ehile registering the user");
    
}

return res.status(201).json(
    new ApiResponse (200, createdUser,"user registered successfully")
)

})

export { registerUser }