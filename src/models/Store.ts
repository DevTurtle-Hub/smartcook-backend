import mongoose, { Document, Model, Schema } from "mongoose";

export interface IGeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IStore extends Document {
  name: string;
  brand: string;
  address: string;
  openHours?: string;
  phone?: string;
  logo?: string;
  location: IGeoJSONPoint;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  latitude: number;
  longitude: number;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    openHours: {
      type: String,
      default: "06:00 - 22:00",
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// GeoSpatial 2dsphere index for $geoNear queries
StoreSchema.index({ location: "2dsphere" });

// Virtual getters for latitude and longitude
StoreSchema.virtual("latitude").get(function (this: IStore) {
  return this.location?.coordinates?.[1];
});

StoreSchema.virtual("longitude").get(function (this: IStore) {
  return this.location?.coordinates?.[0];
});

export const Store: Model<IStore> = mongoose.model<IStore>("Store", StoreSchema);
