import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import StatsCard from "../../components/ui/StatsCard";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import { checkInAttendance, checkOutAttendance, fetchAttendance } from "../../store/slices/attendanceSlice";
import API, { collection } from "../../services/api";
import { mapAttendanceSessionsFromApi } from "../../store/mappers";
import toast from "react-hot-toast";
import { Clock, CheckCircle, XCircle, AlertTriangle, LogIn, LogOut } from "lucide-react";

export default function Attendance() {
  const { user } = useAuth();
  const canManageAttendance = ["owner", "admin", "manager"].includes(user?.role);
  const dispatch = useDispatch();
  const { items: storeRecords, activeSession, actionStatus } = useSelector((state) => state.attendance);

  const [records, setRecords] = useState([]);
  const [teamRecords, setTeamRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const statusKey = (status = "") => status.toLowerCase().replace(/[-\s]+/g, "_");
  const statusLabel = (status = "") => ({
    present: "Present",
    absent: "Absent",
    late: "Late",
    half_day: "Half-day",
    leave: "Leave",
  }[statusKey(status)] || status || "Absent");

  const monthDaysUntilToday = (monthValue) => {
    const [year, monthIndex] = monthValue.split("-").map(Number);
    const lastDay = new Date(year, monthIndex, 0).getDate();
    const today = new Date();
    const days = [];
    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, monthIndex - 1, day);
      if (date > today) break;
      days.push(date.toLocaleDateString("en-CA"));
    }
    return days;
  };

  const getTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const getHours = (record) => {
    if (typeof record?.totalMinutes === "number") {
      const h = Math.floor(record.totalMinutes / 60);
      const m = record.totalMinutes % 60;
      return `${h}h ${String(m).padStart(2, "0")}m`;
    }
    const inAt = record?.checkInAt || record?.checkIn;
    const outAt = record?.checkOutAt || record?.checkOut;
    if (!inAt || !outAt) return "-";
    const a = new Date(inAt);
    const b = new Date(outAt);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "-";
    const minutes = Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
  };

  const normalizeAttendanceRows = (items = []) => items.flatMap((record) => {
    if (record.isGeneratedAbsent || statusKey(record.status) === "absent") {
      return [{
        ...record,
        employeeName: record.employee?.name || record.employeeName || "-",
        role: record.employee?.role || record.role || "-",
        status: statusLabel(record.status || "absent"),
      }];
    }

    return mapAttendanceSessionsFromApi(record).map((row) => ({
      ...row,
      employee: record.employee,
      employeeName: record.employee?.name || row.employeeName || "-",
      role: record.employee?.role || row.role || "-",
      status: statusLabel(row.status),
    }));
  });

  const todayKey = new Date().toLocaleDateString("en-CA");
  const monthRecords = records.filter((record) => record.date?.startsWith(month));
  const ownDisplayRecords = monthDaysUntilToday(month)
    .map((date) => {
      const dayRecords = monthRecords.filter((record) => record.date === date);
      if (dayRecords.length) return dayRecords.map((record) => ({ ...record, status: statusLabel(record.status) }));
      return [{ _id: `absent-${date}`, date, status: "Absent", totalMinutes: 0, isAbsent: true }];
    })
    .flat()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const displayRecords = canManageAttendance ? teamRecords : ownDisplayRecords;
  const todayRecord = records.find((record) => record.date === todayKey);
  const activeRecord = todayRecord?.checkInAt && !todayRecord?.checkOutAt ? todayRecord : activeSession;
  const checkedIn = Boolean(activeRecord);
  const checkInTime = getTime(activeRecord?.checkInAt);
  const checkOutTime = getTime(todayRecord?.checkOutAt);

  const load = async () => {
    try {
      const items = await dispatch(fetchAttendance()).unwrap();
      setRecords(items);
    } catch {
      toast.error("Failed to load your attendance");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamAttendance = async () => {
    setTeamLoading(true);
    try {
      const employeeQuery = selectedEmployee ? `&employee=${selectedEmployee}` : "";
      const [attendanceRes, usersRes] = await Promise.all([
        API.get(`/attendance?includeAbsences=true&month=${month}${employeeQuery}`),
        API.get("/users?limit=100"),
      ]);
      setTeamRecords(normalizeAttendanceRows(collection(attendanceRes.raw)));
      setEmployees(collection(usersRes.raw));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load team attendance");
      setTeamRecords([]);
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    setRecords(storeRecords);
  }, [storeRecords]);

  useEffect(() => {
    if (canManageAttendance) loadTeamAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageAttendance, month, selectedEmployee]);

  const locationDeniedError = () => Object.assign(new Error("Location permission denied"), { code: 1 });
  const readPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => error.code === 1 ? reject(error) : resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
  const getPosition = async () => {
    if (!navigator.geolocation) return null;
    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") throw locationDeniedError();
      } catch (error) {
        if (error.code === 1) throw error;
      }
    }
    return readPosition();
  };
  const checkIn = async () => {
    if (todayRecord?.checkInAt && !todayRecord?.checkOutAt) {
      toast.error("Already checked in");
      return;
    }
    try {
      const position = await getPosition();
      await dispatch(checkInAttendance(position)).unwrap();
      toast.success("GPS check-in saved");
      if (canManageAttendance) loadTeamAttendance();
    } catch (error) {
      toast.error(error?.code === 1 ? "Allow location access to check in" : typeof error === "string" ? error : error?.message || "Unable to check in");
    }
  };
  const checkOut = async () => {
    try {
      const position = await getPosition();
      await dispatch(checkOutAttendance(position)).unwrap();
      toast.success("GPS check-out saved");
      if (canManageAttendance) loadTeamAttendance();
    } catch (error) {
      toast.error(error?.code === 1 ? "Allow location access to check out" : typeof error === "string" ? error : error?.message || "Unable to check out");
    }
  };

  const sum = {
    present: displayRecords.filter((record) => statusKey(record.status) === "present").length,
    absent: displayRecords.filter((record) => statusKey(record.status) === "absent").length,
    late: displayRecords.filter((record) => statusKey(record.status) === "late").length,
    halfDay: displayRecords.filter((record) => statusKey(record.status) === "half_day").length,
  };
  const cols = [
    ...(canManageAttendance ? [{
      header: "Employee",
      accessor: "employeeName",
      render: (row) => (
        <div>
          <p style={{ fontWeight: 700, color: "var(--text)" }}>{row.employeeName || "-"}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize" }}>{row.role || "-"}</p>
        </div>
      ),
    }] : []),
    { header: "Date", accessor: "date", render: (row) => <span style={{ fontWeight: 600, fontSize: "13px" }}>{row.date ? new Date(row.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "-"}</span> },
    { header: "Check In", accessor: "checkInAt", render: (row) => <span className="font-mono" style={{ fontWeight: 600, color: "var(--color-primary-glossy)" }}>{getTime(row.checkInAt || row.checkIn)}</span> },
    { header: "Check Out", accessor: "checkOutAt", render: (row) => <span className="font-mono" style={{ fontWeight: 600, color: "var(--danger)" }}>{getTime(row.checkOutAt || row.checkOut)}</span> },
    { header: "Hours", accessor: "totalMinutes", render: (row) => <span style={{ fontWeight: 700 }}>{getHours(row)}</span> },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={row.status} /> },
  ];

  if (loading) return <LoadingSpinner text="Loading attendance..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Time Tracking"
        title="Attendance"
        subtitle={canManageAttendance ? "Review visible employee attendance by month" : "Track your daily attendance and hours"}
        action={(
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {canManageAttendance && (
              <select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)} style={{ padding: "9px 14px", borderRadius: "var(--r)", background: "var(--surface)", border: "1.5px solid var(--border)", fontSize: "13px", color: "var(--text)", outline: "none", cursor: "pointer", minWidth: "190px" }}>
                <option value="">All visible employees</option>
                {employees.map((employee) => (
                  <option key={employee._id || employee.id} value={employee._id || employee.id}>{employee.name} ({employee.role})</option>
                ))}
              </select>
            )}
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} style={{ padding: "9px 14px", borderRadius: "var(--r)", background: "var(--surface)", border: "1.5px solid var(--border)", fontSize: "13px", color: "var(--text)", outline: "none", cursor: "pointer" }} />
          </div>
        )}
      />
      <div style={{ borderRadius: "var(--r-xl)", padding: "28px", marginBottom: "24px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: "20px", background: checkedIn ? "var(--primary-glossy-gradient)" : "var(--surface)", border: `1px solid ${checkedIn ? "transparent" : "var(--border)"}`, boxShadow: checkedIn ? "var(--shadow-primary)" : "var(--shadow-sm)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", background: checkedIn ? "rgba(255,255,255,0.15)" : "var(--surface-3)", flexShrink: 0 }}>
            <Clock size={28} style={{ color: checkedIn ? "white" : "var(--text-muted)" }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "20px", fontWeight: 800, color: checkedIn ? "white" : "var(--text)", letterSpacing: "-0.03em" }}>{checkedIn ? "You're checked in" : "Not checked in yet"}</p>
            <p style={{ fontSize: "14px", color: checkedIn ? "rgba(255,255,255,0.65)" : "var(--text-muted)", marginTop: "3px" }}>{checkedIn ? `Since ${checkInTime}` : todayRecord?.checkOutAt ? `Last checked out at ${checkOutTime}. You can check in again.` : `Today - ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}</p>
          </div>
        </div>
        {checkedIn ? (
          <button onClick={checkOut} disabled={actionStatus === "loading"} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "var(--r)", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.25)", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "all var(--t)" }}>
            <LogOut size={18} />Check Out
          </button>
        ) : (
          <button onClick={checkIn} disabled={actionStatus === "loading"} className="btn-primary" style={{ padding: "12px 24px", fontSize: "14px" }}><LogIn size={18} />Check In</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "14px", marginBottom: "24px" }} className="stagger">
        <StatsCard icon={CheckCircle} label="Present" value={sum.present} color="success" />
        <StatsCard icon={XCircle} label="Absent" value={sum.absent} color="danger" />
        <StatsCard icon={AlertTriangle} label="Late" value={sum.late} color="warning" />
        <StatsCard icon={Clock} label="Half Day" value={sum.halfDay} color="info" />
      </div>
      <DataTable columns={cols} data={displayRecords} loading={teamLoading} pageSize={15} emptyMessage="No attendance records yet." />
    </div>
  );
}
