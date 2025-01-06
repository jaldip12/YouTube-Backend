import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User}  from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/apiresponce.js';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';

const generateAccessAndRefereshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    
    // res.status(500).json({
    //     message:"jaldip"
    // })

    const {fullName,email,username,password}= req.body
    //console.log(email);

    // if(fullName===""){
    //     throw new ApiError(400,"Full Name is required")
    // }
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
   
    if(existedUser){
        throw new ApiError(409,"user is exist");
    }
    //console.log(req.files);
    const avatarlocal= req.files?.avatar[0]?.path;
   // const coverImagelocal= req.files?.coverImage[0]?.path;

     let coverImagelocal;
     if(req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
        coverImagelocal=req.files.coverImage[0].path
     }

    if(!avatarlocal){
        throw new  ApiError(400,"Avatar filed is require");
    }
    
   const avatar= await uploadOnCloudinary(avatarlocal)
   const coverImage= await uploadOnCloudinary(coverImagelocal)

   if(!avatar){
    throw new  ApiError(400,"Avatar filed is require");
   }
const user =await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
   })
   
   const createduser= await User.findById(user._id).select("-passworld -refreshToken");
   if(!createduser){
    throw new  ApiError(500,"Server Error");
   }

   return res.status(201).json(
    new ApiResponse(200,createduser,"user is Registered")
   )   
})   

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
 //  console.log(user);
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser=asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
        req.user._id,{
            $unset:{refreshToken:1}
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})


const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
 if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }
   try {
    const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user=await User.findById(decodedToken?._id)
   if(!user){
     throw new ApiError(401,"invalid refresh token")
   } 
  
   if(incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired")
   } 
   const options={
     httpOnly:true,
     secure:true
   }
  const {accessToken,newrefreshToken}=  await generateAccessAndRefereshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(new ApiResponse(200,{
     accessToken,refreshToken:newrefreshToken},
     "Access token refreshed"
     ))
   } catch (error) {
       throw new ApiError(401,error?.message || "invalid refresh token")
   }
})


const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const{oldPassword, newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswoedCorrect=await user.isPasswordCorrect(oldPassword)
    if(!isPasswoedCorrect){
        throw new ApiError(400,"Invalid password")
    }  
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed"))
})


const getCurrentUser=asyncHandler(async(req,res)=>{
   // console.log(req.user);
    return res
    .status(200)  
    .json(200,req.user,"Current user fatched successfully")
})


const updateAccountDetails=asyncHandler(async(req,res)=>{
    const{fullName,email}=req.body
    
    if(!fullName && !email ) {
        throw new ApiError(400,"All feilds are required")
    }
    const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details updated"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
      const avataLocalPath= req.file?.path
      if(!avataLocalPath){
        throw new ApiError(400,"Avatar file is missing")
      }
      const avatar=await uploadOnCloudinary(avataLocalPath)
      if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
      }
      const user= await User.findByIdAndUpdate(
        req.user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}
      ).select("-password")
      return res 
      .status(200)
      .json(
          new ApiResponse(200,user,"Avatar Img updated successfully")
      )
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath){
      throw new ApiError(400,"CoverImg file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
      throw new ApiError(400,"Error while uploading Img")
    }
    const user= await User.findByIdAndUpdate(
      req.user?._id,
      {$set:{
        coverImage:coverImage.url
      }},
      {new:true}
    ).select("-password")
    return res 
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Img updated successfully")
    )
})
    
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}= req.params
   if(!username?.trim()){
    throw new ApiError(400,"Username is missing")
   }
   
   const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then: true,
                    else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscriberCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1

            }
        }
        
   ])

   if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
   )
})
  

const getWatchHistroy=asyncHandler(async(req,res)=>{
  
      const user=await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "video",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistroy",
                pipeline:[
                    {
                        $lookup:{
                            from: "user",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                         fullName:1,
                                         username:1,
                                         avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }

        }
      ])
      return res
      .status(200)
      .json(
        new ApiResponse(200,user[0].getWatchHistroy,"watch histroy fetched successfully")
      )
})





export {registerUser,loginUser,logoutUser,
    refreshAccessToken,updateAccountDetails,
    getCurrentUser,changeCurrentPassword,updateUserAvatar,
updateUserCoverImage,getUserChannelProfile,getWatchHistroy}