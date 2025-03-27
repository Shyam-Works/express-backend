import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
// import {videoDuration} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Parse the page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the skip value for pagination
    const skip = (pageNumber - 1) * limitNumber;

    // Build the filter object based on query parameters
    const filter = {};
    if (userId) {
        filter.userId = userId;  
    }
    if (query) {
        filter.title = { $regex: query, $options: 'i' };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === 'asc' ? 1 : -1; 

    const videos = await Video.find(filter)
        .skip(skip)
        .limit(limitNumber)
        .sort(sortOptions);

    const totalVideos = await Video.countDocuments(filter);

    const totalPages = Math.ceil(totalVideos / limitNumber);

    res.status(200).json({
        data: videos,
        page: pageNumber,
        totalPages,
        totalVideos,
    });

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    console.log("Received Files:", req.files);
    console.log("Received Body:", req.body);

    if (!title || !description || !req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFile = req.files.videoFile[0]; // Get video file from memory
    const thumbnailFile = req.files.thumbnail[0]; // Get thumbnail file from memory

    // Upload video to Cloudinary
    const videoUpload = await uploadOnCloudinary(videoFile.buffer, videoFile.originalname);
    if (!videoUpload?.url) {
        throw new ApiError(400, "Failed to upload video");
    }

    // Upload thumbnail to Cloudinary
    const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.buffer, thumbnailFile.originalname);
    if (!thumbnailUpload?.url) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    const videoDuration = videoUpload.duration ? Math.round(videoUpload.duration) : 0;

    const newVideo = new Video({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoDuration,
        owner: req.user._id
    });

    await newVideo.save();

    res.status(201).json(new ApiResponse(201, "Video published successfully", newVideo));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const videos = await Video.findById(videoId)
    if(!videos) {
        throw new ApiError(404, "Video not found")
    }
    else {
        res.status(200).json(new ApiResponse(200, "Video found successfully", videos))
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Update title and description if provided
    if (title) {
        video.title = title;
    }
    if (description) {
        video.description = description;
    }

    // If a new thumbnail is uploaded, update it
    if (req.file) {
        const thumbnailFile = req.file; // Get thumbnail from memory
        const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.buffer, thumbnailFile.originalname);
        if (!thumbnailUpload?.url) {
            throw new ApiError(400, "Failed to upload thumbnail");
        }
        video.thumbnail = thumbnailUpload.url;
    }

    await video.save();

    res.status(200).json(new ApiResponse(200, "Video updated successfully", video));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findByIdAndDelete(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    res.status(200).json(new ApiResponse(200, "Video deleted successfully", video))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = false; 

    await video.save();

    res.status(200).json(new ApiResponse(200, "Video publish status updated successfully", video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}



// console.log("Received request:", req.body);
// console.log("Uploaded files:", req.files);

// if (!req.files?.videoFile || !req.files?.thumbnail) {
//     throw new ApiError(400, "Please upload both video and thumbnail");
// }

// const videoFilePath = req.files.videoFile[0]?.path;
// const thumbnailPath = req.files.thumbnail[0]?.path;
// const { title, description } = req.body;

// if (!title || !description) {
//     throw new ApiError(400, "Title and description are required");
// }

// // Upload video to Cloudinary
// const videoUpload = await uploadOnCloudinary(videoFilePath);
// if (!videoUpload || !videoUpload.url || !videoUpload.duration) {
//     throw new ApiError(400, "Failed to upload video");
// }

// const videoUrl = videoUpload.url;
// const duration = videoUpload.duration; // Ensure duration is retrieved

// // Upload thumbnail to Cloudinary
// let thumbnailUrl = "";
// if (thumbnailPath) {
//     const thumbnailUpload = await uploadOnCloudinary(thumbnailPath);
//     if (!thumbnailUpload || !thumbnailUpload.url) {
//         throw new ApiError(400, "Failed to upload thumbnail");
//     }
//     thumbnailUrl = thumbnailUpload.url;
// }

// // Create the video entry in the database
// const video = await Video.create({
//     title,
//     description,
//     videoUrl,
//     thumbnailUrl,
//     duration, // Ensure duration is saved
// });

// return res.status(201).json({
//     status: 200,
//     message: "Video published successfully",
//     data: video
// });