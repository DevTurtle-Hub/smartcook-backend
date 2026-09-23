import { storeRepository } from "../repositories/store.repository";
import { IStore } from "../models/Store";
import { NotFoundError, BadRequestError } from "../utils/errors";

export interface NearbyStoreResponse {
  id: string;
  name: string;
  brand: string;
  address: string;
  openHours: string;
  phone?: string;
  logo?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  formattedDistance: string;
  travelTimeMotoMinutes: number;
  travelTimeWalkMinutes: number;
}

export class StoreService {
  /**
   * Find nearby supermarkets based on user GPS coordinates
   */
  async getNearbyStores(
    lat: number,
    lng: number,
    radiusKm: number = 20, // default 20km
    limit: number = 10
  ): Promise<NearbyStoreResponse[]> {
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      throw new BadRequestError("Tọa độ GPS lat và lng không hợp lệ");
    }

    const maxDistanceMeters = radiusKm * 1000;
    const rawResults = await storeRepository.findNearby(
      lng,
      lat,
      maxDistanceMeters,
      limit
    );

    return rawResults.map((store: any) => {
      const distanceMeters = store.distanceMeters || 0;
      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const formattedDistance =
        distanceKm < 1
          ? `${Math.round(distanceMeters)} m`
          : `${distanceKm.toFixed(1)} km`;

      // Moto speed ~25km/h in city
      const travelTimeMotoMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
      // Walking speed ~4.5km/h
      const travelTimeWalkMinutes = Math.max(1, Math.round((distanceKm / 4.5) * 60));

      const coordinates = store.location?.coordinates || [lng, lat];

      return {
        id: (store._id || store.id).toString(),
        name: store.name,
        brand: store.brand,
        address: store.address,
        openHours: store.openHours || "06:00 - 22:00",
        phone: store.phone,
        logo: store.logo,
        latitude: coordinates[1],
        longitude: coordinates[0],
        distanceKm,
        formattedDistance,
        travelTimeMotoMinutes,
        travelTimeWalkMinutes,
      };
    });
  }

  /**
   * Get all active stores
   */
  async getAllStores(): Promise<any[]> {
    const stores = await storeRepository.getAllActive();
    return stores.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      brand: s.brand,
      address: s.address,
      openHours: s.openHours,
      phone: s.phone,
      logo: s.logo,
      latitude: s.location.coordinates[1],
      longitude: s.location.coordinates[0],
      isActive: s.isActive,
    }));
  }

  /**
   * Get store detail by ID
   */
  async getStoreById(id: string): Promise<any> {
    const store = await storeRepository.findById(id);
    if (!store) {
      throw new NotFoundError("Siêu thị không tồn tại");
    }
    return {
      id: store._id.toString(),
      name: store.name,
      brand: store.brand,
      address: store.address,
      openHours: store.openHours,
      phone: store.phone,
      logo: store.logo,
      latitude: store.location.coordinates[1],
      longitude: store.location.coordinates[0],
      isActive: store.isActive,
    };
  }

  /**
   * Create new store (Admin)
   */
  async createStore(data: {
    name: string;
    brand: string;
    address: string;
    latitude: number;
    longitude: number;
    openHours?: string;
    phone?: string;
    logo?: string;
  }): Promise<any> {
    const newStore = await storeRepository.create({
      name: data.name,
      brand: data.brand,
      address: data.address,
      openHours: data.openHours || "06:00 - 22:00",
      phone: data.phone,
      logo: data.logo,
      location: {
        type: "Point",
        coordinates: [data.longitude, data.latitude],
      },
      isActive: true,
    });
    return this.getStoreById(newStore._id.toString());
  }
}

export const storeService = new StoreService();
