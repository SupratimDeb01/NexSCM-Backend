const User=require("../models/User");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//generating JWT token
const generateToken=(userId)=>{
    //   header        payload         signature               options
    //   Bearer
    return jwt.sign({id:userId},process.env.JWT_SECRET, {expiresIn: "7d"});
};

//registering user
//POST api to send or create data 
const registerUser=async(req,res)=>{
    try{
        const {name,email,password,role}=req.body;

        const userExists=await User.findOne({email});
        //user exists or not
        if(userExists){
            return res.status(400).json({message:"User already exists"});
        }
        //generate salt for hashing password
        const salt=await bcrypt.genSalt(10);
        //hashing
        const hashedPassword=await bcrypt.hash(password,salt);

        //creating new user in database
        const user=await User.create({
            name,
            email,
            password:hashedPassword,
            role,
        });

        ///return user data along jwt
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token:generateToken(user._id),
        })
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message})
    }
};


//logging in user
//POST api to send or verifying data 
const loginUser=async(req,res)=>{
try{
    const {email,password,role}=req.body;

        const userExists=await User.findOne({email});
        //user exists or not
        if(!userExists){
            return res.status(400).json({message:"User Not Found"});
        }
        if(userExists.role !== role){
    return res.status(403).json({message: "Invalid role"});
}
        //compare password
        const isMatch = await bcrypt.compare(password,userExists.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid Email or Password"});
        }
        //return user data along jwt
        res.json({
            _id:userExists._id,
            name:userExists.name,
            email:userExists.email,
            role:userExists.role,
            token:generateToken(userExists._id),
        });
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message})
    }
};



//fetching user data
//GET api for fetching
const getUserProfile=async(req,res)=>{
try{
        const user=await User.findOne(req.user._id).select("-password");
        //user exists or not
        if(!user){
            return res.status(400).json({message:"User Not Found"});
        }
        res.json(user);
}catch(error){
        res.status(500).json({message:"Server error",error:error.message})
    }
};


module.exports={registerUser,loginUser,getUserProfile};