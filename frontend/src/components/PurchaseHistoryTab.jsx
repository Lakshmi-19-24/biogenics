import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, FileText, IndianRupee, PackageSearch, ShoppingBag } from "lucide-react";
import API, { apiData, apiErrorMessage } from "../services/api";
import EmptyState from "./ui/EmptyState";
import StatusBadge from "./ui/StatusBadge";

const inputStyle = {
  width: "100%",
  fontFamily: "Be Vietnam Pro,sans-serif",
  fontSize: "13px",
  color: "var(--text)",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "9px 12px",
  outline: "none",
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
};

const statusLabel = (status = "") => ({
  fulfilled: "Delivered",
  placed: "Pending",
  draft: "Pending",
  approved: "Confirmed",
  cancelled: "Cancelled",
}[status] || status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()));

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "14px", minHeight: "86px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
        <Icon size={15} />
        {label}
      </div>
      <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", color: "var(--text)", fontSize: "22px", fontWeight: 800, lineHeight: 1.1 }}>{value}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {[1, 2, 3].map((item) => (
        <div key={item} style={{ height: "76px", borderRadius: "var(--r)", background: "linear-gradient(90deg, var(--surface-2), #eef3f8, var(--surface-2))", backgroundSize: "200% 100%" }} className="anim-pulse" />
      ))}
    </div>
  );
}

export default function PurchaseHistoryTab({ customerId, visible }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalOrders: 0, totalSpend: 0, avgOrderValue: 0, lastOrderDate: null });
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [filters, setFilters] = useState({ search: "", status: "", from: "", to: "" });

  useEffect(() => {
    if (!visible || !customerId) return;

    let ignore = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await API.get(`/customers/${customerId}/purchase-history`);
        const data = apiData(response);
        if (!ignore) {
          setSummary(data?.summary || {});
          setOrders(Array.isArray(data?.orders) ? data.orders : []);
        }
      } catch (err) {
        if (!ignore) {
          setError(apiErrorMessage(err, "Failed to load purchase history"));
          setOrders([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [customerId, visible]);

  const filteredOrders = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const fromTime = filters.from ? new Date(filters.from).setHours(0, 0, 0, 0) : null;
    const toTime = filters.to ? new Date(filters.to).setHours(23, 59, 59, 999) : null;

    return orders.filter((order) => {
      const orderTime = order.orderDate ? new Date(order.orderDate).getTime() : 0;
      const matchesDate = (!fromTime || orderTime >= fromTime) && (!toTime || orderTime <= toTime);
      const matchesStatus = !filters.status || statusLabel(order.status).toLowerCase() === filters.status;
      const matchesSearch = !query ||
        String(order.invoiceNumber || "").toLowerCase().includes(query) ||
        (order.items || []).some((item) => String(item.productName || "").toLowerCase().includes(query));

      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [filters, orders]);

  if (loading) return <Skeleton />;

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px" }}>
        <SummaryCard icon={ShoppingBag} label="Total Orders" value={summary.totalOrders || 0} />
        <SummaryCard icon={IndianRupee} label="Total Spend" value={formatCurrency(summary.totalSpend)} />
        <SummaryCard icon={FileText} label="Avg Order Val" value={formatCurrency(summary.avgOrderValue)} />
        <SummaryCard icon={CalendarDays} label="Last Purchase" value={formatDate(summary.lastOrderDate)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.4fr) repeat(3,minmax(130px,1fr))", gap: "10px" }}>
        <input style={inputStyle} value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search product or invoice" />
        <select style={inputStyle} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option value="">All statuses</option>
          <option value="delivered">Delivered</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input style={inputStyle} type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
        <input style={inputStyle} type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
      </div>

      {error ? (
        <p style={{ color: "var(--danger)", fontSize: "13px", fontWeight: 600 }}>{error}</p>
      ) : filteredOrders.length === 0 ? (
        <EmptyState icon={PackageSearch} title="No purchase history yet." description="Orders for this customer will appear here once available." />
      ) : (
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {filteredOrders.map((order) => {
            const key = order.id || order._id || order.invoiceNumber;
            const isOpen = Boolean(expanded[key]);
            return (
              <div key={key} style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <button type="button" onClick={() => setExpanded({ ...expanded, [key]: !isOpen })} style={{ width: "100%", display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center", padding: "14px 16px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontWeight: 800, color: "var(--text)" }}>{order.invoiceNumber || "-"}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>{formatDate(order.orderDate)}</span>
                  <StatusBadge status={statusLabel(order.status)} />
                  <span style={{ fontWeight: 800, color: "var(--text)" }}>{formatCurrency(order.grandTotal)}</span>
                  {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface-2)" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Product Name", "Category", "Qty", "Unit Price", "Total"].map((header) => (
                              <th key={header} style={{ padding: "10px 12px", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(order.items || []).map((item, index) => (
                            <tr key={`${key}-${item.productId || index}`} style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 700 }}>{item.productName}</td>
                              <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{item.category || "-"}</td>
                              <td style={{ padding: "10px 12px" }}>{item.quantity} (Allocated: {item.allocatedQuantity || 0}, Backorder: {item.backorderQuantity || 0})</td>
                              <td style={{ padding: "10px 12px" }}>{formatCurrency(item.unitPrice)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: 800 }}>{formatCurrency(item.totalPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
