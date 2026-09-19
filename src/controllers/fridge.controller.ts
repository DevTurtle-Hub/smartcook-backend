import { Request, Response } from "express";
import { fridgeService } from "../services/fridge.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class FridgeController {
  getMyFridge = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const fridge = await fridgeService.getMyFridge(req.user!._id.toString());
    ApiResponse.success(res, fridge, "Fridge items fetched successfully");
  });

  addItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const fridge = await fridgeService.addItem(
      req.user!._id.toString(),
      req.body
    );
    ApiResponse.created(res, fridge, "Item added to fridge successfully");
  });

  updateItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { itemId } = req.params as { itemId: string };
    const fridge = await fridgeService.updateItem(
      req.user!._id.toString(),
      itemId,
      req.body
    );
    ApiResponse.success(res, fridge, "Fridge item updated successfully");
  });

  removeItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { itemId } = req.params as { itemId: string };
    const fridge = await fridgeService.removeItem(
      req.user!._id.toString(),
      itemId
    );
    ApiResponse.success(res, fridge, "Item removed from fridge successfully");
  });

  clearFridge = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const fridge = await fridgeService.clearFridge(req.user!._id.toString());
    ApiResponse.success(res, fridge, "Fridge cleared successfully");
  });
}

export const fridgeController = new FridgeController();
export default fridgeController;
