
import { FoodInstance } from "../models/foodModel";
import { Response } from "express";
import {JwtPayload} from 'jsonwebtoken';
import { VendorInstance } from "../models/vendorModel";




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



export const userGetFoodByMostPopularVendors = async (req: JwtPayload, res: Response) => {
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
export const getMostPopularFoodsByOrders = async (req: JwtPayload, res: Response) => {
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