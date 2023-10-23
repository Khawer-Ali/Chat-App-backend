const express = require('express');
const UserModel = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const MessageModel = require('../models/Messages');
const router = express.Router();
const JWT_Sercret = 'f,msgnan';

// Register 
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    const createdUser = await UserModel.create({ username, password: hash })

    jwt.sign({ userId: createdUser._id, username }, JWT_Sercret, {}, (err, token) => {
        if (err) throw err
        res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
            id: createdUser._id
        })
    })

})

// Login
router.post('/login',async (req, res) => {
    const { username,password } = req.body;
    const foundUser = await UserModel.findOne({ username });

    if (!foundUser) {
        return res.status(400).json("wrong credentials")
    }

    const passOk = bcrypt.compareSync(password, foundUser.password);;

    if (!passOk) {
        return res.status(400).json("wrong credentials")
    }

    jwt.sign({ userId: foundUser._id, username }, JWT_Sercret, {}, (err, token) => {
        if (err) throw err
        res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
            id: foundUser._id
        })
    })

})


// Profile
router.get('/profile', (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        jwt.verify(token, JWT_Sercret, {}, (err, userData) => {
            if (err) throw err
            res.json(userData);
        })
    } else {
        res.status(401).json('no token')
    }
})

// Fetch Messeges from db
router.get('/messages/:userId',async (req, res) => {
    const token = req.cookies?.token;
    let ourUserId;

    if (token) {
        jwt.verify(token, JWT_Sercret, {}, (err, userData) => {
            if (err) throw err
            ourUserId =  userData.userId ;
        })
    } else {
        res.status(401).json('no token')
    }

     const {userId} = req.params;

     const message = await MessageModel.find({
        sender: {$in:[userId,ourUserId]},
        recipient: {$in:[userId,ourUserId]},
     }).sort({createdUser : 1});

     res.json(message);
})

// Fetch peoples
router.get('/people',async (req,res) => {
  const users = await UserModel.find({},{_id:1,username:1})
  res.json(users)
})

// Logout
router.post('/logout',(req,res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).status(201).json('ok')
})

module.exports = router;