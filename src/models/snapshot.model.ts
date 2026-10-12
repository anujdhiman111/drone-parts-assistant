import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import type { StockStatus } from '../sites/types';

const snapshotSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    checkedAt: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'pre_order', 'unknown'],
      required: true,
    },
    price: { type: Number, default: null },
  },
  { timestamps: false }
);

snapshotSchema.index({ productId: 1, checkedAt: -1 });

export type SnapshotDocument = InferSchemaType<typeof snapshotSchema> & {
  _id: mongoose.Types.ObjectId;
  status: StockStatus;
};

export const Snapshot =
  mongoose.models.Snapshot ?? mongoose.model('Snapshot', snapshotSchema);
