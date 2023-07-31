
import { Request, Response, NextFunction } from 'express';
import { v4 } from 'uuid';
import {GenerateSalt, passWordGenerator, hashPassword, GenerateSignature} from "../utils/helpers"
import { axiosVerifyVendor } from '../utils/helpers';
import { JwtPayload } from 'jsonwebtoken';
import { VendorAttributes, VendorInstance } from '../models/vendorModel'
import { emailHtml, sendmail } from '../utils/emailFunctions';
import { GMAIL_USER } from '../config';
import {zodSchema, validateFoodSchema} from '../utils/validators'
import { FoodAttributes, FoodInstance } from '../models/foodModel';




export const verifyVendor = async (req: Request, res: Response, next:NextFunction) => {
    try{
        const regNo:any = req.query.regNo;
           if(!regNo){
                return res.status(404).json({
                    message: `Registration Number is required`
                })
           }

           const validateRegNo = /^AC-\d{8}$/

           if(!validateRegNo.test(regNo)){
            return res.status(400).json({
                message: `${regNo} is not valid`
            })
           }

           const verifiedRegNo = await axiosVerifyVendor(regNo)
             if(verifiedRegNo === "not found"){
                return res.status(404).json({
                    message: `The business is not found`
                })
             }
      
          const token = await GenerateSignature({regNo:verifiedRegNo.findCompany.reg_no}) 
      
 
        res.cookie( "token", token)
        return res.status(200).json({
            message: `${verifiedRegNo.findCompany.company_name} is verified`,
            company_Name: `${verifiedRegNo.findCompany.company_name}`,
            registration_Number: `${verifiedRegNo.findCompany.reg_no}`
            
        })
            
    }catch(err:any){
        console.log(err.message)
        return res.status(500).json({
            message: `Internal server error`
        })
    }
}

export const registerVendor = async (req:JwtPayload, res: Response, next: NextFunction) => {
    try{

        let newUser = req.body;

        const error = zodSchema.safeParse(newUser);
        if (error.success === false) {
          res.status(400).send({
            error: error.error.issues[0].message
          });
          return;
        }

        const id = v4()
        const userId = req.regNo
        const registeredBusiness = await axiosVerifyVendor(userId)
       
        const {email, phone_no, name_of_owner, restaurant_name, address, cover_image} = req.body

        const verifyIfVendorExistByEmail = await VendorInstance.findOne({where:{email:email}}) as unknown as VendorAttributes
        const verifyIfVendorExistByRestaurantName = await VendorInstance.findOne({where:{restaurant_name:restaurant_name}}) as unknown as VendorAttributes

        if( verifyIfVendorExistByEmail || verifyIfVendorExistByRestaurantName ){
            return res.status(400).json({
                Message: `Profile is already in use`
            })
        }

        const salt = await GenerateSalt()
        const password = await passWordGenerator(phone_no)
        const hash = await hashPassword(password, salt)
        const html = emailHtml(email, password)

        const newVendor = await VendorInstance.create({
            id,
            email,
            restaurant_name,
            name_of_owner,
            company_name: registeredBusiness.findCompany.company_name,
            password:hash,
            address,
            phone_no,
            isAvailable:true,
            role: "vendor",
            salt,
            cover_image: req.file.path,
            rating:0,
            orders:0
       }) as unknown as VendorAttributes

         if(!newVendor){
            return res.status(400).json({
                message: `Vendor's profile couldn't be created`
            })
         }
         if(newVendor){
            const vend = await VendorInstance.findOne({where:{id:id}}) as unknown as VendorAttributes
            await sendmail(GMAIL_USER!, email, "Welcome",html )
           console.log(vend)
            const token = await GenerateSignature({email:vend.email, id:vend.id})
            res.cookie("token", token)
            return res.status(200).json({
              message: `Vendor created successfully`,
              vend,
              token
            })
         }

     }catch(err){
        console.log(err)
        return res.status(500).json({
            message: `Internal Server Error`
        })
    }
 }