import mongoose from "mongoose";
import { Store, IStore } from "../models/Store";
import { SEED_STORES } from "../data/seedStores";

export interface NearbyStoreDoc extends IStore {
  distanceMeters: number;
}

export class StoreRepository {
  /**
   * Count total stores
   */
  async count(): Promise<number> {
    return Store.countDocuments();
  }

  /**
   * Seed stores from SEED_STORES if collection is empty
   */
  async seedStores(): Promise<void> {
    const count = await this.count();
    if (count === 0) {
      await Store.insertMany(SEED_STORES);
    }
  }

  /**
   * Find nearby stores using MongoDB $geoNear aggregation
   */
  async findNearby(
    lng: number,
    lat: number,
    maxDistanceMeters: number = 50000, // default 50km
    limit: number = 10
  ): Promise<NearbyStoreDoc[]> {
    await this.seedStores();

    try {
      const results = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distanceMeters",
            maxDistance: maxDistanceMeters,
            spherical: true,
            query: { isActive: true },
          },
        },
        { $limit: limit },
      ]);

      return results;
    } catch (err) {
      // Fallback: in case 2dsphere index is rebuilding or test memory instance
      const stores = await Store.find({ isActive: true });
      const mapped = stores.map((s) => {
        const storeLng = s.location.coordinates[0];
        const storeLat = s.location.coordinates[1];
        const dist = this.calculateHaversineMeters(lat, lng, storeLat, storeLng);
        const obj = s.toObject ? s.toObject() : (s as any);
        return {
          ...obj,
          distanceMeters: dist,
        };
      });

      mapped.sort((a, b) => a.distanceMeters - b.distanceMeters);
      return mapped.slice(0, limit) as any;
    }
  }

  /**
   * Helper Haversine calculation in meters
   */
  calculateHaversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Get all active stores
   */
  async getAllActive(): Promise<IStore[]> {
    await this.seedStores();
    return Store.find({ isActive: true }).sort({ name: 1 });
  }

  /**
   * Find store by ID
   */
  async findById(id: string): Promise<IStore | null> {
    return Store.findById(id);
  }

  /**
   * Create new store
   */
  async create(data: Partial<IStore>): Promise<IStore> {
    return Store.create(data);
  }

  /**
   * Update existing store
   */
  async update(id: string, data: Partial<IStore>): Promise<IStore | null> {
    return Store.findByIdAndUpdate(id, data, { new: true });
  }

  /**
   * Delete store by ID
   */
  async delete(id: string): Promise<boolean> {
    const res = await Store.findByIdAndDelete(id);
    return !!res;
  }
}

export const storeRepository = new StoreRepository();
