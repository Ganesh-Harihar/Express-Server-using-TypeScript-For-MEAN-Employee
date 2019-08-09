import "reflect-metadata"; // this shim is required
import {createExpressServer} from "routing-controllers";
import {UserController} from "./api/controllers/userController";
import {AuthController} from "./api/controllers/authController"
import mongoose from 'mongoose';
import express = require("express");

//Mongo connection
mongoose.connect('mongodb+srv://test:' + process.env.MONGO_ATLAS_PW + '@cluster0-zxgny.mongodb.net/test?retryWrites=true&w=majority',{
    useNewUrlParser: true });


// creates express app, registers all controller routes and returns you express app instance
const app = createExpressServer({
   cors:true,
   controllers: [UserController,AuthController] // we specify controllers we want to use
});

//declaring uploades
app.use('/uploads',express.static('uploads'));

// run express application on port 3000
app.listen(3000);
