import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import StatsCard from "../../components/ui/StatsCard";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, CheckCircle, Clock, AlertTriangle, IndianRupee } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Received", value: "received" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

const MODE_OPTIONS = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Card", value: "card" },
  { label: "Online Gateway", value: "online_gateway" },
];

const inputStyle = {
  width: "100%",
  fontFamily: "Be Vietnam Pro,sans-serif",
  fontSize: "14px",
  color: "var(--text)",
  background: "var(--surface-2)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "10px 14px",
  outline: "none",
};

const focus = (e) => {
  e.target.style.borderColor = "var(--emerald)";
  e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
};

const blur = (e) => {
  e.target.style.borderColor = "var(--border)";
  e.target.style.boxShadow = "none";
};

const labelOf = (options, value) => options.find((item) => item.value === value)?.label || value || "-";
const statusLabel = (value) => ({ received: "Paid", pending: "Pending", failed: "Overdue", refunded: "Refunded" }[value] || value);
const idOf = (value) => (typeof value === "object" && value ? value._id || value.id : value);

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    order: "",
    customer: "",
    amount: "",
    mode: "cash",
    status: "received",
    transactionRef: "",
    receivedAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [paymentsRes, ordersRes, customersRes] = await Promise.all([
        API.get("/payments?limit=100"),
        API.get("/orders?limit=100"),
        API.get("/customers?limit=100"),
      ]);
      setPayments(apiItems(paymentsRes));
      setOrders(apiItems(ordersRes));
      setCustomers(apiItems(customersRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load payments"));
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => (order._id || order.id) === form.order),
    [orders, form.order]
  );

  const paidByOrder = useMemo(() => {
    return payments.reduce((acc, payment) => {
      if (payment.status !== "received") return acc;
      const orderId = idOf(payment.order);
      if (!orderId) return acc;
      acc[orderId] = (acc[orderId] || 0) + Number(payment.amount || 0);
      return acc;
    }, {});
  }, [payments]);

  const remainingForOrder = useCallback(
    (order) => Math.max(0, Number(order?.grandTotal || 0) - Number(paidByOrder[order?._id || order?.id] || 0)),
    [paidByOrder]
  );
  const availableOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus !== "paid" && remainingForOrder(order) > 0),
    [orders, remainingForOrder]
  );

  const reset = () => {
    setForm({
      order: "",
      customer: "",
      amount: "",
      mode: "cash",
      status: "received",
      transactionRef: "",
      receivedAt: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const selectOrder = (orderId) => {
    const order = availableOrders.find((item) => (item._id || item.id) === orderId);
    const remaining = remainingForOrder(order);
    setForm((prev) => ({
      ...prev,
      order: orderId,
      customer: order?.customer?._id || order?.customer || "",
      amount: remaining ? String(remaining) : "",
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.order || !form.customer || !form.amount) {
      toast.error("Order, customer, and amount are required");
      return;
    }
    const remaining = remainingForOrder(selectedOrder);
    if (form.status === "received" && Number(form.amount || 0) > remaining) {
      toast.error(`Only INR ${remaining.toLocaleString()} is remaining for this order`);
      return;
    }

    try {
      await API.post("/payments", {
        ...form,
        amount: Number(form.amount || 0),
        receivedAt: form.receivedAt ? new Date(form.receivedAt).toISOString() : undefined,
      });
      toast.success("Payment recorded");
      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to record payment"));
    }
  };

  const filtered = filter === "all" ? payments : payments.filter((payment) => payment.status === filter);
  const collected = payments.filter((payment) => payment.status === "received").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pending = payments.filter((payment) => payment.status === "pending").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const failed = payments.filter((payment) => payment.status === "failed").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const columns = [
    { header: "Customer", accessor: "customer", render: (row) => <span style={{ fontWeight: 600 }}>{row.customer?.name || "-"}</span> },
    { header: "Order", accessor: "order", render: (row) => <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700 }}>{row.order?.orderNo || "-"}</span> },
    { header: "Amount", accessor: "amount", render: (row) => <span style={{ fontWeight: 800 }}>INR {Number(row.amount || 0).toLocaleString()}</span> },
    { header: "Mode", accessor: "mode", render: (row) => <span>{labelOf(MODE_OPTIONS, row.mode)}</span> },
    { header: "Reference", accessor: "transactionRef", render: (row) => <span className="font-mono" style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.transactionRef || "-"}</span> },
    { header: "Date", accessor: "receivedAt", render: (row) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.receivedAt ? new Date(row.receivedAt).toLocaleDateString("en-IN") : "-"}</span> },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={statusLabel(row.status)} /> },
  ];

  if (loading) return <LoadingSpinner text="Loading payments..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Record collections against real customer orders"
        action={<button className="btn-primary" onClick={() => { reset(); setOpen(true); }}><Plus size={16} />Record Payment</button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "14px", marginBottom: "20px" }} className="stagger">
        <StatsCard icon={IndianRupee} label="Total Entries" value={payments.length} color="primary" />
        <StatsCard icon={CheckCircle} label="Collected" value={`INR ${collected.toLocaleString()}`} color="success" />
        <StatsCard icon={Clock} label="Pending" value={`INR ${pending.toLocaleString()}`} color="warning" />
        <StatsCard icon={AlertTriangle} label="Failed" value={`INR ${failed.toLocaleString()}`} color="danger" />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {[{ label: "All", value: "all" }, ...STATUS_OPTIONS].map((item) => (
          <button key={item.value} onClick={() => setFilter(item.value)} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1.5px solid", background: filter === item.value ? "var(--emerald)" : "var(--surface)", color: filter === item.value ? "white" : "var(--text-3)", borderColor: filter === item.value ? "var(--emerald)" : "var(--border)" }}>
            {item.label}{item.value !== "all" && ` (${payments.filter((payment) => payment.status === item.value).length})`}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} pageSize={10} emptyMessage="No payments recorded yet." />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Record Payment" size="lg">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "16px" }}>
            <FormField label="Order" required>
              <select value={form.order} onChange={(e) => selectOrder(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                <option value="">Select order</option>
                {availableOrders.map((order) => {
                  const remaining = remainingForOrder(order);
                  return (
                  <option key={order._id || order.id} value={order._id || order.id}>
                    {order.orderNo} - {order.customer?.name || "Customer"} - remaining INR {remaining.toLocaleString()}
                  </option>
                );})}
              </select>
            </FormField>
            <FormField label="Customer" required>
              <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer._id || customer.id} value={customer._id || customer.id}>{customer.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Amount" required>
              <input type="number" min="0" max={selectedOrder ? remainingForOrder(selectedOrder) : undefined} value={form.amount} placeholder={selectedOrder ? String(remainingForOrder(selectedOrder)) : "0.00"} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Mode">
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                {MODE_OPTIONS.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </FormField>
            <FormField label="Received Date">
              <input type="date" value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Transaction Reference">
              <input type="text" value={form.transactionRef} placeholder="UTR / cheque / receipt no." onChange={(e) => setForm({ ...form, transactionRef: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea value={form.notes} rows={3} placeholder="Notes..." onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
