import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CalendarDays,
  Factory,
  Package,
  Plus,
  Search,
  Trash2,
  Warehouse
} from "lucide-react";

import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";

import { useAuth } from "../../context/AuthContext";
import API, { apiErrorMessage, apiItems } from "../../services/api";

const MANAGE_ROLES = ["owner", "admin", "manager"];

const emptyForm = {
  name: "",
  sku: "",
  catalogNumber: "",
  make: "",
  category: "",
  batchNumber: "",
  price: "",
  stock: "",
  unit: "piece",
  expiryDate: "",
  description: ""
};

const inputStyle = {
  width: "100%",
  fontFamily: "Be Vietnam Pro,sans-serif",
  fontSize: "14px",
  color: "var(--text)",
  background: "var(--surface-2)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r)",
  padding: "10px 14px",
  outline: "none"
};

const focus = (event) => {
  event.target.style.borderColor = "var(--emerald)";
  event.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
};

const blur = (event) => {
  event.target.style.borderColor = "var(--border)";
  event.target.style.boxShadow = "none";
};

const productId = (product) => product._id || product.id;
const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateInputValue = (value) => (value ? String(value).slice(0, 10) : "");
const isExpired = (value) => value && new Date(value) < new Date(new Date().toDateString());
const isExpiringSoon = (value) => {
  if (!value || isExpired(value)) return false;
  const expiry = new Date(value);
  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + 90);
  return expiry <= warningDate;
};
const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const stockStatus = (product) => {
  if (Number(product.stock || 0) <= 0) return "Out Of Stock";
  if (Number(product.stock || 0) <= Number(product.lowStockThreshold || 1)) return "Low Stock";
  return "In Stock";
};
const makeSku = (value = "") =>
  String(value || "catalog-item")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || `CATALOG-${Date.now()}`;
