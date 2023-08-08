import { FoodAttributes, FoodInstance } from "../models/foodModel";
import { VendorAttributes, VendorInstance } from "../models/vendorModel";
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
import { OrderAttributes, OrderInstance } from "../models/orderModel";



export const userGetsAllFoods=async(req:JwtPayload,res:Response)=>{
    try{
    const allFood = await FoodInstance.findAll({});
    if(!allFood) return res.status(404).json({msg: `Foods not found`})
    return res.status(200).json({
      msg: `All foods fetched`,
      allFood
    })
    }catch(error:any){
        console.log(error.message);
        return res.status(500).json({msg: `Internal server error`})
    }
}


export const userGetsAllFoodByAVendor = async (req: JwtPayload, res: Response) => {
    try {
        const vendorId = req.query.vendorId;

        if (!vendorId) {
            return res.status(400).json({ msg: "vendorId is required in query parameters" });
        }

        const allFood = await FoodInstance.findAll({ where: { vendorId } });

        if (allFood.length === 0) {
            return res.status(404).json({ msg: `Foods not found for the given vendorId` });
        }
        if(allFood){
            return res.status(200).json({
                msg: `All foods fetched for this vendor`,
                allFood
            });
        }
        
    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ msg: `Internal server error` });
    }
};

export const userGetPopularFoods = async (req: Request, res: Response) => {
    try {
        const top10Foods = await FoodInstance.findAll({
            order: [['order_count', 'DESC']], 
            limit: 10, 
        });

        // if (!top10Foods || top10Foods.length === 0) {
        //     return res.status(404).json({ msg: `Top 10 foods not found` });
        // }

        return res.status(200).json({
            msg: `Top 10 foods fetched`,
            top10Foods,
        });
    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ msg: `Internal server error` });
    }
};

export const userGetPopularVendors = async (req: JwtPayload, res: Response) => {
    try {
        let totalVendors = []
        const vendors:any = await VendorInstance.findAll({})
        if(vendors.length===0) return res.status(400).json({msg: `No vendors found`})
    for (let key of vendors) {
      if (key.orders >= 10) {
        totalVendors.push(key);
      }
    }
    if(totalVendors.length === 0) return res.status(400).json({msg: `No popular vendors found`})
    return res.status(200).json({
        msg: `Popular Vendors fetched`,
        totalVendors
    })
    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ msg: `Internal server error` });
    }

}

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


export const userLogIn = async (req:Request, res:Response, next:NextFunction) => {
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

export const getAllVendors = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let page = 1;
      if (req.query.page) {
        page = parseInt(req.query.page as string);
        if (Number.isNaN(page)) {
          return res.status(400).json({
            message: "Invalid page number",
          });
        }
      }  
  
      const pageSize = 10;
      const offset = (page - 1) * pageSize;
  
      const vendors = await VendorInstance.findAll();
      const totalPages = Math.ceil(vendors.length / pageSize);
  
      if (page > totalPages) {
        page = totalPages;
      }
      const allVendors = vendors.slice(offset, page * pageSize);
  
      return res.status(200).json({
        allVendors,
        currentPage: page,
        totalPages,
      });
    } catch (err) {
      console.error("Error executing getUsers:", err);
      return res.status(500).json({
        Error: "Internal Server Error",
      });
    }
  };

export const userMakeOrder = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {vendorId, foodId, quantity} = req.body

        // const user = await UserInstance.findOne({where: {id: userId}}) as unknown as UserAttributes

        const vendor = await VendorInstance.findOne({where: {id: vendorId}}) as unknown as VendorAttributes

        const food = await FoodInstance.findOne({where: {id: foodId}}) as unknown as FoodAttributes

        // if(!user){
        //     return res.status(400).json({
        //         status: "error",
        //         method: req.method,
        //         message: "user not found"
        //     })
        // }
        if(!vendor){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "vendor not found"
            })
        }
        if(!food){
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "food not found"
            })
        }

        const amount = food.price * quantity
        const orderId = v4()
       
            const order = await OrderInstance.create({
                id: orderId,
                foodid: food.id,
                food_name: food.name,
                quantity: quantity,
                amount: amount,
                status: "pending",
                userId: "",
                vendorId: vendor.id,
                isPaid: false,
            }) as unknown as OrderAttributes

        return res.status(200).json({
            status: "success",
            method: req.method,
            message: "order created successfuly",
            order
        })

        
        

    }catch(err) {
        console.error("Error making order:", err);
        return res.status(500).json({
            Error: "Internal Server Error",
        });
    }
}

export const userChangeOrderStatus = async (req: JwtPayload, res: Response) => {
    try {
        const { orderId, status } = req.body;

        const order = await OrderInstance.findOne({ where: { id: orderId } }) as unknown as OrderAttributes;

        if (!order) {
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "order not found"
            });
        }

        if (order.status === "Ready") {
            const updatedOrder = await OrderInstance.update(
                { status: "Fulfilled" },
                { where: { id: orderId } }
            ) as unknown as OrderAttributes;

            return res.status(200).json({
                status: "success",
                method: req.method,
                message: "order status updated successfully",
                updatedOrder
            });
        } else {
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "order status cannot be changed to Fulfilled",
            });
        }

    } catch (err) {
        console.error("Error updating order:", err);
        return res.status(500).json({
            Error: "Internal Server Error",
        });
    }
}

export const userEditProfile = async (req: JwtPayload, res: Response) => {
    try {
        const userId = req.user.id;
        const { email, firstname, lastname, address, phone_no } = req.body;

        const user = await UserInstance.findOne({ where: { id: userId } }) as unknown as UserAttributes;

        if (!user) {
            return res.status(400).json({
                status: "error",
                method: req.method,
                message: "user not found"
            });
        }

        // Create an Object to store the fields that need to be updated
        const updatedUserFields: Partial<UserAttributes> = {};

        // Check if the fields are empty and add them to the object
        if (email !== '') {
            updatedUserFields.email = email;
        }

        if (firstname !== '') {
            updatedUserFields.firstname = firstname;
        }

        if (lastname !== '') {
            updatedUserFields.lastname = lastname;
        }

        if (address !== '') {
            updatedUserFields.address = address;
        }

        if (phone_no !== '') {
            updatedUserFields.phone_no = phone_no;
        }

        // Update the User

        const updatedUser:any = await UserInstance.update(updatedUserFields, {
            where: { id: userId },
        }) as unknown as UserAttributes;
        

        // const updatedUser = await UserInstance.update({
        //     email: email,
        //     firstname: firstname,
        //     lastname: lastname,
        //     address: address,
        //     phone_no: phone_no
        // }, { where: { id: userId } }) as unknown as UserAttributes;

        return res.status(200).json({
            status: "success",
            method: req.method,
            message: "user updated successfully",
            updatedUser
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            Error: "Internal Server Error",
        });
    }
}