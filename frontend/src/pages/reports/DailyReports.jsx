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

const inputStyle = {
  width: "100%",
  background:"var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "12px",
  padding: "10px 12px",
  fontSize: "13px",
  outline: "none",
};

const titleCase = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function DailyReports() {
  const { user } = useAuth();
  const isManagement = ["owner", "admin", "manager"].includes(user?.role);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [review, setReview] = useState({ status: "reviewed", reviewNote: "" });

  const load = async () => {
    setLoading(true);
    try {
      const response = await API.get(isManagement ? "/daily-reports?limit=100" : "/daily-reports/mine?limit=100");
      setReports(apiItems(response));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load daily reports"));
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManagement]);

  const openReview = (report) => {
    if (!isManagement) return;
    setActiveReport(report);
    setReview({ status: report.status === "rejected" ? "rejected" : "reviewed", reviewNote: report.reviewNote || "" });
    setReviewOpen(true);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!activeReport) return;
    try {
      await API.patch(`/daily-reports/${activeReport._id || activeReport.id}/review`, review);
      toast.success("Report reviewed");
      setReviewOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to review report"));
    }
  };

  const columns = [
    { header: "Date", accessor: "reportDate", render: (row) => <span style={{ fontWeight: 700 }}>{row.reportDate ? new Date(row.reportDate).toLocaleDateString("en-IN") : "-"}</span> },
    { header: "Employee", accessor: "employee", render: (row) => <span>{row.employee?.name || user?.name || "-"}</span> },
    { header: "Calls", accessor: "callsMade", render: (row) => String(row.callsMade ?? 0) },
    { header: "Leads", accessor: "leadsCreated", render: (row) => String(row.leadsCreated ?? 0) },
    { header: "Orders", accessor: "ordersBooked", render: (row) => String(row.ordersBooked ?? 0) },
    { header: "Collected", accessor: "paymentsCollected", render: (row) => <span style={{ fontWeight: 700 }}>INR {Number(row.paymentsCollected || 0).toLocaleString()}</span> },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={titleCase(row.status)} /> },
    { header: "Summary", accessor: "summary", render: (row) => <span style={{ color: "var(--text-muted)" }}>{row.summary || "-"}</span> },
  ];

  if (loading) return <LoadingSpinner text="Loading daily reports..." />;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Reporting" title="Daily Reports" subtitle={isManagement ? "Review team daily activity reports" : "Your submitted daily reports"} />
      <DataTable columns={columns} data={reports} pageSize={15} onRowClick={isManagement ? openReview : undefined} emptyMessage="No daily reports yet." />

      <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Review Daily Report" size="md">
        <form onSubmit={submitReview}>
          {activeReport && (
            <div style={{ marginBottom: "16px", padding: "14px", borderRadius: "var(--r)", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p style={{ fontWeight: 800 }}>{activeReport.employee?.name || "Employee"} - {activeReport.reportDate}</p>
              <p style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{activeReport.summary}</p>
            </div>
          )}
          <div style={{ display: "grid", gap: "14px" }}>
            <FormField label="Decision">
              <select value={review.status} onChange={(event) => setReview({ ...review, status: event.target.value })} style={inputStyle}>
                <option value="reviewed">Reviewed</option>
                <option value="rejected">Rejected</option>
              </select>
            </FormField>
            <FormField label="Review Note">
              <textarea value={review.reviewNote} rows={4} onChange={(event) => setReview({ ...review, reviewNote: event.target.value })} style={{ ...inputStyle, resize: "vertical" }} />
            </FormField>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-ghost" onClick={() => setReviewOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Review</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
