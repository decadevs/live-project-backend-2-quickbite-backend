import { Request, Response, NextFunction } from "express";
import { v4 } from "uuid";
import { GenerateSalt, passWordGenerator, hashPassword, GenerateSignature, calRevenue } from "../utils/helpers";
import { axiosVerifyVendor } from "../utils/helpers";
import { JwtPayload } from "jsonwebtoken";
import { VendorAttributes, VendorInstance } from "../models/vendorModel";
import { emailHtml, sendmail } from "../utils/emailFunctions";
import { GMAIL_USER } from "../config";
import { zodSchema, validateFoodSchema } from "../utils/validators";
import { FoodAttributes, FoodInstance } from "../models/foodModel";
import { vendorLoginSchema } from '../utils/validators';
import bcrypt from 'bcrypt';

export const verifyVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const regNo: any = req.query.regNo;

    console.log(regNo, 'exist  ')

    if (!regNo) {
      return res.status(404).json({
        message: `Registration Number is required`,
      });
    }

    const validateRegNo = /^AC-\d{8}$/;

    if (!validateRegNo.test(regNo)) {
      return res.status(400).json({
        message: `${regNo} is not valid`,
      });
    }

    const verifiedRegNo = await axiosVerifyVendor(regNo);
    if (verifiedRegNo === "not found") {
      return res.status(404).json({
        message: `The business is not found`,
      });
    }

    const token = await GenerateSignature({
      regNo: verifiedRegNo.findCompany.reg_no,
    });

    res.cookie("token", token);
    return res.status(200).json({
      message: `${verifiedRegNo.findCompany.company_name} is verified`,
      company_Name: `${verifiedRegNo.findCompany.company_name}`,
      registration_Number: `${verifiedRegNo.findCompany.reg_no}`,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal server error`,
    });
  }
};

export const registerVendor = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    let newUser = req.body;

    const error = zodSchema.safeParse(newUser);
    if (error.success === false) {
      res.status(400).send({
        error: error.error.issues[0].message,
      });
      return;
    }

    const id = v4();
    const userId = req.regNo;
    const registeredBusiness = await axiosVerifyVendor(userId);

    const {
      email,
      phone_no,
      name_of_owner,
      restaurant_name,
      address,
      cover_image
    } = req.body;

    const verifyIfVendorExistByEmail = (await VendorInstance.findOne({
      where: { email: email },
    })) as unknown as VendorAttributes;
    const verifyIfVendorExistByRestaurantName = (await VendorInstance.findOne({
      where: { restaurant_name: restaurant_name },
    })) as unknown as VendorAttributes;

    if (verifyIfVendorExistByEmail || verifyIfVendorExistByRestaurantName) {
      return res.status(400).json({
        Message: `Profile is already in use`,
      });
    }

    const salt = await GenerateSalt();
    const password = await passWordGenerator(phone_no);
    const hash = await hashPassword(password, salt);
    const html = emailHtml(email, password);

    const newVendor = (await VendorInstance.create({
      id,
      email,
      restaurant_name,
      name_of_owner,
      company_name: registeredBusiness.findCompany.company_name,
      password: hash,
      address,
      phone_no,
      earnings: 0,
      revenue: 0,
      isAvailable: true,
      role: "vendor",
      salt,
      cover_image: req.file.path,
      rating: 0,
      orders: 0,
    })) as unknown as VendorAttributes;

    if (!newVendor) {
      return res.status(400).json({
        message: `Vendor's profile couldn't be created`,
      });
    }
    if (newVendor) {
      const vend = (await VendorInstance.findOne({
        where: { id: id },
      })) as unknown as VendorAttributes;
      await sendmail(GMAIL_USER!, email, "Welcome", html);
      const token = await GenerateSignature({ email: vend.email, id: vend.id });
      res.cookie("token", token);
      return res.status(200).json({
        message: `Vendor created successfully`,
        vend,
        token,
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

// Vendor Creates Food
export const vendorcreatesFood = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    let foodid = v4();
    const venid = req.vendor.id;

    const { name, price, food_image, ready_time, description } = req.body;

    const error = validateFoodSchema.safeParse(req.body);
    if (error.success === false) {
      res.status(400).send({
        error: error.error.issues[0].message,
      });
      return;
    }

    const existingFood = (await FoodInstance.findOne({
      where: { name: name },
    })) as unknown as FoodAttributes;

    if (existingFood) {
      return res.send({
        message: `Food exists`,
      });
    }
    // Create a new food object
    const newFood = (await FoodInstance.create({
      id: foodid,
      order_count: 0,
      name,
      date_created: new Date(),
      date_updated: new Date(),
      vendorId: venid,
      price,
      food_image: req.file.path,
      ready_time,
      isAvailable: true,
      rating: 0,
      description,
    })) as unknown as FoodAttributes;

    console.log(newFood.vendorId);
    if (newFood)
      return res
        .status(200)
        .json({ msg: `Food created successfully`, newFood });
    return res.status(400).json({ msg: `Unable to create` });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error.`,
    });
  }
};

