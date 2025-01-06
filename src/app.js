import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import router from './routes/user.routes.js';
import videoRouter from "./routes/video.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
//import route from "./routes/healthcheck.routes.js";
const app = express()
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from  "./routes/tweet.routes.js"
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
app.get("/api/v1", (req, res) => {
    res.send("Hello");
 });


//routes declaration
app.use("/api/v1/users",router) ;
//app.use("/",route);  //for health check purpose
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
export {app}