import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const userId = req.user._id;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    const tweet = Tweet.create({content, owner: userId});

    // const savedTweet = await tweet.save();

    return res.status(201).json(
        new ApiResponse(200, tweet, "tweet created successfully")
    )
    

})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params.userId;  // Get the userId from the URL parameter
    console.log("User ID from URL:", userId);  // Debugging step

    const tweets = await Tweet.find({ owner: userId });
    console.log("Tweets fetched:", tweets);  // Debugging step

    if (tweets.length > 0) {
        res.status(200).json({
            success: true,
            message: "User tweets fetched successfully",
            data: tweets,
        });
    } else {
        res.status(404).json({
            success: false,
            message: "No tweets found for this user",
        });
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    tweet.content = content; // update the content
    await tweet.save(); // save the updated tweet
    
    return res.status(200).json(
        new ApiResponse(200, tweet, "tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    
    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}