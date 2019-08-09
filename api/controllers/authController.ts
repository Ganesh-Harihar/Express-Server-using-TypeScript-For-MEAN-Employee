import {JsonController, Param, Body, Get, Post, Put, Delete, Req, Res, Patch} from "routing-controllers";
import mongoose from 'mongoose';
import {usersSchema} from '../models/authModel';
const User = mongoose.model('Users',usersSchema);
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Cryptr = require('cryptr');
const cryptr1 = new Cryptr('myTotalySecretKey');


@JsonController()
export class AuthController {
    key:any;
async main(mailId:String,id:String,password:String) 
{
   const cryptr = new Cryptr(password);
   this.key = password;
   console.log(this.key);
   let crptID=cryptr.encrypt(id);
 
   
   let transporter=nodemailer.createTransport({
       service:'gmail',
       auth:{
           user:'ganeshharihar1211@gmail.com',
           pass:"Romanr@14498."
       }
   });
   var mailOptions={
       from:'ganeshharihar1211@gmail.com',
       to:mailId,
       subject:'Sending mail via express',
       text:`Click below link to Reset Your password
 
       http://localhost:4200/auth/changePassword/`+crptID
   }
   transporter.sendMail(mailOptions,function(error:any,info:any){
       if(error){
           console.log(error);
       }
       else{
           console.log("Mail send "+info.response);
       }
   });
}

async userFound(email:String):Promise<boolean>
   {
      var found:any;
      await User.findOne({email:email})
      .exec()
      .then((result)=>
      {
         if(result===null)
         {
            found=false;
         }
         else
         {
            found=true;
         }
      })
      .catch((err)=>{
         console.log(err)});
         return found;
   }



    @Get("/users")
    async getAll(@Req() request: any, @Res() response: any)
    {
      try
      {
         await User.find()
         .exec()
         .then(docs=>
            {
               response.status(200).json(docs)
            })
            .catch(error=>response.status(400).json({error:error}))
      }
      catch(e)
      {
         console.log(e);
      }
    }

    @Get("/users/:email")
   async getOne(@Param("email") email: String,@Req() request: any, @Res() response: any)
    {
      await User.findOne({email:email})
      .exec()
      .then((result:any)=>
      {
         if(result===null)
         {
            response.status(401).json({message:'Record Not Found..!',error:result});
         }
         else
         {
            this.main(result.email,result._id,result.password);
            response.status(200).json({message:'email send...',Employees:result});
         }
      })
      .catch((err)=>{
         response.status(401).json({message:'Record Not Found..!',error:err})});
    }


    @Post("/users")
   async post(@Body() user: any,@Req() req: any, @Res() res: any)
   {
       var user:any;
       var found = await this.userFound(user.email);
      if(found)
      {
         res.status(401).json('already exists..!'); 
      }
      else
      {
        var password = cryptr1.encrypt(user.password);
       user = {
          _id: mongoose.Types.ObjectId(),
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          password: password
       }
      user = new User(user);
      await user.save()
       .then((result: any) => {res.status(200).json({Message: 'success user created',data: result})})
      .catch((err:any) => {res.status(404).json({error: err})})
      }
   }

    @Patch("/users/:id")
   async patch(@Param("id") id: String, @Body() user: any,@Req() req: any, @Res() res: any)
    {
       console.log('in patch');
      const cryptId=id;
      console.log(this.key);
      const cryptr = new Cryptr(this.key);
      this.key="";
      id=cryptr.decrypt(cryptId);
      let password=user.newPass;
      password=cryptr1.encrypt(password);
      console.log(id);
      await User.updateOne({ _id : id},{$set:{password:password}})
     .exec()
     .then(result=>
      {
          console.log(result);
           res.status(201).json({result});    
      })
      .catch(err=>{
          console.log(err);
          res.status(500).json({error:err});
      });
    }


    @Post("/users/:email")
   async post1(@Param("email") email: String, @Body() user: any,@Req() req: any, @Res() res: any)
    {
      await User.findOne({email:email})
      .exec()
      .then((result:any)=>
      {
        if(result===null)
        {
          res.status(401).send('Record Not Found..!');
        }
        else
        {
         var password=cryptr1.decrypt(result.password);
          if(user.password !== password)
            res.status(401).send('email or password is invalid');
          else
          {
            const token = jwt.sign(
              {
                  _id : result._id
              },process.env.JWT_KEY,{
                  expiresIn:"1h"
              })    
              res.status(200).json({message:'Auth Success',token:token});        
          } 
        }
      })
      .catch((err)=>{
        res.status(401).send('Record Not Found..!')});
    }

    @Delete("/users/:email")
    async remove(@Param("email") email: String,@Req() request: any, @Res() response: any)
     {
       await User.findOneAndDelete({email:email})
       .exec()
       .then((result)=>{ 
           response.status(200).json({message:'User Deleted..!'})})
       .catch((err)=>{
           response.status(401).json({error:err})})
     } 
}