import mongoose, { Types } from "mongoose";
import Report, { IReport, ReportStatus, ReportTargetType } from "../models/Report";

export interface ReportFilter {
  status?: ReportStatus | "all";
  targetType?: ReportTargetType;
}

export class ReportRepository {
  async create(data: Partial<IReport>): Promise<IReport> {
    const report = new Report(data);
    return report.save();
  }

  async findExistingPendingReport(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string
  ): Promise<IReport | null> {
    if (!Types.ObjectId.isValid(reporterId) || !Types.ObjectId.isValid(targetId)) {
      return null;
    }
    return Report.findOne({
      reporterId: new Types.ObjectId(reporterId),
      targetType,
      targetId: new Types.ObjectId(targetId),
      status: "pending",
    }).exec();
  }

  async findById(id: string): Promise<IReport | null> {
    if (!id || !Types.ObjectId.isValid(id)) return null;
    return Report.findById(id)
      .populate("reporterId", "firstName lastName fullName email avatar")
      .populate("resolvedBy", "firstName lastName fullName email")
      .exec();
  }

  async findReports(
    filter: ReportFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ reports: IReport[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, any> = {};

    if (filter.status && filter.status !== "all") {
      query.status = filter.status;
    }

    if (filter.targetType) {
      query.targetType = filter.targetType;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporterId", "firstName lastName fullName email avatar")
        .populate("resolvedBy", "firstName lastName fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Report.countDocuments(query).exec(),
    ]);

    return {
      reports,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async update(id: string, data: Partial<IReport>): Promise<IReport | null> {
    if (!id || !Types.ObjectId.isValid(id)) return null;
    return Report.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    })
      .populate("reporterId", "firstName lastName fullName email avatar")
      .populate("resolvedBy", "firstName lastName fullName email")
      .exec();
  }

  async countPending(): Promise<number> {
    return Report.countDocuments({ status: "pending" }).exec();
  }
}

export const reportRepository = new ReportRepository();
export default reportRepository;