const expiryStatus = (product) => {
  if (isExpired(product.expiryDate)) return "Expired";
  if (isExpiringSoon(product.expiryDate)) return "Expiring Soon";
  return "Valid";
};
export default function Products() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(String(user?.role || "").toLowerCase().trim());

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [make, setMake] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const firstResponse = await API.get("/products?limit=100&page=1");
      const firstItems = apiItems(firstResponse);
      const total = Number(firstResponse.raw?.data?.total || firstItems.length);
      const totalPages = Math.max(1, Math.ceil(total / 100));
      const restResponses = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, index) => API.get(`/products?limit=100&page=${index + 2}`))
      );
      setProducts([...firstItems, ...restResponses.flatMap((response) => apiItems(response))]);
    } catch (error) {
      console.error("Products load failed:", error.response?.data || error);
      setProducts([]);
      toast.error(apiErrorMessage(error, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean))).sort()], [products]);
  const makes = useMemo(() => ["All", ...Array.from(new Set(products.map((product) => product.make || product.supplier).filter(Boolean))).sort()], [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const productMake = product.make || product.supplier || "";
      const matchesCategory = category === "All" || product.category === category;
      const matchesMake = make === "All" || productMake === make;
      const matchesSearch =
        !query ||
        [product.name, product.catalogNumber, product.batchNumber, productMake, product.category, product.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesCategory && matchesMake && matchesSearch;
    });
  }, [category, make, products, search]);

  const stats = useMemo(
    () => [
      { label: "Catalog Items", value: products.length, icon: Package, color: "var(--emerald)" },
      { label: "Units In Hand", value: products.reduce((sum, product) => sum + Number(product.stock || 0), 0).toLocaleString("en-IN"), icon: Warehouse, color: "var(--info)" },
      { label: "Makes", value: makes.length > 0 ? makes.length - 1 : 0, icon: Factory, color: "var(--emerald)" },
      { label: "Expiry Watch", value: products.filter((product) => expiryStatus(product) !== "Valid").length, icon: AlertTriangle, color: "var(--warning)" }
    ],
    [makes.length, products]
  );

  const reset = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      catalogNumber: product.catalogNumber || "",
      make: product.make || product.supplier || "",
      category: product.category || "",
      batchNumber: product.batchNumber || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      unit: product.unit || "piece",
      expiryDate: dateInputValue(product.expiryDate),
      description: product.description || ""
    });
    setEditId(productId(product));
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      sku: form.sku || makeSku(form.catalogNumber || form.name),
      supplier: form.make,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      lowStockThreshold: 1,
      expiryDate: form.expiryDate || undefined
    };

    if (!payload.name) return toast.error("Product name is required");
    if (!payload.make) return toast.error("Make is required");

    try {
      if (editId) {
        await API.patch(`/products/${editId}`, payload);
        toast.success("Product updated");
      } else {
        await API.post("/products", payload);
        toast.success("Product added");
      }

      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to save product"));
    }
  };

  const deleteCurrentProduct = async () => {
    if (!editId || !canManage) return;
    if (!window.confirm("Delete this product?")) return;

    try {
      await API.delete(`/products/${editId}`);
      toast.success("Product deleted");
      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete product"));
    }
  };

  const deleteProduct = async (event, product) => {
    event.stopPropagation();
    if (!canManage) return;
    if (!window.confirm(`Delete ${product.name || "this product"}?`)) return;

    try {
      await API.delete(`/products/${productId(product)}`);
      toast.success("Product deleted");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete product"));
    }
  };

  const columns = [
    {
      header: "Product",
      accessor: "name",
      render: (row) => (
        <div style={{ minWidth: "260px" }}>
          <p style={{ fontWeight: 800, color: "var(--text)" }}>{row.name}</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Cat No: {row.catalogNumber || "-"}</p>
        </div>
      )
    },
    { header: "Make", accessor: "make", render: (row) => <span style={{ fontWeight: 700 }}>{row.make || row.supplier || "-"}</span> },
    { header: "Category", accessor: "category", render: (row) => <span>{row.category || "-"}</span> },
    { header: "Batch", accessor: "batchNumber", render: (row) => <span className="font-mono" style={{ fontSize: "12px" }}>{row.batchNumber || "-"}</span> },
    { header: "Price", accessor: "price", render: (row) => <span style={{ fontWeight: 800 }}>{formatCurrency(row.price)}</span> },
    {
      header: "In Hand",
      accessor: "stock",
      render: (row) => (
        <span style={{ fontWeight: 800 }}>
          {Number(row.stock || 0).toLocaleString("en-IN")} {row.unit || "pcs"}
        </span>
      )
    },
    { header: "Expiry", accessor: "expiryDate", render: (row) => <span>{formatDate(row.expiryDate)}</span> },
    { header: "Stock", accessor: "stockStatus", render: (row) => <StatusBadge status={stockStatus(row)} /> },
    { header: "Expiry Status", accessor: "expiryDate", render: (row) => <StatusBadge status={expiryStatus(row)} /> },
    ...(canManage
      ? [
          {
            header: "Delete",
            accessor: "action",
            render: (row) => (
              <button
                type="button"
                className="btn-ghost"
                onClick={(event) => deleteProduct(event, row)}
                title="Delete product"
                style={{ padding: "7px 10px", fontSize: "12px", color: "var(--danger)", whiteSpace: "nowrap" }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )
          }
        ]
      : [])
  ];

  if (loading) return <LoadingSpinner text="Loading product catalog..." />;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="BGL Stock Catalog"
        title="Products"
        subtitle="Catalog aligned to BGL STOCK 2026-27 as on 02.06.2026"
        action={
          canManage ? (
            <button className="btn-primary" onClick={() => { reset(); setOpen(true); }}>
              <Plus size={16} />
              Add Product
            </button>
          ) : null
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "12px", marginBottom: "18px" }}>
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Icon size={20} style={{ color, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-sm)", padding: "14px", marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(180px,240px) minmax(180px,240px)", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, cat no, batch, make..." className="inp-base" style={{ paddingLeft: "36px", paddingTop: "9px", paddingBottom: "9px" }} />
          </div>
          <select value={make} onChange={(event) => setMake(event.target.value)} style={inputStyle}>
            {makes.map((item) => <option key={item} value={item}>{item === "All" ? "All Makes" : item}</option>)}
          </select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} style={inputStyle}>
            {categories.map((item) => <option key={item} value={item}>{item === "All" ? "All Categories" : item}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="No products" description="No catalog products match the current filters." />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={15} searchable={false} onRowClick={canManage ? openEdit : undefined} emptyMessage="No products found." />
      )}

      <Modal isOpen={open} onClose={() => { setOpen(false); reset(); }} title={editId ? "Edit Catalog Product" : "Add Catalog Product"} size="lg">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "16px" }}>
            <FormField label="Product Name" required>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Cat No">
              <input value={form.catalogNumber} onChange={(event) => setForm({ ...form, catalogNumber: event.target.value, sku: event.target.value || form.sku })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Make" required>
              <input value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Category">
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Batch No">
              <input value={form.batchNumber} onChange={(event) => setForm({ ...form, batchNumber: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Price">
              <input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="In Hand">
              <input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Unit">
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
            <FormField label="Expiry Date">
              <input type="date" value={form.expiryDate} onChange={(event) => setForm({ ...form, expiryDate: event.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea value={form.description} rows={3} onChange={(event) => setForm({ ...form, description: event.target.value })} style={{ ...inputStyle, resize: "none" }} onFocus={focus} onBlur={blur} />
          </FormField>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <div>
              {editId && canManage && (
                <button type="button" className="btn-ghost" onClick={deleteCurrentProduct} style={{ color: "var(--danger)" }}>
                  <Trash2 size={15} />
                  Delete Product
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="btn-secondary" onClick={() => { setOpen(false); reset(); }}>Cancel</button>
              <button type="submit" className="btn-primary">
                <CalendarDays size={15} />
                {editId ? "Save Product" : "Add Product"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
