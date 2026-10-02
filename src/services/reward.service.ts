import { User, IUserClaimedReward } from "../models/User";
import { userRepository } from "../repositories/user.repository";
import { notificationService } from "./notification.service";
import { BadRequestError, NotFoundError } from "../utils/errors";
import crypto from "crypto";

export interface RewardCatalogItem {
  id: string;
  title: string;
  brand: string;
  description: string;
  discountValue: string;
  xpCost: number;
  type: "voucher" | "recipe_vip" | "badge";
  icon: string;
  badgeColor: string;
}

export const REWARD_CATALOG: RewardCatalogItem[] = [
  {
    id: "reward-winmart-20k",
    title: "Voucher WinMart+ 20.000đ",
    brand: "WinMart+",
    description: "Áp dụng cho hóa đơn mua sắm thực phẩm tươi sống từ 100.000đ tại mọi cửa hàng WinMart+.",
    discountValue: "20.000đ",
    xpCost: 80,
    type: "voucher",
    icon: "cart",
    badgeColor: "#EF4444",
  },
  {
    id: "reward-coop-30k",
    title: "Phiếu Mua Hàng Co.opmart 30.000đ",
    brand: "Co.opmart",
    description: "Giảm trực tiếp 30.000đ cho đơn hàng rau củ quả, thịt cá sạch tại chuỗi siêu thị Co.opmart.",
    discountValue: "30.000đ",
    xpCost: 120,
    type: "voucher",
    icon: "basket",
    badgeColor: "#059669",
  },
  {
    id: "reward-annam-15pct",
    title: "Ưu Đãi Annam Gourmet 15%",
    brand: "Annam Gourmet",
    description: "Giảm 15% cho các dòng phô mai, thịt bò ngoại nhập và sốt gia vị cao cấp.",
    discountValue: "Giảm 15%",
    xpCost: 180,
    type: "voucher",
    icon: "star",
    badgeColor: "#D97706",
  },
  {
    id: "reward-vip-recipe-pack",
    title: "Mở Khóa 10 Công Thức Bếp Trưởng 5 Sao",
    brand: "SmartCook Master",
    description: "Truy cập không giới hạn bộ công thức bí truyền chuẩn nhà hàng Fine Dining cùng video hướng dẫn chi tiết.",
    discountValue: "VIP Recipe",
    xpCost: 250,
    type: "recipe_vip",
    icon: "ribbon",
    badgeColor: "#8B5CF6",
  },
  {
    id: "reward-gold-badge",
    title: "Huy Hiệu Đầu Bếp Vàng Độc Quyền",
    brand: "SmartCook Community",
    description: "Huy hiệu vinh danh hiển thị nổi bật bên cạnh tên của bạn trên mọi bài viết và phòng chat cộng đồng.",
    discountValue: "Huy hiệu",
    xpCost: 350,
    type: "badge",
    icon: "trophy",
    badgeColor: "#F59E0B",
  },
];

// Mức thưởng XP mỗi ngày trong chu kỳ 7 ngày
export const STREAK_XP_REWARDS = [15, 20, 25, 30, 40, 50, 100];

export class RewardService {
  /**
   * Lấy trạng thái điểm danh, danh mục đổi thưởng và quà đã nhận của user
   */
  async getRewardStatus(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastCheckInStr = user.checkIn?.lastCheckInDate
      ? new Date(user.checkIn.lastCheckInDate).toISOString().slice(0, 10)
      : null;

    const hasCheckedInToday = lastCheckInStr === todayStr;

    // Tính streak hiện tại
    let currentStreak = user.checkIn?.streakDays || 0;
    if (lastCheckInStr && !hasCheckedInToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      if (lastCheckInStr !== yesterdayStr) {
        // Đã bỏ lỡ ngày hôm qua -> reset streak về 0
        currentStreak = 0;
      }
    }

    return {
      chefExp: user.chefExp,
      level: user.level,
      streakDays: currentStreak,
      hasCheckedInToday,
      streakRewards: STREAK_XP_REWARDS,
      catalog: REWARD_CATALOG,
      claimedRewards: user.claimedRewards || [],
    };
  }

