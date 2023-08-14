// models/Order.ts
import { DataTypes, Model } from 'sequelize';
import { db } from '../config';


export interface OrderAttributes {
    length: any;
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

export class OrderInstance extends Model<OrderAttributes> {}

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
      type: DataTypes.STRING,
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
