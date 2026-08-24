import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { MessageCircle, Send } from "lucide-react";

const inputStyle = {
  width: "100%",
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "10px 12px",
  fontSize: "13px",
  outline: "none",
};

const titleCase = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );

export default function DailyReports() {
  const { user } = useAuth();

  const isManagement = [
    "owner",
    "admin",
    "manager",
  ].includes(user?.role);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review
  const [reviewOpen, setReviewOpen] =
    useState(false);

  // Reply
  const [replyOpen, setReplyOpen] =
    useState(false);

  const [activeReport, setActiveReport] =
    useState(null);

  const [replyText, setReplyText] =
    useState("");

  const [replySending, setReplySending] =
    useState(false);

  const [review, setReview] = useState({
    status: "reviewed",
    reviewNote: "",
  });

  // =====================================================
  // LOAD REPORTS
  // =====================================================

  const load = async () => {
    setLoading(true);

    try {
      const response = await API.get(
        isManagement
          ? "/daily-reports?limit=100"
          : "/daily-reports/mine?limit=100"
      );

      setReports(apiItems(response));
    } catch (error) {
      console.error(
        "Failed to load daily reports:",
        error
      );

      toast.error(
        apiErrorMessage(
          error,
          "Failed to load daily reports"
        )
      );

      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagement]);

  // =====================================================
  // OPEN REVIEW
  // =====================================================

  const openReview = (report) => {
    if (!isManagement) return;

    setActiveReport(report);

    setReview({
      status:
        report.status === "rejected"
          ? "rejected"
          : report.status === "reviewed"
          ? "reviewed"
          : "submitted",

      reviewNote:
        report.reviewNote || "",
    });

    setReviewOpen(true);
  };

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const submitReview = async (event) => {
    event.preventDefault();

    if (!activeReport) return;

    try {
      const response = await API.patch(
        `/daily-reports/${
          activeReport._id ||
          activeReport.id
        }/review`,
        review
      );

      toast.success(
        "Report reviewed successfully"
      );

      // Update active report immediately
      const updated =
        response?.data?.data ||
        response?.data;

      if (updated) {
        setActiveReport(updated);
      }

      setReviewOpen(false);

      await load();
    } catch (error) {
      console.error(
        "Failed to review report:",
        error
      );

      toast.error(
        apiErrorMessage(
          error,
          "Failed to review report"
        )
      );
    }
  };

  // =====================================================
  // OPEN REPLY
  // =====================================================

  const openReply = (report) => {
    setActiveReport(report);
    setReplyText("");
    setReplyOpen(true);
  };

  // =====================================================
  // SEND REPLY
  // =====================================================

  const sendReply = async (event) => {
    event.preventDefault();

    if (!activeReport) return;

    if (!replyText.trim()) {
      toast.error(
        "Please enter a reply"
      );
      return;
    }

    setReplySending(true);

    try {
      const response = await API.post(
        `/daily-reports/${
          activeReport._id ||
          activeReport.id
        }/reply`,
        {
          message:
            replyText.trim(),
        }
      );

      const updatedReport =
        response?.data?.data ||
        response?.data;

      if (updatedReport) {
        setActiveReport(
          updatedReport
        );

        setReports(
          (previous) =>
            previous.map(
              (report) =>
                String(
                  report._id ||
                    report.id
                ) ===
                String(
                  activeReport._id ||
                    activeReport.id
                )
                  ? updatedReport
                  : report
            )
        );
      }

      setReplyText("");

      toast.success(
        "Reply sent successfully"
      );

      await load();
    } catch (error) {
      console.error(
        "Failed to send reply:",
        error
      );

      toast.error(
        apiErrorMessage(
          error,
          "Failed to send reply"
        )
      );
    } finally {
      setReplySending(false);
    }
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    {
      header: "Date",
      accessor: "reportDate",

      render: (row) => (
        <span
          style={{
            fontWeight: 700,
          }}
        >
          {row.reportDate
            ? new Date(
                row.reportDate
              ).toLocaleDateString(
                "en-IN"
              )
            : "-"}
        </span>
      ),
    },

    {
      header: "Employee",
      accessor: "employee",

      render: (row) =>
        row.employee?.name ||
        user?.name ||
        "-",
    },

    {
      header: "Calls",
      accessor: "callsMade",

      render: (row) =>
        String(
          row.callsMade ?? 0
        ),
    },

    {
      header: "Leads",
      accessor: "leadsCreated",

      render: (row) =>
        String(
          row.leadsCreated ?? 0
        ),
    },

    {
      header: "Orders",
      accessor: "ordersBooked",

      render: (row) =>
        String(
          row.ordersBooked ?? 0
        ),
    },

    {
      header: "Collected",
      accessor: "paymentsCollected",

      render: (row) => (
        <span
          style={{
            fontWeight: 700,
          }}
        >
          INR{" "}
          {Number(
            row.paymentsCollected ||
              0
          ).toLocaleString()}
        </span>
      ),
    },

    {
      header: "Status",
      accessor: "status",

      render: (row) => (
        <StatusBadge
          status={titleCase(
            row.status ||
              "submitted"
          )}
        />
      ),
    },

    {
      header: "Summary",
      accessor: "summary",

      render: (row) => (
        <span
          style={{
            color:
              "var(--text-muted)",
          }}
        >
          {row.summary || "-"}
        </span>
      ),
    },

    // =================================================
    // REVIEW
    // =================================================

    {
      header: "Review",
      accessor: "reviewNote",

      render: (row) => (
        <div
          style={{
            minWidth: "220px",
            maxWidth: "320px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: "5px",
            }}
          >
            {row.status ===
            "reviewed"
              ? "✅ Reviewed"
              : row.status ===
                "rejected"
              ? "❌ Rejected"
              : "⏳ Pending"}
          </div>

          {row.reviewNote ? (
            <div
              style={{
                fontSize: "12px",
                color:
                  "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              📝{" "}
              {row.reviewNote}
            </div>
          ) : (
            <span
              style={{
                fontSize: "12px",
                color:
                  "var(--text-muted)",
              }}
            >
              No review note yet
            </span>
          )}

          {row.reviewedAt && (
            <div
              style={{
                fontSize: "11px",
                color:
                  "var(--text-muted)",
                marginTop: "5px",
              }}
            >
              Reviewed on{" "}
              {new Date(
                row.reviewedAt
              ).toLocaleDateString(
                "en-IN"
              )}
            </div>
          )}
        </div>
      ),
    },

    // =================================================
    // REPLY
    // =================================================

    {
      header: "Action",
      accessor: "_id",

      render: (row) => (
        <button
          type="button"
          className="btn-ghost"
          style={{
            color: "#2563eb",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
          onClick={(event) => {
            event.stopPropagation();
            openReply(row);
          }}
        >
          <MessageCircle
            size={15}
          />

          Reply

          {Array.isArray(
            row.replies
          ) &&
            row.replies.length >
              0 && (
              <span
                style={{
                  background:
                    "#2563eb",
                  color: "#fff",
                  borderRadius:
                    "999px",
                  padding:
                    "1px 6px",
                  fontSize:
                    "10px",
                }}
              >
                {
                  row.replies
                    .length
                }
              </span>
            )}
        </button>
      ),
    },
  ];

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <LoadingSpinner
        text="Loading daily reports..."
      />
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="page-enter">

      <PageHeader
        eyebrow="Reporting"
        title="Daily Reports"
        subtitle={
          isManagement
            ? "Review team daily activity reports"
            : "Your submitted daily reports"
        }
      />

      <DataTable
        columns={columns}
        data={reports}
        pageSize={15}

        onRowClick={
          isManagement
            ? openReview
            : undefined
        }

        emptyMessage="No daily reports yet."
      />

      {/* =================================================
          REVIEW MODAL
          ================================================= */}

      <Modal
        isOpen={reviewOpen}
        onClose={() =>
          setReviewOpen(false)
        }
        title="Review Daily Report"
        size="md"
      >
        <form
          onSubmit={submitReview}
        >
          {activeReport && (
            <div
              style={{
                marginBottom:
                  "16px",
                padding: "14px",
                borderRadius:
                  "var(--r)",
                background:
                  "var(--surface-2)",
                border:
                  "1px solid var(--border)",
              }}
            >
              <p
                style={{
                  fontWeight: 800,
                }}
              >
                {activeReport
                  .employee?.name ||
                  "Employee"}{" "}
                -{" "}
                {
                  activeReport.reportDate
                }
              </p>

              <p
                style={{
                  marginTop:
                    "6px",
                  fontSize:
                    "13px",
                  color:
                    "var(--text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {
                  activeReport.summary
                }
              </p>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            <FormField label="Decision">
              <select
                value={
                  review.status
                }
                onChange={(event) =>
                  setReview({
                    ...review,
                    status:
                      event.target
                        .value,
                  })
                }
                style={inputStyle}
              >
                <option value="submitted">
                  Pending
                </option>

                <option value="reviewed">
                  Reviewed
                </option>

                <option value="rejected">
                  Rejected
                </option>
              </select>
            </FormField>

            <FormField label="Review Note">
              <textarea
                value={
                  review.reviewNote
                }
                rows={4}
                placeholder="Enter your review, observation or feedback..."
                onChange={(event) =>
                  setReview({
                    ...review,
                    reviewNote:
                      event.target
                        .value,
                  })
                }
                style={{
                  ...inputStyle,
                  resize:
                    "vertical",
                }}
              />
            </FormField>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop:
                "20px",
              paddingTop:
                "16px",
              borderTop:
                "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                setReviewOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              Save Review
            </button>
          </div>
        </form>
      </Modal>

      {/* =================================================
          REPLY / CONVERSATION MODAL
          ================================================= */}

      <Modal
        isOpen={replyOpen}
        onClose={() => {
          if (!replySending) {
            setReplyOpen(false);
            setReplyText("");
          }
        }}
        title={
          activeReport
            ? `Report Conversation - ${activeReport.reportDate}`
            : "Report Conversation"
        }
        size="lg"
      >
        {activeReport && (
          <div>

            {/* REPORT INFO */}

            <div
              style={{
                padding: "14px",
                marginBottom:
                  "16px",
                borderRadius:
                  "var(--r)",
                background:
                  "var(--surface-2)",
                border:
                  "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                }}
              >
                {activeReport
                  .employee?.name ||
                  user?.name ||
                  "Employee"}
              </div>

              <div
                style={{
                  fontSize:
                    "13px",
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "4px",
                }}
              >
                Report Date:{" "}
                {
                  activeReport.reportDate
                }
              </div>

              {activeReport
                .reviewNote && (
                <div
                  style={{
                    marginTop:
                      "10px",
                    padding:
                      "10px",
                    borderRadius:
                      "8px",
                    background:
                      "var(--surface)",
                    border:
                      "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontWeight:
                        700,
                      marginBottom:
                        "5px",
                    }}
                  >
                    📝 Team Head / Management Review
                  </div>

                  <div
                    style={{
                      fontSize:
                        "13px",
                      lineHeight:
                        1.5,
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {
                      activeReport.reviewNote
                    }
                  </div>
                </div>
              )}
            </div>

            {/* CONVERSATION */}

            <div
              style={{
                display:
                  "flex",
                flexDirection:
                  "column",
                gap: "10px",
                maxHeight:
                  "320px",
                overflowY:
                  "auto",
                marginBottom:
                  "16px",
                padding:
                  "4px",
              }}
            >
              {Array.isArray(
                activeReport.replies
              ) &&
              activeReport.replies
                .length > 0 ? (
                activeReport.replies.map(
                  (
                    reply,
                    index
                  ) => (
                    <div
                      key={
                        reply._id ||
                        index
                      }
                      style={{
                        padding:
                          "12px",
                        border:
                          "1px solid var(--border)",
                        borderRadius:
                          "var(--r)",
                        background:
                          "var(--surface-2)",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                          marginBottom:
                            "6px",
                        }}
                      >
                        <strong>
                          {reply
                            .user
                            ?.name ||
                            reply
                              .user
                              ?.email ||
                            "User"}
                        </strong>

                        <span
                          style={{
                            fontSize:
                              "11px",
                            color:
                              "var(--text-muted)",
                          }}
                        >
                          {reply.createdAt
                            ? new Date(
                                reply.createdAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            : ""}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize:
                            "13px",
                          lineHeight:
                            1.5,
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          reply.message
                        }
                      </div>

                      {reply
                        .user
                        ?.role && (
                        <div
                          style={{
                            marginTop:
                              "6px",
                            fontSize:
                              "10px",
                            color:
                              "var(--text-muted)",
                            textTransform:
                              "capitalize",
                          }}
                        >
                          {String(
                            reply
                              .user
                              .role
                          ).replace(
                            /_/g,
                            " "
                          )}
                        </div>
                      )}
                    </div>
                  )
                )
              ) : (
                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "30px 15px",
                    color:
                      "var(--text-muted)",
                    border:
                      "1px dashed var(--border)",
                    borderRadius:
                      "var(--r)",
                  }}
                >
                  <MessageCircle
                    size={28}
                    style={{
                      marginBottom:
                        "8px",
                    }}
                  />

                  <div>
                    No replies yet.
                  </div>

                  <div
                    style={{
                      fontSize:
                        "12px",
                      marginTop:
                        "4px",
                    }}
                  >
                    Start the conversation
                    below.
                  </div>
                </div>
              )}
            </div>

            {/* SEND REPLY */}

            <form
              onSubmit={sendReply}
            >
              <FormField label="Your Reply">
                <textarea
                  value={
                    replyText
                  }
                  rows={4}
                  disabled={
                    replySending
                  }
                  placeholder="Reply to the review or feedback..."
                  onChange={(event) =>
                    setReplyText(
                      event.target
                        .value
                    )
                  }
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                  }}
                />
              </FormField>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  marginTop:
                    "16px",
                  paddingTop:
                    "14px",
                  borderTop:
                    "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={
                    replySending
                  }
                  onClick={() => {
                    setReplyOpen(
                      false
                    );
                    setReplyText(
                      ""
                    );
                  }}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    replySending ||
                    !replyText.trim()
                  }
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                  }}
                >
                  <Send
                    size={15}
                  />

                  {replySending
                    ? "Sending..."
                    : "Send Reply"}
                </button>
              </div>
            </form>

          </div>
        )}
      </Modal>
    </div>
  );
}