import mongoose, { Schema, Document } from 'mongoose';

export interface DeveloperDocument extends Document {
  email: string;
  password: string;
}

const DeveloperSchema = new Schema<DeveloperDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

export const Developer =
  mongoose.models.Developer || mongoose.model<DeveloperDocument>('Developer', DeveloperSchema);
