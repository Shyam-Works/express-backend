import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }
    if(userId === channelId){
        throw new ApiError(400, "User cannot subscribe to own channel")
    }

    const existingSubscription = await Subscription.findOne({subscriber: userId, channel: channelId})
    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        res.json(new ApiResponse(200, "Unsubscribed successfully"))
    }
    else{
        const newSubscription =  await Subscription.create({subscriber: userId, channel: channelId})
        // await newSubscription.save()
        res.json(new ApiResponse(200, "Subscribed successfully", newSubscription))
    }
    // TODO: toggle subscription
     
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    console.log("Received channelId:", channelId);

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }
    const subscribers = await Subscription.find({channel: channelId}).populate("subscriber", "username email profilePicture")
    res.json(new ApiResponse(200, "Subscriber list", subscribers))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscribeId } = req.params
    console.log("Received subscribeId:", subscribeId);

    if(!isValidObjectId(subscribeId)){
        throw new ApiError(400, "Invalid user id")
    }
    const subscriptions = await Subscription.find({subscriber: subscribeId}).populate("channel", "username email profilePicture")

    if(subscriptions.length === 0){
        res.json(new ApiResponse(200, "No subscriptions found"))
    }
    res.json(new ApiResponse(200, "Subscribed channels", subscriptions))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}