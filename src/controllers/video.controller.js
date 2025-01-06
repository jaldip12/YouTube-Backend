import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { [sortBy]: sortType === 'desc' ? -1 : 1 }
    }
    const filter = {}
    if (query) {
        filter.title = { $regex: query, $options: 'i' }
    }
    if (userId) {
        filter.userId = userId
    }
    const videos = await Video.paginate(filter, options)
    res.status(200).json(new ApiResponse(videos))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const { path } = req.file
    const result = await uploadOnCloudinary(path)
    const video = new Video({
        title,
        description,
        url: result.secure_url,
        userId: req.user._id
    })
    await video.save()
    res.status(201).json(new ApiResponse(video))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }
    res.status(200).json(new ApiResponse(video))
})

/**
 * Updates a video by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} req.params - The request parameters.
 * @param {string} req.params.videoId - The ID of the video to update.
 * @param {Object} req.body - The request body.
 * @param {string} [req.body.title] - The new title of the video.
 * @param {string} [req.body.description] - The new description of the video.
 * @param {string} [req.body.thumbnail] - The new thumbnail URL of the video.
 * @param {Object} res - The response object.
 * @throws {ApiError} If the video ID is invalid or the video is not found.
 * @returns {Promise<void>} A promise that resolves when the video is updated.
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }

    // Check if user is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized to update this video')
    }

    const { title, description, thumbnail } = req.body
    if (title) video.title = title
    if (description) video.description = description
    if (thumbnail) video.thumbnail = thumbnail

    const updatedVideo = await video.save()

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }

    // Check if user is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Unauthorized to delete this video')
    }

    await Video.findByIdAndDelete(videoId) // Fixed: video.remove() -> Video.findByIdAndDelete()

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID')
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, 'Video not found')
    }
    video.isPublished = !video.isPublished
    await video.save()
    res.status(200).json(new ApiResponse(video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}