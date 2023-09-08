"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const dbConfig_1 = __importDefault(require("./config/dbConfig"));
const vendorRoutes_1 = __importDefault(require("./routes/vendorRoutes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const body_parser_1 = __importDefault(require("body-parser"));
const foodModel_1 = require("./models/foodModel");
const vendorModel_1 = require("./models/vendorModel");
const userModel_1 = require("./models/userModel");
const { PORT } = dbConfig_1.default;
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
config_1.db.sync({}).then(() => {
    console.log("Database is connected");
}).catch((err) => {
    console.log(err);
});
app.use("/vendor", vendorRoutes_1.default);
app.use('/user', userRoutes_1.default);
app.get('/', async (req, res) => {
    console.log('get');
    const allFoods = await foodModel_1.FoodInstance.findAll({});
    const allVendors = await vendorModel_1.VendorInstance.findAll({});
    const users = await userModel_1.UserInstance.findAll({});
    return res.status(200).json({
        message: `All Foods Fetched`,
        Foods: allFoods,
        Restaurants: allVendors,
        Users: users
    });
});
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});
exports.default = app;
