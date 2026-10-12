import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    source: { type: String, required: true, default: 'robu' },
    addedAt: { type: Date, default: Date.now },
    addedBy: { type: String, default: null },
  },
  { timestamps: false }
);

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product =
  mongoose.models.Product ?? mongoose.model('Product', productSchema);
