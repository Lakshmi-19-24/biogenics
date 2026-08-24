import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

const STATUSES = ["pending", "accepted", "rejected", "expired"];
const inputStyle = { width: "100%", fontSize: "14px", background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", outline: "none" };
const humanize = (v = "") => v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [status, setStatus] = useState("pending");
  const [form, setForm] = useState({ customer: "", validTill: "", notes: "", items: [{ product: "", name: "", quantity: 1, price: "" }] });

  const load = async () => {
    setLoading(true);
    try {
      const [quotationRes, customerRes, productRes] = await Promise.all([
        API.get("/quotations?limit=100"),
        API.get("/customers?limit=100"),
        API.get("/products?limit=100"),
      ]);
      setQuotations(apiItems(quotationRes));
      setCustomers(apiItems(customerRes));
      setProducts(apiItems(productRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load quotations"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => form.items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.price || 0), 0), [form.items]);
  const updateItem = (idx, patch) => setForm((p) => ({ ...p, items: p.items.map((i, n) => n === idx ? { ...i, ...patch } : i) }));
  const chooseProduct = (idx, id) => {
    const product = products.find((p) => (p._id || p.id) === id);
    updateItem(idx, { product: id, name: product?.name || "", price: product?.price || "" });
  };

  const submit = async (event) => {
    event.preventDefault();
    const items = form.items.filter((i) => i.name && Number(i.quantity) > 0).map((i) => ({ product: i.product || undefined, name: i.name, quantity: Number(i.quantity), price: Number(i.price || 0) }));
    if (!form.customer || !items.length) return toast.error("Customer and at least one item are required");
    try {
      await API.post("/quotations", { ...form, items, validTill: form.validTill || undefined });
      toast.success("Quotation created");
      setOpen(false);
      setForm({ customer: "", validTill: "", notes: "", items: [{ product: "", name: "", quantity: 1, price: "" }] });
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to create quotation"));
    }
  };

  const saveStatus = async (event) => {
    event.preventDefault();
    try {
      await API.patch(`/quotations/${active._id || active.id}/status`, { status });
      toast.success("Quotation updated");
      setStatusOpen(false);
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update quotation"));
    }
  };

  const columns = [
    { header: "Quotation", accessor: "quotationNo", render: (r) => <span className="font-mono" style={{ fontWeight: 700 }}>{r.quotationNo}</span> },
    { header: "Customer", accessor: "customer", render: (r) => r.customer?.name || "-" },
    { header: "Items", accessor: "items", render: (r) => r.items?.map((i) => `${i.name} x${i.quantity}`).join(", ") || "-" },
    { header: "Total", accessor: "total", render: (r) => <span style={{ fontWeight: 800 }}>INR {Number(r.total || 0).toLocaleString()}</span> },
    { header: "Valid Till", accessor: "validTill", render: (r) => r.validTill ? new Date(r.validTill).toLocaleDateString("en-IN") : "-" },
    { header: "Status", accessor: "status", render: (r) => <StatusBadge status={humanize(r.status)} /> },
  ];

  if (loading) return <LoadingSpinner text="Loading quotations..." />;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Billing" title="Quotations" subtitle="Create pre-sale price offers for customers" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New Quotation</button>} />
      <DataTable columns={columns} data={quotations} pageSize={15} onRowClick={(q) => { setActive(q); setStatus(q.status || "pending"); setStatusOpen(true); }} emptyMessage="No quotations yet." />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="New Quotation" size="lg">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "14px", marginBottom: "14px" }}>
            <FormField label="Customer" required><select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={inputStyle}><option value="">Select customer</option>{customers.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}</select></FormField>
            <FormField label="Valid Till"><input type="date" value={form.validTill} onChange={(e) => setForm({ ...form, validTill: e.target.value })} style={inputStyle} /></FormField>
          </div>
          <div style={{ display: "grid", gap: "10px" }}>
            {form.items.map((item, idx) => <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px 120px 40px", gap: "8px", alignItems: "end" }}>
              <FormField label="Product"><select value={item.product} onChange={(e) => chooseProduct(idx, e.target.value)} style={inputStyle}><option value="">Custom</option>{products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>)}</select></FormField>
              <FormField label="Name"><input value={item.name} onChange={(e) => updateItem(idx, { name: e.target.value })} style={inputStyle} /></FormField>
              <FormField label="Qty"><input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, { quantity: e.target.value })} style={inputStyle} /></FormField>
              <FormField label="Price"><input type="number" min="0" value={item.price} onChange={(e) => updateItem(idx, { price: e.target.value })} style={inputStyle} /></FormField>
              <button type="button" className="btn-ghost" style={{ padding: "10px" }} onClick={() => setForm((p) => ({ ...p, items: p.items.filter((_, n) => n !== idx) }))}><Trash2 size={14} /></button>
            </div>)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
            <button type="button" className="btn-ghost" onClick={() => setForm((p) => ({ ...p, items: [...p.items, { product: "", name: "", quantity: 1, price: "" }] }))}>Add Item</button>
            <strong>INR {total.toLocaleString()}</strong>
          </div>
          <FormField label="Notes"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, marginTop: "14px" }} /></FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn-primary">Create Quotation</button></div>
        </form>
      </Modal>
      <Modal isOpen={statusOpen} onClose={() => setStatusOpen(false)} title="Update Quotation" size="sm">
        <form onSubmit={saveStatus}><FormField label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></FormField><div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}><button type="button" className="btn-ghost" onClick={() => setStatusOpen(false)}>Cancel</button><button type="submit" className="btn-primary">Save</button></div></form>
      </Modal>
    </div>
  );
}
