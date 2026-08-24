import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


import StatsCard from "../components/ui/StatsCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import PageHeader from "../components/ui/PageHeader";

import {
  Users,
  ShoppingCart,
  MapPin,
  ClipboardList,
  Target,
  Clock,
  ArrowRight,
  X,
  Bell,
  Phone,
  CalendarDays,
  ExternalLink,
} from "lucide-react";


import API, { collection } from "../services/api";

export default function SalesDashboard() {
  const navigate = useNavigate();


  const [stats, setStats] = useState(null);
  const [todaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Popup state
  const [popupType, setPopupType] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupItems, setPopupItems] = useState([]);
  const [popupError, setPopupError] = useState("");

 useEffect(() => {
  const loadSalesDashboard = async () => {
    try {
      const response = await API.get("/sales-dashboard");

      console.log("SALES DASHBOARD RESPONSE:", response);

      const summary =
        response?.data?.stats ||
        response?.data?.data?.stats ||
        response?.stats ||
        {};

      console.log("SALES DASHBOARD STATS:", summary);

      setStats({
        myLeads: Number(summary.leads || 0),

        myOrders: Number(summary.orders || 0),

        todayVisits: Number(summary.visits || 0),

        dcrStatus:
          summary.pendingTasks?.dailyReportStatus ||
          "pending",

        pendingTasks: {
          newLeads: Number(
            summary.pendingTasks?.newLeads || 0
          ),

          followUps: Number(
            summary.pendingTasks?.followUps || 0
          ),

          orders: Number(
            summary.pendingTasks?.orders || 0
          ),

          reminders: Number(
            summary.pendingTasks?.reminders || 0
          ),

          dailyReport:
            summary.pendingTasks?.dailyReport || false,

          dailyReportStatus:
            summary.pendingTasks?.dailyReportStatus ||
            "pending",
        },
      });
    } catch (error) {
      console.error(
        "Sales dashboard load failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  loadSalesDashboard();
}, []);

  /*
   * Load records for the selected pending-task popup.
   */
  const openPendingPopup = async (type) => {
    setPopupType(type);
    setPopupItems([]);
    setPopupError("");
    setPopupLoading(true);

    try {
      let items = [];

      // =========================
      // NEW LEADS
      // =========================
      if (type === "newLeads") {
        const response = await API.get("/leads?limit=100");

        const leads = collection(response.raw);

        items = leads.filter(
          (lead) => lead.status === "new"
        );
      }

      // =========================
      // FOLLOW-UPS
      // =========================
      if (type === "followUps") {
        const response = await API.get("/leads?limit=100");

        const leads = collection(response.raw);

        const now = new Date();

        items = leads.filter((lead) => {
          const isFollowUpStatus =
            lead.status === "follow_up";

          const isDueFollowUp =
            lead.nextFollowUpAt &&
            new Date(lead.nextFollowUpAt) <= now &&
            !["converted", "lost"].includes(
              lead.status
            );

          return isFollowUpStatus || isDueFollowUp;
        });
      }

      // =========================
      // PENDING ORDERS
      // =========================
      if (type === "orders") {
        const response = await API.get(
          "/orders?limit=100"
        );

        const orders = collection(response.raw);

        items = orders.filter((order) =>
          ["placed", "approved"].includes(
            order.status
          )
        );
      }

      // =========================
      // REMINDERS
      // =========================
      if (type === "reminders") {
        const response = await API.get("/reminders");

        const reminders = collection(response.raw);

        const now = new Date();

        items = reminders.filter((reminder) => {
          if (reminder.status !== "pending") {
            return false;
          }

          if (!reminder.dueAt) {
            return false;
          }

          return new Date(reminder.dueAt) <= now;
        });
      }

      setPopupItems(items);
    } catch (error) {
      console.error(
        `Failed to load ${type}:`,
        error
      );

      setPopupError(
        "Unable to load pending records. Please try again."
      );
    } finally {
      setPopupLoading(false);
    }
  };

  const closePopup = () => {
    setPopupType(null);
    setPopupItems([]);
    setPopupError("");
  };

  if (loading) {
    return (
      <LoadingSpinner text="Loading dashboard…" />
    );
  }

  const actions = [
    {
      label: "Add Lead",
      icon: Users,
      path: "/leads",
      gradient:
        "linear-gradient(135deg,#2563EB,#3B82F6)",
    },
    {
      label: "New Order",
      icon: ShoppingCart,
      path: "/orders",
      gradient:
        "linear-gradient(135deg,#0369a1,#0ea5e9)",
    },
    {
      label: "Check In",
      icon: MapPin,
      path: "/attendance",
      gradient:
        "linear-gradient(135deg,#d97706,#fbbf24)",
    },
    {
      label: "Log Activity",
      icon: ClipboardList,
      path: "/activity",
      gradient:
        "linear-gradient(135deg,#7c3aed,#a78bfa)",
    },
  ];

  const popupTitle = {
    newLeads: "New Leads",
    followUps: "Pending Follow-ups",
    orders: "Pending Orders",
    reminders: "Due Reminders",
  };

  const popupDescription = {
    newLeads:
      "New leads that require your attention.",
    followUps:
      "Follow-ups that are currently pending or due.",
    orders:
      "Orders that are placed or awaiting approval.",
    reminders:
      "Reminders that are currently due.",
  };

  const formatDateTime = (value) => {
    if (!value) return "No date";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "No date";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLeadName = (lead) =>
    lead.customerName ||
    lead.title ||
    "Unnamed Lead";

  const getOrderNumber = (order) =>
    order.invoiceNumber ||
    order.orderNo ||
    order.orderNumber ||
    String(order._id || "").slice(-8) ||
    "Order";

  const getReminderTitle = (reminder) =>
    reminder.title ||
    "Reminder";

  const getRecordId = (item) =>
    item?._id || item?.id;

  return (
    <div className="page-enter">

      <PageHeader
        eyebrow="Sales Executive"
        title="My Dashboard"
        subtitle="Your daily overview and quick actions"
      />

      {/* ================= STATS ================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(200px,1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
        className="stagger"
      >
        <StatsCard
          icon={Users}
          label="My Leads"
          value={stats?.myLeads || "0"}
          trend={stats?.leadsTrend}
          trendLabel="this week"
          color="primary"
        />

        <StatsCard
          icon={ShoppingCart}
          label="My Orders"
          value={stats?.myOrders || "0"}
          trend={stats?.ordersTrend}
          trendLabel="this week"
          color="success"
        />

        <StatsCard
          icon={MapPin}
          label="Today's Visits"
          value={stats?.todayVisits || "0"}
          color="warning"
        />

        <StatsCard
          icon={Target}
          label="DCR Status"
          value={stats?.dcrStatus || "Pending"}
          color="info"
        />
      </div>

      {/* ================= PENDING TASKS ================= */}

      <div
        className="card"
        style={{
          marginBottom: "24px",
          overflow: "hidden",
        }}
      >
        <div className="card-header">
          <h3>
            📋 Today's Pending Tasks
          </h3>
        </div>

        <div
          style={{
            padding: "20px",
            display: "grid",
            gap: "10px",
          }}
        >

          {/* ================= NEW LEADS ================= */}

          <button
            type="button"
            onClick={() =>
              openPendingPopup("newLeads")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: "10px",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2)";
              e.currentTarget.style.transform =
                "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
              e.currentTarget.style.transform =
                "translateX(0)";
            }}
          >
            <span>
              🔴 New Leads
            </span>

            <strong
              style={{
                float: "right",
                color: "var(--text)",
              }}
            >
              {stats?.pendingTasks?.newLeads || 0}
            </strong>
          </button>

          {/* ================= FOLLOW UPS ================= */}

          <button
            type="button"
            onClick={() =>
              openPendingPopup("followUps")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: "10px",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2)";
              e.currentTarget.style.transform =
                "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
              e.currentTarget.style.transform =
                "translateX(0)";
            }}
          >
            <span>
              🟡 Follow-ups
            </span>

            <strong
              style={{
                float: "right",
              }}
            >
              {stats?.pendingTasks?.followUps || 0}
            </strong>
          </button>

          {/* ================= DAILY REPORT ================= */}

          <button
            type="button"
            onClick={() =>
              navigate("/reports")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: "10px",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2)";
              e.currentTarget.style.transform =
                "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
              e.currentTarget.style.transform =
                "translateX(0)";
            }}
          >
            {stats?.pendingTasks?.dailyReportStatus ===
            "submitted"
              ? "🟢 Daily Report — Submitted"
              : "🔴 Daily Report — Pending"}

            <span
              style={{
                float: "right",
                color: "var(--text-muted)",
                fontSize: "12px",
              }}
            >
              View
              <ArrowRight
                size={13}
                style={{
                  display: "inline",
                  marginLeft: "4px",
                  verticalAlign: "middle",
                }}
              />
            </span>
          </button>

          {/* ================= ORDERS ================= */}

          <button
            type="button"
            onClick={() =>
              openPendingPopup("orders")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: "10px",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2)";
              e.currentTarget.style.transform =
                "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
              e.currentTarget.style.transform =
                "translateX(0)";
            }}
          >
            <span>
              🔵 Orders
            </span>

            <strong
              style={{
                float: "right",
              }}
            >
              {stats?.pendingTasks?.orders || 0}
            </strong>
          </button>

          {/* ================= REMINDERS ================= */}

          <button
            type="button"
            onClick={() =>
              openPendingPopup("reminders")
            }
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              color: "var(--text)",
              cursor: "pointer",
              textAlign: "left",
              padding: "10px 8px",
              borderRadius: "10px",
              fontSize: "15px",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "var(--surface-2)";
              e.currentTarget.style.transform =
                "translateX(3px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "transparent";
              e.currentTarget.style.transform =
                "translateX(0)";
            }}
          >
            <span>
              🟣 Reminders
            </span>

            <strong
              style={{
                float: "right",
              }}
            >
              {stats?.pendingTasks?.reminders || 0}
            </strong>
          </button>

        </div>
      </div>

      {/* ================= QUICK ACTIONS ================= */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >

        <p
          style={{
            fontFamily:
              "'Bricolage Grotesque',sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "var(--text)",
            letterSpacing: "-0.03em",
            marginBottom: "14px",
          }}
        >
          Quick Actions
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "14px",
          }}
        >

          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() =>
                navigate(a.path)
              }
              style={{
                padding: "20px",
                borderRadius: "var(--r-xl)",
                background: a.gradient,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                color: "white",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow:
                  "0 4px 20px rgba(0,0,0,0.15)",
                transition:
                  "transform var(--t-spring),box-shadow var(--t)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-3px)";

                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(0,0,0,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";

                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >

              <div
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background:
                    "rgba(255,255,255,0.10)",
                }}
              />

              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background:
                    "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <a.icon
                  size={20}
                  color="white"
                />
              </div>

              <div>

                <p
                  style={{
                    fontFamily:
                      "'Bricolage Grotesque',sans-serif",
                    fontWeight: 700,
                    fontSize: "15px",
                    letterSpacing:
                      "-0.02em",
                  }}
                >
                  {a.label}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color:
                      "rgba(255,255,255,0.6)",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                >
                  Tap to open
                  <ArrowRight size={11} />
                </div>

              </div>

            </button>
          ))}

        </div>
      </div>

      {/* ================= TODAY'S SCHEDULE ================= */}

      <div
        className="card"
        style={{
          overflow: "hidden",
        }}
      >

        <div
          className="card-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
          }}
        >

          <p
            style={{
              fontFamily:
                "'Bricolage Grotesque',sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing:
                "-0.03em",
            }}
          >
            Today's Schedule
          </p>

          <button
            onClick={() =>
              navigate("/activity")
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--emerald)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            View All
            <ArrowRight size={13} />
          </button>

        </div>

        {todaySchedule.length > 0 ? (

          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {todaySchedule.map((item, i) => (

              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "var(--r)",
                  background:
                    "var(--surface-2)",
                  border:
                    "1px solid var(--border)",
                }}
              >

                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background:
                      "var(--emerald-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                  }}
                >
                  <MapPin
                    size={16}
                    style={{
                      color:
                        "var(--emerald)",
                    }}
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                  }}
                >

                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color:
                        "var(--text)",
                    }}
                  >
                    {item.title}
                  </p>

                  <p
                    style={{
                      fontSize: "12px",
                      color:
                        "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    <Clock
                      size={11}
                      style={{
                        display:
                          "inline",
                        marginRight:
                          "4px",
                      }}
                    />
                    {item.time} ·{" "}
                    {item.location}
                  </p>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <EmptyState
            icon={ClipboardList}
            title="No activities scheduled"
            description="Log an activity to see it here."
            action={() =>
              navigate("/activity")
            }
            actionLabel="Log Activity"
          />

        )}

      </div>

      {/* =========================================================
          PENDING TASK POPUP / MODAL
         ========================================================= */}

      {popupType && (
        <div
          onClick={closePopup}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.60)",
            backdropFilter:
              "blur(5px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight:
                "calc(100vh - 80px)",
              background:
                "var(--surface)",
              border:
                "1px solid var(--border)",
              borderRadius: "20px",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.40)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                padding:
                  "20px 22px",
                borderBottom:
                  "1px solid var(--border)",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 800,
                    color:
                      "var(--text)",
                  }}
                >
                  {popupTitle[popupType]}
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    fontSize:
                      "13px",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  {popupDescription[
                    popupType
                  ]}
                </p>
              </div>

              <button
                type="button"
                onClick={closePopup}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid var(--border)",
                  background:
                    "var(--surface-2)",
                  color:
                    "var(--text)",
                  cursor:
                    "pointer",
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                }}
              >
                <X size={18} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div
              style={{
                padding: "16px",
                overflowY: "auto",
              }}
            >

              {popupLoading && (
                <div
                  style={{
                    padding:
                      "50px 20px",
                    textAlign:
                      "center",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Loading pending records...
                </div>
              )}

              {!popupLoading &&
                popupError && (
                  <div
                    style={{
                      padding:
                        "30px",
                      textAlign:
                        "center",
                      color:
                        "#ef4444",
                    }}
                  >
                    {popupError}
                  </div>
                )}

              {!popupLoading &&
                !popupError &&
                popupItems.length === 0 && (
                  <div
                    style={{
                      padding:
                        "50px 20px",
                      textAlign:
                        "center",
                    }}
                  >
                    <div
                      style={{
                        width:
                          "52px",
                        height:
                          "52px",
                        borderRadius:
                          "50%",
                        background:
                          "var(--surface-2)",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        margin:
                          "0 auto 12px",
                      }}
                    >
                      <ClipboardList
                        size={24}
                        style={{
                          color:
                            "var(--text-muted)",
                        }}
                      />
                    </div>

                    <p
                      style={{
                        fontWeight:
                          700,
                        color:
                          "var(--text)",
                        marginBottom:
                          "5px",
                      }}
                    >
                      No pending items
                    </p>

                    <p
                      style={{
                        fontSize:
                          "13px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      Everything is up to date.
                    </p>
                  </div>
                )}

              {!popupLoading &&
                !popupError &&
                popupItems.map(
                  (item, index) => {
                    const id =
                      getRecordId(
                        item
                      );

                    return (
                      <div
                        key={
                          id ||
                          index
                        }
                        style={{
                          padding:
                            "16px",
                          marginBottom:
                            "10px",
                          border:
                            "1px solid var(--border)",
                          borderRadius:
                            "14px",
                          background:
                            "var(--surface-2)",
                        }}
                      >

                        {/* LEAD */}

                        {(popupType ===
                          "newLeads" ||
                          popupType ===
                            "followUps") && (
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "12px",
                              alignItems:
                                "flex-start",
                            }}
                          >

                            <div
                              style={{
                                width:
                                  "42px",
                                height:
                                  "42px",
                                borderRadius:
                                  "12px",
                                background:
                                  "rgba(37,99,235,0.12)",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink:
                                  0,
                              }}
                            >
                              <Users
                                size={
                                  20
                                }
                                style={{
                                  color:
                                    "#2563EB",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                flex:
                                  1,
                                minWidth:
                                  0,
                              }}
                            >

                              <p
                                style={{
                                  margin:
                                    0,
                                  fontSize:
                                    "15px",
                                  fontWeight:
                                    800,
                                  color:
                                    "var(--text)",
                                }}
                              >
                                {getLeadName(
                                  item
                                )}
                              </p>

                              {item.phone && (
                                <p
                                  style={{
                                    margin:
                                      "6px 0 0",
                                    fontSize:
                                      "13px",
                                    color:
                                      "var(--text-muted)",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap:
                                      "5px",
                                  }}
                                >
                                  <Phone
                                    size={
                                      13
                                    }
                                  />
                                  {item.phone}
                                </p>
                              )}

                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap:
                                    "7px",
                                  marginTop:
                                    "8px",
                                }}
                              >

                                <span
                                  style={{
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      700,
                                    padding:
                                      "4px 8px",
                                    borderRadius:
                                      "999px",
                                    background:
                                      "rgba(239,68,68,0.12)",
                                    color:
                                      "#ef4444",
                                  }}
                                >
                                  {item.status ||
                                    "new"}
                                </span>

                                {item.nextFollowUpAt && (
                                  <span
                                    style={{
                                      fontSize:
                                        "11px",
                                      color:
                                        "var(--text-muted)",
                                      display:
                                        "flex",
                                      alignItems:
                                        "center",
                                      gap:
                                        "4px",
                                    }}
                                  >
                                    <CalendarDays
                                      size={
                                        12
                                      }
                                    />
                                    {formatDateTime(
                                      item.nextFollowUpAt
                                    )}
                                  </span>
                                )}

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                closePopup();
                                if (
                                  id
                                ) {
                                  navigate(
                                    `/leads/${id}`
                                  );
                                } else {
                                  navigate(
                                    "/leads"
                                  );
                                }
                              }}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "4px",
                                padding:
                                  "7px 10px",
                                border:
                                  "1px solid var(--border)",
                                borderRadius:
                                  "8px",
                                background:
                                  "var(--surface)",
                                color:
                                  "var(--text)",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                                flexShrink:
                                  0,
                              }}
                            >
                              View
                              <ExternalLink
                                size={
                                  12
                                }
                              />
                            </button>

                          </div>
                        )}

                        {/* ORDER */}

                        {popupType ===
                          "orders" && (
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "12px",
                              alignItems:
                                "center",
                            }}
                          >

                            <div
                              style={{
                                width:
                                  "42px",
                                height:
                                  "42px",
                                borderRadius:
                                  "12px",
                                background:
                                  "rgba(14,165,233,0.12)",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink:
                                  0,
                              }}
                            >
                              <ShoppingCart
                                size={
                                  20
                                }
                                style={{
                                  color:
                                    "#0ea5e9",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                flex:
                                  1,
                              }}
                            >

                              <p
                                style={{
                                  margin:
                                    0,
                                  fontSize:
                                    "15px",
                                  fontWeight:
                                    800,
                                  color:
                                    "var(--text)",
                                }}
                              >
                                {getOrderNumber(
                                  item
                                )}
                              </p>

                              <p
                                style={{
                                  margin:
                                    "5px 0 0",
                                  fontSize:
                                    "13px",
                                  color:
                                    "var(--text-muted)",
                                }}
                              >
                                Status:{" "}
                                {item.status ||
                                  "Pending"}
                              </p>

                              {item.grandTotal !==
                                undefined && (
                                <p
                                  style={{
                                    margin:
                                      "4px 0 0",
                                    fontSize:
                                      "13px",
                                    fontWeight:
                                      700,
                                    color:
                                      "var(--text)",
                                  }}
                                >
                                  ₹
                                  {Number(
                                    item.grandTotal ||
                                      0
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              )}

                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                closePopup();

                                if (
                                  id
                                ) {
                                  navigate(
                                    `/orders/${id}`
                                  );
                                } else {
                                  navigate(
                                    "/orders"
                                  );
                                }
                              }}
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap:
                                  "4px",
                                padding:
                                  "7px 10px",
                                border:
                                  "1px solid var(--border)",
                                borderRadius:
                                  "8px",
                                background:
                                  "var(--surface)",
                                color:
                                  "var(--text)",
                                cursor:
                                  "pointer",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  700,
                              }}
                            >
                              View
                              <ExternalLink
                                size={
                                  12
                                }
                              />
                            </button>

                          </div>
                        )}

                        {/* REMINDER */}

                        {popupType ===
                          "reminders" && (
                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "12px",
                              alignItems:
                                "flex-start",
                            }}
                          >

                            <div
                              style={{
                                width:
                                  "42px",
                                height:
                                  "42px",
                                borderRadius:
                                  "12px",
                                background:
                                  "rgba(124,58,237,0.12)",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                flexShrink:
                                  0,
                              }}
                            >
                              <Bell
                                size={
                                  20
                                }
                                style={{
                                  color:
                                    "#7c3aed",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                flex:
                                  1,
                              }}
                            >

                              <p
                                style={{
                                  margin:
                                    0,
                                  fontSize:
                                    "15px",
                                  fontWeight:
                                    800,
                                  color:
                                    "var(--text)",
                                }}
                              >
                                {getReminderTitle(
                                  item
                                )}
                              </p>

                              {item.description && (
                                <p
                                  style={{
                                    margin:
                                      "6px 0 0",
                                    fontSize:
                                      "13px",
                                    lineHeight:
                                      1.5,
                                    color:
                                      "var(--text-muted)",
                                  }}
                                >
                                  {
                                    item.description
                                  }
                                </p>
                              )}

                              {item.dueAt && (
                                <p
                                  style={{
                                    margin:
                                      "8px 0 0",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#ef4444",
                                    fontWeight:
                                      700,
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap:
                                      "5px",
                                  }}
                                >
                                  <Clock
                                    size={
                                      13
                                    }
                                  />
                                  Due:{" "}
                                  {formatDateTime(
                                    item.dueAt
                                  )}
                                </p>
                              )}

                            </div>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

            </div>

            {/* MODAL FOOTER */}

            <div
              style={{
                padding:
                  "14px 18px",
                borderTop:
                  "1px solid var(--border)",
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "8px",
              }}
            >

              {popupType ===
                "newLeads" && (
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    navigate(
                      "/leads"
                    );
                  }}
                  className="btn-primary"
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "6px",
                  }}
                >
                  View All Leads
                  <ArrowRight
                    size={14}
                  />
                </button>
              )}

              {popupType ===
                "followUps" && (
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    navigate(
                      "/leads"
                    );
                  }}
                  className="btn-primary"
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "6px",
                  }}
                >
                  View All Leads
                  <ArrowRight
                    size={14}
                  />
                </button>
              )}

              {popupType ===
                "orders" && (
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    navigate(
                      "/orders"
                    );
                  }}
                  className="btn-primary"
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "6px",
                  }}
                >
                  View All Orders
                  <ArrowRight
                    size={14}
                  />
                </button>
              )}

              {popupType ===
                "reminders" && (
                <button
                  type="button"
                  onClick={() => {
                    closePopup();
                    navigate(
                      "/reminders"
                    );
                  }}
                  className="btn-primary"
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "6px",
                  }}
                >
                  View All Reminders
                  <ArrowRight
                    size={14}
                  />
                </button>
              )}

              <button
                type="button"
                onClick={closePopup}
                style={{
                  padding:
                    "8px 14px",
                  borderRadius:
                    "8px",
                  border:
                    "1px solid var(--border)",
                  background:
                    "var(--surface-2)",
                  color:
                    "var(--text)",
                  cursor:
                    "pointer",
                  fontWeight:
                    600,
                }}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}