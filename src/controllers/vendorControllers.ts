import { Request, Response, NextFunction } from "express";
import { v4 } from "uuid";
import { GenerateSalt, passWordGenerator, hashPassword, GenerateSignature, } from "../utils/helpers";
import { axiosVerifyVendor } from "../utils/helpers";
import { JwtPayload } from "jsonwebtoken";
import { VendorAttributes, VendorInstance } from "../models/vendorModel";
import { emailHtml, sendmail } from "../utils/emailFunctions";
import { GMAIL_USER } from "../config";
import { zodSchema, validateFoodSchema } from "../utils/validators";
import { FoodAttributes, FoodInstance } from "../models/foodModel";
import { vendorLoginSchema } from '../utils/validators';
import bcrypt from 'bcrypt';
import { OrderAttributes, OrderInstance } from "../models/orderModel";

export const verifyVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const regNo: any = req.body.regNo;
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
      token,
    });
  } catch (err) {
    console.log(err);
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
      cover_image,
    
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
    const vendorId = req.vendor.id;

    
    
    const { name, price, food_image, ready_time, description } = req.body;

     console.log( name, price,food_image,ready_time, description )

     // const venid = vendorId
    
 
    const error = validateFoodSchema.safeParse(req.body);
    if (error.success === false) {
      res.status(400).send({
        error: error.error.issues[0].message,
      });
      return;
    }

    console.log("vender id", vendorId)
    const existingFood = (await FoodInstance.findOne({
      where: { name: name },
    })) as unknown as FoodAttributes;

    if (existingFood) {
      return res.send({
        message: `Food exists`,
      });
    }
    let foodid = v4();
    // Create a new food object
    const newFood = (await FoodInstance.create({
      id: foodid,
      order_count: 0,
      name,
      date_created: new Date(),
      date_updated: new Date(),
      vendorId: vendorId,
      price,
      food_image: req.file.path,
      ready_time,
      isAvailable: true,
      rating: 0,
      description
    })) as unknown as FoodAttributes;

    // console.log(newFood.vendorId);
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
    //   const validateResult = updateSchema.validate(req.body, option);
    //   if (validateResult.error) {
    //     return res.status(400).json({
    //       Error: validateResult.error.details[0].message,
    //     });
    //   }

    const findVendor = (await VendorInstance.findOne({
      where: { id: vend },
    })) as unknown as VendorAttributes;

    if (!findVendor)
      return res.status(404).json({ msg: `You cannot edit this profile` });

    // Create an object to store the fields that need to be updated
    const updatedFields: Partial<VendorAttributes> = {};

    // // Check if email is provided and not empty, then add it to the updatedFields object
    if (email !== "") {
      updatedFields.email = email;
    }

    // Add other fields to the updatedFields object if they are provided and not empty
    if (restaurant_name !== "") {
      updatedFields.restaurant_name = restaurant_name;
    }

    if (name_of_owner !== "") {
      updatedFields.name_of_owner = name_of_owner;
    }

    if (address !== "") {
      updatedFields.address = address;
    }

    if (phone_no !== "") {
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
        email: vendor.email,
      });
      res.cookie("token", token);
      const newVendor = (await VendorInstance.findOne({
        where: { id: vend },
      })) as unknown as VendorAttributes;
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
    const vendor = await VendorInstance.findOne({ where: { id: userId } });
    if (!vendor) return res.status(404).json({ msg: `Vendor not found` });

    return res.status(200).json({ msg: `Here is your profile`, vendor });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ msg: `Internal Server Error` });
  }
};

export const updateFood = async (req: JwtPayload, res: Response) => {
 // console.log( JwtPayload)
  try {
   const id = req.vendor.id;
    const { name, price, ready_time, description } = req.body;
    const [rowsUpdated, updatedFoods] = await FoodInstance.update(
      {
        name,
        price,
        ready_time,
        description,
      },
      {
        where: {id:id },
        returning: true,
      }
    );

    if (rowsUpdated === 0) {
      return res.status(401).send({
        Message: `Food with id ${id} does not exist`,
      });
    }

    const updatedFood = updatedFoods[0];

    return res.status(200).send({
      Status: "success",
      Method: req.method,
      Message: `Food with id ${id} updated successfully`,
      updatedFood,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ Message: "Internal Server Error" });
  }
};


