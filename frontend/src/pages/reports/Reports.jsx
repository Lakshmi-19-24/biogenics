import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import API, { apiData, apiErrorMessage, apiItems } from "../../services/api";
import { BarChart3, Calendar, Download, DollarSign, FileText, ShoppingCart, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TYPES = [
  { k: "sales", label: "Sales", icon: DollarSign },
  { k: "leads", label: "Lead Conversion", icon: Users },
  { k: "orders", label: "Orders", icon: ShoppingCart },
];
const PC = ["#2563EB", "#0369a1", "#d97706", "#7c3aed", "#dc2626", "#3B82F6"];
const CS = { background:"var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)", fontSize: "12px", boxShadow: "var(--shadow-md)" };

const toCsv = (rows) => rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

const download = (filename, rows) => {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const location = useLocation();
  const isAnalytics = location.pathname.includes("analytics");
  const [active, setActive] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [leads, setLeads] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadReports();
  }, [range]);

  const loadReports = async () => {
    try {
      setError("");
      setLoading(true);
      const [analyticsRes, reportsRes, leadsRes, ordersRes] = await Promise.all([
        API.get("/analytics"),
        API.get("/daily-reports", { params: { limit: 100 } }),
        API.get("/leads", { params: { limit: 100 } }),
        API.get("/orders", { params: { limit: 100 } }),
      ]);
      setAnalytics(apiData(analyticsRes));
      setReports(apiItems(reportsRes));
      setLeads(apiItems(leadsRes));
      setOrders(apiItems(ordersRes));
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  };

  const leadStages = useMemo(() => ["new", "assigned", "in_progress", "follow_up", "converted", "lost"].map((stage) => ({
    stage: stage.replace(/_/g, " "),
    count: leads.filter((lead) => lead.status === stage).length,
  })), [leads]);

  const orderStatuses = useMemo(() => ["draft", "placed", "approved", "fulfilled", "cancelled"].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  })), [orders]);

  const salesByDay = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      const key = order.createdAt?.slice(0, 10) || "unknown";
      acc[key] = (acc[key] || 0) + Number(order.grandTotal || 0);
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  const reportTotals = reports.reduce(
    (acc, report) => ({
      calls: acc.calls + Number(report.callsMade || 0),
      leads: acc.leads + Number(report.leadsCreated || 0),
      orders: acc.orders + Number(report.ordersBooked || 0),
      collected: acc.collected + Number(report.paymentsCollected || 0),
    }),
    { calls: 0, leads: 0, orders: 0, collected: 0 }
  );

  const handleExport = () => {
    if (isAnalytics && active === "sales") return download("sales_by_day.csv", [["date", "revenue"], ...salesByDay.map((row) => [row.date, row.revenue])]);
    if (isAnalytics && active === "leads") return download("lead_pipeline.csv", [["stage", "count"], ...leadStages.map((row) => [row.stage, row.count])]);
    if (isAnalytics) return download("order_statuses.csv", [["status", "count"], ...orderStatuses.map((row) => [row.status, row.count])]);
    return download(`daily-reports-${range.from}-to-${range.to}.csv`, [
      ["employee", "date", "calls", "leads", "orders", "collected", "status"],
      ...reports.map((row) => [row.employee?.name || "Employee", row.reportDate, row.callsMade, row.leadsCreated, row.ordersBooked, row.paymentsCollected, row.status]),
    ]);
  };

  if (loading) return <LoadingSpinner text={isAnalytics ? "Generating analytics..." : "Loading reports..."} />;

  const Card = ({ title, sub, children }) => (
    <div style={{ background:"var(--surface)", borderRadius: "var(--r-xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", padding: "24px" }}>
      <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "16px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: "3px" }}>{title}</p>
      {sub && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>{sub}</p>}
      <div style={{ marginTop: sub ? 0 : "20px" }}>{children}</div>
    </div>
  );

  const reportColumns = [
    { header: "Employee", accessor: "employee", render: (row) => row.employee?.name || "Employee" },
    { header: "Date", accessor: "reportDate" },
    { header: "Calls", accessor: "callsMade" },
    { header: "Leads", accessor: "leadsCreated" },
    { header: "Orders", accessor: "ordersBooked" },
    { header: "Collected", accessor: "paymentsCollected", render: (row) => `INR ${Number(row.paymentsCollected || 0).toLocaleString("en-IN")}` },
    { header: "Status", accessor: "status" },
  ];

  return (
    <div className="page-enter">
      <PageHeader eyebrow={isAnalytics ? "Analytics" : "Reports"} title={isAnalytics ? "Analytics" : "Daily Reports"} subtitle={`Revenue INR ${Number(analytics?.payments?.received || 0).toLocaleString("en-IN")} · ${reports.length} daily reports`} action={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", background:"var(--surface)", borderRadius: "var(--r)", border: "1px solid var(--border)", boxShadow: "var(--shadow-xs)" }}>
            <Calendar size={13} style={{ color: "var(--text-muted)" }} />
            <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} style={{ border: "none", background: "none", outline: "none", fontSize: "12px", color: "var(--text)", cursor: "pointer" }} />
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>to</span>
            <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} style={{ border: "none", background: "none", outline: "none", fontSize: "12px", color: "var(--text)", cursor: "pointer" }} />
          </div>
          <button type="button" className="btn-ghost" style={{ gap: "6px" }} onClick={handleExport}><Download size={14} />Export</button>
        </div>
      } />

      {error && <div style={{ padding: "12px 16px", borderRadius: "var(--r)", background: "rgba(220,38,38,0.08)", color: "var(--danger)", marginBottom: "16px", fontSize: "13px", fontWeight: 600 }}>{error}</div>}

      {!isAnalytics && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "12px", marginBottom: "20px" }}>
            {[
              ["Reports", reports.length, FileText],
              ["Calls", reportTotals.calls, Users],
              ["Orders", reportTotals.orders, ShoppingCart],
              ["Collected", `INR ${reportTotals.collected.toLocaleString("en-IN")}`, DollarSign],
            ].map(([label, value, Icon]) => (
              <div key={label} style={{ background:"var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}><Icon size={17} /></div>
                <div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{label}</p>
                  <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          <DataTable columns={reportColumns} data={reports} pageSize={15} emptyMessage="No daily reports found." />
        </>
      )}

      {isAnalytics && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
            {TYPES.map(({ k, label, icon: Icon }) => (
              <button key={k} onClick={() => setActive(k)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "var(--r)", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all var(--t)", background: active === k ? "var(--emerald)" : "white", color: active === k ? "white" : "var(--text-3)", borderColor: active === k ? "var(--emerald)" : "var(--border)" }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {active === "sales" && (
            <Card title="Revenue by Day" sub="Order value grouped from backend orders">
              {salesByDay.length ? <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesByDay} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `INR ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={CS} formatter={(v) => [`INR ${Number(v).toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer> : <EmptyState icon={BarChart3} title="No sales data" description="Revenue data will appear once orders are recorded." />}
            </Card>
          )}

          {active === "leads" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
              <Card title="Lead Pipeline" sub="By backend status">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={leadStages} layout="vertical" barSize={18} margin={{ top: 0, right: 24, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="stage" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={CS} />
                    <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card title="Lead Share" sub="Pipeline distribution">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={leadStages} dataKey="count" nameKey="stage" cx="50%" cy="50%" outerRadius={90}>
                      {leadStages.map((_, i) => <Cell key={i} fill={PC[i % PC.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={CS} /><Legend iconType="circle" iconSize={10} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {active === "orders" && (
            <Card title="Order Fulfillment" sub="By backend order status">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={orderStatuses} barSize={32} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="status" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CS} />
                  <Bar dataKey="count" fill="#0369a1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
