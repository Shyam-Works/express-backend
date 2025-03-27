import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken // save in DB
        await user.save(
            { validateBeforeSave: false }
        )

        return {accessToken, refreshToken} 
    }catch(error){
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

// register -------------------------------------------------------------------------------------------
// const registerUser = asyncHandler(async (req, res) => {
//     const { fullname, email, username, password } = req.body;
//     console.log("Received files:", req.files);

//     // Validate fields
//     if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
//         throw new ApiError(400, "All fields are required!");
//     }

//     // Check if user already exists (by email or username)
//     const existedUser = await User.findOne({
//         $or: [{ username }, { email }]
//     });

//     if (existedUser) {
//         throw new ApiError(409, "User with this email or username already exists");
//     }

//     // Ensure avatar file exists
//     const avatarLocalPath = req.files?.avatar?.[0]?.path; 
    

//     if (!avatarLocalPath) {
//         throw new ApiError(400, "Avatar file is required");
//     }
//     const coverImageLocalPath = req.files?.coverImage?.[0]?.path; 


//     const avatar =  await uploadOnCloudinary(avatarLocalPath);
//     const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

//     if (!avatar?.url) {
//         throw new ApiError(400, "Error uploading avatar");
//     }

//     // Create new user in database
//     const user = await User.create({
//         fullname,
//         avatar: avatar.url,
//         coverImage: coverImage?.url || "", 
//         email,
//         password,
//         username: username.toLowerCase(),
//     });

//     // Fetch user without password or refreshToken
//     const createdUser = await User.findById(user._id).select("-password -refreshToken");
    
//     if (!createdUser) {
//         throw new ApiError(500, "Something went wrong while registering the user");
//     }

//     return res.status(201).json(
//         new ApiResponse(200, createdUser, "User registered successfully")
//     );
// });
const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    const avatarFile = req.files?.avatar?.[0];
    const coverImageFile = req.files?.coverImage?.[0];

    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required");
    }

    try {
        // Upload to Cloudinary
        const avatar = await uploadOnCloudinary(avatarFile.buffer, avatarFile.originalname);
        const coverImage = coverImageFile ? await uploadOnCloudinary(coverImageFile.buffer, coverImageFile.originalname) : null;

        if (!avatar?.url) {
            throw new ApiError(400, "Error uploading avatar");
        }

        // Create new user in database
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase(),
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");
        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
    } catch (error) {
        console.error("Error in Cloudinary Upload or User Creation:", error);
        throw new ApiError(500, "Error occurred during user registration");
    }
});


// login -------------------------------------------------------------------------------------------------------------
const loginUser = asyncHandler(async (req,res)=>{
    // req body -> data
    // username, email
    // find user
    // password check
    // access and refresh token
    // send cookie
    const { email, username, password } = req.body
    if (!username && !email){
        throw new ApiError(400, "username or password is required!")
    }
    const user = await User.findOne({ // User is coming from mongoDB object and user is our object locally 
        $or: [{username}, {email}]
    })
    if (!user){
        throw new ApiError(404, "user does not exist");
    }
    // password check
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid){
        throw new ApiError(401, "password incorrect");
    }

    // if password correct than ....
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")


    const options = {
        // now only modified by server not by frontend
        httpOnly: true,
        secure: true
    }
    return res
    .status(200).cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
            user: loggedInUser, accessToken, refreshToken
            },
            `User logged in successfully`
        )
    )
    
})

// logout user ---------------------------------------------------------------------------------------
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate( // updating refreshToken to undefined
        req.user._id,{
            $unset: {
                refreshToken: 1 // this removes the field from database
            }
        },
        {
            new: true // return the updated one not the old one
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accessToken", options) // clear access token cookie with options
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, [], "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    // get refresh token from cookie or body based on website or app based user
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    // decode token
try {
        const decodedToken = jwt.verify(
    
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "invalid refresh token")
        }
    
        // we saved token in User in db and now we will check whatever token user has and whatever token is saved they match or not
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "access token refreshed successfully"
            )
        )
} catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token")
}

})

// change password....
const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id) // find user by id
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) // check password

    if (!isPasswordCorrect){ // if password is not correct then throw error
        throw new ApiError(401, "old password is incorrect")
    }
    user.password = newPassword // otherwise change password
    await user.save({validateBeforeSave: false})

    return res // just passing 200 status of password changed successfully
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})

