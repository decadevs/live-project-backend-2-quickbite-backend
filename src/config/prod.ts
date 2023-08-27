import dotenv from "dotenv";

dotenv.config();

const { PROD_PORT, PROD_DB_HOST, PROD_DB_NAME, PROD_DB_USERNAME, PROD_DB_PASSWORD, DB_PORT, PG_PROD_DB_NAME } =
    process.env;

// PG ADMIN CONNECT
export const PGADMIN_DEFAULT = {
    PORT: PROD_PORT,
    DB_NAME: PG_PROD_DB_NAME
}

// PG CLOUND CONNECT
export default {
    PORT: PROD_PORT,
    DB_NAME: PROD_DB_NAME,
    DB_HOST: PROD_DB_HOST,
    DB_USERNAME: PROD_DB_USERNAME,
    DB_PASSWORD: PROD_DB_PASSWORD,
    // DB_PORT,
};



console.log("running in production mode");