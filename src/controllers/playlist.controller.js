import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(400, "all fields are required")
    }
    
    const playlist = await Playlist.create(
        {
        name,
        description,
        owner: req.user._id 
        })

    res.status(201).json(new ApiResponse(201, "Playlist created successfully", playlist))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id")
    }
    else {
        const playlists = await Playlist.find({owner: userId})
        res.status(200).json(new ApiResponse(200, "User playlists found successfully", playlists))
    }
    
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    else {
        const playlist = await Playlist.findById(playlistId)
        if(!playlist) {
            throw new ApiError(404, "Playlist not found")
        }
        else {
            res.status(200).json(new ApiResponse(200, "Playlist found successfully", playlist))
        }
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist");
    }

    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }

    playlist.videos.push(videoId);
    await playlist.save();
    res.status(200).json(new ApiResponse(200, "Video added to playlist successfully", playlist));

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist id or video id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video not found in the playlist");
    }

    playlist.videos.pull(videoId); // This removes the video from the array
    await playlist.save();

    res.status(200).json(new ApiResponse(200, "Video removed from playlist successfully", playlist));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if(!deletedPlaylist) {
        throw new ApiError(500, "An error occurred while deleting the playlist")
    }
    res.status(200).json(new ApiResponse(200, "Playlist deleted successfully", deletedPlaylist));


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist) {
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to perform this action")
    }
    if(name) {
        playlist.name = name
    }
    if(description) {
        playlist.description = description
    }
    await playlist.save()
    res.status(200).json(new ApiResponse(200, "Playlist updated successfully", playlist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}