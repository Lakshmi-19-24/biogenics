import { Lead } from "../models/lead.model.js";
import { Order } from "../models/order.model.js";
import { Reminder } from "../models/reminder.model.js";
import { DailyReport } from "../models/dailyReport.model.js";
import { Visit } from "../models/visit.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/apiResponse.js";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

export const salesDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { start, end } = getTodayRange();

  const today = new Date().toISOString().slice(0, 10);

  /*
   * ==============================
   * LEADS
   * ==============================
   */

  const leadOwnerFilter = {
    $or: [
      { assignedTo: userId },
      { createdBy: userId }
    ]
  };

  const newLeadsFilter = {
    ...leadOwnerFilter,
    status: "new"
  };

  /*
   * Follow-up leads:
   * - explicitly marked follow_up
   * - OR nextFollowUpAt is today
   * - OR nextFollowUpAt is overdue
   */
const followUpFilter = {
  $and: [
    leadOwnerFilter,
    {
      status: {
        $nin: ["converted", "lost"]
      }
    },
    {
      $or: [
        { status: "follow_up" },
        {
          nextFollowUpAt: {
            $gte: start,
            $lt: end
          }
        },
        {
          nextFollowUpAt: {
            $lt: start
          }
        }
      ]
    }
  ]
};
  /*
   * ==============================
   * ORDERS
   * ==============================
   */

  const pendingOrdersFilter = {
    placedBy: userId,
    status: {
      $nin: ["fulfilled", "cancelled"]
    }
  };

  /*
   * ==============================
   * REMINDERS
   * ==============================
   */

  const remindersFilter = {
    $and: [
      {
        $or: [
          { assignedTo: userId },
          { createdBy: userId }
        ]
      },
      {
        status: "pending"
      },
      {
        dueAt: {
          $lt: end
        }
      }
    ]
  };

  /*
   * ==============================
   * DAILY REPORT
   * ==============================
   */

  /*
   * ==============================
   * TODAY'S VISITS
   * ==============================
   *
   * Visit model uses:
   * employee
   * createdAt
   *
   * There is no separate visitDate field.
   */

  const visitsFilter = {
    employee: userId,
    createdAt: {
      $gte: start,
      $lt: end
    }
  };

  const [
    totalLeads,
    totalOrders,
    totalVisits,
    newLeads,
    followUps,
    pendingOrders,
    dueReminders,
    todayReport
  ] = await Promise.all([
    /*
     * Total leads belonging to salesperson
     */
    Lead.countDocuments(leadOwnerFilter),

    /*
     * Total orders created by salesperson
     */
    Order.countDocuments({
      placedBy: userId
    }),

    /*
     * Today's visits
     */
    Visit.countDocuments(visitsFilter),

    /*
     * New leads
     */
    Lead.countDocuments(newLeadsFilter),

    /*
     * Follow-ups
     */
    Lead.countDocuments(followUpFilter),

    /*
     * Pending orders
     */
    Order.countDocuments(pendingOrdersFilter),

    /*
     * Due reminders
     */
    Reminder.countDocuments(remindersFilter),

    /*
     * Today's daily report
     */
    DailyReport.findOne({
      employee: userId,
      reportDate: today
    })
  ]);

  const dailyReportStatus = todayReport
    ? todayReport.status
    : "pending";

  sendResponse(res, 200, "Sales dashboard fetched", {
    stats: {
      leads: totalLeads,
      orders: totalOrders,
      visits: totalVisits,

      pendingTasks: {
        newLeads,
        followUps,
        orders: pendingOrders,
        reminders: dueReminders,

        dailyReport: dailyReportStatus === "pending",

        dailyReportStatus
      }
    }
  });
});