import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const userId = req.user._id

    const existingLike = await Like.findOne({likeBy: userId, Video: videoId})
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        res.json(new ApiResponse(200, "Unliked successfully"))
    }
    else{
        const newLike = await Like.create({likeBy: userId, Video: videoId})
        res.json(new ApiResponse(200, "Liked successfully", newLike))
    }
    res.json(new ApiResponse(200, "Liked successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({likeBy: userId, Comment: commentId})
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        res.json(new ApiResponse(200, "Unliked successfully"))
    }
    else{
        const newLike = await Like.create({likeBy: userId, Comment: commentId})
        res.json(new ApiResponse(200, "Liked successfully", newLike))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const userId = req.user._id
    const existingLike = await Like.findOne({likeBy: userId, tweet: tweetId})
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        res.json(new ApiResponse(200, "Unliked successfully"))
    }
    else{
        const newLike = await Like.create({likeBy: userId, tweet: tweetId})
        res.json(new ApiResponse(200, "Liked successfully", newLike))
    }
    res.json(new ApiResponse(200, "Liked successfully"))
} 
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // by this i get what all things i liked like video, comment, and tweet
    // const userId = req.user._id
    // const likedVideo = await Like.find({likeBy: userId}).populate("Video")
    // res.json(new ApiResponse(200, "Liked videos", likedVideo))

    const userId = req.user._id
    const likedVideo = await Like.find({likeBy: userId}).populate("Video", "title description videoFile thumbnail duration views isPublished"); // Assuming contentId stores the reference to the video
    res.json(new ApiResponse(200, "Liked videos", likedVideo))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}