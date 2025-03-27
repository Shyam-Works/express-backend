import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id;

    // Ensure that userId is a valid ObjectId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    // Convert userId to an ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Total Videos
    const totalVideos = await Video.countDocuments({ owner: userObjectId });

    // Total Views
    const totalViews = await Video.aggregate([
        {
            $match: { owner: userObjectId }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    // Total Subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userObjectId });

    // just video likes
    const totalLikes = await Like.countDocuments({ Video: { $exists: true } });
    

    // console.log("Total Likes on the user's videos:", totalLikes); // Debugging log for likes

    // console.log("Liked Videos:", totalLikes); // Log the liked videos

    // Respond with the stats
    res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews: totalViews[0]?.totalViews || 0, // If no views, default to 0
            totalSubscribers,
            totalLikes
        })
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const videos = await Video.find({ owner: userObjectId });
    res.status(200).json(
        new ApiResponse(200, videos)
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }