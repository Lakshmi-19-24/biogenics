import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Upload } from "lucide-react";

const STATUSES = ["draft", "sent", "paid", "cancelled"];
const inputStyle = { width: "100%", fontSize: "14px", background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", outline: "none" };
const humanize = (v = "") => v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({ order: "", dueDate: "", status: "draft" });
  const [edit, setEdit] = useState({ status: "draft", file: null });

  const load = async () => {
    setLoading(true);
    try {
      const [invoiceRes, orderRes] = await Promise.all([API.get("/invoices?limit=100"), API.get("/orders?limit=100")]);
      setInvoices(apiItems(invoiceRes));
      setOrders(apiItems(orderRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load invoices"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createInvoice = async (event) => {
    event.preventDefault();
    if (!form.order) return toast.error("Order is required");
    try {
      await API.post("/invoices", { ...form, dueDate: form.dueDate || undefined });
      toast.success("Invoice created");
      setOpen(false);
      setForm({ order: "", dueDate: "", status: "draft" });
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to create invoice"));
    }
  };

  const saveInvoice = async (event) => {
    event.preventDefault();
    try {
      await API.patch(`/invoices/${active._id || active.id}/status`, { status: edit.status });
      if (edit.file) {
        const body = new FormData();
        body.append("file", edit.file);
        await API.post(`/invoices/${active._id || active.id}/file`, body, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success("Invoice updated");
      setEditOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update invoice"));
    }
  };

  const invoicedOrderIds = new Set(invoices.map((i) => i.order?._id || i.order));
  const availableOrders = orders.filter((o) => !invoicedOrderIds.has(o._id || o.id));
  const columns = [
    { header: "Invoice", accessor: "invoiceNo", render: (r) => <span className="font-mono" style={{ fontWeight: 700 }}>{r.invoiceNo}</span> },
    { header: "Order", accessor: "order", render: (r) => r.order?.orderNo || "-" },
    { header: "Customer", accessor: "customer", render: (r) => r.customer?.name || "-" },
    { header: "Amount", accessor: "grandTotal", render: (r) => <span style={{ fontWeight: 800 }}>INR {Number(r.grandTotal || 0).toLocaleString()}</span> },
    { header: "Due Date", accessor: "dueDate", render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-" },
    { header: "File", accessor: "file", render: (r) => r.file?.url ? <a href={r.file.url} target="_blank" rel="noreferrer" style={{ color: "var(--emerald)", fontWeight: 700 }}>Open</a> : "-" },
    { header: "Status", accessor: "status", render: (r) => <StatusBadge status={humanize(r.status)} /> },
  ];

  if (loading) return <LoadingSpinner text="Loading invoices..." />;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Billing" title="Invoices" subtitle="Create invoices from confirmed orders and track status" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New Invoice</button>} />
      <DataTable columns={columns} data={invoices} pageSize={15} onRowClick={(i) => { setActive(i); setEdit({ status: i.status || "draft", file: null }); setEditOpen(true); }} emptyMessage="No invoices yet." />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Create Invoice" size="md">
        <form onSubmit={createInvoice}>
          <div style={{ display: "grid", gap: "14px" }}>
            <FormField label="Order" required><select value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} style={inputStyle}><option value="">Select order</option>{availableOrders.map((o) => <option key={o._id || o.id} value={o._id || o.id}>{o.orderNo} - {o.customer?.name || "Customer"} - INR {Number(o.grandTotal || 0).toLocaleString()}</option>)}</select></FormField>
            <FormField label="Due Date"><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></FormField>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn-primary">Create Invoice</button></div>
        </form>
      </Modal>
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Update Invoice" size="md">
        <form onSubmit={saveInvoice}>
          <div style={{ display: "grid", gap: "14px" }}>
            <FormField label="Status"><select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} style={inputStyle}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></FormField>
            <FormField label="Invoice File"><input type="file" onChange={(e) => setEdit({ ...edit, file: e.target.files?.[0] || null })} style={inputStyle} /></FormField>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}><button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button><button type="submit" className="btn-primary"><Upload size={15} />Save</button></div>
        </form>
      </Modal>
    </div>
  );
}
