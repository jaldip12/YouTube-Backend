import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middle.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(verifyJWT,createTweet);
//router.route("/displaytweet").get(getUserTweets)
router.route("/viewtweet").get(getUserTweets);
// router.route("/view").get(verifyJWT,getUserTweets);
router.route("/delete").delete(deleteTweet);

export default router
