import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middle.js"

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Toggle subscription status for a channel
router.route("/c/:channelId").post(toggleSubscription);

// Get list of subscribers for a channel 
router.route("/subscribers/:channelId").get(getUserChannelSubscribers);

// Get list of channels subscribed to by a user
router.route("/channels/:subscriberId").get(getSubscribedChannels);

export default router;