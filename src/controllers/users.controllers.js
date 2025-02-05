import asynchandler from "../utils/asynchandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError("user not found");

        }

        // console.log("user");


        const accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }).catch((err) => console.log("Error saving refreshToken:", err));

        return { accessToken, refreshToken }

    } catch (error) {
        console.log("error in token generation", error);

        throw new ApiError(500, "something went wrong while generating access and refresh tokens");

    }
}

const registerUser = asynchandler(async (req, res) => {

    console.log("running in controller", req.body, req.files)
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
    // console.log("email:", email);
    // console.log("username:", username);

    if (
        [username, email, fullname, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError("All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    console.log("existed user", existedUser)

    if (existedUser) {
        throw new ApiError(409, "user with same username or email already exists");

    }

    const avatarLocalPath = Array.isArray(req.files?.avatar) ? req.files?.avatar[0]?.path : undefined
    //    const coverimageLocalPath= req.files?.coverimage[0]?.path
    let coverimageLocalPath;
    if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        coverimageLocalPath = req.files.coverimage[0].path
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required");

    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverimage = await uploadOnCloudinary(coverimageLocalPath)

    console.log("hello", avatar, coverimage)


    if (!avatar) {
        throw new ApiError(400, "avatar is required");

    }

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase(),
        coverimage: coverimage?.url || "",
        avatar: avatar.url
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError("something went wrong while registering the user")

    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

    // const response = new ApiResponse(200, createdUser, "User registered successfully");
    // console.log("Response:", JSON.stringify(response));
    // return res.status(201).json(response);


})

const loginUser = asynchandler(async (req, res) => {
    // req body -> data
    // username and email
    //find the user
    // password check
    //access and refresh tokens
    //send cookie

    const { username, email, password } = req.body

    if ((!username && !email)) {
        throw new ApiError(400, "username or email is required");

    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exists");

    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "password is incorrect");

    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password, -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "user logged in successfully"
            )
        )
})

const logoutUser = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User looged out"))

})

const refreshAccessToken = asynchandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized access");
        
    }

    try {
        const decodedToken =jwt.verify(
            incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
        )
    
        const user= await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"refresh token is expired or used");
            
        }
    
    const options = {
        httpOnly: true,
        secure: true
    }
    
    const {accessToken,newRefreshToken} =await generateAccessAndRefreshTokens(user._id)
    return res.status(200)
    .cookies("accessToken", accessToken,options)
    .cookies("refreshToken", newRefreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,refreshToken:newRefreshToken
            },
            "access token refreshed successfully"
        )
    )
    } catch (error) {
        throw new ApiError(401,error?.message || "invalid refresh token");
        
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}