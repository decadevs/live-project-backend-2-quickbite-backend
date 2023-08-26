import dotenv from "dotenv";

dotenv.config();

const { DEV_PORT, DEV_DB_HOST, DEV_DB_NAME, DEV_DB_USERNAME, DEV_DB_PASSWORD, DB_PORT, PG_DEV_DB_NAME  } =
    process.env;


    // PG ADMIN CONNECT
export const PGADMIN_DEFAULT = {
    PORT: DEV_PORT,
    DB_NAME: PG_DEV_DB_NAME
}

// PG CLOUD CONNECT
export default {
    PORT: DEV_PORT,
    DB_HOST: DEV_DB_HOST,
    DB_NAME: DEV_DB_NAME,
    DB_USERNAME: DEV_DB_USERNAME,
    DB_PASSWORD: DEV_DB_PASSWORD,
    DB_PORT,
};


console.log("running in development mode");