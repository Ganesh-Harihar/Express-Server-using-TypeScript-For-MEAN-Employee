import mongoose from 'mongoose';

export const usersSchema = new mongoose.Schema({
    fname:{type:String,required:true},
    lname:{type:String},
    email:{type:String,required:true},
    password:{type:String,required:true}
 });
