import express, { NextFunction } from "express"
import { Request, Response } from 'express';
import dotenv from "dotenv"
import {db} from "./config"
import {HttpError} from 'http-errors';
import config from './config/dbConfig';
import vendorRoutes from './routes/vendorRoutes';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import logger from 'morgan';
import path from 'path';
import userRoutes from './routes/userRoutes'
import bodyParser from 'body-parser'
import { FoodInstance } from "./models/foodModel";
import { VendorInstance } from "./models/vendorModel";



const {PORT} = config

dotenv.config()

const app = express()

app.use(bodyParser.json())

app.use(logger('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended: false}));
app.use(cors())
app.use(express.static(path.join(__dirname, '../public')));

db.sync({}).then( ()=>{
    console.log("Database is connected");
}).catch((err:HttpError)=>{
    console.log(err);
})

app.use("/vendor", vendorRoutes)
app.use('/user', userRoutes)
app.get('/', async (req:Request, res:Response)=>{
        console.log('get')
        const allFoods = await FoodInstance.findAll({})
        const allVendors = await VendorInstance.findAll({})
        return res.status(200).json({
            message: `All Foods Fetched`,
            Foods: allFoods,
            Restaurants: allVendors
        })
    })
// const {DB_PORT} = process.env
// console.log(DB_PORT);

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`)
})

export default app;