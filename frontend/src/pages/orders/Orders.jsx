import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Plus, ShoppingCart, IndianRupee, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";

const MANAGE_ROLES = ["owner", "admin", "manager"];

const STATUSES = [
  { label: "Draft", value: "draft" },
  { label: "Placed", value: "placed" },
  { label: "Approved", value: "approved" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Cancelled", value: "cancelled" },
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

const titleCase = (value = "") => value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
const productOptionLabel = (product) => {
  const supplier = product.supplier ? `${product.supplier} - ` : "";
  const price = productPrice(product);
  const priceLabel = price > 0 ? `INR ${price.toLocaleString()}` : "price pending";
  return `${supplier}${product.name} - ${priceLabel} - stock ${product.stock ?? 0}`;
};

const sameId = (left, right) => String(left || "") === String(right || "");
const productPrice = (product) => Number(product?.price ?? product?.unitPrice ?? 0);

export default function Orders() {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(String(user?.role || "").toLowerCase().trim());

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editOrder, setEditOrder] = useState(null);
  const [form, setForm] = useState({
    customer: "",
    status: "placed",
    notes: "",
    items: [{ product: "", quantity: 1 }],
  });

  const load = async () => {
    setLoading(true);
    const [ordersResult, customersResult, productsResult] = await Promise.allSettled([
      API.get("/orders?limit=100"),
      API.get("/customers?limit=100"),
      API.get("/products?limit=100"),
    ]);

    if (ordersResult.status === "fulfilled") {
      setOrders(apiItems(ordersResult.value));
    } else {
      console.error("Orders load failed:", ordersResult.reason?.response?.data || ordersResult.reason);
      setOrders([]);
      toast.error(apiErrorMessage(ordersResult.reason, "Failed to load orders"));
    }

    if (customersResult.status === "fulfilled") {
      setCustomers(apiItems(customersResult.value));
    } else {
      console.error("Customers load failed:", customersResult.reason?.response?.data || customersResult.reason);
      setCustomers([]);
      toast.error(apiErrorMessage(customersResult.reason, "Failed to load customers"));
    }

    if (productsResult.status === "fulfilled") {
      setProducts(apiItems(productsResult.value));
    } else {
      console.error("Products load failed:", productsResult.reason?.response?.data || productsResult.reason);
      setProducts([]);
      toast.error(apiErrorMessage(productsResult.reason, "Products unavailable. Orders still loaded."));
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditOrder(null);
    setForm({ customer: "", status: "placed", notes: "", items: [{ product: "", quantity: 1 }] });
  };

  const openNew = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (order) => {
    setEditOrder(order);
    setForm({
      customer: order.customer?._id || order.customer || "",
      status: order.status || "placed",
      notes: order.notes || "",
      items: order.items?.length ? order.items.map((item) => ({ product: item.product?._id || item.product || "", quantity: item.quantity || 1 })) : [{ product: "", quantity: 1 }],
    });
    setOpen(true);
  };

  const updateItem = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  };

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, { product: "", quantity: 1 }] }));
  const removeItem = (index) => setForm((prev) => ({ ...prev, items: prev.items.filter((_, itemIndex) => itemIndex !== index) }));

  const estimatedTotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const product = products.find((candidate) => sameId(candidate._id || candidate.id, item.product));
      const qty = Number(item.quantity || 0);
      return sum + productPrice(product) * qty;
    }, 0);
  }, [form.items, products]);

  const hasSelectedProductWithoutPrice = form.items.some((item) => {
    if (!item.product) return false;
    const product = products.find((candidate) => sameId(candidate._id || candidate.id, item.product));
    return product && productPrice(product) <= 0;
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!form.customer) {
      toast.error("Customer is required");
      return;
    }
    const items = form.items
      .filter((item) => item.product && Number(item.quantity) > 0)
      .map((item) => ({ product: item.product, quantity: Number(item.quantity) }));
    if (!items.length) {
      toast.error("Add at least one product");
      return;
    }

    try {
      if (editOrder) {
        await API.patch(`/orders/${editOrder._id || editOrder.id}/status`, { status: form.status });
        toast.success("Order status updated");
      } else {
        await API.post("/orders", { customer: form.customer, items, notes: form.notes, status: form.status });
        toast.success("Order created");
      }
      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to save order"));
    }
  };

  const deleteOrder = async (event, order) => {
    event.stopPropagation();
    if (!canManage) return;
    if (!window.confirm(`Delete ${order.orderNo || "this order"}? Stock allocated to this order will be returned.`)) return;

    try {
      await API.delete(`/orders/${order._id || order.id}`);
      toast.success("Order deleted");
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete order"));
    }
  };

  const deleteCurrentOrder = async () => {
    if (!editOrder || !canManage) return;
    if (!window.confirm(`Delete ${editOrder.orderNo || "this order"}? Stock allocated to this order will be returned.`)) return;

    try {
      await API.delete(`/orders/${editOrder._id || editOrder.id}`);
      toast.success("Order deleted");
      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete order"));
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((order) => order.status === filter);
  const revenue = orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0);

  const columns = [
    { header: "Order", accessor: "orderNo", render: (row) => <span className="font-mono" style={{ fontSize: "12px", fontWeight: 700 }}>{row.orderNo || "-"}</span> },
    { header: "Customer", accessor: "customer", render: (row) => <span style={{ fontWeight: 600 }}>{row.customer?.name || "-"}</span> },
    { header: "Items", accessor: "items", render: (row) => <span style={{ color: "var(--text-muted)" }}>{Array.isArray(row.items) ? row.items.map((item) => `${item.name} x${item.quantity}${item.allocatedQuantity !== undefined ? ` (Allocated: ${item.allocatedQuantity}, Backorder: ${item.backorderQuantity})` : ''}`).join(", ") : "-"}</span> },
    { header: "Amount", accessor: "grandTotal", render: (row) => <span style={{ fontWeight: 800 }}>INR {Number(row.grandTotal || 0).toLocaleString()}</span> },
    { header: "Payment", accessor: "paymentStatus", render: (row) => <StatusBadge status={titleCase(row.paymentStatus || "unpaid")} /> },
    { header: "Status", accessor: "status", render: (row) => <StatusBadge status={titleCase(row.status || "placed")} /> },
    { header: "Date", accessor: "createdAt", render: (row) => <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN") : "-"}</span> },
    ...(canManage
      ? [
          {
            header: "Delete",
            accessor: "action",
            render: (row) => (
              <button
                type="button"
                className="btn-ghost"
                onClick={(event) => deleteOrder(event, row)}
                title="Delete order"
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

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "var(--info)" },
    { label: "Revenue", value: `INR ${revenue.toLocaleString()}`, icon: IndianRupee, color: "var(--emerald)" },
    { label: "Placed", value: orders.filter((order) => order.status === "placed").length, icon: Clock, color: "var(--warning)" },
    { label: "Fulfilled", value: orders.filter((order) => order.status === "fulfilled").length, icon: CheckCircle, color: "var(--emerald)" },
    { label: "Cancelled", value: orders.filter((order) => order.status === "cancelled").length, icon: XCircle, color: "var(--danger)" },
  ];

  return (
    <div className="page-enter">
      <PageHeader eyebrow="Order Management" title="Orders" subtitle="Create product-based orders and track fulfillment" action={<button className="btn-primary" onClick={openNew}><Plus size={16} />New Order</button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px", marginBottom: "20px" }}>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {[{ label: "All", value: "all" }, ...STATUSES].map((status) => (
          <button key={status.value} onClick={() => setFilter(status.value)} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1.5px solid", background: filter === status.value ? "var(--emerald)" : "var(--surface)", color: filter === status.value ? "white" : "var(--text-3)", borderColor: filter === status.value ? "var(--emerald)" : "var(--border)" }}>
            {status.label}{status.value !== "all" && ` (${orders.filter((order) => order.status === status.value).length})`}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} pageSize={10} onRowClick={openEdit} emptyMessage="No orders found." />

      <Modal isOpen={open} onClose={() => { setOpen(false); reset(); }} title={editOrder ? "Update Order Status" : "New Order"} size="lg">
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "16px", marginBottom: "16px" }}>
            <FormField label="Customer" required>
              <select disabled={Boolean(editOrder)} value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} style={{ ...inputStyle, cursor: editOrder ? "not-allowed" : "pointer" }} onFocus={focus} onBlur={blur}>
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer._id || customer.id} value={customer._id || customer.id}>{customer.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </FormField>
          </div>

          {!editOrder && (
            <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
              {form.items.map((item, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px 40px", gap: "10px", alignItems: "end" }}>
                  <FormField label={index === 0 ? "Product" : "Product"}>
                    <select value={item.product} onChange={(e) => updateItem(index, { product: e.target.value })} style={{ ...inputStyle, cursor: "pointer" }} onFocus={focus} onBlur={blur}>
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product._id || product.id} value={product._id || product.id}>
                          {productOptionLabel(product)}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Qty">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} style={inputStyle} onFocus={focus} onBlur={blur} />
                  </FormField>
                  <button type="button" className="btn-ghost" onClick={() => removeItem(index)} disabled={form.items.length === 1} style={{ padding: "10px", justifyContent: "center" }}><Trash2 size={15} /></button>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <button type="button" className="btn-ghost" onClick={addItem}>Add Item</button>
                <span style={{ fontSize: "13px", fontWeight: 800, color: hasSelectedProductWithoutPrice ? "var(--danger)" : "var(--emerald)" }}>
                  {hasSelectedProductWithoutPrice ? "Selected product has no price" : `Estimated total: INR ${estimatedTotal.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}

          <FormField label="Notes">
            <textarea value={form.notes} disabled={Boolean(editOrder)} rows={3} placeholder="Notes..." onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} onFocus={focus} onBlur={blur} />
          </FormField>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <div>
              {editOrder && canManage && (
                <button type="button" className="btn-ghost" onClick={deleteCurrentOrder} style={{ color: "var(--danger)" }}>
                  <Trash2 size={15} />
                  Delete Order
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" className="btn-ghost" onClick={() => { setOpen(false); reset(); }}>Cancel</button>
              <button type="submit" className="btn-primary">{editOrder ? "Update Status" : "Create Order"}</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
