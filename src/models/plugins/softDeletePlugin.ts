import mongoose, { Schema, Document } from "mongoose";

export interface ISoftDeleteDocument extends Document {
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  softDelete(deletedBy?: mongoose.Types.ObjectId): Promise<this>;
  restore(): Promise<this>;
}

export const softDeletePlugin = (schema: Schema) => {
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  });

  const excludeDeleted = function (this: any) {
    const filter = this.getFilter ? this.getFilter() : {};
    // Only exclude deleted if caller hasn't explicitly specified isDeleted in query
    if (filter && filter.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre("find", excludeDeleted);
  schema.pre("findOne", excludeDeleted);
  schema.pre("findOneAndUpdate", excludeDeleted);
  schema.pre("countDocuments", excludeDeleted);

  schema.methods.softDelete = async function (deletedBy?: mongoose.Types.ObjectId) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (deletedBy) {
      this.deletedBy = deletedBy;
    }
    return this.save();
  };

  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    this.deletedBy = null;
    return this.save();
  };
};

export default softDeletePlugin;
