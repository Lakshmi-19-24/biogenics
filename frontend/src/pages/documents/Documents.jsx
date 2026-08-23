import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import { Edit3, FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";

const CATEGORIES = [
  "purchase_order",
  "quotation",
  "invoice",
  "agreement",
  "customer_document",
  "other",
];

const VISIBILITY = ["team", "admin"];

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

const humanize = (value = "") => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "other",
    customer: "",
    order: "",
    visibility: "team",
    file: null,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [docsRes, customersRes, ordersRes] = await Promise.all([
        API.get("/documents?limit=100"),
        API.get("/customers?limit=100"),
        API.get("/orders?limit=100"),
      ]);
      setDocuments(apiItems(docsRes));
      setCustomers(apiItems(customersRes));
      setOrders(apiItems(ordersRes));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to load documents"));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditId(null);
    setForm({ title: "", category: "other", customer: "", order: "", visibility: "team", file: null });
  };

  const openCreate = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (document) => {
    setEditId(document._id || document.id);
    setForm({
      title: document.title || "",
      category: document.category || "other",
      customer: document.customer?._id || document.customer || "",
      order: document.order?._id || document.order || "",
      visibility: document.visibility || "team",
      file: null,
    });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title || (!editId && !form.file)) {
      toast.error(editId ? "Title is required" : "Title and file are required");
      return;
    }

    setUploading(true);
    try {
      if (editId) {
        await API.patch(`/documents/${editId}`, {
          title: form.title,
          category: form.category,
          visibility: form.visibility,
          customer: form.customer,
          order: form.order,
        });
      } else {
        const body = new FormData();
        body.append("title", form.title);
        body.append("category", form.category);
        body.append("visibility", form.visibility);
        if (form.customer) body.append("customer", form.customer);
        if (form.order) body.append("order", form.order);
        body.append("file", form.file);
        await API.post("/documents", body, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success(editId ? "Document updated" : "Document uploaded");
      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to upload document"));
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (document) => {
    const ok = window.confirm(`Delete "${document.title}"?`);
    if (!ok) return;

    try {
      await API.delete(`/documents/${document._id || document.id}`);
      toast.success("Document deleted");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete document"));
    }
  };

  const columns = [
    { header: "Title", accessor: "title", render: (row) => <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><FileText size={16} style={{ color: "var(--emerald)" }} /><span style={{ fontWeight: 700 }}>{row.title}</span></div> },
    { header: "Category", accessor: "category", render: (row) => <span>{humanize(row.category)}</span> },
    { header: "File", accessor: "file", render: (row) => row.file?.url ? <a href={row.file.url} target="_blank" rel="noreferrer" style={{ color: "var(--emerald)", fontWeight: 700 }}>Open</a> : "-" },
    { header: "Uploaded By", accessor: "uploadedBy", render: (row) => <span>{row.uploadedBy?.name || "-"}</span> },
    { header: "Visibility", accessor: "visibility", render: (row) => <span>{humanize(row.visibility)}</span> },
    { header: "Date", accessor: "createdAt", render: (row) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "-"}</span> },
    { header: "Actions", render: (row) => (
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px" }} onClick={() => openEdit(row)}><Edit3 size={14} />Edit</button>
        <button className="btn-ghost" style={{ padding: "7px 10px", fontSize: "12px", color: "var(--danger)" }} onClick={() => deleteDocument(row)}><Trash2 size={14} />Delete</button>
      </div>
    ) },
  ];

  if (loading) return <LoadingSpinner text="Loading documents..." />;

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Documents" title="Document Upload" subtitle="Upload and manage business documents" action={<button className="btn-primary" onClick={openCreate}><Plus size={16} />Upload Document</button>} />
      <DataTable columns={columns} data={documents} pageSize={15} emptyMessage="No documents uploaded yet." />

      <Modal isOpen={open} onClose={() => { setOpen(false); reset(); }} title={editId ? "Edit Document" : "Upload Document"} size="lg">
        <form onSubmit={submit} style={{ position: "relative" }}>
          {uploading && (
            <div style={{ position: "absolute", inset: "-8px", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", background: "rgba(10,15,30,0.72)", borderRadius: "var(--r-lg)", backdropFilter: "blur(6px)" }}>
              <Loader2 size={30} className="anim-spin" style={{ color: "var(--emerald)" }} />
              <p style={{ color: "var(--text)", fontWeight: 800 }}>{editId ? "Saving changes..." : "Uploading document..."}</p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Please keep this window open.</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "16px" }}>
            <FormField label="Title" required><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} /></FormField>
            <FormField label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>{CATEGORIES.map((category) => <option key={category} value={category}>{humanize(category)}</option>)}</select></FormField>
            <FormField label="Customer"><select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}><option value="">None</option>{customers.map((customer) => <option key={customer._id || customer.id} value={customer._id || customer.id}>{customer.name}</option>)}</select></FormField>
            <FormField label="Order"><select value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}><option value="">None</option>{orders.map((order) => <option key={order._id || order.id} value={order._id || order.id}>{order.orderNo}</option>)}</select></FormField>
            <FormField label="Visibility"><select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>{VISIBILITY.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}</select></FormField>
            {!editId && <FormField label="File" required><input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} style={inputStyle} onFocus={focus} onBlur={blur} /></FormField>}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <button type="button" className="btn-ghost" disabled={uploading} onClick={() => { setOpen(false); reset(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={uploading}><Upload size={15} />{uploading ? "Saving..." : editId ? "Save Changes" : "Upload"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
