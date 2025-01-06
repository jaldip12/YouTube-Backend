import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist
} from "../controllers/playlist.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

// Apply auth middleware to all routes
router.use(verifyJWT);

// Routes
router.route("/").post(createPlaylist);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById).delete(deletePlaylist);
router.route("/:playlistId/videos/:videoId")
    .post(addVideoToPlaylist)
    .delete(removeVideoFromPlaylist);

export default router;