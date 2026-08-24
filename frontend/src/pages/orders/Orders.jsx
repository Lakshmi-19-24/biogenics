import { useEffect, useMemo, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";

import {
  Plus,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
} from "lucide-react";

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
  e.target.style.boxShadow =
    "0 0 0 3px rgba(37,99,235,0.12)";
};

const blur = (e) => {
  e.target.style.borderColor = "var(--border)";
  e.target.style.boxShadow = "none";
};

const titleCase = (value = "") =>
  value
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");

const sameId = (left, right) =>
  String(left || "") === String(right || "");

const productPrice = (product) =>
  Number(
    product?.price ??
      product?.unitPrice ??
      0
  );

const productOptionLabel = (product) => {
  const supplier = product?.supplier
    ? `${product.supplier} - `
    : "";

  const price = productPrice(product);

  const priceLabel =
    price > 0
      ? `INR ${price.toLocaleString()}`
      : "price pending";

  return `${supplier}${product?.name || "Unnamed Product"} - ${priceLabel} - stock ${
    product?.stock ?? 0
  }`;
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  /*
   * Each product row gets its own search value.
   *
   * Example:
   * {
   *   0: "Qiagen",
   *   1: "TRUPCR",
   *   2: "Gilson"
   * }
   */
  const [productSearch, setProductSearch] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [open, setOpen] =
    useState(false);

  const [filter, setFilter] =
    useState("all");

  const [editOrder, setEditOrder] =
    useState(null);

  const [form, setForm] = useState({
    customer: "",
    status: "placed",

    // Purchase Order
    poNumber: "",
    poDate: "",
    poAmount: "",

    notes: "",
    grandTotal: "",

    items: [
      {
        product: "",
        quantity: 1,
      },
    ],
  });

  /*
   * ==========================================
   * GET FILTERED PRODUCTS FOR ONE ROW
   * ==========================================
   */
  const getFilteredProducts = (
    index,
    selectedProductId = ""
  ) => {
    const searchValue = String(
      productSearch[index] || ""
    )
      .trim()
      .toLowerCase();

    let result;

    if (!searchValue) {
      result = products;
    } else {
      result = products.filter(
        (product) =>
          String(product?.name || "")
            .toLowerCase()
            .includes(searchValue) ||
          String(product?.sku || "")
            .toLowerCase()
            .includes(searchValue) ||
          String(
            product?.catalogNumber || ""
          )
            .toLowerCase()
            .includes(searchValue) ||
          String(product?.supplier || "")
            .toLowerCase()
            .includes(searchValue)
      );
    }

    /*
     * Always keep currently selected product
     * in the options.
     */
    if (selectedProductId) {
      const selectedExists =
        result.some((product) =>
          sameId(
            product?._id ||
              product?.id,
            selectedProductId
          )
        );

      if (!selectedExists) {
        const selectedProduct =
          products.find((product) =>
            sameId(
              product?._id ||
                product?.id,
              selectedProductId
            )
          );

        if (selectedProduct) {
          result = [
            selectedProduct,
            ...result,
          ];
        }
      }
    }

    return result;
  };

  /*
   * ==========================================
   * LOAD DATA
   * ==========================================
   */
  const load = async () => {
    setLoading(true);

    const [
      ordersResult,
      customersResult,
      firstProductResult,
    ] = await Promise.allSettled([
      API.get("/orders?limit=100"),
      API.get("/customers?limit=100"),
      API.get(
        "/products?limit=100&page=1"
      ),
    ]);

    /*
     * ORDERS
     */
    if (
      ordersResult.status ===
      "fulfilled"
    ) {
      setOrders(
        apiItems(ordersResult.value)
      );
    } else {
      console.error(
        "Orders load failed:",
        ordersResult.reason
          ?.response?.data ||
          ordersResult.reason
      );

      setOrders([]);

      toast.error(
        apiErrorMessage(
          ordersResult.reason,
          "Failed to load orders"
        )
      );
    }

    /*
     * CUSTOMERS
     */
    if (
      customersResult.status ===
      "fulfilled"
    ) {
      setCustomers(
        apiItems(
          customersResult.value
        )
      );
    } else {
      console.error(
        "Customers load failed:",
        customersResult.reason
          ?.response?.data ||
          customersResult.reason
      );

      setCustomers([]);

      toast.error(
        apiErrorMessage(
          customersResult.reason,
          "Failed to load customers"
        )
      );
    }

    /*
     * PRODUCTS
     */
    if (
      firstProductResult.status ===
      "fulfilled"
    ) {
      try {
        const firstProducts =
          apiItems(
            firstProductResult.value
          );

        const total = Number(
          firstProductResult.value
            .raw?.data?.total ||
            firstProducts.length
        );

        const totalPages = Math.max(
          1,
          Math.ceil(total / 100)
        );

        const remainingResponses =
          await Promise.all(
            Array.from(
              {
                length:
                  totalPages - 1,
              },
              (_, index) =>
                API.get(
                  `/products?limit=100&page=${
                    index + 2
                  }`
                )
            )
          );

        const allProducts = [
          ...firstProducts,
          ...remainingResponses.flatMap(
            (response) =>
              apiItems(response)
          ),
        ];

        setProducts(
          allProducts
        );
      } catch (error) {
        console.error(
          "Products load failed:",
          error.response?.data ||
            error
        );

        setProducts([]);

        toast.error(
          apiErrorMessage(
            error,
            "Products unavailable. Orders still loaded."
          )
        );
      }
    } else {
      console.error(
        "Products load failed:",
        firstProductResult.reason
          ?.response?.data ||
          firstProductResult.reason
      );

      setProducts([]);

      toast.error(
        apiErrorMessage(
          firstProductResult.reason,
          "Products unavailable. Orders still loaded."
        )
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * ==========================================
   * RESET FORM
   * ==========================================
   */
  const reset = () => {
    setEditOrder(null);

    setForm({
      customer: "",
      status: "placed",

      poNumber: "",
      poDate: "",
      poAmount: "",

      notes: "",
      grandTotal: "",

      items: [
        {
          product: "",
          quantity: 1,
        },
      ],
    });

    setProductSearch({});
  };

  /*
   * ==========================================
   * NEW ORDER
   * ==========================================
   */
  const openNew = () => {
    reset();
    setOpen(true);
  };

  /*
   * ==========================================
   * EDIT ORDER
   * ==========================================
   */
  const openEdit = (order) => {
    setEditOrder(order);

    setProductSearch({});

    setForm({
      customer:
        order.customer?._id ||
        order.customer ||
        "",

      status:
        order.status ||
        "placed",

      poNumber:
        order.poNumber || "",

      poDate: order.poDate
        ? new Date(
            order.poDate
          )
            .toISOString()
            .split("T")[0]
        : "",

      poAmount:
        order.poAmount ??
        "",

      notes:
        order.notes || "",

      grandTotal:
        order.grandTotal || "",

      items:
        order.items?.length
          ? order.items.map(
              (item) => ({
                product:
                  item.product?._id ||
                  item.product ||
                  "",
                quantity:
                  item.quantity ||
                  1,
              })
            )
          : [
              {
                product: "",
                quantity: 1,
              },
            ],
    });

    setOpen(true);
  };

  /*
   * ==========================================
   * UPDATE ITEM
   * ==========================================
   */
  const updateItem = (
    index,
    patch
  ) => {
    setForm((prev) => ({
      ...prev,

      items: prev.items.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...patch,
              }
            : item
      ),
    }));
  };

  /*
   * ==========================================
   * ADD ITEM
   * ==========================================
   */
  const addItem = () => {
    setForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        {
          product: "",
          quantity: 1,
        },
      ],
    }));
  };

  /*
   * ==========================================
   * REMOVE ITEM
   * ==========================================
   */
  const removeItem = (
    index
  ) => {
    setForm((prev) => ({
      ...prev,

      items: prev.items.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));

    /*
     * Rebuild search indexes.
     */
    setProductSearch((prev) => {
      const next = {};

      Object.keys(prev).forEach(
        (key) => {
          const oldIndex =
            Number(key);

          if (oldIndex < index) {
            next[oldIndex] =
              prev[key];
          } else if (
            oldIndex > index
          ) {
            next[oldIndex - 1] =
              prev[key];
          }
        }
      );

      return next;
    });
  };

  /*
   * ==========================================
   * ESTIMATED TOTAL
   * ==========================================
   */
  const estimatedTotal =
    useMemo(() => {
      return form.items.reduce(
        (sum, item) => {
          const product =
            products.find(
              (candidate) =>
                sameId(
                  candidate._id ||
                    candidate.id,
                  item.product
                )
            );

          const qty = Number(
            item.quantity || 0
          );

          return (
            sum +
            productPrice(product) *
              qty
          );
        },
        0
      );
    }, [
      form.items,
      products,
    ]);

  /*
   * ==========================================
   * CHECK PRODUCTS WITHOUT PRICE
   * ==========================================
   */
  const hasSelectedProductWithoutPrice =
    form.items.some(
      (item) => {
        if (!item.product)
          return false;

        const product =
          products.find(
            (candidate) =>
              sameId(
                candidate._id ||
                  candidate.id,
                item.product
              )
          );

        return (
          product &&
          productPrice(product) <=
            0
        );
      }
    );

  /*
   * ==========================================
   * SUBMIT ORDER
   * ==========================================
   */
  const submit = async (
    event
  ) => {
    event.preventDefault();

    if (!form.customer) {
      toast.error(
        "Customer is required"
      );
      return;
    }

    /*
     * Purchase Order validation
     */
    if (!editOrder) {
      if (!form.poNumber.trim()) {
        toast.error(
          "Purchase Order Number is required"
        );
        return;
      }

      if (!form.poDate) {
        toast.error(
          "Purchase Order Date is required"
        );
        return;
      }

      if (
        form.poAmount === "" ||
        Number(form.poAmount) < 0
      ) {
        toast.error(
          "Purchase Order Amount is required"
        );
        return;
      }
    }

    const items =
      form.items
        .filter(
          (item) =>
            item.product &&
            Number(item.quantity) >
              0
        )
        .map((item) => ({
          product:
            item.product,
          quantity:
            Number(
              item.quantity
            ),
        }));

    if (!editOrder && !items.length) {
      toast.error(
        "Add at least one product"
      );
      return;
    }

    try {
      if (editOrder) {
        await API.patch(
          `/orders/${
            editOrder._id ||
            editOrder.id
          }/status`,
          {
            status:
              form.status,
          }
        );

        toast.success(
          "Order status updated"
        );
      } else {
        await API.post(
          "/orders",
          {
            customer:
              form.customer,

            /*
             * PURCHASE ORDER
             */
            poNumber:
              form.poNumber.trim(),

            poDate:
              form.poDate,

            poAmount:
              Number(
                form.poAmount
              ),

            items,

            notes:
              form.notes,

            status:
              form.status,

            grandTotal:
              Number(
                form.grandTotal ||
                  estimatedTotal ||
                  0
              ),
          }
        );

        toast.success(
          "Order created"
        );
      }

      setOpen(false);

      reset();

      load();
    } catch (error) {
      console.error(
        "Failed to save order:",
        error
      );

      toast.error(
        apiErrorMessage(
          error,
          "Failed to save order"
        )
      );
    }
  };

  /*
   * ==========================================
   * ORDER FILTER
   * ==========================================
   */
  const filtered =
    filter === "all"
      ? orders
      : orders.filter(
          (order) =>
            order.status ===
            filter
        );

  /*
   * ==========================================
   * REVENUE
   * ==========================================
   */
  const revenue =
    orders.reduce(
      (sum, order) =>
        sum +
        Number(
          order.grandTotal || 0
        ),
      0
    );

  /*
   * ==========================================
   * DELETE ORDER
   * ==========================================
   */
  const deleteOrder = async (
    order
  ) => {
    const orderId =
      order._id || order.id;

    if (!orderId) {
      toast.error(
        "Order ID not found"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete order ${
          order.orderNo || ""
        }?`
      );

    if (!confirmed) return;

    try {
      await API.delete(
        `/orders/${orderId}`
      );

      toast.success(
        "Order deleted successfully"
      );

      setOpen(false);

      reset();

      load();
    } catch (error) {
      console.error(
        "Delete order failed:",
        error.response?.data ||
          error
      );

      toast.error(
        apiErrorMessage(
          error,
          "Failed to delete order"
        )
      );
    }
  };

  /*
   * ==========================================
   * TABLE COLUMNS
   * ==========================================
   */
  const columns = [
    {
      header: "Order",
      accessor: "orderNo",

      render: (row) => (
        <span
          className="font-mono"
          style={{
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          {row.orderNo || "-"}
        </span>
      ),
    },

    {
      header: "Customer",
      accessor: "customer",

      render: (row) => (
        <span
          style={{
            fontWeight: 600,
          }}
        >
          {row.customer?.name ||
            "-"}
        </span>
      ),
    },

    {
      header: "PO Number",
      accessor: "poNumber",

      render: (row) => (
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color:
              row.poNumber
                ? "var(--text)"
                : "var(--text-muted)",
          }}
        >
          {row.poNumber ||
            "No PO"}
        </span>
      ),
    },

    {
      header: "Items",
      accessor: "items",

      render: (row) => (
        <span
          style={{
            color:
              "var(--text-muted)",
          }}
        >
          {Array.isArray(
            row.items
          )
            ? row.items
                .map(
                  (item) =>
                    `${item.name} x${
                      item.quantity
                    }${
                      item.allocatedQuantity !==
                      undefined
                        ? ` (Allocated: ${
                            item.allocatedQuantity
                          }, Backorder: ${
                            item.backorderQuantity
                          })`
                        : ""
                    }`
                )
                .join(", ")
            : "-"}
        </span>
      ),
    },

    {
      header: "Amount",
      accessor: "grandTotal",

      render: (row) => (
        <span
          style={{
            fontWeight: 800,
          }}
        >
          INR{" "}
          {Number(
            row.grandTotal || 0
          ).toLocaleString()}
        </span>
      ),
    },

    {
      header: "Payment",
      accessor:
        "paymentStatus",

      render: (row) => (
        <StatusBadge
          status={titleCase(
            row.paymentStatus ||
              "unpaid"
          )}
        />
      ),
    },

    {
      header: "Status",
      accessor: "status",

      render: (row) => (
        <StatusBadge
          status={titleCase(
            row.status ||
              "placed"
          )}
        />
      ),
    },

    {
      header: "Date",
      accessor: "createdAt",

      render: (row) => (
        <span
          style={{
            fontSize: "12px",
            color:
              "var(--text-muted)",
          }}
        >
          {row.createdAt
            ? new Date(
                row.createdAt
              ).toLocaleDateString(
                "en-IN"
              )
            : "-"}
        </span>
      ),
    },

    {
      header: "Action",
      accessor: "action",

      render: (row) => (
        <button
          type="button"
          className="btn-ghost"
          onClick={(event) => {
            event.stopPropagation();
            deleteOrder(row);
          }}
          style={{
            color:
              "var(--danger)",
            display:
              "inline-flex",
            alignItems:
              "center",
            gap: "6px",
          }}
          title="Delete Order"
        >
          <Trash2 size={15} />
          Delete
        </button>
      ),
    },
  ];

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */
  if (loading) {
    return (
      <LoadingSpinner
        text="Loading orders..."
      />
    );
  }

  /*
   * ==========================================
   * STATS
   * ==========================================
   */
  const stats = [
    {
      label: "Total Orders",
      value:
        orders.length,
      icon: ShoppingCart,
      color: "var(--info)",
    },

    {
      label: "Revenue",
      value: `INR ${revenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "var(--emerald)",
    },

    {
      label: "Placed",
      value:
        orders.filter(
          (order) =>
            order.status ===
            "placed"
        ).length,
      icon: Clock,
      color: "var(--warning)",
    },

    {
      label: "Fulfilled",
      value:
        orders.filter(
          (order) =>
            order.status ===
            "fulfilled"
        ).length,
      icon: CheckCircle,
      color: "var(--emerald)",
    },

    {
      label: "Cancelled",
      value:
        orders.filter(
          (order) =>
            order.status ===
            "cancelled"
        ).length,
      icon: XCircle,
      color: "var(--danger)",
    },
  ];

  /*
   * ==========================================
   * UI
   * ==========================================
   */
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Order Management"
        title="Orders"
        subtitle="Create product-based orders and track fulfillment"
        action={
          <button
            className="btn-primary"
            onClick={openNew}
          >
            <Plus size={16} />
            New Order
          </button>
        }
      />

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(160px,1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {stats.map(
          ({
            label,
            value,
            icon: Icon,
            color,
          }) => (
            <div
              key={label}
              className="card"
              style={{
                padding: "16px",
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
              }}
            >
              <Icon
                size={20}
                style={{
                  color,
                  flexShrink: 0,
                }}
              />

              <div>
                <p
                  style={{
                    fontFamily:
                      "'Bricolage Grotesque',sans-serif",
                    fontSize:
                      "20px",
                    fontWeight: 800,
                    color:
                      "var(--text)",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </p>

                <p
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "2px",
                  }}
                >
                  {label}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      {/* STATUS FILTERS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {[
          {
            label: "All",
            value: "all",
          },
          ...STATUSES,
        ].map((status) => (
          <button
            key={status.value}
            onClick={() =>
              setFilter(
                status.value
              )
            }
            style={{
              padding:
                "6px 14px",
              borderRadius:
                "100px",
              fontSize:
                "12px",
              fontWeight: 600,
              cursor:
                "pointer",
              border:
                "1.5px solid",
              background:
                filter ===
                status.value
                  ? "var(--emerald)"
                  : "var(--surface)",
              color:
                filter ===
                status.value
                  ? "white"
                  : "var(--text-3)",
              borderColor:
                filter ===
                status.value
                  ? "var(--emerald)"
                  : "var(--border)",
            }}
          >
            {status.label}

            {status.value !==
              "all" &&
              ` (${
                orders.filter(
                  (order) =>
                    order.status ===
                    status.value
                ).length
              })`}
          </button>
        ))}
      </div>

      {/* ORDERS TABLE */}
      <DataTable
        columns={columns}
        data={filtered}
        pageSize={10}
        onRowClick={openEdit}
        emptyMessage="No orders found."
      />

      {/* NEW / EDIT ORDER MODAL */}
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={
          editOrder
            ? "Update Order Status"
            : "New Order"
        }
        size="lg"
      >
        <form
          onSubmit={submit}
        >
          {/* CUSTOMER + STATUS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "16px",
              marginBottom:
                "16px",
            }}
          >
            <FormField
              label="Customer"
              required
            >
              <select
                disabled={Boolean(
                  editOrder
                )}
                value={
                  form.customer
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    customer:
                      e.target
                        .value,
                  })
                }
                style={{
                  ...inputStyle,
                  cursor:
                    editOrder
                      ? "not-allowed"
                      : "pointer",
                }}
                onFocus={focus}
                onBlur={blur}
              >
                <option value="">
                  Select customer
                </option>

                {customers.map(
                  (customer) => (
                    <option
                      key={
                        customer._id ||
                        customer.id
                      }
                      value={
                        customer._id ||
                        customer.id
                      }
                    >
                      {
                        customer.name
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Status">
              <select
                value={
                  form.status
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target
                        .value,
                  })
                }
                style={{
                  ...inputStyle,
                  cursor:
                    "pointer",
                }}
                onFocus={focus}
                onBlur={blur}
              >
                {STATUSES.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {
                        status.label
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>
          </div>

          {/* ========================================
              PURCHASE ORDER
              ======================================== */}
          {!editOrder && (
            <div
              style={{
                padding: "16px",
                marginBottom: "18px",
                border:
                  "1px solid var(--border)",
                borderRadius:
                  "var(--r-xl)",
                background:
                  "var(--surface-2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom:
                    "14px",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius:
                      "9px",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    background:
                      "rgba(37,99,235,0.10)",
                    color:
                      "var(--info)",
                    fontWeight: 800,
                    fontSize:
                      "13px",
                  }}
                >
                  PO
                </div>

                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize:
                        "14px",
                      fontWeight: 800,
                      color:
                        "var(--text)",
                    }}
                  >
                    Purchase Order
                  </p>

                  <p
                    style={{
                      margin:
                        "2px 0 0",
                      fontSize:
                        "11px",
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    Enter the customer's purchase order details
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(200px,1fr))",
                  gap: "14px",
                }}
              >
                <FormField
                  label="PO Number"
                  required
                >
                  <input
                    type="text"
                    placeholder="e.g. PO/2026/00125"
                    value={
                      form.poNumber
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        poNumber:
                          e.target
                            .value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      color:
                        "var(--text)",
                      background:
                        "var(--surface)",
                      caretColor:
                        "var(--text)",
                    }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </FormField>

                <FormField
                  label="PO Date"
                  required
                >
                  <input
                    type="date"
                    value={
                      form.poDate
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        poDate:
                          e.target
                            .value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      color:
                        "var(--text)",
                      background:
                        "var(--surface)",
                      colorScheme:
                        "light dark",
                    }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </FormField>

                <FormField
                  label="PO Amount (INR)"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter PO amount"
                    value={
                      form.poAmount
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        poAmount:
                          e.target
                            .value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      color:
                        "var(--text)",
                      background:
                        "var(--surface)",
                      caretColor:
                        "var(--text)",
                    }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* EDIT MODE PO DETAILS */}
          {editOrder &&
            (form.poNumber ||
              form.poDate ||
              form.poAmount !== "") && (
              <div
                style={{
                  padding:
                    "14px 16px",
                  marginBottom:
                    "16px",
                  border:
                    "1px solid var(--border)",
                  borderRadius:
                    "var(--r-xl)",
                  background:
                    "var(--surface-2)",
                }}
              >
                <p
                  style={{
                    margin:
                      "0 0 10px",
                    fontSize:
                      "13px",
                    fontWeight: 800,
                    color:
                      "var(--text)",
                  }}
                >
                  Purchase Order
                </p>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      PO Number
                    </span>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "13px",
                        fontWeight: 700,
                        color:
                          "var(--text)",
                      }}
                    >
                      {form.poNumber ||
                        "-"}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      PO Date
                    </span>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "13px",
                        fontWeight: 700,
                        color:
                          "var(--text)",
                      }}
                    >
                      {form.poDate ||
                        "-"}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      PO Amount
                    </span>

                    <div
                      style={{
                        marginTop:
                          "4px",
                        fontSize:
                          "13px",
                        fontWeight: 700,
                        color:
                          "var(--text)",
                      }}
                    >
                      INR{" "}
                      {Number(
                        form.poAmount ||
                          0
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* ========================================
              ITEMS
              ======================================== */}
          {!editOrder && (
            <div
              style={{
                display: "grid",
                gap: "10px",
                marginBottom:
                  "16px",
              }}
            >
              {form.items.map(
                (
                  item,
                  index
                ) => {
                  const rowProducts =
                    getFilteredProducts(
                      index,
                      item.product
                    );

                  return (
                    <div
                      key={index}
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "minmax(0,1fr) 120px 40px",
                        gap: "10px",
                        alignItems:
                          "end",
                      }}
                    >
                      <FormField label="Product">
                        {/* PRODUCT SEARCH */}
                        <div
                          style={{
                            position:
                              "relative",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <Search
                            size={15}
                            style={{
                              position:
                                "absolute",
                              left: "12px",
                              top: "50%",
                              transform:
                                "translateY(-50%)",
                              color:
                                "var(--text-muted)",
                              pointerEvents:
                                "none",
                              zIndex: 1,
                            }}
                          />

                          <input
                            type="text"
                            placeholder="Search product..."
                            value={
                              productSearch[
                                index
                              ] || ""
                            }
                            onChange={(
                              e
                            ) =>
                              setProductSearch(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [index]:
                                    e
                                      .target
                                      .value,
                                })
                              )
                            }
                            style={{
                              ...inputStyle,
                              paddingLeft:
                                "36px",
                              color:
                                "var(--text)",
                              background:
                                "var(--surface)",
                              caretColor:
                                "var(--text)",
                            }}
                            onFocus={
                              focus
                            }
                            onBlur={
                              blur
                            }
                          />
                        </div>

                        {/* PRODUCT SELECT */}
                        <select
                          value={
                            item.product
                          }
                          onChange={(
                            e
                          ) => {
                            const selectedId =
                              e.target
                                .value;

                            updateItem(
                              index,
                              {
                                product:
                                  selectedId,
                              }
                            );

                            /*
                             * Clear only THIS row.
                             */
                            setProductSearch(
                              (
                                previous
                              ) => ({
                                ...previous,
                                [index]:
                                  "",
                              })
                            );
                          }}
                          style={{
                            ...inputStyle,
                            cursor:
                              "pointer",
                            color:
                              "var(--text)",
                            background:
                              "var(--surface)",
                          }}
                          onFocus={
                            focus
                          }
                          onBlur={
                            blur
                          }
                        >
                          <option value="">
                            Select product
                          </option>

                          {rowProducts.map(
                            (
                              product
                            ) => (
                              <option
                                key={
                                  product._id ||
                                  product.id
                                }
                                value={
                                  product._id ||
                                  product.id
                                }
                              >
                                {productOptionLabel(
                                  product
                                )}
                              </option>
                            )
                          )}
                        </select>

                        {productSearch[
                          index
                        ] &&
                          rowProducts.length ===
                            0 && (
                            <p
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "var(--danger)",
                                marginTop:
                                  "6px",
                              }}
                            >
                              No matching products found.
                            </p>
                          )}
                      </FormField>

                      {/* QUANTITY */}
                      <FormField label="Qty">
                        <input
                          type="number"
                          min="1"
                          value={
                            item.quantity
                          }
                          onChange={(
                            e
                          ) =>
                            updateItem(
                              index,
                              {
                                quantity:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          style={{
                            ...inputStyle,
                            color:
                              "var(--text)",
                            background:
                              "var(--surface)",
                          }}
                          onFocus={
                            focus
                          }
                          onBlur={
                            blur
                          }
                        />
                      </FormField>

                      {/* REMOVE */}
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() =>
                          removeItem(
                            index
                          )
                        }
                        disabled={
                          form
                            .items
                            .length ===
                          1
                        }
                        style={{
                          padding:
                            "10px",
                          justifyContent:
                            "center",
                        }}
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  );
                }
              )}

              {/* ADD ITEM + TOTAL */}
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "space-between",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={
                    addItem
                  }
                >
                  Add Item
                </button>

                <span
                  style={{
                    fontSize:
                      "13px",
                    fontWeight: 800,
                    color:
                      hasSelectedProductWithoutPrice
                        ? "var(--danger)"
                        : "var(--emerald)",
                  }}
                >
                  {hasSelectedProductWithoutPrice
                    ? "Selected product has no price"
                    : `Estimated total: INR ${estimatedTotal.toLocaleString()}`}
                </span>
              </div>

              {/* ORDER AMOUNT */}
              <FormField
                label="Order Amount (INR)"
                required
              >
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.grandTotal ||
                    ""
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      grandTotal:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    ...inputStyle,
                    color:
                      "var(--text)",
                    background:
                      "var(--surface)",
                    caretColor:
                      "var(--text)",
                  }}
                  onFocus={
                    focus
                  }
                  onBlur={
                    blur
                  }
                  placeholder={
                    estimatedTotal
                      ? String(
                          estimatedTotal
                        )
                      : "Enter total order amount"
                  }
                />
              </FormField>
            </div>
          )}

          {/* NOTES */}
          <FormField label="Notes">
            <textarea
              value={
                form.notes
              }
              disabled={Boolean(
                editOrder
              )}
              rows={3}
              placeholder="Notes..."
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target
                      .value,
                })
              }
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: 1.6,
                color:
                  "var(--text)",
                background:
                  "var(--surface)",
              }}
              onFocus={focus}
              onBlur={blur}
            />
          </FormField>

          {/* BUTTONS */}
          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop:
                "20px",
              paddingTop:
                "16px",
              borderTop:
                "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setOpen(false);
                reset();
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              {editOrder
                ? "Update Status"
                : "Create Order"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}