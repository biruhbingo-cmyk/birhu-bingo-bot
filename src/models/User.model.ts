import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  telegramId: number;
  firstName: string;
  lastName?: string;
  phone: string;
  balance: number;
  demoGames: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 5, // Initial balance
    },
    demoGames: {
      type: Number,
      default: 3, // Initial demo games
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referredBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);

