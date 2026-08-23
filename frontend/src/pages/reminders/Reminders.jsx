import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { BellRing, CalendarClock, Check, Clock, Plus, RefreshCw, X } from "lucide-react";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import DataTable from "../../components/ui/DataTable";
import FormField from "../../components/ui/FormField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
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
  title: "",
  description: "",
  dueAt: "",
  assignedTo: "",
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-");

const remainingTime = (dueAt, now) => {
  const diff = new Date(dueAt).getTime() - now;
  if (diff <= 0) return "Due now";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const statusStyle = (reminder) => {
  if (reminder.status === "completed") return { label: "Completed", color: "var(--emerald)", bg: "rgba(37,99,235,0.10)" };
  if (reminder.status === "cancelled") return { label: "Cancelled", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
  if (reminder.notifiedAt) return { label: "Notified", color: "#0369a1", bg: "rgba(3,105,161,0.1)" };
  return { label: "Pending", color: "#d97706", bg: "rgba(217,119,6,0.1)" };
};

export default function Reminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  const canAssignOthers = ["owner", "admin", "manager"].includes(user?.role);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [reminderRes, userRes] = await Promise.all([
        API.get("/reminders"),
        canAssignOthers ? API.get("/users?limit=100") : Promise.resolve(null),
      ]);
      setReminders(apiItems(reminderRes));
      if (userRes) setUsers(apiItems(userRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load reminders"));
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAssignOthers]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return toast.error("Reminder title is required");
    if (!form.dueAt) return toast.error("Reminder date and time are required");

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        dueAt: form.dueAt,
        assignedTo: canAssignOthers && form.assignedTo ? form.assignedTo : undefined,
      };
      const res = await API.post("/reminders", payload);
      setReminders((prev) => [res.data, ...prev]);
      setForm(emptyForm);
      toast.success("Reminder added");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to add reminder"));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (reminder, status) => {
    try {
      const res = await API.patch(`/reminders/${reminder._id}`, { status });
      setReminders((prev) => prev.map((item) => (item._id === reminder._id ? res.data : item)));
      toast.success(status === "completed" ? "Reminder completed" : "Reminder cancelled");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update reminder"));
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Reminder",
        accessor: "title",
        render: (row) => (
          <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontWeight: 800 }}>{row.title}</span>
            {row.description && <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{row.description}</span>}
          </span>
        ),
      },
      {
        header: "For",
        accessor: "assignedTo",
        render: (row) => <span style={{ fontWeight: 600 }}>{row.assignedTo?.name || "Me"}</span>,
      },
      {
        header: "Due",
        accessor: "dueAt",
        render: (row) => (
          <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "150px" }}>
            <span>{formatDateTime(row.dueAt)}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "12px" }}>
              <Clock size={12} /> {remainingTime(row.dueAt, now)}
            </span>
          </span>
        ),
      },
      {
        header: "Status",
        accessor: "status",
        render: (row) => {
          const badge = statusStyle(row);
          return <span style={{ padding: "5px 10px", borderRadius: "999px", background: badge.bg, color: badge.color, fontSize: "12px", fontWeight: 700 }}>{badge.label}</span>;
        },
      },
      {
        header: "Notification",
        accessor: "notifiedAt",
        render: (row) => <span>{row.notifiedAt ? formatDateTime(row.notifiedAt) : "Scheduled"}</span>,
      },
      {
        header: "Actions",
        accessor: "_id",
        render: (row) =>
          row.status === "pending" ? (
            <span style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button type="button" className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px" }} onClick={() => updateStatus(row, "completed")}>
                <Check size={13} /> Done
              </button>
              <button type="button" className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px", color: "#dc2626" }} onClick={() => updateStatus(row, "cancelled")}>
                <X size={13} /> Cancel
              </button>
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>-</span>
          ),
      },
    ],
    [now]
  );

  if (loading) return <LoadingSpinner text="Loading reminders..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Follow ups"
        title="Reminders"
        subtitle="Add reminders and receive notifications at the scheduled time"
        action={
          <button onClick={load} className="btn-primary" style={{ padding: "10px 14px", fontSize: "13px" }}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      <form onSubmit={submit} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-sm)", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(37,99,235,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
            <BellRing size={18} />
          </div>
          <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "17px", fontWeight: 800, color: "var(--text)" }}>Add Reminder</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: "14px" }}>
          <FormField label="Title">
            <input type="text" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Follow up with customer" style={inputStyle} />
          </FormField>
          <FormField label="Date & Time">
            <input type="datetime-local" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} style={inputStyle} />
          </FormField>
          {canAssignOthers && (
            <FormField label="Assign To">
              <select value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} style={inputStyle}>
                <option value="">Myself</option>
                {users.map((item) => <option key={item._id} value={item._id}>{item.name} ({item.role})</option>)}
              </select>
            </FormField>
          )}
          <FormField label="Description">
            <input type="text" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Optional note" style={inputStyle} />
          </FormField>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <CalendarClock size={15} /> : <Plus size={15} />}
            {saving ? "Adding..." : "Add Reminder"}
          </button>
        </div>
      </form>

      <DataTable columns={columns} data={reminders} pageSize={15} emptyMessage="No reminders found." />
    </div>
  );
}
