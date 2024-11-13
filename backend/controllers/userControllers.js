const asyncHandler = require("express-async-handler");
const User= require("../models/userModel");
const generateToken = require("../config/generateToken");
const registerUser = asyncHandler(async (req, res) => {
    console.log('Request Body:', req.body);
    const { name, email, password, pic, githubToken } = req.body;

    if (!name || !email || !password || !githubToken) {
        console.log('Missing fields:', { name, email, password, pic, githubToken });
        res.status(400);
        throw new Error("Please enter all the fields");
    }

    console.log('Checking if user already exists...');
    const userExists = await User.findOne({ email });
    if (userExists) {
        console.log('User already exists!');
        res.status(400);
        throw new Error("User already exists!");
    }

    console.log('Creating new user...');
    const user = await User.create({
        name,
        email,
        password,
        pic,
        githubToken,
    });

    if (user) {
        console.log('User created successfully:', user);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id),
        });
    } else {
        console.log('User creation failed');
        res.status(400);
        throw new Error("Failed to create user!");
    }
});

const authUser=asyncHandler(async(req, res)=>{
    const {email, password}= req.body;
    const user= await User.findOne({email});
    if(user && (await user.matchPassword(password))){
        res.json({
            _id:user._id,
            name:user.name,
            email:user.email,
            pic:user.pic,
            token:generateToken(user._id),
        });
    }
    else{
        res.status(401);
        throw new Error("Invalid Email or password");
    }
});
//api/user?search=sravya
const allUsers=asyncHandler(async(req, res)=>{
    const keyword= req.query.search?{
        $or:[
            {name:{$regex: req.query.search, $options:"i"}},
            {email:{$regex: req.query.search, $options:"i"}},
        ]
    }:{};
    const users= await User.find(keyword).find({_id:{$ne:req.user._id}});
    res.send(users);
    // console.log(keyword);  
});
module.exports={registerUser, authUser, allUsers};