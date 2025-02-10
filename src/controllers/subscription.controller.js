import mongoose, {isValidObjectId} from "mongoose"
import {Subscription} from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/apiresponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(
            new ApiResponse(200, {}, "Unsubscribed successfully")
        )
    }

    // Subscribe
    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Subscribed successfully")
    )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.find(
        { channel: channelId }
    ).populate("subscriber", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(
            200, 
            { subscribers }, 
            "Channel subscribers fetched successfully"
        )
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    const subscriptions = await Subscription.find(
        { subscriber: subscriberId }
    ).populate("channel", "username fullName avatar")

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscriptions },
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}