// returning the user
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json( new ApiResponse(
        200, req.user, "current user"))
}
)

// update details of username and email
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname, email} = req.body
    if (!fullname && !email){
        throw new ApiError(400, "fullname or email is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {
            new: true // after updating  return updated document
        }
    ).select("-password") // do not update password

    return res.status(200).json(new ApiResponse(200, user, "user details updated successfully"))
})

// // avatar update
// const updateUserAvatar = asyncHandler(async(req,res)=>{
//     const avatarLocalPath = req.file?.path // get path of file
//     if(!avatarLocalPath){
//         throw new ApiError(400, "avatar file is required")
//     }
//     // after uploading on cloudinary we will get url
//     const avatar = await uploadOnCloudinary(avatarLocalPath) // upload on cloudinary by file path

//     if (!avatar.url){
//         throw new ApiError(400, "error while uploading on avatar")
//     }
//     // upload avatar on cloudinary and update in database
//     const user = await User.findByIdAndUpdate(
//         req.user._id,
//         {
//             $set: {
//                 avatar: avatar.url
//             }
//         },
//         {
//             new: true
//         }
//     ).select("-password") // not password
//     return res.status(200).json(new ApiResponse(200, user, "avatar updated successfully"))
// })

// // cover image update
// const updateUserCoverImage = asyncHandler(async(req,res)=>{
//     const coverImageLocalPath = req.file?.path
//     if(!coverImageLocalPath){
//         throw new ApiError(400, "cover image file is required")
//     }
//     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if (!coverImage.url){
//         throw new ApiError(400, "error while uploading on cover image")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user._id,
//         {
//             $set: {
//                 coverImage: coverImage.url
//             }
//         },
//         {
//             new: true
//         }
//     ).select("-password")

//     return res.status(200).json(new ApiResponse(200, user, "cover image updated successfully"))
// })

// Avatar update
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarFile = req.file; // Get the file from memory
    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required");
    }

    try {
        // Upload avatar to Cloudinary
        const avatar = await uploadOnCloudinary(avatarFile.buffer, avatarFile.originalname);

        if (!avatar?.url) {
            throw new ApiError(400, "Error while uploading avatar");
        }

        // Update avatar in the database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { avatar: avatar.url } },
            { new: true }
        ).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
    } catch (error) {
        console.error("Error while uploading avatar:", error);
        throw new ApiError(500, "Error occurred while updating avatar");
    }
});

// Cover image update
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageFile = req.file; // Get the file from memory
    if (!coverImageFile) {
        throw new ApiError(400, "Cover image file is required");
    }

    try {
        // Upload cover image to Cloudinary
        const coverImage = await uploadOnCloudinary(coverImageFile.buffer, coverImageFile.originalname);

        if (!coverImage?.url) {
            throw new ApiError(400, "Error while uploading cover image");
        }

        // Update cover image in the database
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { coverImage: coverImage.url } },
            { new: true }
        ).select("-password");

        return res.status(200).json(new ApiResponse(200, user, "Cover image updated successfully"));
    } catch (error) {
        console.error("Error while uploading cover image:", error);
        throw new ApiError(500, "Error occurred while updating cover image");
    }
});


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is required")
    }

    //  aggregate is used to join two collections for subscribe and subscriptions............................................
    const channel = await User.aggregate([
        {/////////////////////////
            $match:{
                username: username?.toLowerCase()
            }
        },
        {////////////
            $lookup:{
                from: "Subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }
        },
        {////////////
            $lookup:{
                from: "Subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {////////////////
            $addFields:{
                subscribersCount: { $size: "$subscribers" }, // count of subscribers
                channelsSubscribedToCount: { $size: "$subscribedTo" }, // count of subscribed to
                isSubscribed:{
                    $cond:{ // condition
                        if: { 
                            // if i am in subscriber array then true else false
                            // $in check in object and array both, here we are checking from object
                            $in: [req.user._id, "$subscribers.subscriber"] 
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel not found")
    }
    // channel[0] will return the first object of channel array $project
    return res.status(200).json(new ApiResponse(200, channel[0], "channel profile"));

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                // here we cannot use like user._id because we are using aggregate in mongoDB
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    { // normally we get array so by this we will get object so frontend will not get array and get info easily
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, "watch history fetched successfully"))
})


// export everything
export {registerUser, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentUserPassword,updateAccountDetails,  updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}