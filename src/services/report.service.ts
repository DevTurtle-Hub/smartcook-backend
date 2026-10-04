import { Types } from "mongoose";
import Comment from "../models/Comment";
import Post from "../models/Post";
import Recipe from "../models/Recipe";
import Report, { IReport, ReportReason, ReportStatus, ReportTargetType } from "../models/Report";
import User from "../models/User";
import { reportRepository, ReportFilter } from "../repositories/report.repository";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

export interface ResolveReportInput {
  status: ReportStatus;
  resolutionNotes?: string;
  action?: "none" | "hide" | "delete" | "ban";
}

export class ReportService {
  /**
   * Submit a new moderation report
   */
  async createReport(reporterId: string, input: CreateReportInput): Promise<IReport> {
    const { targetType, targetId, reason, description } = input;

    if (!targetType || !targetId || !reason) {
      throw new BadRequestError("Thiếu thông tin báo cáo bắt buộc (targetType, targetId, reason)");
    }

    if (!Types.ObjectId.isValid(targetId)) {
      throw new BadRequestError("ID đối tượng báo cáo không hợp lệ");
    }

    // 1. Verify target exists and extract preview text
    let targetPreview = "";

    switch (targetType) {
      case "post": {
        const post = await Post.findById(targetId).exec();
        if (!post) {
          throw new NotFoundError("Bài viết được báo cáo không tồn tại hoặc đã bị xoá");
        }
        targetPreview = `[Bài viết] ${post.dishName || "Món ngon"}: ${(post.caption || "").slice(0, 80)}`;
        break;
      }
      case "comment": {
        const comment = await Comment.findById(targetId).exec();
        if (!comment) {
          throw new NotFoundError("Bình luận được báo cáo không tồn tại hoặc đã bị xoá");
        }
        targetPreview = `[Bình luận] ${(comment.content || "").slice(0, 80)}`;
        break;
      }
      case "recipe": {
        const recipe = await Recipe.findById(targetId).exec();
        if (!recipe) {
          throw new NotFoundError("Công thức được báo cáo không tồn tại hoặc đã bị xoá");
        }
        targetPreview = `[Công thức] ${recipe.title}`;
        break;
      }
      case "user": {
        const targetUser = await User.findById(targetId).exec();
        if (!targetUser) {
          throw new NotFoundError("Tài khoản người dùng được báo cáo không tồn tại");
        }
        targetPreview = `[Người dùng] ${targetUser.fullName || targetUser.email}`;
        break;
      }
      default:
        throw new BadRequestError("Loại đối tượng báo cáo không hợp lệ");
    }

    // 2. Prevent duplicate pending reports from the same reporter
    const existing = await reportRepository.findExistingPendingReport(
      reporterId,
      targetType,
      targetId
    );
    if (existing) {
      throw new ConflictError("Bạn đã gửi báo cáo cho nội dung này và đang chờ quản trị viên xử lý");
    }

    // 3. Save report
    return reportRepository.create({
      reporterId: new Types.ObjectId(reporterId),
      targetType,
      targetId: new Types.ObjectId(targetId),
      reason,
      description: description?.trim(),
      status: "pending",
      targetPreview,
    });
  }

  /**
   * Get list of reports (Admin)
   */
  async getReports(filter: ReportFilter = {}, page = 1, limit = 20) {
    return reportRepository.findReports(filter, page, limit);
  }

  /**
   * Get report detail by ID (Admin)
   */
  async getReportById(id: string): Promise<IReport> {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError("Báo cáo vi phạm không tồn tại");
    }
    return report;
  }

  /**
   * Resolve moderation report and optionally apply enforcement actions (Admin)
   */
  async resolveReport(
    reportId: string,
    adminId: string,
    input: ResolveReportInput
  ): Promise<IReport> {
    const report = await reportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError("Báo cáo vi phạm không tồn tại");
    }

    const { status, resolutionNotes, action = "none" } = input;
    const adminObjectId = new Types.ObjectId(adminId);

    // Apply enforcement action if requested
    if (action === "hide" || action === "delete" || status === "action_taken") {
      const targetIdStr = report.targetId.toString();

      if (report.targetType === "post") {
        const post = await Post.findById(targetIdStr).exec();
        if (post) {
          if (action === "delete") {
            await (post as any).softDelete(adminObjectId);
          } else {
            post.status = "hidden";
            await post.save();
          }
        }
      } else if (report.targetType === "comment") {
        const comment = await Comment.findById(targetIdStr).exec();
        if (comment) {
          await (comment as any).softDelete(adminObjectId);
        }
      } else if (report.targetType === "recipe") {
        const recipe = await Recipe.findById(targetIdStr).exec();
        if (recipe) {
          if (action === "delete") {
            await (recipe as any).softDelete(adminObjectId);
          } else {
            recipe.isActive = false;
            await recipe.save();
          }
        }
      } else if (report.targetType === "user" || action === "ban") {
        const targetUser = await User.findById(targetIdStr).exec();
        if (targetUser) {
          targetUser.isActive = false;
          await targetUser.save();
        }
      }
    }

    const updated = await reportRepository.update(reportId, {
      status,
      resolutionNotes: resolutionNotes?.trim(),
      resolvedBy: adminObjectId,
      resolvedAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundError("Không thể cập nhật báo cáo vi phạm");
    }

    return updated;
  }
}

export const reportService = new ReportService();
export default reportService;
