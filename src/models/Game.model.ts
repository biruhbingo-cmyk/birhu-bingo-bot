import mongoose, { Schema, Document } from 'mongoose';

export enum GameStatus {
  WAITING = 'waiting',
  STARTING = 'starting',
  PLAYING = 'playing',
  FINISHED = 'finished',
  CANCELLED = 'cancelled',
}

export interface IGame extends Document {
  gameType: number; // 5, 7, 10, 20, 50, 100, 200
  status: GameStatus;
  players: Array<{
    userId: mongoose.Types.ObjectId;
    cardId: number;
    markedNumbers: number[];
    hasWon: boolean;
  }>;
  drawnNumbers: number[];
  winner?: mongoose.Types.ObjectId;
  prizePool: number;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
  {
    gameType: {
      type: Number,
      required: true,
      enum: [5, 7, 10, 20, 50, 100, 200],
    },
    status: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.WAITING,
    },
    players: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        cardId: {
          type: Number,
          required: true,
        },
        markedNumbers: {
          type: [Number],
          default: [],
        },
        hasWon: {
          type: Boolean,
          default: false,
        },
      },
    ],
    drawnNumbers: {
      type: [Number],
      default: [],
    },
    winner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGame>('Game', GameSchema);

