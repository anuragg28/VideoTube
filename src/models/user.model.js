import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: string,
            required: true,
            unique: true,
            lowercasde: true,
            trim: true,
            index: true
        },
        email: {
            type: string,
            required: true,
            unique: true,
            lowercasde: true

        },
        fullname: {
            type: string,
            required: true,
            trim: true,
            index: true

        },
        avatar: {
            type: string, //cloudinary url
            required: true
        },
        coverimage: {
            type: string,
            required: true
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: string,
            required: true
        },
        refreshToken: {
            type: string
        }

    }, { timestamps: true }
)

userSchema.pre("save", async function (next) {

    if (!this.isModified("password")) return next()

    this.password = bcrypt.hash(this.password, 10)
    next()



})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () { 
    return jwt.sign({
        _id: this._id,
        
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)