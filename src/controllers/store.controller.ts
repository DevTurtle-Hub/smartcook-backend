import { Request, Response } from "express";
import { storeService } from "../services/store.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class StoreController {
  /**
   * GET /api/v1/stores/nearby?lat=...&lng=...&radiusKm=...&limit=...
   */
  getNearbyStores = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radiusKm = req.query.radiusKm
        ? parseFloat(req.query.radiusKm as string)
        : 20;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;

      const stores = await storeService.getNearbyStores(
        lat,
        lng,
        radiusKm,
        limit
      );

      ApiResponse.success(
        res,
        stores,
        "Tìm kiếm siêu thị lân cận theo GPS thành công",
        200
      );
    }
  );

  /**
   * GET /api/v1/stores
   */
  getAllStores = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const stores = await storeService.getAllStores();
      ApiResponse.success(
        res,
        stores,
        "Lấy danh sách tất cả siêu thị thành công",
        200
      );
    }
  );

  /**
   * GET /api/v1/stores/:id
   */
  getStoreById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const store = await storeService.getStoreById(id);
      ApiResponse.success(
        res,
        store,
        "Lấy thông tin chi tiết siêu thị thành công",
        200
      );
    }
  );

  /**
   * POST /api/v1/stores (Admin)
   */
  createStore = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const newStore = await storeService.createStore(req.body);
      ApiResponse.created(
        res,
        newStore,
        "Thêm siêu thị mới thành công"
      );
    }
  );

  /**
   * PUT /api/v1/stores/:id (Admin)
   */
  updateStore = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      const updated = await storeService.updateStore(id, req.body);
      ApiResponse.success(
        res,
        updated,
        "Cập nhật thông tin siêu thị thành công",
        200
      );
    }
  );

  /**
   * DELETE /api/v1/stores/:id (Admin)
   */
  deleteStore = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const id = req.params.id as string;
      await storeService.deleteStore(id);
      ApiResponse.success(
        res,
        null,
        "Xóa siêu thị thành công",
        200
      );
    }
  );
}

export const storeController = new StoreController();
