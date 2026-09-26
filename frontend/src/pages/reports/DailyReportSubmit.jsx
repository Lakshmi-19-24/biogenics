import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import API, { apiErrorMessage } from "../../services/api";
import PageHeader from "../../components/ui/PageHeader";

export default function DailyReportSubmit() {
const navigate = useNavigate();
const [searchParams] = useSearchParams();

const visitId = searchParams.get("visitId");
const returnTo = searchParams.get("returnTo");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().slice(0, 10),
    callsMade: 0,
    leadsCreated: 0,
    ordersBooked: 0,
    paymentsCollected: 0,
    summary: "",
    blockers: "",
    tomorrowPlan: "",
  });

  const onChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.summary.trim()) {
      toast.error("Summary is required");
      return;
    }
    setLoading(true);
    try {
      await API.post("/daily-reports", {
  ...form,
  visits: visitId ? [visitId] : [],
  callsMade: Number(form.callsMade || 0),
  leadsCreated: Number(form.leadsCreated || 0),
  ordersBooked: Number(form.ordersBooked || 0),
  paymentsCollected: Number(form.paymentsCollected || 0),
});
      toast.success("Daily report submitted");

if (returnTo) {
  const returnVisitId = searchParams.get("returnVisitId");

  navigate(
    `${returnTo}?reportSubmitted=true&visitId=${returnVisitId || ""}`
  );
}else {
  navigate("/daily-reports");
}
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to submit"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background:"var(--surface)",
    border: "1.5px solid var(--border)",
    borderRadius: "12px",
    padding: "10px 12px",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Reporting"
        title="Submit Daily Report"
        subtitle="Submit your work summary for the day"
        action={
          <button onClick={submit} disabled={loading} className="btn-primary" style={{ padding: "10px 14px", fontSize: "13px" }}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "16px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Date</label>
          <input type="date" value={form.reportDate} onChange={(e) => onChange("reportDate", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Calls made</label>
          <input type="number" min="0" value={form.callsMade} onChange={(e) => onChange("callsMade", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Leads created</label>
          <input type="number" min="0" value={form.leadsCreated} onChange={(e) => onChange("leadsCreated", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Orders booked</label>
          <input type="number" min="0" value={form.ordersBooked} onChange={(e) => onChange("ordersBooked", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Payments collected</label>
          <input type="number" min="0" value={form.paymentsCollected} onChange={(e) => onChange("paymentsCollected", e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <div>
          <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Summary *</label>
          <textarea value={form.summary} onChange={(e) => onChange("summary", e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Blockers</label>
            <textarea value={form.blockers} onChange={(e) => onChange("blockers", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>Tomorrow plan</label>
            <textarea value={form.tomorrowPlan} onChange={(e) => onChange("tomorrowPlan", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

