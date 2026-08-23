import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Clock, Plus, RefreshCw, Target as TargetIcon, UserRound } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import FormField from "../../components/ui/FormField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const inputStyle = {
  width: "100%",
  fontFamily: "Be Vietnam Pro,sans-serif",
  fontSize: "13px",
  color: "var(--text)",
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "10px 12px",
  outline: "none",
};

const emptyForm = {
  employee: "",
  period: "monthly",
  startsAt: "",
  endsAt: "",
  salesAmountTarget: "",
  orderCountTarget: "",
  visitCountTarget: "",
  leadConversionTarget: "",
};

const ASSIGNABLE_ROLES = {
  owner: ["owner", "admin", "manager", "sales"],
  admin: ["manager", "sales"],
  manager: ["sales"],
};

const ROLE_LABEL = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  sales: "Sales Executive",
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-");
const asNumber = (value) => Number(value || 0);

const targetStatus = (target, now) => {
  const startsAt = new Date(target.startsAt).getTime();
  const endsAt = new Date(target.endsAt).getTime();
  const goals = [
    [target.salesAmountTarget, target.achievedSalesAmount],
    [target.orderCountTarget, target.achievedOrderCount],
    [target.visitCountTarget, target.achievedVisitCount],
    [target.leadConversionTarget, target.achievedLeadConversions],
  ].filter(([goal]) => asNumber(goal) > 0);

  const complete = goals.length > 0 && goals.every(([goal, achieved]) => asNumber(achieved) >= asNumber(goal));
  if (complete) return { label: "Achieved", color: "var(--emerald)", bg: "rgba(37,99,235,0.10)" };
  if (now < startsAt) return { label: "Not started", color: "#0369a1", bg: "rgba(3,105,161,0.1)" };
  if (now > endsAt) return { label: "Expired", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
  return { label: "In progress", color: "#d97706", bg: "rgba(217,119,6,0.1)" };
};

const remainingTime = (endsAt, now) => {
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return "Time ended";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const progressText = (target) => {
  const parts = [];
  if (asNumber(target.salesAmountTarget) > 0) parts.push(`Sales ${asNumber(target.achievedSalesAmount)}/${asNumber(target.salesAmountTarget)}`);
  if (asNumber(target.orderCountTarget) > 0) parts.push(`Orders ${asNumber(target.achievedOrderCount)}/${asNumber(target.orderCountTarget)}`);
  if (asNumber(target.visitCountTarget) > 0) parts.push(`Visits ${asNumber(target.achievedVisitCount)}/${asNumber(target.visitCountTarget)}`);
  if (asNumber(target.leadConversionTarget) > 0) parts.push(`Leads ${asNumber(target.achievedLeadConversions)}/${asNumber(target.leadConversionTarget)}`);
  return parts.length ? parts.join(" | ") : "No target values";
};

export default function Targets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [now, setNow] = useState(Date.now());

  const canAssign = ["owner", "admin", "manager"].includes(user?.role);
  const assignableRoles = ASSIGNABLE_ROLES[user?.role] || [];

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [targetRes, userRes] = await Promise.all([
        API.get("/targets"),
        canAssign ? API.get("/users?limit=200") : Promise.resolve(null),
      ]);
      setTargets(apiItems(targetRes));
      if (userRes) {
        const users = apiItems(userRes).filter((item) => assignableRoles.includes(item.role));
        setSalesUsers(users);
        setForm((prev) => ({ ...prev, employee: prev.employee || users[0]?._id || "" }));
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load targets"));
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAssign]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.employee) return toast.error("Select a team member");
    if (!form.startsAt || !form.endsAt) return toast.error("Select target start and end time");
    if (new Date(form.endsAt) <= new Date(form.startsAt)) return toast.error("End time must be after start time");

    const payload = {
      ...form,
      salesAmountTarget: asNumber(form.salesAmountTarget),
      orderCountTarget: asNumber(form.orderCountTarget),
      visitCountTarget: asNumber(form.visitCountTarget),
      leadConversionTarget: asNumber(form.leadConversionTarget),
    };

    if (
      payload.salesAmountTarget <= 0 &&
      payload.orderCountTarget <= 0 &&
      payload.visitCountTarget <= 0 &&
      payload.leadConversionTarget <= 0
    ) {
      return toast.error("Enter at least one target value");
    }

    setSaving(true);
    try {
      await API.post("/targets", payload);
      setForm((prev) => ({ ...emptyForm, employee: prev.employee, period: prev.period }));
      await load();
      toast.success("Target assigned");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to assign target"));
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Assigned To",
        accessor: "employee",
        render: (row) => (
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
            <UserRound size={14} style={{ color: "var(--emerald)" }} />
            {row.employee?.name || "Team member"}
            {row.employee?.role && <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({ROLE_LABEL[row.employee.role] || row.employee.role})</span>}
          </span>
        ),
      },
      {
        header: "Target",
        accessor: "salesAmountTarget",
        render: (row) => <span style={{ fontWeight: 600 }}>{progressText(row)}</span>,
      },
      {
        header: "Status",
        accessor: "status",
        render: (row) => {
          const status = targetStatus(row, now);
          return <span style={{ padding: "5px 10px", borderRadius: "999px", background: status.bg, color: status.color, fontSize: "12px", fontWeight: 700 }}>{status.label}</span>;
        },
      },
      {
        header: "Time Span",
        accessor: "startsAt",
        render: (row) => (
          <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "180px" }}>
            <span>{formatDateTime(row.startsAt)}</span>
            <span style={{ color: "var(--text-muted)" }}>to {formatDateTime(row.endsAt)}</span>
          </span>
        ),
      },
      {
        header: "Remaining",
        accessor: "endsAt",
        render: (row) => (
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <Clock size={14} style={{ color: "var(--text-muted)" }} />
            {remainingTime(row.endsAt, now)}
          </span>
        ),
      },
      {
        header: "Assigned By",
        accessor: "createdBy",
        render: (row) => <span>{row.createdBy?.name || "-"}</span>,
      },
    ],
    [now]
  );

  if (loading) return <LoadingSpinner text="Loading targets..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Performance"
        title="Targets"
        subtitle={canAssign ? "Assign targets by hierarchy and track completion time" : "Your assigned targets and remaining time"}
        action={
          <button onClick={load} className="btn-primary" style={{ padding: "10px 14px", fontSize: "13px" }}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {canAssign && (
        <form onSubmit={submit} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-sm)", padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(37,99,235,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
              <TargetIcon size={18} />
            </div>
            <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>Assign Target</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "14px" }}>
            <FormField label="Assign To">
              <select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} style={inputStyle}>
                {salesUsers.length === 0 ? <option value="">No eligible users</option> : salesUsers.map((item) => <option key={item._id} value={item._id}>{item.name} - {ROLE_LABEL[item.role] || item.role}</option>)}
              </select>
            </FormField>
            <FormField label="Period">
              <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} style={inputStyle}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </FormField>
            <FormField label="Starts At">
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Ends At">
              <input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} style={inputStyle} />
            </FormField>
            <FormField label="Sales Amount">
              <input type="number" min="0" value={form.salesAmountTarget} onChange={(e) => setForm({ ...form, salesAmountTarget: e.target.value })} placeholder="0" style={inputStyle} />
            </FormField>
            <FormField label="Orders">
              <input type="number" min="0" value={form.orderCountTarget} onChange={(e) => setForm({ ...form, orderCountTarget: e.target.value })} placeholder="0" style={inputStyle} />
            </FormField>
            <FormField label="Visits">
              <input type="number" min="0" value={form.visitCountTarget} onChange={(e) => setForm({ ...form, visitCountTarget: e.target.value })} placeholder="0" style={inputStyle} />
            </FormField>
            <FormField label="Lead Conversions">
              <input type="number" min="0" value={form.leadConversionTarget} onChange={(e) => setForm({ ...form, leadConversionTarget: e.target.value })} placeholder="0" style={inputStyle} />
            </FormField>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
            <button type="submit" disabled={saving || salesUsers.length === 0} className="btn-primary">
              {saving ? <CalendarClock size={15} /> : <Plus size={15} />}
              {saving ? "Assigning..." : "Assign Target"}
            </button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={targets} pageSize={15} emptyMessage="No targets found." />
    </div>
  );
}
