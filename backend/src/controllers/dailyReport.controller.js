import { DailyReport } from "../models/dailyReport.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";
import { getPagination } from "../utils/pagination.js";
import {
  emitToAdmins,
  notifyRoles,
} from "../services/notification.service.js";
import { MANAGEMENT_ROLES } from "../constants/roles.js";

const today = () =>
  new Date().toISOString().slice(0, 10);

// =====================================================
// SUBMIT DAILY REPORT
// Every submission creates a NEW report.
// Multiple reports on the same date are allowed.
// =====================================================

export const submitDailyReport =
  asyncHandler(async (req, res) => {
    const reportDate =
      req.body.reportDate || today();

    const report =
      await DailyReport.create({
        employee: req.user._id,

        reportDate,

        visits: Array.isArray(req.body.visits)
          ? req.body.visits
          : [],

        callsMade: Number(
          req.body.callsMade || 0
        ),

        leadsCreated: Number(
          req.body.leadsCreated || 0
        ),

        ordersBooked: Number(
          req.body.ordersBooked || 0
        ),

        paymentsCollected: Number(
          req.body.paymentsCollected || 0
        ),

        summary: String(
          req.body.summary || ""
        ).trim(),

        blockers: String(
          req.body.blockers || ""
        ).trim(),

        tomorrowPlan: String(
          req.body.tomorrowPlan || ""
        ).trim(),

        status: "submitted",

        replies: [],
      });

    const populatedReport =
      await DailyReport.findById(
        report._id
      )
        .populate(
          "employee",
          "name email role"
        )
        .populate(
          "replies.user",
          "name email role"
        );

    emitToAdmins(
      "daily-report:submitted",
      populatedReport
    );

    await notifyRoles(
      MANAGEMENT_ROLES,
      {
        title:
          "Daily report submitted",

        message:
          `${req.user.name} submitted a daily report for ${reportDate}.`,

        type: "system",

        excludeUser:
          req.user._id,

        data: {
          action:
            "daily_report_submitted",

          reportId:
            report._id.toString(),

          reportDate,
        },
      }
    );

    sendResponse(
      res,
      201,
      "Daily report submitted",
      populatedReport
    );
  });

// =====================================================
// LIST ALL DAILY REPORTS
// =====================================================

export const listDailyReports =
  asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      skip,
    } = getPagination(
      req.query
    );

    const filter = {};

    if (req.query.employee) {
      filter.employee =
        req.query.employee;
    }

    if (req.query.reportDate) {
      filter.reportDate =
        req.query.reportDate;
    }

    if (req.query.status) {
      filter.status =
        req.query.status;
    }
    if (req.query.visitId) {
  filter.visits = req.query.visitId;
}

    const [
      items,
      total,
    ] = await Promise.all([
      DailyReport.find(filter)
        .populate(
          "employee",
          "name email role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "replies.user",
          "name email role"
        )
        .skip(skip)
        .limit(limit)
        .sort({
          reportDate: -1,
          createdAt: -1,
        }),

      DailyReport.countDocuments(
        filter
      ),
    ]);

    sendResponse(
      res,
      200,
      "Daily reports fetched",
      {
        items,
        page,
        limit,
        total,
      }
    );
  });

// =====================================================
// LIST MY DAILY REPORTS
// =====================================================

export const listMyDailyReports =
  asyncHandler(async (req, res) => {
    const {
      page,
      limit,
      skip,
    } = getPagination(
      req.query
    );

    const filter = {
      employee: req.user._id,
    };

    if (req.query.reportDate) {
      filter.reportDate =
        req.query.reportDate;
    }

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    const [
      items,
      total,
    ] = await Promise.all([
      DailyReport.find(filter)
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "replies.user",
          "name email role"
        )
        .skip(skip)
        .limit(limit)
        .sort({
          reportDate: -1,
          createdAt: -1,
        }),

      DailyReport.countDocuments(
        filter
      ),
    ]);

    sendResponse(
      res,
      200,
      "My daily reports fetched",
      {
        items,
        page,
        limit,
        total,
      }
    );
  });

// =====================================================
// REVIEW DAILY REPORT
// =====================================================

export const reviewDailyReport =
  asyncHandler(async (req, res) => {
    const status =
      req.body.status;

    const update = {
      status,
    };

    if (status === "submitted") {
      update.reviewNote =
        undefined;

      update.reviewedBy =
        undefined;

      update.reviewedAt =
        undefined;
    } else {
      update.reviewNote =
        req.body.reviewNote || "";

      update.reviewedBy =
        req.user._id;

      update.reviewedAt =
        new Date();
    }

    const report =
      await DailyReport.findByIdAndUpdate(
        req.params.id,
        update,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "employee",
          "name email role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "replies.user",
          "name email role"
        );

    if (!report) {
      throw new ApiError(
        404,
        "Daily report not found"
      );
    }

    sendResponse(
      res,
      200,
      "Daily report updated",
      report
    );
  });

// =====================================================
// REPLY TO DAILY REPORT REVIEW
// =====================================================

export const replyToDailyReport =
  asyncHandler(async (req, res) => {
    const {
      message,
    } = req.body;

    if (
      !message ||
      !message.trim()
    ) {
      throw new ApiError(
        400,
        "Reply message is required"
      );
    }

    const report =
      await DailyReport.findById(
        req.params.id
      );

    if (!report) {
      throw new ApiError(
        404,
        "Daily report not found"
      );
    }

    // Sales employee can reply
    // only to their own report.
    if (
      req.user.role === "sales" &&
      String(
        report.employee
      ) !==
        String(req.user._id)
    ) {
      throw new ApiError(
        403,
        "You can only reply to your own daily reports"
      );
    }

    report.replies.push({
      user: req.user._id,
      message:
        message.trim(),
    });

    await report.save();

    const updatedReport =
      await DailyReport.findById(
        report._id
      )
        .populate(
          "employee",
          "name email role"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "replies.user",
          "name email role"
        );

    sendResponse(
      res,
      200,
      "Reply added successfully",
      updatedReport
    );
  });