  /**
   * Điểm danh nhận XP hàng ngày
   */
  async claimDailyCheckIn(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const lastCheckInStr = user.checkIn?.lastCheckInDate
      ? new Date(user.checkIn.lastCheckInDate).toISOString().slice(0, 10)
      : null;

    if (lastCheckInStr === todayStr) {
      throw new BadRequestError("Bạn đã điểm danh hôm nay rồi! Hãy quay lại vào ngày mai nhé.");
    }

    // Tính streak mới
    let streak = user.checkIn?.streakDays || 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastCheckInStr === yesterdayStr) {
      streak = (streak % 7) + 1;
    } else {
      streak = 1; // Bắt đầu chu kỳ mới
    }

    // Lấy điểm thưởng XP tương ứng với ngày trong streak
    const xpReward = STREAK_XP_REWARDS[streak - 1] || 15;
    const newExp = (user.chefExp || 0) + xpReward;

    // Cập nhật level dựa trên điểm kinh nghiệm mới
    let newLevel = user.level || "Tập sự";
    if (newExp >= 1500) newLevel = "Master Chef";
    else if (newExp >= 900) newLevel = "Bếp trưởng";
    else if (newExp >= 450) newLevel = "Đầu bếp tài ba";
    else if (newExp >= 150) newLevel = "Bếp phó";

    user.chefExp = newExp;
    user.level = newLevel;
    user.checkIn = {
      lastCheckInDate: today,
      streakDays: streak,
    };

    await user.save();

    // Gửi realtime notification thông báo điểm danh thành công
    await notificationService.pushNotification(userId, {
      title: `🎁 Điểm danh ngày ${streak} thành công!`,
      body: `Bạn vừa nhận được +${xpReward} XP. Tổng điểm hiện tại: ${newExp} XP (${newLevel}).`,
      type: "reward",
      data: { xpGained: xpReward, newTotalExp: newExp, streakDay: streak },
    });

    return {
      message: `Điểm danh thành công! Bạn nhận được +${xpReward} XP`,
      xpGained: xpReward,
      chefExp: newExp,
      level: newLevel,
      streakDays: streak,
      hasCheckedInToday: true,
    };
  }

  /**
   * Đổi quà / voucher bằng điểm Chef XP
   */
  async redeemReward(userId: string, rewardId: string) {
    const item = REWARD_CATALOG.find((r) => r.id === rewardId);
    if (!item) {
      throw new NotFoundError("Gói quà thưởng không tồn tại");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    if ((user.chefExp || 0) < item.xpCost) {
      throw new BadRequestError(
        `Bạn cần có ít nhất ${item.xpCost} XP để đổi phần quà này (Hiện có: ${user.chefExp || 0} XP). Hãy nấu ăn và tương tác thêm để tích lũy XP nhé!`
      );
    }

    // Trừ điểm XP
    user.chefExp -= item.xpCost;

    // Tạo mã code ngẫu nhiên duy nhất
    const randomCode = `${item.brand.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4)}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Hiệu lực 30 ngày

    const claimedItem: IUserClaimedReward = {
      id: `${item.id}-${Date.now()}`,
      title: item.title,
      description: item.description,
      code: randomCode,
      discountValue: item.discountValue,
      type: item.type,
      claimedAt: new Date(),
      expiresAt,
      isUsed: false,
    };

    if (!user.claimedRewards) {
      user.claimedRewards = [];
    }
    user.claimedRewards.unshift(claimedItem);

    await user.save();

    // Bắn realtime notification chúc mừng đổi quà
    await notificationService.pushNotification(userId, {
      title: `🎉 Đổi quà thành công: ${item.title}!`,
      body: `Mã ưu đãi của bạn là [${randomCode}]. Hãy kiểm tra trong mục 'Quà của tôi' để sử dụng trước khi hết hạn.`,
      type: "reward",
      data: { rewardCode: randomCode, voucherTitle: item.title },
    });

    return {
      message: "Đổi quà thành công!",
      reward: claimedItem,
      remainingExp: user.chefExp,
    };
  }
}

export const rewardService = new RewardService();
