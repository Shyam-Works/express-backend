import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt" // for password
const userSchema = new mongoose.Schema(
    {
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // for searching
        },
        email:{
            type:String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname:{
            type:String,
            required: true,
            trim: true,
            index: true
        },
        avatar:{
            type:String, // url cloudinary
            required: true,
        },
        coverImage:{
            type:String, // url cloudinary
        },
        watchHistory:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password:{
            type: String,
            required: [true, "password is required"]
        },
        refreshToken:{
            type: String,
        }
    },
    {
        timestamps: true
    });



// password thing -------------------------------------------------------------------------------------------------------------
    // this is pre middleware which incypt password just before save it. so it has 
userSchema.pre("save", async function(next){

    // if password is not changed then do not change hash password otherwise like if someone will change avatar and save it it will also change hashed password which is not correct so this is not ideal
    if(!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    // check or compare the password by bcrypt this.password is encypted password
    return await bcrypt.compare(password, this.password)
}
// ----------------------------------------------------------------------------------------------------------------

// access token 
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
    {
        _id:this._id,
        email:this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

// refresh token by id only
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema) // export User