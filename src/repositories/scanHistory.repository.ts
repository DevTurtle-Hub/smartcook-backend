import { Types } from "mongoose";
import { IScanHistory, ScanHistory } from "../models/ScanHistory";

export class ScanHistoryRepository {
  /**
   * Create a new scan history entry
   */
  async create(data: Partial<IScanHistory>): Promise<IScanHistory> {
    const scan = new ScanHistory(data);
    return await scan.save();
  }

  /**
   * Find scan histories by user ID, ordered by scannedAt desc
   */
  async findByUserId(userId: string, limit: number = 30): Promise<IScanHistory[]> {
    return await ScanHistory.find({ userId: new Types.ObjectId(userId) })
      .sort({ scannedAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Find scan history by ID
   */
  async findById(id: string): Promise<IScanHistory | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await ScanHistory.findById(id).exec();
  }

  /**
   * Delete scan history by ID
   */
  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await ScanHistory.findByIdAndDelete(id).exec();
    return !!result;
  }
}

export const scanHistoryRepository = new ScanHistoryRepository();
