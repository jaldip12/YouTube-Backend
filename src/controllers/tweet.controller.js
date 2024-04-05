import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/apiresponce.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    try {
        // Get content from request body
        const { content } = req.body;
        // console.log(req.user);

        // Check if content exists
        if (!content) {
            throw new ApiError(400, "Content missing");
        }

        // Create a new tweet
        const tweets = await Tweet.create({
            content: content,
            owner: req.user._id
        });

        // Send response
        return res.json(new ApiResponse(200, {}, "Tweeted"));
    } catch (error) {
        // Handle errors
        console.log(error);
        return res.status(error.statusCode || 500).json(new ApiResponse(error.statusCode || 500, {}, error.message || "Internal Server Error"));
    }
});

// const createTweet = asyncHandler(async (req, res) => {
//     //TODO: create tweet
//     const content=req.body
//     if(!content){
//         throw new ApiError(400,"Content missing")
//     }
//     try {
//         const tweet=await Tweet.create({
//             content:content,
//             owner: req.user._id, 
            
//         })
//     } catch (error) {
//         console.log(error);
//     }

     
//     // content.save()
//     // .then(() => console.log('String saved to MongoDB'))
//     // .catch(err => console.error(err));
//     return res
//     .json(new ApiResponse(200,{},"Tweeted"))

// })

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    console.log("hii");
   try {
     const ownerid=req.user._id;
     if(!ownerid){
         throw new ApiError(400, "Login Please");
     }
     const dtweet= await Tweet.find({owner : ownerid})
     
     if(!dtweet){
         throw new ApiError(400, "Tweets does not exist");
     }
     
     return res
     .status(200)
     .json(
         new ApiResponse(
             200,
             {
                 tweet: dtweet
             },
             "Displey successfull"
         )
     )
    
 
   } catch (error) {
    console.log(error);
   }

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    // console.log("hii");
    const own=req.user._id;
    if(!own){
        throw new ApiError(400, "Login Please");
    }
    const dtw= await Tweet.find({owner : own})
    
    if(!dtw){
        throw new ApiError(400, "Tweets does not exist");
    }
    // const co=videotube.tweets(Tweet)
   const de=await Tweet.deleteOne({content:"Hello"})
    // console.log(co);
   return res
   .status(200)
   .json(
     new ApiResponse(
         200,
         'Deleted Successfully'
     )
   );
   


})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}