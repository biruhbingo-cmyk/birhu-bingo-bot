import mongoose, { Schema, Document } from 'mongoose';

export interface ICard extends Document {
  cardId: number; // 1-100
  numbers: {
    B: number[]; // 1-15
    I: number[]; // 16-30
    N: number[]; // 31-45
    G: number[]; // 46-60
    O: number[]; // 61-75
  };
}

const CardSchema = new Schema<ICard>(
  {
    cardId: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 100,
    },
    numbers: {
      B: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 5 && arr.every(n => n >= 1 && n <= 15),
          message: 'B column must have 5 numbers between 1-15',
        },
      },
      I: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 5 && arr.every(n => n >= 16 && n <= 30),
          message: 'I column must have 5 numbers between 16-30',
        },
      },
      N: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 5 && arr.every(n => n >= 31 && n <= 45),
          message: 'N column must have 5 numbers between 31-45',
        },
      },
      G: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 5 && arr.every(n => n >= 46 && n <= 60),
          message: 'G column must have 5 numbers between 46-60',
        },
      },
      O: {
        type: [Number],
        required: true,
        validate: {
          validator: (arr: number[]) => arr.length === 5 && arr.every(n => n >= 61 && n <= 75),
          message: 'O column must have 5 numbers between 61-75',
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICard>('Card', CardSchema);