// Vendor Get All Food
export const vendorgetsAllHisFood = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const vendorId = req.vendor.id;
    const allFood = await FoodInstance.findAll({
      where: {
        vendorId: vendorId,
      },
    });
    return res.status(200).json({ allFood });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

// Vendor Get Single Food
export const vendorGetsSingleFood = async (req: JwtPayload, res: Response) => {
  try {
    const vendorId = req.vendor.id;
    const foodid = req.query.foodid;
    const food = (await FoodInstance.findOne({
      where: { id: foodid, vendorId: vendorId },
    })) as unknown as FoodAttributes;
    if (!food) return res.status(400).json({ msg: `Unable to fetch food` });
    return res.status(200).json({
      msg: `Here is your food`,
      food,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      msg: `Internal server error`,
    });
  }
};

export const vendorLogin = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password
    } = req.body

    const validateVendor = vendorLoginSchema.safeParse({ email, password })
    if (validateVendor.success === false) {
      return res.status(400).send({
        status: 'error',
        method: req.method,
        message: validateVendor.error.issues
      });
    }
    const user = await VendorInstance.findOne({ where: { email: email } }) as unknown as VendorAttributes
    if (!user) return res.status(404).json({ msg: `User not found` })

    const validatePassword = await bcrypt.compare(password, user.password);

    const token = await GenerateSignature({ email: user.email, id: user.id });
    res.cookie("token", token);

    if (validatePassword) {
      return res.status(200).json({
        status: 'Success',
        method: req.method,
        message: 'Login successful'
      })
    }
    return res.status(404).json({ msg: `Wrong Password` })
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: `Internal Server Error`
    })
  }
};

export const vendorChangePassword = async (req: JwtPayload, res: Response) => {
  try {
    const { old_password, new_password, confirm_password } = req.body;
    if (new_password !== confirm_password) {
      return res.status(400).json({
        message: `Password Mismatch`
      })
    }
    const vendorid = req.vendor.id;
    const vendor: any = await VendorInstance.findOne({
      where: { id: vendorid },
    }) as unknown as VendorAttributes;

    const confirm = await bcrypt.compare(old_password, vendor.password)
    if (!confirm) return res.status(400).json({
      msg: `Wrong Password`
    })
    const token = await GenerateSignature({
      id: vendor.id,
      email: vendor.email
    })
    res.cookie('token', token)
    const new_salt = await GenerateSalt()
    const hash = await hashPassword(new_password, new_salt)
    const updatedPassword = await VendorInstance.update(
      {
        password: hash,
        salt: new_salt
      },
      { where: { id: vendorid } }
    ) as unknown as VendorAttributes;

    if (updatedPassword) {
      return res.status(200).json({
        message: "You have successfully changes your password",
        id: vendor.id,
        email: vendor.email,
        role: vendor.role
      });
    }
    return res.status(400).json({
      message: "Unsuccessful, contact Admin",
      vendor
    });
  } catch (err: any) {
    console.log(err.message)
    return res.status(500).json({
      message: `Internal Server Error`
    })
  }
};

