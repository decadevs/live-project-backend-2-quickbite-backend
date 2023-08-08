import {Sequelize} from "sequelize"
import dotenv from "dotenv"
dotenv.config()

export const {DB_HOST, GMAIL_USER, GMAIL_PASSWORD, 
    DB_NAME, DB_USERNAME, DB_PASSWORD, APP_SECRET } = process.env

const DB_PORT = process.env.DB_PORT as unknown as number
export const db = new Sequelize(
  DB_NAME!,//name of database
  DB_USERNAME!,//name of username
  DB_PASSWORD as string,//db password


  {​​​​​​​
    host: DB_HOST,
    port: DB_PORT, //`${DB_PORT}`,
    dialect: "postgres",
    logging: false,
    dialectOptions: {​​​​​​​
      encrypt: true,
    //  ssl: {​​​​​​​
    //    rejectUnauthorized: false,
    //  }​​​​​​​,
    }​​​​​​​,
  }​​​​​​​
);
 



