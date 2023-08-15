// models/Order.ts
import { DataTypes, Model } from 'sequelize';
import { db } from '../config';
import { UserInstance } from './userModel';


export interface OrderAttributes {
    id: string;
    foodid: string;
    food_name: string;
    quantity: number;
    amount: number;
    status: string;
    userId: string;
    vendorId: string;
    isPaid: boolean
}

export class OrderInstance extends Model<OrderAttributes> {
  markAsReady() {
    throw new Error("Method not implemented.");
  }
  public static associate(models:{User: typeof UserInstance}): void{
    OrderInstance.belongsTo(models.User,{foreignKey:'userId', as:'User'})
  }
}

OrderInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    foodid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    food_name: {
        type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amount: {
        type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    },
    userId: {
      type: DataTypes.UUID,
      references:{
        model: UserInstance,
        key:'id',

      },
    },
    vendorId: {
        type: DataTypes.STRING,
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    }
  },
  {
    sequelize: db,
    tableName: 'Orders',
  }
);

export default OrderInstance;


