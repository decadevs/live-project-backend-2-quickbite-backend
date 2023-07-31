import express, {Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import {v4} from 'uuid';
import jwt, { JwtPayload } from "jsonwebtoken"
import { APP_SECRET } from '../config';


import {UserInstance} from '../models/userModel'
import { UserAttributes } from '../models/userModel'; 
import { validateUserSchema } from '../utils/validators';
import { hashPassword, GenerateOTP, GenerateSignature, GenerateSalt } from '../utils/helpers';
import { mailUserOtp } from '../utils/emailFunctions';



export const registerUser = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {email,
            firstname,
            lastname,
            password,
            confirm_password,
            address,
            phone_no} = req.body
        const userId = v4()

        //validate input
        if(password !== confirm_password) return res.status(400).json({msg: `Password Mismatch`})

        const error = validateUserSchema.safeParse(req.body);
        if(error.success === false){
            return   res.status(400).send({
                status: "error",
                method: req.method,
                ERROR: error.error.issues.map((a:any)=> a.message)
            })
        }

        //chech if user exist
        const userExist = await UserInstance.findOne({where:{email:email}})
        const phoneExist = await UserInstance.findOne({where:{phone_no:phone_no}})
        if(userExist){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "user already exists"
            }) 
        }

        if(phoneExist){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "phone number exists"
            }) 
        }

        //encrypt password
        const userSalt = await GenerateSalt()
        const hashedPassword = await hashPassword(password, userSalt)

        //generate OTP
        const {otp, expiry} = GenerateOTP()
        //create user
        const user = await  UserInstance.create({
            email,
            firstname,
            lastname,
            address,
            phone_no,
            password: hashedPassword,
            salt: userSalt,
            id: userId,
            role:'user',
            otp: otp,
            otp_expiry: expiry,
            verified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }) as unknown as UserAttributes

         //mail otp to user
         mailUserOtp({
            to: email,
            OTP:otp
         })

        //generate token
        // const token = jwt.sign({id:user.id, email:user.email},`quickbite` ) 
        const token = await GenerateSignature({email:email, id:userId})
        res.cookie("token", token)
        return res.status(200).json({
            status: "success",
            method: req.method,
            message: "user created successfuly",
            token,
            user
            
        })
    } catch (error:any) {
        console.log(error.message)
        return res.status(400).json({
            status: "error",
            method: req.method,
            message: error.message,
        
        })  
        
    }

}

export const verifyOtp = async(req:JwtPayload, res:Response, next:NextFunction)=>{
    try {
        const otp = req.query.otp
        const userId = req.user.id
        console.log(req.user)

        const user:JwtPayload = await UserInstance.findOne({where:{id:userId}}) as unknown as UserAttributes
    
        if(user && user.otp === Number(otp) && user.otp_expiry > new Date()){
            const newOtp = 108
            await UserInstance.update({
                verified:true,
                otp:newOtp
            }, {where: {id:userId}})
            return res.status(200).json({
                msg: `Email verified, proceed to login`
            })
        }
        if(user.otp !== Number(otp)){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "Invalid OTP",
            })    
        }
        if(user.otp_expiry < new Date()){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "OTP expired",
            })  
        }
    } catch (error) {
        console.log(error)    
    }
}

export const reSendOtp = async(req:JwtPayload, res:Response, next:NextFunction)=>{
   try {
    const userId = req.user.id
    const user:JwtPayload = await UserInstance.findOne({where:{id:userId}}) as unknown as UserAttributes

    //generate OTP
    const {otp, expiry} = GenerateOTP()

    const updatedUser = await UserInstance.update({
        otp,
        otp_expiry: expiry
    }, {where:{id: user.id}})as unknown as UserAttributes

    if(updatedUser){
        mailUserOtp({
            to: user.email,
            OTP:otp
         })
        return res.status(200).json({ status:"success", msg: `OTP regenerated`})
    }
    return res.status(400).json({msg: `Otp generation unsuccesful`})
   } catch (error:any) {
    return res.status(400).json({
        status: "error",
        method: req.method,
        message: error.message,
    })  
   }
}


export const LogIn = async (req:Request, res:Response, next:NextFunction) => {
    try {
  
        //catch frontend data
        const {email, password} = req.body;

        //fetch user
        const user = await UserInstance.findOne({where: {email: email}})as unknown as UserAttributes 

        if(!user){
            return  res.status(404).json({
                status: "error",
                method: req.method,
                message: "user not found"
            })
        }
    
        //validate user password
        if(user){
            const validated =  await bcrypt.compare(password, user.password)
           if(!validated){
               return res.status(401).send({
                   status: "error",
                   method: req.method,
                   message:"email or password is incorect"
               })    
           }
           //check verified
           
           //generate token
           const token = jwt.sign({id:user.id, email:user.email},`${APP_SECRET}` )  
             res.cookie('token', token)
            return res.status(200).json({
                status: "success",
                method: req.method,
                message: "Login Successful",
                email: user.email,
                token
            }) 

        }
        
    } catch (error) {
        return res.status(400).json({
            status: "error",
            method: req.method,
            message: error,
        })   
    }
}



