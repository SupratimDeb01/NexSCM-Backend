const express=require("express");
const {registerUser, loginUser, getUserProfile} = require("../controllers/authController");
const {protect} = require("../middlewares/authMiddleware");
const router = express.Router();

//auth routes
router.post("/register", registerUser);              //register user
router.post("/login", loginUser);                  //login user
router.get("/profile", protect, getUserProfile);  //get user profile



module.exports = router; 