export const vendorEditProfile = async (req: JwtPayload, res: Response) => {
  try {
    const vend = req.vendor.id;
    const { email, restaurant_name, name_of_owner, address, phone_no } = req.body;

    const findVendor = await VendorInstance.findOne({ where: { id: vend } }) as unknown as VendorAttributes;

    if (!findVendor) return res.status(404).json({ msg: `You cannot edit this profile` });

    // Create an object to store the fields that need to be updated
    const updatedFields: Partial<VendorAttributes> = {};

    // // Check if email is provided and not empty, then add it to the updatedFields object
    if (email !== '') {
      updatedFields.email = email;
    }

    // Add other fields to the updatedFields object if they are provided and not empty
    if (restaurant_name !== '') {
      updatedFields.restaurant_name = restaurant_name;
    }

    if (name_of_owner !== '') {
      updatedFields.name_of_owner = name_of_owner;
    }

    if (address !== '') {
      updatedFields.address = address;
    }

    if (phone_no !== '') {
      updatedFields.phone_no = phone_no;
    }

    // Perform the update operation with the fields from updatedFields
    const rowsAffected: any = await VendorInstance.update(updatedFields, {
      where: { id: vend },
    }) as unknown as VendorAttributes;
    if (rowsAffected) {
      const vendor: JwtPayload = await VendorInstance.findOne({ where: { id: vend } }) as unknown as VendorAttributes
      const token = await GenerateSignature({
        id: vendor.id,
        email: vendor.email
      })
      res.cookie('token', token)
      const newVendor = await VendorInstance.findOne({ where: { id: vend } }) as unknown as VendorAttributes;
      return res.status(200).json({
        message: "You have successfully updated your profile",
        newVendor,
      });
    }

    return res.status(400).json({
      message: "Error updating your profile",
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ message: `Internal Server Error` });
  }
};

export const vendorGetsProfile = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.vendor.id;
    const vendor = await VendorInstance.findOne({ where: { id: userId } })
    if (!vendor) return res.status(404).json({ msg: `Vendor not found` })
    return res.status(200).json({ msg: `Here is your profile`, vendor })
  } catch (err: any) {
    console.log(err.message)
    return res.status(500).json({ msg: `Internal Server Error` })
  }
};



export const getVendorRevenue = async (req: JwtPayload, res: Response) => {

 try {
  const vendorId = req.vendor.id;
  const vendor = await VendorInstance.findOne({ where: { id: vendorId } }) as unknown as VendorAttributes

  if (!vendor)
    return res.status(404).json({
      status: "error",
      method: req.method,
      message: "vendor does not exist"
    })

  const revenue: number = vendor.revenue

  const vendorRevenue: number = calRevenue(revenue)

  return res.status(200).json({
    status: "success",
    method: req.method,
    message: "vendor's revenue",
    data: vendorRevenue
  })
 } catch (error) {
  return res.status(404).json({
    status: "error",
    method: req.method,
    message: "internal server error",
    data: `${console.log(error)}`
  })
 }
}



export const editVendorCoverImage =async (req: JwtPayload, res: Response) => {

  const vendorId = req.vendor.id;
  let { cover_image } = req.file
  
  const updatedFields: Partial<VendorAttributes> = {};

   if(cover_image !== ''){
    updatedFields.cover_image = cover_image
   }

  const vendor = await VendorInstance.update(updatedFields , {where: { id: vendorId }})as unknown as VendorAttributes;

  if(!vendor){
    return res.status(404).json({
      status: "error",
      method: req.method,
      message: "vendor does not exist"
    })
  }

  return res.status(200).json({
    status: "success",
    method: req.method,
    message: "vendor's cover image updated successfully",
    data: vendor
  })

}





export const editFoodImage = async (req: JwtPayload, res: Response) => {

  const foodId = req.vendor.id;
  let { food_image } = req.file

  const updatedFields: Partial<FoodAttributes> = {};

  if(food_image !== ''){
    updatedFields.food_image = food_image;
  }

  const food = await FoodInstance.update( updatedFields ,{
    where: { id: foodId }
  })as unknown as FoodAttributes;

  if(!food){
    return res.status(404).json({
      status: "error",
      method: req.method,
      message: "food does not exist"
    })
  }

  return res.status(200).json({
    status: "success",
    method: req.method,
    message: "food's image updated successfully",
    data: food
  })

}