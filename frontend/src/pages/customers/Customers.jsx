import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import StatusBadge from "../../components/ui/StatusBadge";
import PurchaseHistoryTab from "../../components/PurchaseHistoryTab";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import toast from "react-hot-toast";
import {
  Archive,
  FileText,
  History,
  MessageSquare,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";

const TYPES = [
  "clinical lab",
  "institution",
  "industry",
  "seed company",
  "hospital",
  "others",
];

const STATUSES = ["active", "inactive", "blocked"];

const INTERACTION_TYPES = [
  "call",
  "email",
  "meeting",
  "visit",
  "note",
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
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

/* Normalize phone number for comparison */
const normalizePhone = (value = "") =>
  String(value).replace(/\D/g, "").slice(-10);

/* Normalize email for comparison */
const normalizeEmail = (value = "") =>
  String(value).trim().toLowerCase();

/* Normalize names for comparison */
const normalizeName = (value = "") =>
  String(value).trim().replace(/\s+/g, " ").toLowerCase();

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [binLoading, setBinLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [binOpen, setBinOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);

  /* Existing customer popup */
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [existingMatchType, setExistingMatchType] = useState("");

  const [editId, setEditId] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [form, setForm] = useState({
    name: "",
    type: "others",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    branch: "",
    status: "active",
    tags: "",
    notes: "",
  });

  const [interaction, setInteraction] = useState({
    type: "note",
    summary: "",
    feedback: "",
    nextFollowUpAt: "",
  });

  const load = async () => {
    setLoading(true);

    try {
      const response = await API.get("/customers?limit=2000");
      setCustomers(apiItems(response));
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "Failed to load customers")
      );
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedCustomers = async () => {
    setBinLoading(true);

    try {
      const response = await API.get("/customers/bin?limit=2000");
      setDeletedCustomers(apiItems(response));
    } catch (error) {
      toast.error(
        apiErrorMessage(error, "Failed to load deleted customers")
      );
      setDeletedCustomers([]);
    } finally {
      setBinLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
   * ---------------------------------------------------------
   * EXISTING CUSTOMER DETECTION
   * ---------------------------------------------------------
   *
   * We check:
   * 1. Phone number - strongest match
   * 2. Email
   * 3. Customer name
   *
   * This only runs while creating a NEW customer.
   * It does NOT run while editing an existing customer.
   */
  useEffect(() => {
    if (!open || editId || !customers.length) {
      setExistingCustomer(null);
      setExistingMatchType("");
      return;
    }

    const phone = normalizePhone(form.phone);
    const email = normalizeEmail(form.email);
    const name = normalizeName(form.name);

    let matchedCustomer = null;
    let matchType = "";

    /* Phone match */
    if (phone.length === 10) {
      matchedCustomer = customers.find(
        (customer) =>
          normalizePhone(customer.phone) === phone
      );

      if (matchedCustomer) {
        matchType = "phone";
      }
    }

    /* Email match */
    if (!matchedCustomer && email.length > 4 && email.includes("@")) {
      matchedCustomer = customers.find(
        (customer) =>
          normalizeEmail(customer.email) === email
      );

      if (matchedCustomer) {
        matchType = "email";
      }
    }

    /* Name match only after reasonable length */
    if (!matchedCustomer && name.length >= 4) {
      matchedCustomer = customers.find(
        (customer) =>
          normalizeName(customer.name) === name
      );

      if (matchedCustomer) {
        matchType = "name";
      }
    }

    if (matchedCustomer) {
      const existingId =
        matchedCustomer._id || matchedCustomer.id;

      /*
       * Don't repeatedly show the same popup on every keystroke.
       */
      if (
        existingCustomer?._id === existingId ||
        existingCustomer?.id === existingId
      ) {
        return;
      }

      setExistingCustomer(matchedCustomer);
      setExistingMatchType(matchType);
    }
  }, [
    form.phone,
    form.email,
    form.name,
    customers,
    open,
    editId,
    existingCustomer,
  ]);

  const reset = () => {
    setEditId(null);
    setActiveCustomer(null);
    setActiveTab("overview");

    setExistingCustomer(null);
    setExistingMatchType("");

    setForm({
      name: "",
      type: "others",
      contactPerson: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      branch: "",
      status: "active",
      tags: "",
      notes: "",
    });
  };

  const openEdit = (
    customer,
    initialTab = "overview"
  ) => {
    setExistingCustomer(null);
    setExistingMatchType("");

    setEditId(customer._id || customer.id);
    setActiveCustomer(customer);
    setActiveTab(initialTab);

    setForm({
      name: customer.name || "",
      type: customer.type || "others",
      contactPerson: customer.contactPerson || "",
      email: customer.email || "",
      phone: customer.phone || "",
      city: customer.address?.city || "",
      state: customer.address?.state || "",
      branch: customer.branch || "",
      status: customer.status || "active",
      tags: Array.isArray(customer.tags)
        ? customer.tags.join(", ")
        : "",
      notes: customer.notes || "",
    });

    setOpen(true);
  };

  const openHistory = (event, customer) => {
    event.stopPropagation();
    setHistoryCustomer(customer);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    /*
     * Final duplicate protection before saving.
     *
     * This prevents accidentally creating a duplicate even
     * if the user closes the popup and submits the form.
     */
    if (!editId) {
      const phone = normalizePhone(form.phone);
      const email = normalizeEmail(form.email);
      const name = normalizeName(form.name);

      const duplicate = customers.find((customer) => {
        const customerPhone = normalizePhone(customer.phone);
        const customerEmail = normalizeEmail(customer.email);
        const customerName = normalizeName(customer.name);

        if (
          phone.length === 10 &&
          customerPhone === phone
        ) {
          return true;
        }

        if (
          email &&
          email.includes("@") &&
          customerEmail === email
        ) {
          return true;
        }

        if (
          name &&
          customerName === name
        ) {
          return true;
        }

        return false;
      });

      if (duplicate) {
        setExistingCustomer(duplicate);

        const duplicatePhone =
          phone.length === 10 &&
          normalizePhone(duplicate.phone) === phone;

        const duplicateEmail =
          email &&
          email.includes("@") &&
          normalizeEmail(duplicate.email) === email;

        setExistingMatchType(
          duplicatePhone
            ? "phone"
            : duplicateEmail
            ? "email"
            : "name"
        );

        return;
      }
    }

    const payload = {
      name: form.name,
      type: form.type,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      branch: form.branch,
      status: form.status,
      notes: form.notes,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      address: {
        city: form.city,
        state: form.state,
        country: "India",
      },
    };

    try {
      if (editId) {
        await API.patch(
          `/customers/${editId}`,
          payload
        );
      } else {
        await API.post(
          "/customers",
          payload
        );
      }

      toast.success(
        editId
          ? "Customer updated"
          : "Customer created"
      );

      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to save customer"
        )
      );
    }
  };

  const openInteraction = (customer) => {
    setActiveCustomer(customer);

    setInteraction({
      type: "note",
      summary: "",
      feedback: "",
      nextFollowUpAt: "",
    });

    setInteractionOpen(true);
  };

  const submitInteraction = async (event) => {
    event.preventDefault();

    if (!interaction.summary) {
      toast.error(
        "Interaction summary is required"
      );
      return;
    }

    try {
      await API.post(
        `/customers/${
          activeCustomer._id ||
          activeCustomer.id
        }/interactions`,
        {
          ...interaction,
          nextFollowUpAt:
            interaction.nextFollowUpAt
              ? new Date(
                  interaction.nextFollowUpAt
                ).toISOString()
              : undefined,
        }
      );

      toast.success("Interaction added");
      setInteractionOpen(false);
      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to add interaction"
        )
      );
    }
  };

  const deleteCustomer = async (
    event,
    customer
  ) => {
    event.stopPropagation();

    const id =
      customer._id || customer.id;

    if (!id) return;

    if (
      !window.confirm(
        `Move ${customer.name} to recycle bin?`
      )
    ) {
      return;
    }

    try {
      await API.delete(
        `/customers/${id}`
      );

      toast.success(
        "Customer moved to recycle bin"
      );

      if (
        (historyCustomer?._id ||
          historyCustomer?.id) === id
      ) {
        setHistoryCustomer(null);
      }

      load();

      if (binOpen) {
        loadDeletedCustomers();
      }
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to delete customer"
        )
      );
    }
  };

  const openRecycleBin = () => {
    setBinOpen(true);
    loadDeletedCustomers();
  };

  const restoreCustomer = async (
    event,
    customer
  ) => {
    event.stopPropagation();

    const id =
      customer._id || customer.id;

    if (!id) return;

    try {
      await API.post(
        `/customers/${id}/restore`
      );

      toast.success(
        "Customer restored"
      );

      await Promise.all([
        load(),
        loadDeletedCustomers(),
      ]);
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to restore customer"
        )
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * EXISTING CUSTOMER POPUP ACTIONS
   * ---------------------------------------------------------
   */

  const closeExistingPopup = () => {
    setExistingCustomer(null);
    setExistingMatchType("");
  };

  const viewExistingCustomer = () => {
    if (!existingCustomer) return;

    const customer = existingCustomer;

    setExistingCustomer(null);
    setExistingMatchType("");

    /*
     * Open the existing customer's details.
     */
    openEdit(customer, "overview");
  };

  const columns = [
    {
      header: "Customer",
      accessor: "name",
      render: (row) => (
        <div>
          <p style={{ fontWeight: 700 }}>
            {row.name}
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {row.contactPerson || "-"}
          </p>
        </div>
      ),
    },

    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span>
          {titleCase(row.type)}
        </span>
      ),
    },

    {
      header: "Phone",
      accessor: "phone",
      render: (row) => (
        <span className="font-mono">
          {row.phone || "-"}
        </span>
      ),
    },

    {
      header: "City",
      accessor: "city",
      render: (row) => (
        <span>
          {row.address?.city || "-"}
        </span>
      ),
    },

    {
      header: "Interactions",
      accessor: "interactions",
      render: (row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontWeight: 700,
            }}
          >
            {row.interactions?.length || 0}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "3px 8px",
              borderRadius: "100px",
              background:
                "rgba(37,99,235,0.10)",
              color: "var(--emerald)",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {formatCurrency(
              row.totalSpend
            )}
          </span>
        </div>
      ),
    },

    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <StatusBadge
          status={titleCase(
            row.status
          )}
        />
      ),
    },

    {
      header: "Action",
      render: (row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-ghost"
            style={{
              padding: "7px 10px",
              fontSize: "12px",
            }}
            onClick={(event) =>
              openHistory(
                event,
                row
              )
            }
          >
            <History size={14} />
            History
          </button>

          <button
            className="btn-ghost"
            style={{
              padding: "7px 10px",
              fontSize: "12px",
            }}
            onClick={(event) => {
              event.stopPropagation();
              openInteraction(row);
            }}
          >
            <MessageSquare size={14} />
            Log
          </button>

          <button
            className="btn-ghost"
            style={{
              padding: "7px 10px",
              fontSize: "12px",
              color: "var(--danger)",
            }}
            onClick={(event) =>
              deleteCustomer(
                event,
                row
              )
            }
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const deletedColumns = [
    {
      header: "Customer",
      accessor: "name",
      render: (row) => (
        <div>
          <p style={{ fontWeight: 700 }}>
            {row.name}
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            {row.contactPerson || "-"}
          </p>
        </div>
      ),
    },

    {
      header: "Type",
      accessor: "type",
      render: (row) => (
        <span>
          {titleCase(row.type)}
        </span>
      ),
    },

    {
      header: "Phone",
      accessor: "phone",
      render: (row) => (
        <span className="font-mono">
          {row.phone || "-"}
        </span>
      ),
    },

    {
      header: "City",
      accessor: "city",
      render: (row) => (
        <span>
          {row.address?.city || "-"}
        </span>
      ),
    },

    {
      header: "Deleted On",
      accessor: "deletedAt",
      render: (row) => (
        <span>
          {row.deletedAt
            ? new Date(
                row.deletedAt
              ).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )
            : "-"}
        </span>
      ),
    },

    {
      header: "Deleted By",
      accessor: "deletedBy",
      render: (row) => (
        <span>
          {row.deletedBy?.name ||
            "-"}
        </span>
      ),
    },

    {
      header: "Action",
      render: (row) => (
        <button
          className="btn-ghost"
          style={{
            padding: "7px 10px",
            fontSize: "12px",
            color: "var(--emerald)",
          }}
          onClick={(event) =>
            restoreCustomer(
              event,
              row
            )
          }
        >
          <RotateCcw size={14} />
          Restore
        </button>
      ),
    },
  ];

  if (loading) {
    return (
      <LoadingSpinner text="Loading customers..." />
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="CRM"
        title="Customers"
        subtitle="Manage customer records and interaction history"
        action={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-ghost"
              onClick={openRecycleBin}
            >
              <Archive size={16} />
              Recycle Bin
            </button>

            <button
              className="btn-primary"
              onClick={() => {
                reset();
                setOpen(true);
              }}
            >
              <Plus size={16} />
              Add Customer
            </button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        pageSize={15}
        onRowClick={(customer) => {
          setHistoryCustomer(customer);
          openEdit(customer);
        }}
        emptyTitle="No customers yet"
        emptyMessage="Add your first customer to start tracking interactions, orders, and purchase history."
        emptyAction={() => {
          reset();
          setOpen(true);
        }}
        emptyActionLabel="Add Customer"
        emptyIcon={Users}
      />

      {/* CUSTOMER HISTORY */}
      <div
        style={{
          marginTop: "22px",
          background: "var(--surface)",
          borderRadius: "var(--r-xl)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom:
              "1px solid var(--border)",
            background: "var(--surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: "#60A5FA",
                textTransform:
                  "uppercase",
                letterSpacing:
                  "0.1em",
                marginBottom: "4px",
              }}
            >
              Customer History
            </p>

            <h3
              style={{
                color: "var(--text)",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              {historyCustomer
                ? historyCustomer.name
                : "Interaction timeline"}
            </h3>
          </div>

          {historyCustomer && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() =>
                openEdit(
                  historyCustomer,
                  "overview"
                )
              }
            >
              View Details
            </button>
          )}
        </div>

        <div
          style={{
            padding: "18px 20px",
          }}
        >
          {historyCustomer ? (
            <PurchaseHistoryTab
              customerId={
                historyCustomer._id ||
                historyCustomer.id
              }
              visible={Boolean(
                historyCustomer
              )}
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "minmax(220px,0.9fr) minmax(0,1.5fr)",
                gap: "18px",
                minHeight: "220px",
              }}
            >
              <div
                style={{
                  borderRight:
                    "1px solid var(--border)",
                  paddingRight: "18px",
                }}
              >
                {[0, 1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "10px",
                        padding: "12px",
                        borderRadius:
                          "10px",
                        background:
                          item === 0
                            ? "rgba(37,99,235,0.10)"
                            : "rgba(255,255,255,0.025)",
                        border:
                          "1px solid var(--border)",
                        marginBottom:
                          "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius:
                            "50%",
                          background:
                            "#1E293B",
                        }}
                      />

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            height: "9px",
                            width: "70%",
                            borderRadius:
                              "99px",
                            background:
                              "#1E293B",
                            marginBottom:
                              "7px",
                          }}
                        />

                        <div
                          style={{
                            height: "7px",
                            width: "46%",
                            borderRadius:
                              "99px",
                            background:
                              "#172033",
                          }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  justifyContent:
                    "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    gap: "12px",
                    alignItems:
                      "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius:
                        "50%",
                      background:
                        "#2563EB",
                      marginTop:
                        "4px",
                      boxShadow:
                        "0 0 0 6px rgba(37,99,235,0.12)",
                    }}
                  />

                  <div>
                    <p
                      style={{
                        color:
                          "var(--text)",
                        fontWeight: 700,
                        fontSize:
                          "14px",
                      }}
                    >
                      Select a customer to view history
                    </p>

                    <p
                      style={{
                        color:
                          "var(--text-muted)",
                        fontSize:
                          "13px",
                        marginTop:
                          "3px",
                      }}
                    >
                      Purchase dates,
                      products,
                      quantities,
                      unit prices,
                      and
                      interaction
                      notes will
                      appear here.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    height: "1px",
                    background:
                      "var(--border)",
                  }}
                />

                <div
                  style={{
                    display:
                      "flex",
                    gap: "12px",
                    alignItems:
                      "flex-start",
                    opacity: 0.65,
                  }}
                >
                  <div
                    style={{
                      width: "11px",
                      height: "11px",
                      borderRadius:
                        "50%",
                      background:
                        "#475569",
                      marginTop:
                        "4px",
                    }}
                  />

                  <div>
                    <p
                      style={{
                        color:
                          "var(--text-2)",
                        fontWeight: 700,
                        fontSize:
                          "14px",
                      }}
                    >
                      Customer activity placeholder
                    </p>

                    <p
                      style={{
                        color:
                          "var(--text-muted)",
                        fontSize:
                          "13px",
                        marginTop:
                          "3px",
                      }}
                    >
                      The timeline
                      stays ready
                      even before a
                      row is selected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={
          editId
            ? "Customer Details"
            : "Add Customer"
        }
        size="lg"
      >
        {editId && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              borderBottom:
                "1px solid var(--border)",
              marginBottom: "18px",
              overflowX: "auto",
            }}
          >
            {[
              ["overview", "Overview"],
              [
                "purchase",
                "Purchase History",
              ],
              [
                "interactions",
                "Interactions",
              ],
              [
                "documents",
                "Documents",
              ],
            ].map(
              ([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setActiveTab(key)
                  }
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "7px",
                    padding:
                      "10px 12px",
                    border: "none",
                    borderBottom:
                      activeTab === key
                        ? "2px solid var(--emerald)"
                        : "2px solid transparent",
                    background:
                      "transparent",
                    color:
                      activeTab === key
                        ? "var(--emerald)"
                        : "var(--text-muted)",
                    fontSize:
                      "13px",
                    fontWeight: 800,
                    cursor:
                      "pointer",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {label}
                </button>
              )
            )}
          </div>
        )}

        {activeTab ===
          "overview" && (
          <form onSubmit={submit}>
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
                label="Name"
                required
              >
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="Type">
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
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
                  {TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {titleCase(
                          type
                        )}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Contact Person">
                <input
                  value={
                    form.contactPerson
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contactPerson:
                        e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="Phone">
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Enter phone number"
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email:
                        e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="City">
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="State">
                <input
                  value={form.state}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      state:
                        e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="Branch">
                <input
                  value={form.branch}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branch:
                        e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>

              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value,
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
                        key={status}
                        value={status}
                      >
                        {titleCase(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>
              </FormField>

              <FormField label="Tags">
                <input
                  value={form.tags}
                  placeholder="priority, north zone"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tags:
                        e.target.value,
                    })
                  }
                  style={inputStyle}
                  onFocus={focus}
                  onBlur={blur}
                />
              </FormField>
            </div>

            <FormField label="Notes">
              <textarea
                value={form.notes}
                rows={3}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes:
                      e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  resize: "none",
                }}
                onFocus={focus}
                onBlur={blur}
              />
            </FormField>

            <div
              style={{
                display: "flex",
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
                onClick={() =>
                  setOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
              >
                {editId
                  ? "Update Customer"
                  : "Create Customer"}
              </button>
            </div>
          </form>
        )}

        {activeTab ===
          "purchase" && (
          <PurchaseHistoryTab
            customerId={editId}
            visible={
              open &&
              activeTab ===
                "purchase"
            }
          />
        )}

        {activeTab ===
          "interactions" && (
          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {(
              activeCustomer?.interactions ||
              []
            ).length === 0 ? (
              <p
                style={{
                  color:
                    "var(--text-muted)",
                  fontSize:
                    "14px",
                  textAlign:
                    "center",
                  padding:
                    "36px 0",
                }}
              >
                No interactions yet.
              </p>
            ) : (
              activeCustomer.interactions.map(
                (item, index) => (
                  <div
                    key={
                      item._id ||
                      index
                    }
                    style={{
                      border:
                        "1px solid var(--border)",
                      borderRadius:
                        "var(--r)",
                      padding:
                        "12px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        gap:
                          "10px",
                        marginBottom:
                          "6px",
                      }}
                    >
                      <StatusBadge
                        status={titleCase(
                          item.type
                        )}
                      />

                      <span
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "12px",
                        }}
                      >
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </span>
                    </div>

                    <p
                      style={{
                        fontWeight: 700,
                        color:
                          "var(--text)",
                      }}
                    >
                      {item.summary}
                    </p>

                    {item.feedback && (
                      <p
                        style={{
                          color:
                            "var(--text-muted)",
                          fontSize:
                            "13px",
                          marginTop:
                            "4px",
                        }}
                      >
                        {item.feedback}
                      </p>
                    )}
                  </div>
                )
              )
            )}
          </div>
        )}

        {activeTab ===
          "documents" && (
          <div
            style={{
              textAlign:
                "center",
              color:
                "var(--text-muted)",
              padding:
                "42px 0",
            }}
          >
            <FileText
              size={28}
              style={{
                margin:
                  "0 auto 10px",
              }}
            />

            <p>
              No customer documents yet.
            </p>
          </div>
        )}
      </Modal>

      {/* =====================================================
          EXISTING CUSTOMER POPUP
          ===================================================== */}
      <Modal
        isOpen={Boolean(
          existingCustomer
        )}
        onClose={
          closeExistingPopup
        }
        title="Existing Customer Found"
        size="md"
      >
        {existingCustomer && (
          <div>
            <div
              style={{
                padding:
                  "14px 16px",
                marginBottom:
                  "16px",
                borderRadius:
                  "12px",
                background:
                  "rgba(245,158,11,0.10)",
                border:
                  "1px solid rgba(245,158,11,0.30)",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  alignItems:
                    "flex-start",
                }}
              >
                <div
                  style={{
                    width:
                      "34px",
                    height:
                      "34px",
                    borderRadius:
                      "50%",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    background:
                      "rgba(245,158,11,0.15)",
                    fontSize:
                      "18px",
                    flexShrink: 0,
                  }}
                >
                  ⚠️
                </div>

                <div>
                  <p
                    style={{
                      fontWeight:
                        800,
                      color:
                        "var(--text)",
                      marginBottom:
                        "3px",
                    }}
                  >
                    This customer may already exist
                  </p>

                  <p
                    style={{
                      fontSize:
                        "12px",
                      color:
                        "var(--text-muted)",
                      lineHeight:
                        1.5,
                    }}
                  >
                    A customer with the same{" "}
                    <strong>
                      {existingMatchType ===
                      "phone"
                        ? "phone number"
                        : existingMatchType ===
                          "email"
                        ? "email address"
                        : "customer name"}
                    </strong>{" "}
                    is already registered.
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{
                border:
                  "1px solid var(--border)",
                borderRadius:
                  "14px",
                overflow:
                  "hidden",
                background:
                  "var(--surface-2)",
              }}
            >
              <div
                style={{
                  padding:
                    "16px",
                  borderBottom:
                    "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize:
                      "17px",
                    fontWeight:
                      800,
                    color:
                      "var(--text)",
                  }}
                >
                  {existingCustomer.name ||
                    "-"}
                </p>

                <p
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "var(--text-muted)",
                    marginTop:
                      "4px",
                  }}
                >
                  {titleCase(
                    existingCustomer.type ||
                      ""
                  )}
                </p>
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "0",
                }}
              >
                {[
                  [
                    "Contact Person",
                    existingCustomer.contactPerson,
                  ],
                  [
                    "Phone",
                    existingCustomer.phone,
                  ],
                  [
                    "Email",
                    existingCustomer.email,
                  ],
                  [
                    "City",
                    existingCustomer.address
                      ?.city,
                  ],
                  [
                    "State",
                    existingCustomer.address
                      ?.state,
                  ],
                  [
                    "Branch",
                    existingCustomer.branch,
                  ],
                ].map(
                  ([label, value]) => (
                    <div
                      key={label}
                      style={{
                        display:
                          "grid",
                        gridTemplateColumns:
                          "130px 1fr",
                        gap:
                          "12px",
                        padding:
                          "10px 16px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            "12px",
                          fontWeight:
                            700,
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        {label}
                      </span>

                      <span
                        style={{
                          fontSize:
                            "13px",
                          color:
                            "var(--text)",
                          fontWeight:
                            value
                              ? 600
                              : 400,
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {value || "-"}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "10px",
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
                onClick={
                  closeExistingPopup
                }
              >
                Continue Anyway
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={
                  viewExistingCustomer
                }
              >
                View Customer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RECYCLE BIN */}
      <Modal
        isOpen={binOpen}
        onClose={() =>
          setBinOpen(false)
        }
        title="Recycle Bin"
        size="lg"
      >
        <DataTable
          columns={
            deletedColumns
          }
          data={
            deletedCustomers
          }
          loading={
            binLoading
          }
          pageSize={10}
          onRowClick={
            undefined
          }
          emptyMessage="No deleted customers."
        />
      </Modal>

      {/* INTERACTION MODAL */}
      <Modal
        isOpen={
          interactionOpen
        }
        onClose={() =>
          setInteractionOpen(
            false
          )
        }
        title={`Log Interaction${
          activeCustomer
            ? ` - ${activeCustomer.name}`
            : ""
        }`}
        size="md"
      >
        <form
          onSubmit={
            submitInteraction
          }
        >
          <div
            style={{
              display:
                "grid",
              gap:
                "14px",
            }}
          >
            <FormField label="Type">
              <select
                value={
                  interaction.type
                }
                onChange={(e) =>
                  setInteraction({
                    ...interaction,
                    type:
                      e.target.value,
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
                {INTERACTION_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {titleCase(
                        type
                      )}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField
              label="Summary"
              required
            >
              <textarea
                value={
                  interaction.summary
                }
                rows={3}
                onChange={(e) =>
                  setInteraction({
                    ...interaction,
                    summary:
                      e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  resize:
                    "none",
                }}
                onFocus={focus}
                onBlur={blur}
              />
            </FormField>

            <FormField label="Feedback">
              <textarea
                value={
                  interaction.feedback
                }
                rows={2}
                onChange={(e) =>
                  setInteraction({
                    ...interaction,
                    feedback:
                      e.target.value,
                  })
                }
                style={{
                  ...inputStyle,
                  resize:
                    "none",
                }}
                onFocus={focus}
                onBlur={blur}
              />
            </FormField>

            <FormField label="Next Follow Up">
              <input
                type="datetime-local"
                value={
                  interaction.nextFollowUpAt
                }
                onChange={(e) =>
                  setInteraction({
                    ...interaction,
                    nextFollowUpAt:
                      e.target.value,
                  })
                }
                style={inputStyle}
                onFocus={focus}
                onBlur={blur}
              />
            </FormField>
          </div>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              gap:
                "10px",
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
              onClick={() =>
                setInteractionOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
            >
              <Users size={15} />
              Save Interaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}