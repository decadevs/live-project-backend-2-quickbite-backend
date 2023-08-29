import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import {GMAIL_USER,
    GMAIL_PASSWORD} from '../config'

dotenv.config()

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_USER}`,
        pass: `${process.env.GMAIL_PASSWORD}`
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const sendmail = async(from:string, to:string, subject:string, html:string)=>{
    try{
        const reponse = await transporter.sendMail({
            from: `${process.env.GMAIL_USER}`,
            to,
            subject: "Welcome to QuickBite",
            html
        })
    }catch(err){
        console.log(err)
    }
}

export const emailHtml = (email:string, password:string)=>{
    const mail = `<h3><em>Hello Vendor</em>,Your profile has been created.<h3>
                    <p>Your Email: ${email}</p><br>
                    <p>Your Password: ${password}</p><br><br>
                    <p>
                    Thank You<br>
                    TEAM QUICKBITE</p>`

                    return mail
}

type Mail_Params = {
    to: string,
    OTP: number
}
export const otpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_USER}`,
        pass: `${process.env.GMAIL_PASSWORD}`
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const mailUserOtp = async(params:Mail_Params)=>{
    try {
        const info = await otpTransporter.sendMail({
            from: process.env.GMAIL_USER,
            to: params.to,
            subject: "VERIFY EMAIL",
            html: `
                <div style="
                max-width:90%; 
                margin: auto; 
                padding-top: 20px">
                    
                <h2>Welcome to QUICKBITE</h2>

                <p style="
                margin-bottom:30px;"
                >Please enter the OTP to complete your sign up <br><br>
                <span style="
                font-size:40px;
                lettre-spacing:2px;
                text-align:center;
                ">${params.OTP}</span><br><br>
                Thank You<br>
                TEAM QUICKBITE</p>
            </div>`
        })

        return info;
    } catch (error) {
        console.log(error)
    }
}

export const orderTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_USER}`,
        pass: `${process.env.GMAIL_PASSWORD}`
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const mailOrder = async(params:any)=>{
    try {
        const info = await orderTransporter.sendMail({
            from: process.env.GMAIL_USER,
            to: params,
            subject: "ORDER CREATED",
            html: `
                <div style="
                max-width:90%; 
                margin: auto; 
                padding-top: 20px">
                    
                <h2>Welcome to QUICKBITE</h2>

                <p style="
                margin-bottom:30px;"
                >Your order has been successfully created, Please check your dashboard to view order<br><br>
                Thank You<br>
                TEAM QUICKBITE
                </p>
            </div>`
        })

        return info;
    } catch (error:any) {
        console.log(error.message)
    }
}

export const orderVendorTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: `${process.env.GMAIL_USER}`,
        pass: `${process.env.GMAIL_PASSWORD}`
    },
    tls: {
        rejectUnauthorized: false
    }
})

export const mailVendorOrder = async(params:any)=>{
    try {
        const info = await orderVendorTransporter.sendMail({
            from: process.env.GMAIL_USER,
            to: params,
            subject: "ORDER RECEIVED",
            html: `
                <div style="
                max-width:90%; 
                margin: auto; 
                padding-top: 20px">
                    
                <h2>Welcome to QUICKBITE</h2>

                <p style="
                margin-bottom:30px;"
                >A user has ordered your product. Please check your dashboard to view order. Please remember to change order status to "ready" when the order is ready for delivery<br><br>
                Thank You<br>
                TEAM QUICKBITE
                </p>
            </div>`
        })

        return info;
    } catch (error:any) {
        console.log(error.message)
    }
}
