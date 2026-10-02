import { Request, Response } from "express";
import { rewardService } from "../services/reward.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class RewardController {
  getStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const status = await rewardService.getRewardStatus(userId);
      ApiResponse.success(res, status, "Reward status fetched successfully");
    }
  );

  checkIn = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const result = await rewardService.claimDailyCheckIn(userId);
      ApiResponse.success(res, result, result.message);
    }
  );

  redeem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const { rewardId } = req.body;
      const result = await rewardService.redeemReward(userId, rewardId);
      ApiResponse.success(res, result, result.message);
    }
  );
}

export const rewardController = new RewardController();
