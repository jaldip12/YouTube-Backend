import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiresponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  const totalVideos = await Video.countDocuments({
    owner: userId,
  });

  const channelVideos = await Video.find({ owner: userId });

  const totalViews = channelVideos.reduce(
    (acc, video) => acc + (video.views || 0),
    0
  );

  const totalLikes = await Like.countDocuments({
    video: { $in: channelVideos.map((video) => video._id) },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(400, "Unauthorized request");
  }

  const videos = await Video.find({
    owner: userId,
  }).sort({ createdAt: -1 }); // Sort by newest first

  if (!videos?.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No videos found for this channel"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
