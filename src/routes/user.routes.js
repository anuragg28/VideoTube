import { Router } from "express";
import { loginUser,registerUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,userUpdateAvatar,userUpdateCoverImage,getUserChannelProfile,getWatchHistory} from "../controllers/users.controllers.js";
import {upload} from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
         name: "avatar",
         maxCount:1
        },
        {
            name: "coverimage",
            maxCount:1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-details").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),userUpdateAvatar)

router.route("/Cover-Image").patch(verifyJWT,upload.single("coverimage"),userUpdateCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(getWatchHistory)

export default router