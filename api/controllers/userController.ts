import {JsonController, Param, Body, Get, Post, Put, Delete, Req, Res, UploadedFile, Patch, UseBefore} from "routing-controllers";
import mongoose from 'mongoose';
import {employeeSchema} from '../models/userModel';
import multer from 'multer';
import * as fs from 'fs';
const jwt = require('jsonwebtoken');

const storage = multer.diskStorage({
   destination: function(req,file,cb){
      cb(null,'./uploads/');

   },
   filename:function(req,file,cb){
       var extension = file.mimetype;
   extension = extension.substring(extension.indexOf("/")+1, extension.length);
   var filename = file.originalname + '-' + Date.now() + "." + extension;
   cb(null, filename);
   }   
});

const upload = multer({storage:storage});

const Employee = mongoose.model('employees',employeeSchema);

function verifyToken(req:any,res:any,next:any)
{
   console.log('in verfify token');
   if(!req.headers.authorization)
   {
      return res.status(401).send('Unauthorized request');
   }
   let token = req.headers.authorization.split(' ')[1];
   console.log(token);
   if(token === 'null')
   {
      return res.status(401).send('Unauthorized reqeuest');
   }
   let payload = jwt.verify(token,process.env.JWT_KEY);
   if(!payload)
   {
      console.log("Payload is not found");
      return res.status(401).send('Unauthorized request');
   }
   console.log("payload is ",payload);
   req.userId=payload.subject;
   next();
}



@JsonController()
export class UserController {

 async userFound(email:String):Promise<boolean>
   {
      var found:any;
      await Employee.findOne({email:email})
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

   @UseBefore(verifyToken)
   @Get("/employee")
    async getAll(@Req() request: any, @Res() response: any) {
      try
      {
         await Employee.find()
         .exec()
         .then(docs=>
         {
            response.status(200).json(docs)
         })
         .catch(error=>response.status(400).json({error:error})) 
      }
      catch(error)
      {
         console.log(error);
      }
    }

   @UseBefore(verifyToken)
   @Get("/employee/:id")
   async getOne(@Param("id") id: String,@Req() request: any, @Res() response: any)
   {
      console.log('getone');
      await Employee.findOne({_id:id})
      .exec()
      .then((result)=>
      {
         if(result===null) 
         {
            response.status(401).json({message:'Record Not Found..!',error:result});
         }
         else
         {
            response.status(200).json({Employees:result});
         }
      })
      .catch((err)=>{
         response.status(401).json({message:'Record Not Found..!',error:err})});
   }

   @UseBefore(verifyToken)
   @Post("/employee")
   async post(@Body() user: any,@Req() req: any, @Res() res: any,@UploadedFile("profiePic",{options: upload}) file: any) 
   {
      var employee:any;
      if(req.file)
      {
         employee = {
            _id: new mongoose.Types.ObjectId(),
            fname: user.fname ? user.fname: '',
            lname: user.lname ? user.lname: '',
            email: user.email ? user.email:'',
            phone: user.phone ? user.phone:'',
            gender:user.gender ? user.gender:'',
            birthdate:user.birthdate,
            qualification:user.qualification ? user.qualification:'',
            state:user.state ? user.state:'',
            city:user.city ? user.city:'',
            hobbies:user.hobbies, 
            profiePic:req.file.path,
            zipCode:user.zipCode ? user.zipCode:'',
            address:user.address ? user.address:'',
            skills:user.skills,
            salary:user.salary,
         }
         employee = new Employee(employee);
        
      }
      else
      {
         employee = {
         _id: new mongoose.Types.ObjectId(),
         fname: user.fname? user.fname: '',
         lname: user.lname ? user.lname: '',
         email: user.email ? user.email:'',
         phone: user.phone ? user.phone:'',
         gender:user.gender ? user.gender:'',
         birthdate:user.birthdate,
         qualification:user.qualification ? user.qualification:'',
         state:user.state ? user.state:'',
         city:user.city ? user.city:'',
         hobbies:user.hobbies, 
         zipCode:user.zipCode ? user.zipCode:'',
         address:user.address ? user.address:'',
         skills:user.skills,
         salary:user.salary
         }
         employee = new Employee(employee);
      }

      var found = await this.userFound(user.email);
      if(found)
      {
         res.status(401).json('already exists..!');          
      }
      else
      {
         await employee.save()
         .then((result: any) => {res.status(200).json({Message: 'success employee created',data: result})})
         .catch((err:any) => {res.status(404).json({error: err})})
      }
   }

   @UseBefore(verifyToken)
    @Patch("/employee/:id")  
   async patch(@Param("id") id: String, @Body() user: any,@Req() req: any, @Res() res: any,@UploadedFile("profiePic",{options: upload}) file: any) 
   {
      
      var updateOps={};
      
      if(req.file)
      {
            updateOps={
            fname:user.fname,
            lname:user.lname,
            email:user.email,
            phone:user.phone,
            gender:user.gender,
            birthdate:user.birthdate,
            qualification:user.qualification,
            state:user.state,
            city:user.city,
            hobbies:user.hobbies,
            zipCode:user.zipCode,
            address:user.address,
            profiePic:req.file.path,
            skills:JSON.parse(user.skills),
            salary:user.salary
          };
          if(user.oldImgPath !== 'undefined')
          {
              console.log('in unlink');
              fs.unlink(user.oldImgPath, (err:any) => {
                  if (err) throw err;
                  console.log(user.oldImgPath+'was deleted');
                 });
          }
      }
      else
      {
         updateOps={
            fname:user.fname,
            lname:user.lname,
            email:user.email,
            phone:user.phone,
            gender:user.gender,
            birthdate:user.birthdate,
            qualification:user.qualification,
            state:user.state,
            city:user.city,
            hobbies:user.hobbies,
            zipCode:user.zipCode,
            address:user.address,
            skills:JSON.parse(user.skills),
            salary:user.salary
          };
      }
      
   try
   {
      await Employee.findOneAndUpdate({ _id : id},{$set:updateOps})
   .exec()
   .then(result=>
    {
        console.log(result);
        if(result)
        {
            res.status(200).json({
            Message:'Employee is updated Successfully',
            request:'GET', 
            url:'http://localhost:3000/employee/'+result._id,
            });
        }
        else{res.status(500).json({error:result});}
    })
    .catch(err=>{
        console.log(err);
        res.status(200).json({error:err});
    });
   }
   catch(e)
   {
      console.log(e);
   }


   }

   @UseBefore(verifyToken)
    @Delete("/employee/:id")
   async remove(@Param("id") id: String,@Req() request: any, @Res() response: any)
    {
      await Employee.findOneAndDelete({_id:id})
      .exec()
      .then((result)=>{ 
          response.status(200).json({message:'User Deleted..!'})})
      .catch((err)=>{
          response.status(401).json({error:err})})
    }

}