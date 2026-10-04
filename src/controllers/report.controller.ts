import { Request, Response } from "express";
import { reportService } from "../services/report.service";
import { asyncHandler } from "../utils/asyncHandler";

export class ReportController {
  /**
   * User submits a new report
   */
  createReport = asyncHandler(async (req: Request, res: Response) => {
    const reporterId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
    const result = await reportService.createReport(reporterId, req.body);

    res.status(201).json({
      success: true,
      message: "Báo cáo của bạn đã được tiếp nhận và sẽ được kiểm duyệt sớm nhất",
      data: result,
    });
  });

  /**
   * Admin retrieves paginated reports
   */
  getReports = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const status = (req.query.status as any) || "all";
    const targetType = req.query.targetType as any;

    const result = await reportService.getReports({ status, targetType }, page, limit);

    res.status(200).json({
      success: true,
      data: result.reports,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  });

  /**
   * Admin retrieves single report detail
   */
  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const report = await reportService.getReportById(reportId);

    res.status(200).json({
      success: true,
      data: report,
    });
  });

  /**
   * Admin resolves/moderates report
   */
  resolveReport = asyncHandler(async (req: Request, res: Response) => {
    const adminId = (req.user as any)?.id || (req.user as any)?._id?.toString();
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await reportService.resolveReport(reportId, adminId, req.body);

    res.status(200).json({
      success: true,
      message: "Báo cáo vi phạm đã được cập nhật thành công",
      data: result,
    });
  });
}

export const reportController = new ReportController();
export default reportController;
