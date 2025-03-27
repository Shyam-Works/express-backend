import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const comments = await Comment.find({video: videoId})
        .populate("owner")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({createdAt: -1})


    const totalComments = await Comment.countDocuments({video: videoId})
    const totalPages = Math.ceil(totalComments / parseInt(limit)) // take bigger number

    res.status(200).json(new ApiResponse(200, {
        comments,
        page: parseInt(page),
        totalPages,
        totalComments
    }))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    // Validate the videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    if(content.trim() === "") {
        throw new ApiError(400, "Comment cannot be empty");
    }

    // Create the comment
    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });
    await newComment.save();
    res.status(201).json(new ApiResponse(201, newComment));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    const comment = await Comment.findById(commentId);
    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }

    comment.content = content;
    await comment.save();

    res.status(200).json(new ApiResponse(200, "comment updated", comment));
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params;
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found");
    }

    res.status(200).json({
        message: "Comment deleted successfully",
        deletedComment,
    });
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }