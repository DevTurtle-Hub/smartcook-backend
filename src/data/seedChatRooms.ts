import Conversation from "../models/Conversation";

export const DEFAULT_CHAT_ROOMS = [
  {
    roomCode: "room-quick-tips",
    type: "room" as const,
    title: "Góc Chia Sẻ Mẹo Nấu Nhanh",
    description:
      "Bí kíp chế biến món ăn nhanh dưới 20p, mẹo vặt bảo quản thực phẩm và xử lý gia vị thơm ngon.",
    iconName: "flash",
    tags: ["#MonNhanh", "#MeoVat", "#TietKiemThoiGian"],
    activeMembers: 128,
    lastMessage:
      "Mẹo ướp thịt bò với chút dầu mè và bột bắp giúp bò mềm tan không dai nhé cả nhà!",
    lastMessageTime: new Date(),
    isAiBot: false,
  },
  {
    roomCode: "room-eat-clean",
    type: "room" as const,
    title: "Hội Ăn Chay & Eat Clean",
    description:
      "Không gian kết nối những tâm hồn yêu thích lối sống lành mạnh, thực đơn thuần chay & eat clean khoa học.",
    iconName: "leaf",
    tags: ["#EatClean", "#ThuanChay", "#HealthyLife"],
    activeMembers: 245,
    lastMessage:
      "Salad ức gà sốt chanh leo hôm nay làm theo công thức của app ngon xuất sắc luôn ạ.",
    lastMessageTime: new Date(),
    isAiBot: false,
  },
  {
    roomCode: "room-masterchef",
    type: "room" as const,
    title: "Hỏi Đáp Cùng Bếp Trưởng",
    description:
      "Giải đáp mọi thắc mắc chuyên môn, kỹ thuật canh nhiệt độ, nêm nếm gia vị chuẩn nhà hàng.",
    iconName: "chef-hat",
    tags: ["#HoiDap", "#KyThuatNau", "#BepTruong"],
    activeMembers: 89,
    lastMessage:
      "Chào bạn, khi nấu canh xương bạn nên hớt bọt ở lửa vừa để nước dùng trong vắt nhé!",
    lastMessageTime: new Date(),
    isAiBot: false,
  },
];

export async function seedDefaultChatRooms(): Promise<void> {
  try {
    for (const room of DEFAULT_CHAT_ROOMS) {
      await Conversation.findOneAndUpdate(
        { roomCode: room.roomCode },
        { $setOnInsert: room },
        { upsert: true, new: true }
      ).exec();
    }
    console.log("✅ [Seed] Default chat rooms seeded successfully.");
  } catch (err: any) {
    console.warn("⚠️ [Seed] Failed to seed default chat rooms:", err?.message || err);
  }
}
