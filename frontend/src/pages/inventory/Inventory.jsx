import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const TYPES = ["purchase", "return", "adjustment", "sale"];
const inputStyle = { width: "100%", fontSize: "14px", background: "var(--surface-2)", border: "1.5px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", outline: "none" };
const humanize = (v = "") => v.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

export default function Inventory() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ product: "", type: "purchase", quantity: 1, warehouse: "main", note: "", backorder_id: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [movementRes, productRes] = await Promise.all([
        API.get("/inventory/movements?limit=100"),
        API.get("/products?limit=100"),
      ]);
      setMovements(apiItems(movementRes));
      setProducts(apiItems(productRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load inventory"));
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openBackorderModal = (row) => {
    setForm({
      product: row.product?._id || row.product?.id,
      type: "sale",
      quantity: row.quantity,
      warehouse: row.warehouse || "main",
      note: row.note,
      backorder_id: row.referenceId || "",
    });
    setOpen(true);
  };

  // Define table columns including action for backorder fulfillment
  const columns = [
    { header: "Product", accessor: "product", render: (row) => <div><p style={{ fontWeight: 700 }}>{row.product?.name || "-"}</p><p className="font-mono" style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.product?.sku || "-"}</p></div> },
    { header: "Type", accessor: "type", render: (row) => <span style={{ fontWeight: 700, color: row.type === "sale" ? "var(--danger)" : "var(--emerald)" }}>{humanize(row.type)}</span> },
    { header: "Quantity", accessor: "quantity", render: (row) => {
      if (row.note?.includes('Backorder')) {
        return <span style={{ fontWeight: 800 }}>-0</span>;
      }
      return <span style={{ fontWeight: 800 }}>{row.type === "sale" ? "-" : "+"}{Number(row.quantity || 0).toLocaleString()}</span>;
    } },
    { header: "Remaining", accessor: "quantity", render: (row) => row.note?.includes("Backorder") ? <span style={{ fontWeight: 600, color: "var(--warning)" }}>{Number(row.quantity).toLocaleString()}</span> : "" },
    { header: "Warehouse", accessor: "warehouse", render: (row) => row.warehouse || "main" },
    { header: "Reference", accessor: "referenceType", render: (row) => row.referenceType || "Manual" },
    { header: "Note", accessor: "note", render: (row) => row.note || "-" },
    { header: "Created By", accessor: "createdBy", render: (row) => row.createdBy?.name || "-" },
    { header: "Date", accessor: "createdAt", render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "-" },
    { header: "Action", accessor: "action", render: (row) => row.note?.includes("Backorder") && row.note.includes("remaining") ? <button className="btn-ghost" onClick={() => openBackorderModal(row)}>Fulfill</button> : null }
  ];

  const submit = async (event) => {
    event.preventDefault();
    if (!form.product || !form.quantity) {
      toast.error("Product and quantity are required");
      return;
    }
    try {
      if (form.backorder_id) {
        // Fulfill backorder via order endpoint
        await API.patch(`/orders/${form.backorder_id}/backorder`, { product: form.product, quantity: Number(form.quantity) });
        toast.success("Backorder fulfilled");
      } else {
        await API.post(`/products/${form.product}/stock`, { ...form, quantity: Number(form.quantity) });
        toast.success("Stock adjusted");
      }
      setOpen(false);
      setForm({ product: "", type: "purchase", quantity: 1, warehouse: "main", note: "", backorder_id: "" });
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, form.backorder_id ? "Failed to fulfill backorder" : "Failed to adjust stock"));
    }
  };

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Stock" title="Inventory Movements" subtitle="Track stock purchases, sales, returns, and adjustments" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />Adjust Stock</button>} />
      <DataTable columns={columns} data={movements} pageSize={15} emptyMessage="No inventory movements yet." />
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Adjust Stock" size="md">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gap: "14px" }}>
            <FormField label="Product" required><select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} style={inputStyle}><option value="">Select product</option>{products.map((p) => <option key={p._id || p.id} value={p._id || p.id}>{p.name} - stock {p.stock}</option>)}</select></FormField>
            <FormField label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle}>{TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}</select></FormField>
            <FormField label="Quantity" required><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Warehouse"><input value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Backorder ID"><input value={form.backorder_id} onChange={(e) => setForm({ ...form, backorder_id: e.target.value })} style={inputStyle} /></FormField>
            <FormField label="Note"><textarea rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={{ ...inputStyle, resize: "vertical" }} /></FormField>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save Movement</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