export const DeleteSingleFood = async (req: JwtPayload, res: Response) => {
  try {
    const id = req.vendor.id;
    console.log(id)
    const food = await FoodInstance.findOne({ where: { id: id } });
    if (!food)
      return res
        .status(404)
        .json({ message: `vendor with id ${req.params.id} not found` });
    await FoodInstance.destroy({ where: { id: id } });
    return res.status(200).json({ msg: `Vendor was deleted successfully` });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ msg: `Internal Server Error` });
  }
};

export const DeleteAllFood = async (req: JwtPayload, res: Response) => {
 
  try {   
    const food = await FoodInstance.destroy({truncate:true});
    
      return res.status(200).json({ msg: `All vendors deleted successfully` });
  
   
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ msg: `Internal Server Error` });
  }
};

export const changeStatus = async(req: JwtPayload, res: Response) => {
  try {
    const { orderId } = req.params;

    const order = await OrderInstance.findByPk(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.markAsReady();

    return res.json({ message: 'Order status updated to ready' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const vendorGetsOrderCount = async (req: JwtPayload, res: Response) => {
  try {
    const vendorId = req.vendor.id;
    const vendorOrders:any = await OrderInstance.findOne({ where: { vendorId: vendorId } }) as unknown as OrderAttributes

    if (!vendorOrders) {
      return res.status(404).json({
        message: `Vendor order not found`
      })
    } else if (vendorOrders) {

      const orderCount = vendorOrders.length

      return res.status(200).json({ message: `Vendor's order fetched` })
      orderCount
    }

  } catch (err: any) {
    console.log(err.message)
    return res.status(500).json({ message: `Internal server error` })
  }

}

export const vendorTotalRevenue = async (req: JwtPayload, res: Response) => {
  try {
    const vendorId = req.vendor.id;
    const vendorRevenue = await VendorInstance.findOne({ where: { id: vendorId } })
    if (!vendorRevenue) {
      return res.status(404).json({
        message: `Vendor's total revenue cannot be fetched`
      })
    } else if (vendorRevenue) {

      const totalRevenue = vendorRevenue.revenue
      return res.status(200).json({
        message: `Vendor's total revenue fetched successfully`,
        totalRevenue

      })
    }
  }
  catch (err: any) {
    console.log(err)
    return res.status(500).json({
      message: `Internal server error`
    })
  }
}


export const vendorAvailability = async (req: JwtPayload, res: Response) => {
  try {
    const vendorId = req.vendor.id;
    const availableVendor = await VendorInstance.findOne({ where: { id: vendorId } })
    if (!availableVendor) {
      return res.status(404).json({
        message: `Vendor not found`
      })
      
    } else if (availableVendor) {
      try {
        const newAvailability = !availableVendor.isAvailable;
        // const updateVendor= await VendorInstance.update({isAvailable: true }, {where: {id: vendorId}})

        await VendorInstance.update({ isAvailable: newAvailability }, { where: { id: vendorId } });

        return res.status(200).json({
          message: `Vendor availability status updated`
        })
      }
      catch (err: any) {
        console.log(err); return res.status(500).json({ message: `Internal server error` })
      }
    }
  }
  catch (err: any) {
    console.log(err)
    return res.status(500).json({
      message: `Internal server error`
    })
  }

}

export const singleOrderDetails = async (req: JwtPayload, res: Response) => {
  try {
    const orderId =  req.query.id;
    const orderDetails = await OrderInstance.findOne({ where: { id: orderId } }) as unknown as OrderAttributes;
    if (!orderDetails) {
      return res.status(404).json({
        message: `Order not found`
      })
    } else if (orderDetails) {
      return res.status(200).json({
        message: `Order details fetched`,
        order: orderDetails
      })
    }
  }
  catch (err: any) {
    console.log(err); return res.status(500).json({ message: `Internal server error` })
  }
}
