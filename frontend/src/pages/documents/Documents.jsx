import { useEffect, useState } from "react";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import PageHeader from "../../components/ui/PageHeader";
import FormField from "../../components/ui/FormField";
import API, { apiErrorMessage, apiItems } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  Edit3,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  MessageSquare,
  UserPlus,
  UserX,
  Send,
} from "lucide-react";

const CATEGORIES = [
  "purchase_order",
  "quotation",
  "invoice",
  "agreement",
  "customer_document",
  "other",
];

/*
 * Document recipient options.
 *
 * Team              -> everyone
 * Vinutha            -> Vinutha only
 * Manager (Chandru)  -> Chandru only
 * Sales Person       -> show Shilpa / Chandan
 */
const RECIPIENT_OPTIONS = [
  { value: "team", label: "Team" },
  { value: "vinutha", label: "Vinutha" },
  { value: "chandru", label: "Manager (Chandru)" },
  { value: "sales", label: "Sales Person" },
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

const humanize = (value = "") =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Documents() {
  const { user } = useAuth();

  const role = user?.role;

  const isOwner = role === "owner";
  const isAdmin = role === "admin";

  const canAssign = isOwner || isAdmin;

  const [documents, setDocuments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);

  /*
   * All active managers + sales users.
   * We use this to locate:
   * Vinutha
   * Chandru
   * Shilpa
   * Chandan
   */
  const [recipientUsers, setRecipientUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [editId, setEditId] = useState(null);
  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [replyMessage, setReplyMessage] = useState("");

  const [selectedAssignUser, setSelectedAssignUser] =
    useState("");

  const [documentTotal, setDocumentTotal] = useState(0);

  const MAX_DOCUMENTS = 2000;

  /*
   * UI recipient selection.
   *
   * recipient:
   * team
   * vinutha
   * chandru
   * sales
   *
   * assignedTo:
   * actual MongoDB user ID
   */
  const [form, setForm] = useState({
    title: "",
    category: "other",
    customer: "",
    order: "",
    recipient: "team",
    assignedTo: "",
    file: null,
  });

  /*
   * Find users by name.
   */
  const findUserByName = (name) =>
    recipientUsers.find(
      (item) =>
        String(item.name || "").toLowerCase() ===
        name.toLowerCase()
    );

  /*
   * Find users by role.
   */
  const salesUsers = recipientUsers.filter(
    (item) =>
      item.role === "sales" &&
      item.isActive !== false
  );

  const managerUsers = recipientUsers.filter(
    (item) =>
      item.role === "manager" &&
      item.isActive !== false
  );

  /*
   * Specific required users.
   */
  const vinuthaUser = findUserByName("vinutha");
  const chandruUser = findUserByName("chandru");

  /*
   * Sales users shown in the Sales Person dropdown.
   * Only Shilpa and Chandan are shown as requested.
   */
  const selectedSalesUsers = salesUsers.filter(
    (item) => {
      const name = String(
        item.name || ""
      ).toLowerCase();

      return (
        name === "shilpa" ||
        name === "chandan"
      );
    }
  );

  /*
   * Load documents and supporting data.
   */
  const load = async () => {
    setLoading(true);

    try {
      const requests = [
  API.get("/documents?limit=2000"),
  API.get("/customers?limit=2000"),
  API.get("/orders?limit=100"),
];
      /*
       * Owner/Admin need users for assignment.
       */
      if (canAssign) {
        requests.push(
          API.get("/users?limit=100")
        );
      }

      const responses =
        await Promise.all(requests);

      const docsRes = responses[0];
      const customersRes = responses[1];
      const ordersRes = responses[2];
      const usersRes = responses[3];

      const docsData =
        docsRes?.data?.data ||
        docsRes?.data ||
        {};

      setDocuments(apiItems(docsRes));
      setCustomers(apiItems(customersRes));
      setOrders(apiItems(ordersRes));

      if (usersRes) {
        setRecipientUsers(
          apiItems(usersRes)
        );
      }

      setDocumentTotal(
        Number(
          docsData.total ||
            apiItems(docsRes).length ||
            0
        )
      );
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to load documents"
        )
      );

      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [role]);

  /*
   * Convert current recipient into actual backend
   * visibility + assignedTo values.
   */
  const getRecipientData = () => {
    if (form.recipient === "team") {
      return {
        visibility: "team",
        assignedTo: "",
      };
    }

    if (form.recipient === "vinutha") {
      return {
        visibility: "private",
        assignedTo:
          vinuthaUser?._id ||
          vinuthaUser?.id ||
          "",
      };
    }

    if (form.recipient === "chandru") {
      return {
        visibility: "private",
        assignedTo:
          chandruUser?._id ||
          chandruUser?.id ||
          "",
      };
    }

    if (form.recipient === "sales") {
      return {
        visibility: "private",
        assignedTo: form.assignedTo || "",
      };
    }

    return {
      visibility: "team",
      assignedTo: "",
    };
  };

  /*
   * Determine the UI recipient from an existing document.
   */
  const getRecipientFromDocument = (
    document
  ) => {
    if (
      document.visibility === "team" &&
      !document.assignedTo
    ) {
      return "team";
    }

    const assignedName = String(
      document.assignedTo?.name || ""
    ).toLowerCase();

    if (assignedName === "vinutha") {
      return "vinutha";
    }

    if (assignedName === "chandru") {
      return "chandru";
    }

    if (
      assignedName === "shilpa" ||
      assignedName === "chandan"
    ) {
      return "sales";
    }

    return "team";
  };

  const reset = () => {
    setEditId(null);

    setForm({
      title: "",
      category: "other",
      customer: "",
      order: "",
      recipient: "team",
      assignedTo: "",
      file: null,
    });
  };

  const openCreate = () => {
    if (
      documentTotal >=
      MAX_DOCUMENTS
    ) {
      toast.error(
        "Maximum limit of 2,000 documents has been reached."
      );
      return;
    }

    reset();
    setOpen(true);
  };

  const openEdit = (document) => {
    const recipient =
      getRecipientFromDocument(
        document
      );

    setEditId(
      document._id ||
        document.id
    );

    setForm({
      title: document.title || "",
      category:
        document.category ||
        "other",
      customer:
        document.customer?._id ||
        document.customer ||
        "",
      order:
        document.order?._id ||
        document.order ||
        "",
      recipient,
      assignedTo:
        document.assignedTo?._id ||
        document.assignedTo ||
        "",
      file: null,
    });

    setOpen(true);
  };

  /*
   * Change recipient.
   */
  const handleRecipientChange = (
    value
  ) => {
    if (value === "team") {
      setForm((previous) => ({
        ...previous,
        recipient: "team",
        assignedTo: "",
      }));

      return;
    }

    if (value === "vinutha") {
      setForm((previous) => ({
        ...previous,
        recipient: "vinutha",
        assignedTo:
          vinuthaUser?._id ||
          vinuthaUser?.id ||
          "",
      }));

      return;
    }

    if (value === "chandru") {
      setForm((previous) => ({
        ...previous,
        recipient: "chandru",
        assignedTo:
          chandruUser?._id ||
          chandruUser?.id ||
          "",
      }));

      return;
    }

    /*
     * Sales Person selected.
     * Clear assignedTo so user must choose
     * Shilpa or Chandan.
     */
    if (value === "sales") {
      setForm((previous) => ({
        ...previous,
        recipient: "sales",
        assignedTo: "",
      }));
    }
  };

  /*
   * Submit upload/edit.
   */
  const submit = async (event) => {
    event.preventDefault();

    if (
      !form.title ||
      (!editId && !form.file)
    ) {
      toast.error(
        editId
          ? "Title is required"
          : "Title and file are required"
      );
      return;
    }

    const recipientData =
      getRecipientData();

    /*
     * Team requires no assigned user.
     */
    if (
      form.recipient !== "team" &&
      !recipientData.assignedTo
    ) {
      toast.error(
        "Please select a recipient"
      );
      return;
    }

    setUploading(true);

    try {
      if (editId) {
        /*
         * Update metadata first.
         */
        await API.patch(
          `/documents/${editId}`,
          {
            title: form.title,
            category: form.category,
            customer: form.customer,
            order: form.order,
          }
        );

        /*
         * Change recipient.
         */
        if (
          canAssign &&
          recipientData.assignedTo
        ) {
          await API.post(
            `/documents/${editId}/assign`,
            {
              assignedTo:
                recipientData.assignedTo,
            }
          );
        }

        /*
         * Team visibility.
         */
        if (
          canAssign &&
          !recipientData.assignedTo
        ) {
          await API.post(
            `/documents/${editId}/unassign`
          );
        }
      } else {
        const body =
          new FormData();

        body.append(
          "title",
          form.title
        );

        body.append(
          "category",
          form.category
        );

        body.append(
          "visibility",
          recipientData.visibility
        );

        if (form.customer) {
          body.append(
            "customer",
            form.customer
          );
        }

        if (form.order) {
          body.append(
            "order",
            form.order
          );
        }

        if (
          recipientData.assignedTo
        ) {
          body.append(
            "assignedTo",
            recipientData.assignedTo
          );
        }

        body.append(
          "file",
          form.file
        );

        await API.post(
          "/documents",
          body,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      }

      toast.success(
        editId
          ? "Document updated"
          : "Document uploaded"
      );

      setOpen(false);
      reset();
      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to save document"
        )
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * Delete document.
   */
  const deleteDocument = async (
    document
  ) => {
    const ok =
      window.confirm(
        `Delete "${document.title}"?`
      );

    if (!ok) return;

    try {
      await API.delete(
        `/documents/${
          document._id ||
          document.id
        }`
      );

      toast.success(
        "Document deleted"
      );

      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to delete document"
        )
      );
    }
  };

  /*
   * Open assignment modal.
   */
  const openAssign = (
    document
  ) => {
    setSelectedDocument(
      document
    );

    setSelectedAssignUser(
      document.assignedTo?._id ||
        document.assignedTo ||
        ""
    );

    setAssignOpen(true);
  };

  /*
   * Assign existing document.
   */
  const assignDocument = async () => {
    if (
      !selectedDocument ||
      !selectedAssignUser
    ) {
      toast.error(
        "Select a recipient"
      );
      return;
    }

    setAssigning(true);

    try {
      await API.post(
        `/documents/${
          selectedDocument._id ||
          selectedDocument.id
        }/assign`,
        {
          assignedTo:
            selectedAssignUser,
        }
      );

      toast.success(
        "Document assigned successfully"
      );

      setAssignOpen(false);
      setSelectedDocument(null);
      setSelectedAssignUser("");

      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to assign document"
        )
      );
    } finally {
      setAssigning(false);
    }
  };

  /*
   * Remove assignment.
   */
  const unassignDocument = async (
    document
  ) => {
    try {
      await API.post(
        `/documents/${
          document._id ||
          document.id
        }/unassign`
      );

      toast.success(
        "Assignment removed"
      );

      load();
    } catch (error) {
      toast.error(
        apiErrorMessage(
          error,
          "Failed to remove assignment"
        )
      );
    }
  };

  /*
   * Open reply modal.
   */
  const openReply = (
    document
  ) => {
    setSelectedDocument(
      document
    );

    setReplyMessage("");
    setReplyOpen(true);
  };

  /*
   * Send reply.
   */
  const submitReply =
    async () => {
      const message =
        replyMessage.trim();

      if (!message) {
        toast.error(
          "Please enter a reply"
        );
        return;
      }

      setReplying(true);

      try {
        await API.post(
          `/documents/${
            selectedDocument._id ||
            selectedDocument.id
          }/reply`,
          {
            message,
          }
        );

        toast.success(
          "Reply sent"
        );

        setReplyOpen(false);
        setSelectedDocument(null);
        setReplyMessage("");

        load();
      } catch (error) {
        toast.error(
          apiErrorMessage(
            error,
            "Failed to send reply"
          )
        );
      } finally {
        setReplying(false);
      }
    };

  /*
   * Display recipient name.
   */
  const recipientLabel = (
    document
  ) => {
    if (
      document.visibility ===
        "team" &&
      !document.assignedTo
    ) {
      return "Team";
    }

    if (
      document.assignedTo?.name
    ) {
      return document.assignedTo.name;
    }

    return "Not assigned";
  };

  const columns = [
    {
      header: "Title",
      accessor: "title",
      render: (row) => (
        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "10px",
          }}
        >
          <FileText
            size={16}
            style={{
              color:
                "var(--emerald)",
            }}
          />

          <span
            style={{
              fontWeight: 700,
            }}
          >
            {row.title}
          </span>
        </div>
      ),
    },

    {
      header: "Category",
      accessor: "category",
      render: (row) => (
        <span>
          {humanize(
            row.category
          )}
        </span>
      ),
    },

    {
      header: "File",
      accessor: "file",
      render: (row) =>
        row.file?.url ? (
          <a
            href={
              row.file.url
            }
            target="_blank"
            rel="noreferrer"
            style={{
              color:
                "var(--emerald)",
              fontWeight: 700,
            }}
          >
            Open
          </a>
        ) : (
          "-"
        ),
    },

    {
      header: "Uploaded By",
      accessor:
        "uploadedBy",
      render: (row) => (
        <span>
          {row.uploadedBy
            ?.name || "-"}
        </span>
      ),
    },

    {
      header: "Recipient",
      accessor:
        "assignedTo",
      render: (row) => (
        <span>
          {recipientLabel(
            row
          )}
        </span>
      ),
    },

    {
      header: "Replies",
      accessor:
        "replies",
      render: (row) => (
        <span>
          {row.replies
            ?.length || 0}
        </span>
      ),
    },

    {
      header: "Date",
      accessor:
        "createdAt",
      render: (row) => (
        <span
          style={{
            fontSize:
              "12px",
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
      header: "Actions",
      render: (row) => (
        <div
          style={{
            display:
              "flex",
            gap: "8px",
            flexWrap:
              "wrap",
          }}
        >
          <button
            className="btn-ghost"
            style={{
              padding:
                "7px 10px",
              fontSize:
                "12px",
            }}
            onClick={() =>
              openReply(
                row
              )
            }
          >
            <MessageSquare
              size={14}
            />
            Review / Reply
          </button>

          {canAssign && (
            <>
              <button
                className="btn-ghost"
                style={{
                  padding:
                    "7px 10px",
                  fontSize:
                    "12px",
                }}
                onClick={() =>
                  openAssign(
                    row
                  )
                }
              >
                <UserPlus
                  size={14}
                />
                Assign
              </button>

              {row.assignedTo && (
                <button
                  className="btn-ghost"
                  style={{
                    padding:
                      "7px 10px",
                    fontSize:
                      "12px",
                  }}
                  onClick={() =>
                    unassignDocument(
                      row
                    )
                  }
                >
                  <UserX
                    size={14}
                  />
                  Unassign
                </button>
              )}
            </>
          )}

          {(isOwner ||
            isAdmin ||
            row.uploadedBy
              ?._id ===
              user?._id) && (
            <>
              <button
                className="btn-ghost"
                style={{
                  padding:
                    "7px 10px",
                  fontSize:
                    "12px",
                }}
                onClick={() =>
                  openEdit(
                    row
                  )
                }
              >
                <Edit3
                  size={14}
                />
                Edit
              </button>

              <button
                className="btn-ghost"
                style={{
                  padding:
                    "7px 10px",
                  fontSize:
                    "12px",
                  color:
                    "var(--danger)",
                }}
                onClick={() =>
                  deleteDocument(
                    row
                  )
                }
              >
                <Trash2
                  size={14}
                />
                Delete
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <LoadingSpinner
        text="Loading documents..."
      />
    );
  }

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Documents"
        title="Document Management"
        subtitle="Upload, assign, review and reply to business documents"
        action={
          <button
            className="btn-primary"
            onClick={
              openCreate
            }
            disabled={
              documentTotal >=
              MAX_DOCUMENTS
            }
          >
            <Plus size={16} />
            Upload Document
          </button>
        }
      />

      <div
        style={{
          marginBottom:
            "16px",
          padding:
            "12px 16px",
          border:
            "1px solid var(--border)",
          borderRadius:
            "var(--r)",
          background:
            "var(--surface-2)",
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "12px",
          flexWrap:
            "wrap",
        }}
      >
        <span>
          Documents:{" "}
          <strong>
            {documentTotal}
          </strong>{" "}
          / {MAX_DOCUMENTS}
        </span>

        <span
          style={{
            color:
              "var(--text-muted)",
            fontSize:
              "13px",
          }}
        >
          {documentTotal >=
          MAX_DOCUMENTS
            ? "Upload limit reached"
            : `${
                MAX_DOCUMENTS -
                documentTotal
              } upload slots remaining`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        pageSize={15}
        emptyMessage="No documents available."
      />

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title={
          editId
            ? "Edit Document"
            : "Upload Document"
        }
        size="lg"
      >
        <form
          onSubmit={submit}
          style={{
            position:
              "relative",
          }}
        >
          {uploading && (
            <div
              style={{
                position:
                  "absolute",
                inset: "-8px",
                zIndex: 2,
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                flexDirection:
                  "column",
                gap: "10px",
                background:
                  "rgba(10,15,30,0.72)",
                borderRadius:
                  "var(--r-lg)",
                backdropFilter:
                  "blur(6px)",
              }}
            >
              <Loader2
                size={30}
                className="anim-spin"
                style={{
                  color:
                    "var(--emerald)",
                }}
              />

              <p
                style={{
                  color:
                    "var(--text)",
                  fontWeight:
                    800,
                }}
              >
                {editId
                  ? "Saving changes..."
                  : "Uploading document..."}
              </p>
            </div>
          )}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: "16px",
              marginBottom:
                "16px",
            }}
          >
            <FormField
              label="Title"
              required
            >
              <input
                value={
                  form.title
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    title:
                      e.target
                        .value,
                  })
                }
                style={
                  inputStyle
                }
                onFocus={
                  focus
                }
                onBlur={
                  blur
                }
              />
            </FormField>

            <FormField label="Category">
              <select
                value={
                  form.category
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target
                        .value,
                  })
                }
                style={{
                  ...inputStyle,
                  cursor:
                    "pointer",
                }}
              >
                {CATEGORIES.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {humanize(
                        category
                      )}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Customer">
              <select
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
                    "pointer",
                }}
              >
                <option value="">
                  None
                </option>

                {customers.map(
                  (
                    customer
                  ) => (
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

            <FormField label="Order">
              <select
                value={
                  form.order
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    order:
                      e.target
                        .value,
                  })
                }
                style={{
                  ...inputStyle,
                  cursor:
                    "pointer",
                }}
              >
                <option value="">
                  None
                </option>

                {orders.map(
                  (order) => (
                    <option
                      key={
                        order._id ||
                        order.id
                      }
                      value={
                        order._id ||
                        order.id
                      }
                    >
                      {
                        order.orderNo
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            {/* Recipient */}
            <FormField
              label="Recipient"
              required
            >
              <select
                value={
                  form.recipient
                }
                onChange={(e) =>
                  handleRecipientChange(
                    e.target
                      .value
                  )
                }
                style={{
                  ...inputStyle,
                  cursor:
                    "pointer",
                }}
              >
                {RECIPIENT_OPTIONS.map(
                  (
                    option
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  )
                )}
              </select>
            </FormField>

            {/* Sales Person selection */}
            {canAssign &&
              form.recipient ===
                "sales" && (
                <FormField
                  label="Sales Person"
                  required
                >
                  <select
                    value={
                      form.assignedTo
                    }
                    onChange={(
                      e
                    ) =>
                      setForm({
                        ...form,
                        assignedTo:
                          e.target
                            .value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      cursor:
                        "pointer",
                    }}
                  >
                    <option value="">
                      Select Sales Person
                    </option>

                    {selectedSalesUsers.map(
                      (
                        salesUser
                      ) => (
                        <option
                          key={
                            salesUser._id ||
                            salesUser.id
                          }
                          value={
                            salesUser._id ||
                            salesUser.id
                          }
                        >
                          {
                            salesUser.name
                          }{" "}
                          —{" "}
                          {
                            salesUser.email
                          }
                        </option>
                      )
                    )}
                  </select>
                </FormField>
              )}

            {/* Selected Vinutha / Chandru information */}
            {canAssign &&
              form.recipient ===
                "vinutha" && (
                <FormField label="Selected Person">
                  <input
                    value={
                      vinuthaUser
                        ?.name ||
                      "Vinutha"
                    }
                    readOnly
                    style={
                      inputStyle
                    }
                  />
                </FormField>
              )}

            {canAssign &&
              form.recipient ===
                "chandru" && (
                <FormField label="Selected Person">
                  <input
                    value={
                      chandruUser
                        ?.name ||
                      "Chandru"
                    }
                    readOnly
                    style={
                      inputStyle
                    }
                  />
                </FormField>
              )}

            {!editId && (
              <FormField
                label="File"
                required
              >
                <input
                  type="file"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      file:
                        e.target
                          .files?.[0] ||
                        null,
                    })
                  }
                  style={
                    inputStyle
                  }
                />
              </FormField>
            )}
          </div>

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
              disabled={
                uploading
              }
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
              disabled={
                uploading
              }
            >
              <Upload
                size={15}
              />

              {uploading
                ? "Saving..."
                : editId
                ? "Save Changes"
                : "Upload"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={
          assignOpen
        }
        onClose={() => {
          setAssignOpen(
            false
          );
          setSelectedDocument(
            null
          );
        }}
        title="Assign Document"
        size="md"
      >
        <div>
          <p
            style={{
              marginBottom:
                "16px",
              fontWeight:
                700,
            }}
          >
            {
              selectedDocument?.title
            }
          </p>

          <FormField
            label="Recipient"
            required
          >
            <select
              value={
                selectedAssignUser
              }
              onChange={(e) =>
                setSelectedAssignUser(
                  e.target
                    .value
                )
              }
              style={{
                ...inputStyle,
                cursor:
                  "pointer",
              }}
            >
              <option value="">
                Select Recipient
              </option>

              {recipientUsers
                .filter(
                  (item) =>
                    item.isActive !==
                      false &&
                    (item.role ===
                      "manager" ||
                      item.role ===
                        "sales")
                )
                .map(
                  (
                    recipient
                  ) => (
                    <option
                      key={
                        recipient._id ||
                        recipient.id
                      }
                      value={
                        recipient._id ||
                        recipient.id
                      }
                    >
                      {
                        recipient.name
                      }{" "}
                      —{" "}
                      {humanize(
                        recipient.role
                      )}
                    </option>
                  )
                )}
            </select>
          </FormField>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop:
                "20px",
            }}
          >
            <button
              className="btn-ghost"
              disabled={
                assigning
              }
              onClick={() =>
                setAssignOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              disabled={
                assigning
              }
              onClick={
                assignDocument
              }
            >
              {assigning
                ? "Assigning..."
                : "Assign Document"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Review / Reply Modal */}
      <Modal
        isOpen={
          replyOpen
        }
        onClose={() => {
          setReplyOpen(
            false
          );
          setSelectedDocument(
            null
          );
        }}
        title="Review / Reply"
        size="lg"
      >
        <div>
          <div
            style={{
              padding:
                "12px 14px",
              marginBottom:
                "16px",
              border:
                "1px solid var(--border)",
              borderRadius:
                "var(--r)",
              background:
                "var(--surface-2)",
            }}
          >
            <strong>
              {
                selectedDocument?.title
              }
            </strong>

            {selectedDocument
              ?.assignedTo
              ?.name && (
              <div
                style={{
                  marginTop:
                    "5px",
                  fontSize:
                    "13px",
                  color:
                    "var(--text-muted)",
                }}
              >
                Assigned to:{" "}
                {
                  selectedDocument
                    .assignedTo
                    .name
                }
              </div>
            )}
          </div>

          <div
            style={{
              maxHeight:
                "260px",
              overflowY:
                "auto",
              marginBottom:
                "16px",
            }}
          >
            {selectedDocument
              ?.replies
              ?.length ? (
              selectedDocument.replies.map(
                (reply) => (
                  <div
                    key={
                      reply._id
                    }
                    style={{
                      padding:
                        "10px 12px",
                      marginBottom:
                        "8px",
                      border:
                        "1px solid var(--border)",
                      borderRadius:
                        "var(--r)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight:
                          700,
                        fontSize:
                          "13px",
                      }}
                    >
                      {reply
                        .user
                        ?.name ||
                        "User"}
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "14px",
                      }}
                    >
                      {
                        reply.message
                      }
                    </div>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "11px",
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      {reply.createdAt
                        ? new Date(
                            reply.createdAt
                          ).toLocaleString(
                            "en-IN"
                          )
                        : ""}
                    </div>
                  </div>
                )
              )
            ) : (
              <p
                style={{
                  color:
                    "var(--text-muted)",
                }}
              >
                No replies yet.
              </p>
            )}
          </div>

          <FormField label="Your Reply">
            <textarea
              value={
                replyMessage
              }
              onChange={(e) =>
                setReplyMessage(
                  e.target
                    .value
                )
              }
              maxLength={5000}
              rows={5}
              placeholder="Write your review or reply..."
              style={{
                ...inputStyle,
                resize:
                  "vertical",
              }}
            />
          </FormField>

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              gap: "10px",
              marginTop:
                "16px",
            }}
          >
            <button
              className="btn-ghost"
              disabled={
                replying
              }
              onClick={() =>
                setReplyOpen(
                  false
                )
              }
            >
              Cancel
            </button>

            <button
              className="btn-primary"
              disabled={
                replying
              }
              onClick={
                submitReply
              }
            >
              <Send
                size={15}
              />

              {replying
                ? "Sending..."
                : "Send Reply"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}